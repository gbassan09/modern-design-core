import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PDFStatementReport {
  id: string;
  period_month: number;
  period_year: number;
  total_value: number;
  calculated_total: number;
  difference: number;
  status: string;
  expenses: {
    id: string;
    description: string;
    value: number;
    expense_date: string | null;
  }[];
}

interface UserReport {
  user: {
    id: string;
    full_name: string | null;
    department: string | null;
  };
  invoices: {
    id: string;
    supplier: string;
    total_value: number;
    status: string;
    category: string;
    invoice_date: string | null;
    description: string | null;
  }[];
  pdfStatements: PDFStatementReport[];
  summary: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    totalApprovedValue: number;
    totalPendingValue: number;
    totalRejectedValue: number;
    pdfStatementsCount: number;
    pdfStatementsBatidas: number;
    pdfStatementsDivergentes: number;
  };
  generated_at: string;
}

export const useReportGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateUserReport = async (userId: string): Promise<UserReport | null> => {
    setIsGenerating(true);

    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch user invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch PDF statements
      const { data: statements, error: statementsError } = await supabase
        .from("pdf_statements")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (statementsError) throw statementsError;

      // Fetch expenses for each statement
      const pdfStatementsWithExpenses: PDFStatementReport[] = [];
      for (const stmt of statements || []) {
        const { data: expenses } = await supabase
          .from("pdf_expenses")
          .select("*")
          .eq("statement_id", stmt.id)
          .order("expense_date", { ascending: true });

        pdfStatementsWithExpenses.push({
          id: stmt.id,
          period_month: stmt.period_month,
          period_year: stmt.period_year,
          total_value: stmt.total_value,
          calculated_total: stmt.calculated_total,
          difference: stmt.difference,
          status: stmt.status,
          expenses: (expenses || []).map((e) => ({
            id: e.id,
            description: e.description,
            value: e.value,
            expense_date: e.expense_date,
          })),
        });
      }

      const approvedInvoices = invoices?.filter((i) => i.status === "approved") || [];
      const pendingInvoices = invoices?.filter((i) => i.status === "pending") || [];
      const rejectedInvoices = invoices?.filter((i) => i.status === "rejected") || [];

      const stmtBatidas = statements?.filter((s) => s.status === "batida") || [];
      const stmtDivergentes = statements?.filter((s) => s.status === "divergente") || [];

      const report: UserReport = {
        user: {
          id: userId,
          full_name: profile?.full_name || "Usuário",
          department: profile?.department || null,
        },
        invoices: (invoices || []).map((inv) => ({
          id: inv.id,
          supplier: inv.supplier,
          total_value: inv.total_value,
          status: inv.status,
          category: inv.category,
          invoice_date: inv.invoice_date,
          description: inv.description,
        })),
        pdfStatements: pdfStatementsWithExpenses,
        summary: {
          total: invoices?.length || 0,
          approved: approvedInvoices.length,
          pending: pendingInvoices.length,
          rejected: rejectedInvoices.length,
          totalApprovedValue: approvedInvoices.reduce((sum, i) => sum + i.total_value, 0),
          totalPendingValue: pendingInvoices.reduce((sum, i) => sum + i.total_value, 0),
          totalRejectedValue: rejectedInvoices.reduce((sum, i) => sum + i.total_value, 0),
          pdfStatementsCount: statements?.length || 0,
          pdfStatementsBatidas: stmtBatidas.length,
          pdfStatementsDivergentes: stmtDivergentes.length,
        },
        generated_at: new Date().toISOString(),
      };

      return report;
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReportAsCSV = async (userId: string) => {
    const report = await generateUserReport(userId);
    if (!report) return;

    // Create CSV headers and rows
    const headers = ["Tipo", "Fornecedor", "Categoria", "Descrição", "Data", "Valor", "Status", "Itens"];
    
    const invoiceRows = report.invoices.map((inv) => {
      const itemsText = (inv as any).items && Array.isArray((inv as any).items) 
        ? (inv as any).items.map((item: any) => `${item.description} (${item.quantity}x R$${item.unit_price})`).join("; ")
        : "";
      
      return [
        "Nota Fiscal",
        inv.supplier,
        inv.category,
        inv.description || "",
        inv.invoice_date ? format(new Date(inv.invoice_date), "dd/MM/yyyy") : "",
        inv.total_value.toString().replace(".", ","),
        inv.status === "approved" ? "Aprovada" : inv.status === "pending" ? "Pendente" : "Rejeitada",
        itemsText
      ];
    });

    // Add PDF statements
    const stmtRows = report.pdfStatements.flatMap((stmt) => {
      const monthNames = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      
      // Main statement row
      const mainRow = [
        "Fatura PDF",
        `Fatura ${monthNames[stmt.period_month]}/${stmt.period_year}`,
        "",
        `Status: ${stmt.status === "batida" ? "Batida" : "Divergente"}`,
        "",
        stmt.total_value.toString().replace(".", ","),
        stmt.status,
        ""
      ];

      // Expense rows
      const expenseRows = stmt.expenses.map((exp) => [
        "Item Fatura",
        "",
        "",
        exp.description,
        exp.expense_date ? format(new Date(exp.expense_date), "dd/MM/yyyy") : "",
        exp.value.toString().replace(".", ","),
        "",
        ""
      ]);

      return [mainRow, ...expenseRows];
    });

    const allRows = [headers, ...invoiceRows, ...stmtRows];
    
    // Convert to CSV with proper escaping
    const csvContent = allRows
      .map(row => 
        row.map(cell => {
          const cellStr = String(cell);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(",")
      )
      .join("\n");

    // Add BOM for proper Excel/Sheets UTF-8 support
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${report.user.full_name?.replace(/\s+/g, "-") || userId}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Relatório exportado",
      description: "Arquivo CSV baixado. Importe no Google Sheets ou Excel.",
    });
  };

  const downloadReportAsPDF = async (userId: string) => {
    const report = await generateUserReport(userId);
    if (!report) return;

    // Generate HTML content for the PDF
    const categoryLabels: Record<string, string> = {
      transporte: "Transporte",
      alimentacao: "Alimentação",
      hospedagem: "Hospedagem",
      suprimentos: "Suprimentos",
      tecnologia: "Tecnologia",
      outros: "Outros",
    };

    const statusLabels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovada",
      rejected: "Rejeitada",
      em_analise: "Em Análise",
      batida: "Batida",
      divergente: "Divergente",
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const monthNames = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Despesas - ${report.user.full_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; background: #fff; color: #333; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
    .header h1 { color: #6366f1; font-size: 28px; margin-bottom: 8px; }
    .header p { color: #666; font-size: 14px; }
    .user-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .user-info h2 { color: #333; font-size: 18px; margin-bottom: 10px; }
    .user-info p { color: #666; font-size: 14px; }
    .summary { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
    .summary-card { flex: 1; min-width: 150px; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card.approved { background: #d1fae5; border: 1px solid #10b981; }
    .summary-card.pending { background: #fef3c7; border: 1px solid #f59e0b; }
    .summary-card.rejected { background: #fee2e2; border: 1px solid #ef4444; }
    .summary-card.batida { background: #d1fae5; border: 1px solid #10b981; }
    .summary-card.divergente { background: #fee2e2; border: 1px solid #ef4444; }
    .summary-card h3 { font-size: 24px; margin-bottom: 4px; }
    .summary-card p { font-size: 12px; color: #666; }
    .invoices, .statements { margin-top: 30px; }
    .invoices h2, .statements h2 { color: #333; font-size: 20px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; color: #333; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status.approved, .status.batida { background: #d1fae5; color: #065f46; }
    .status.pending, .status.em_analise { background: #fef3c7; color: #92400e; }
    .status.rejected, .status.divergente { background: #fee2e2; color: #991b1b; }
    .statement-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .statement-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .statement-header h3 { color: #333; font-size: 16px; }
    .statement-meta { font-size: 12px; color: #666; }
    .difference { color: #ef4444; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relatório de Despesas</h1>
    <p>Gerado em ${format(new Date(report.generated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
  </div>

  <div class="user-info">
    <h2>${report.user.full_name || "Usuário"}</h2>
    <p>Departamento: ${report.user.department || "Não informado"}</p>
  </div>

  <div class="summary">
    <div class="summary-card approved">
      <h3>${formatCurrency(report.summary.totalApprovedValue)}</h3>
      <p>${report.summary.approved} despesas aprovadas</p>
    </div>
    <div class="summary-card pending">
      <h3>${formatCurrency(report.summary.totalPendingValue)}</h3>
      <p>${report.summary.pending} despesas pendentes</p>
    </div>
    <div class="summary-card rejected">
      <h3>${formatCurrency(report.summary.totalRejectedValue)}</h3>
      <p>${report.summary.rejected} despesas rejeitadas</p>
    </div>
  </div>

  <div class="invoices">
    <h2>Detalhamento das Despesas</h2>
    <table>
      <thead>
        <tr>
          <th>Fornecedor</th>
          <th>Categoria</th>
          <th>Data</th>
          <th>Valor</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${report.invoices
          .map(
            (inv) => `
          <tr>
            <td>${inv.supplier}</td>
            <td>${categoryLabels[inv.category] || inv.category}</td>
            <td>${inv.invoice_date ? format(new Date(inv.invoice_date), "dd/MM/yyyy") : "-"}</td>
            <td>${formatCurrency(inv.total_value)}</td>
            <td><span class="status ${inv.status}">${statusLabels[inv.status]}</span></td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  </div>

  ${report.pdfStatements.length > 0 ? `
  <div class="statements">
    <h2>Faturas PDF (${report.pdfStatements.length})</h2>
    <div class="summary" style="margin-bottom: 20px;">
      <div class="summary-card batida">
        <h3>${report.summary.pdfStatementsBatidas}</h3>
        <p>Faturas batidas</p>
      </div>
      <div class="summary-card divergente">
        <h3>${report.summary.pdfStatementsDivergentes}</h3>
        <p>Faturas divergentes</p>
      </div>
    </div>
    ${report.pdfStatements
      .map(
        (stmt) => `
      <div class="statement-section">
        <div class="statement-header">
          <h3>Fatura ${monthNames[stmt.period_month]}/${stmt.period_year}</h3>
          <span class="status ${stmt.status}">${statusLabels[stmt.status]}</span>
        </div>
        <div class="statement-meta">
          <p>Valor da fatura: ${formatCurrency(stmt.total_value)}</p>
          <p>Total calculado: ${formatCurrency(stmt.calculated_total)}</p>
          ${stmt.status === 'divergente' ? `<p class="difference">Diferença: ${formatCurrency(Math.abs(stmt.difference))}</p>` : ''}
        </div>
        ${stmt.expenses.length > 0 ? `
        <table style="margin-top: 15px;">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Data</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${stmt.expenses
              .map(
                (exp) => `
              <tr>
                <td>${exp.description}</td>
                <td>${exp.expense_date ? format(new Date(exp.expense_date), "dd/MM/yyyy") : "-"}</td>
                <td>${formatCurrency(exp.value)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        ` : '<p style="color: #666; margin-top: 10px;">Nenhuma despesa extraída</p>'}
      </div>
    `
      )
      .join("")}
  </div>
  ` : ''}

  <div class="footer">
    <p>XpenseFlow - Sistema de Gestão de Despesas</p>
  </div>
</body>
</html>
    `;

    // Open a new window and print as PDF
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    toast({
      title: "Relatório gerado",
      description: "Use Ctrl+P ou Cmd+P para salvar como PDF.",
    });
  };

  return {
    isGenerating,
    generateUserReport,
    downloadReportAsCSV,
    downloadReportAsPDF,
  };
};
