import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ParsedExpense } from "./usePDFParser";

export interface PDFStatement {
  id: string;
  user_id: string;
  period_month: number;
  period_year: number;
  total_value: number;
  calculated_total: number;
  difference: number;
  status: "em_analise" | "batida" | "divergente";
  pdf_url: string | null;
  raw_pdf_data: any;
  created_at: string;
  updated_at: string;
}

export interface PDFExpense {
  id: string;
  statement_id: string;
  user_id: string;
  description: string;
  value: number;
  expense_date: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

export const usePDFStatements = () => {
  const [statements, setStatements] = useState<PDFStatement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();
  const { toast } = useToast();

  const fetchStatements = useCallback(async () => {
    if (!session) {
      setStatements([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pdf_statements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setStatements((data || []) as PDFStatement[]);
    } catch (error) {
      console.error("Error fetching statements:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as faturas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);

  const checkDuplicateStatement = useCallback(async (
    month: number,
    year: number
  ): Promise<boolean> => {
    if (!session) return false;

    try {
      const { data, error } = await supabase
        .from("pdf_statements")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("period_month", month)
        .eq("period_year", year)
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error("Error checking duplicate:", error);
      return false;
    }
  }, [session]);

  const createStatement = useCallback(async (
    periodMonth: number,
    periodYear: number,
    totalValue: number,
    expenses: ParsedExpense[],
    rawPdfData: any,
    pdfUrl?: string
  ): Promise<{ statement: PDFStatement | null; error: Error | null }> => {
    if (!session?.user) {
      return { statement: null, error: new Error("Não autenticado") };
    }

    try {
      // Check for duplicates first
      const isDuplicate = await checkDuplicateStatement(periodMonth, periodYear);
      if (isDuplicate) {
        return { 
          statement: null, 
          error: new Error(`Já existe uma fatura cadastrada para ${periodMonth}/${periodYear}`) 
        };
      }

      // Create the statement
      const { data: statementData, error: statementError } = await supabase
        .from("pdf_statements")
        .insert({
          user_id: session.user.id,
          period_month: periodMonth,
          period_year: periodYear,
          total_value: totalValue,
          status: "em_analise",
          pdf_url: pdfUrl || null,
          raw_pdf_data: rawPdfData,
        })
        .select()
        .single();

      if (statementError) throw statementError;

      // Create expenses
      if (expenses.length > 0) {
        const expensesToInsert = expenses.map((expense) => ({
          statement_id: statementData.id,
          user_id: session.user.id,
          description: expense.description,
          value: expense.value,
          expense_date: expense.date,
          type: "pdf_fatura",
        }));

        const { error: expensesError } = await supabase
          .from("pdf_expenses")
          .insert(expensesToInsert);

        if (expensesError) throw expensesError;
      }

      // Refetch to get updated totals
      await fetchStatements();

      return { statement: statementData as PDFStatement, error: null };
    } catch (error) {
      console.error("Error creating statement:", error);
      return { statement: null, error: error as Error };
    }
  }, [session, checkDuplicateStatement, fetchStatements]);

  const getExpensesForStatement = useCallback(async (
    statementId: string
  ): Promise<PDFExpense[]> => {
    try {
      const { data, error } = await supabase
        .from("pdf_expenses")
        .select("*")
        .eq("statement_id", statementId)
        .order("expense_date", { ascending: true });

      if (error) throw error;

      return (data || []) as PDFExpense[];
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return [];
    }
  }, []);

  const updateExpense = useCallback(async (
    expenseId: string,
    updates: Partial<Pick<PDFExpense, "description" | "value" | "expense_date">>
  ): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase
        .from("pdf_expenses")
        .update(updates)
        .eq("id", expenseId);

      if (error) throw error;

      await fetchStatements();
      return { error: null };
    } catch (error) {
      console.error("Error updating expense:", error);
      return { error: error as Error };
    }
  }, [fetchStatements]);

  const deleteExpense = useCallback(async (
    expenseId: string
  ): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase
        .from("pdf_expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      await fetchStatements();
      return { error: null };
    } catch (error) {
      console.error("Error deleting expense:", error);
      return { error: error as Error };
    }
  }, [fetchStatements]);

  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  return {
    statements,
    isLoading,
    refetch: fetchStatements,
    checkDuplicateStatement,
    createStatement,
    getExpensesForStatement,
    updateExpense,
    deleteExpense,
  };
};
