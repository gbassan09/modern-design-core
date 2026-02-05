import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PDFStatement, PDFExpense } from "./usePDFStatements";
import { Invoice } from "./useInvoices";

export interface ReconciliationAlert {
  id: string;
  type: "missing_invoice" | "extra_expense" | "value_mismatch" | "incomplete_statement";
  severity: "warning" | "error" | "info";
  title: string;
  description: string;
  statementId?: string;
  invoiceId?: string;
  expenseId?: string;
  userId?: string;
  value?: number;
}

export interface StatementReconciliation {
  statement: PDFStatement;
  expenses: PDFExpense[];
  matchedInvoices: Invoice[];
  unmatchedExpenses: PDFExpense[];
  invoicesNotInStatement: Invoice[];
  totalExpensesValue: number;
  totalMatchedValue: number;
  totalUnmatchedValue: number;
  status: "matched" | "partial" | "divergent";
  alerts: ReconciliationAlert[];
}

export interface UserReconciliationSummary {
  userId: string;
  userName: string;
  userDepartment: string | null;
  statements: StatementReconciliation[];
  invoices: Invoice[];
  totalStatements: number;
  totalInvoices: number;
  statementsMatched: number;
  statementsDivergent: number;
  invoicesApproved: number;
  invoicesPending: number;
  invoicesRejected: number;
  totalApprovedValue: number;
  totalPendingValue: number;
  alerts: ReconciliationAlert[];
}

export interface GlobalReconciliationReport {
  users: UserReconciliationSummary[];
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  totalStatements: number;
  totalInvoices: number;
  generatedAt: string;
}

// Normalize text for matching (remove accents, lowercase, trim)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

// Check if two descriptions match (fuzzy matching)
const descriptionsMatch = (desc1: string, desc2: string): boolean => {
  const norm1 = normalizeText(desc1);
  const norm2 = normalizeText(desc2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // Contains match
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // First 10 chars match (for truncated descriptions)
  if (norm1.slice(0, 10) === norm2.slice(0, 10) && norm1.length > 10) return true;
  
  return false;
};

// Check if values match (with small tolerance for rounding)
const valuesMatch = (v1: number, v2: number, tolerance = 0.01): boolean => {
  return Math.abs(v1 - v2) <= tolerance;
};

export const useReconciliation = () => {
  const [isLoading, setIsLoading] = useState(false);

  const reconcileStatement = useCallback(async (
    statement: PDFStatement,
    userInvoices: Invoice[]
  ): Promise<StatementReconciliation> => {
    // Fetch expenses for this statement
    const { data: expenses } = await supabase
      .from("pdf_expenses")
      .select("*")
      .eq("statement_id", statement.id)
      .order("expense_date", { ascending: true });

    const expensesList: PDFExpense[] = (expenses || []) as PDFExpense[];
    const alerts: ReconciliationAlert[] = [];
    
    // Find invoices that match the statement period
    const statementPeriodStart = new Date(statement.period_year, statement.period_month - 1, 1);
    const statementPeriodEnd = new Date(statement.period_year, statement.period_month, 0);
    
    const periodInvoices = userInvoices.filter((inv) => {
      if (!inv.invoice_date) return false;
      const invDate = new Date(inv.invoice_date);
      return invDate >= statementPeriodStart && invDate <= statementPeriodEnd;
    });

    // Match expenses with invoices
    const matchedExpenseIds = new Set<string>();
    const matchedInvoiceIds = new Set<string>();
    const matchedInvoices: Invoice[] = [];
    const unmatchedExpenses: PDFExpense[] = [];

    // First pass: match by description and value
    for (const expense of expensesList) {
      let matched = false;
      
      for (const invoice of periodInvoices) {
        if (matchedInvoiceIds.has(invoice.id)) continue;
        
        const descMatch = descriptionsMatch(expense.description, invoice.supplier) ||
                         descriptionsMatch(expense.description, invoice.description || "");
        const valueMatch = valuesMatch(expense.value, invoice.total_value);
        
        if (descMatch && valueMatch) {
          matchedExpenseIds.add(expense.id);
          matchedInvoiceIds.add(invoice.id);
          matchedInvoices.push(invoice);
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        // Second pass: match by value only (within tolerance)
        for (const invoice of periodInvoices) {
          if (matchedInvoiceIds.has(invoice.id)) continue;
          
          if (valuesMatch(expense.value, invoice.total_value)) {
            matchedExpenseIds.add(expense.id);
            matchedInvoiceIds.add(invoice.id);
            matchedInvoices.push(invoice);
            matched = true;
            break;
          }
        }
      }
      
      if (!matched) {
        unmatchedExpenses.push(expense);
      }
    }

    // Find invoices not in statement (submitted but not in PDF)
    const invoicesNotInStatement = periodInvoices.filter(
      (inv) => !matchedInvoiceIds.has(inv.id)
    );

    // Calculate totals
    const totalExpensesValue = expensesList.reduce((sum, e) => sum + e.value, 0);
    const totalMatchedValue = matchedInvoices.reduce((sum, i) => sum + i.total_value, 0);
    const totalUnmatchedValue = unmatchedExpenses.reduce((sum, e) => sum + e.value, 0);

    // Determine status
    let status: "matched" | "partial" | "divergent";
    if (unmatchedExpenses.length === 0 && invoicesNotInStatement.length === 0) {
      status = "matched";
    } else if (unmatchedExpenses.length > 0 && matchedInvoices.length > 0) {
      status = "partial";
    } else {
      status = "divergent";
    }

    // Generate alerts
    if (statement.status === "divergente") {
      alerts.push({
        id: `divergent-${statement.id}`,
        type: "value_mismatch",
        severity: "error",
        title: "Divergência de valores",
        description: `A fatura ${statement.period_month}/${statement.period_year} apresenta diferença de R$ ${Math.abs(statement.difference).toFixed(2)} entre o total declarado e o calculado.`,
        statementId: statement.id,
        value: statement.difference,
      });
    }

    for (const expense of unmatchedExpenses) {
      alerts.push({
        id: `unmatched-expense-${expense.id}`,
        type: "extra_expense",
        severity: "warning",
        title: "Despesa sem nota fiscal",
        description: `"${expense.description}" (R$ ${expense.value.toFixed(2)}) consta na fatura PDF mas não tem nota fiscal correspondente.`,
        statementId: statement.id,
        expenseId: expense.id,
        value: expense.value,
      });
    }

    for (const invoice of invoicesNotInStatement) {
      alerts.push({
        id: `missing-invoice-${invoice.id}`,
        type: "missing_invoice",
        severity: "warning",
        title: "Nota fiscal fora da fatura",
        description: `"${invoice.supplier}" (R$ ${invoice.total_value.toFixed(2)}) foi cadastrada mas não consta na fatura PDF.`,
        statementId: statement.id,
        invoiceId: invoice.id,
        value: invoice.total_value,
      });
    }

    if (expensesList.length === 0 && statement.total_value > 0) {
      alerts.push({
        id: `incomplete-${statement.id}`,
        type: "incomplete_statement",
        severity: "info",
        title: "Fatura sem despesas",
        description: `A fatura ${statement.period_month}/${statement.period_year} foi cadastrada mas nenhuma despesa foi extraída.`,
        statementId: statement.id,
      });
    }

    return {
      statement,
      expenses: expensesList,
      matchedInvoices,
      unmatchedExpenses,
      invoicesNotInStatement,
      totalExpensesValue,
      totalMatchedValue,
      totalUnmatchedValue,
      status,
      alerts,
    };
  }, []);

  const generateUserReconciliation = useCallback(async (
    userId: string
  ): Promise<UserReconciliationSummary | null> => {
    setIsLoading(true);
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Fetch user statements
      const { data: statements } = await supabase
        .from("pdf_statements")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch user invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const stmtList = (statements || []) as PDFStatement[];
      const invList = (invoices || []) as Invoice[];

      // Reconcile each statement
      const reconciliations: StatementReconciliation[] = [];
      for (const stmt of stmtList) {
        const recon = await reconcileStatement(stmt, invList);
        reconciliations.push(recon);
      }

      // Aggregate alerts
      const allAlerts = reconciliations.flatMap((r) => r.alerts);

      // Calculate summary
      const approvedInvoices = invList.filter((i) => i.status === "approved");
      const pendingInvoices = invList.filter((i) => i.status === "pending");
      const rejectedInvoices = invList.filter((i) => i.status === "rejected");

      return {
        userId,
        userName: profile?.full_name || "Usuário",
        userDepartment: profile?.department || null,
        statements: reconciliations,
        invoices: invList,
        totalStatements: stmtList.length,
        totalInvoices: invList.length,
        statementsMatched: stmtList.filter((s) => s.status === "batida").length,
        statementsDivergent: stmtList.filter((s) => s.status === "divergente").length,
        invoicesApproved: approvedInvoices.length,
        invoicesPending: pendingInvoices.length,
        invoicesRejected: rejectedInvoices.length,
        totalApprovedValue: approvedInvoices.reduce((s, i) => s + i.total_value, 0),
        totalPendingValue: pendingInvoices.reduce((s, i) => s + i.total_value, 0),
        alerts: allAlerts,
      };
    } catch (error) {
      console.error("Error generating user reconciliation:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [reconcileStatement]);

  const generateGlobalReport = useCallback(async (): Promise<GlobalReconciliationReport | null> => {
    setIsLoading(true);
    try {
      // Fetch all users with statements or invoices
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, department");

      const userSummaries: UserReconciliationSummary[] = [];

      for (const profile of profiles || []) {
        const summary = await generateUserReconciliation(profile.user_id);
        if (summary && (summary.totalStatements > 0 || summary.totalInvoices > 0)) {
          userSummaries.push(summary);
        }
      }

      const allAlerts = userSummaries.flatMap((u) => u.alerts);

      return {
        users: userSummaries,
        totalAlerts: allAlerts.length,
        criticalAlerts: allAlerts.filter((a) => a.severity === "error").length,
        warningAlerts: allAlerts.filter((a) => a.severity === "warning").length,
        totalStatements: userSummaries.reduce((s, u) => s + u.totalStatements, 0),
        totalInvoices: userSummaries.reduce((s, u) => s + u.totalInvoices, 0),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error generating global report:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [generateUserReconciliation]);

  return {
    isLoading,
    reconcileStatement,
    generateUserReconciliation,
    generateGlobalReport,
  };
};
