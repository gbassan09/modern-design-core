import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  summary: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    totalApprovedValue: number;
    totalPendingValue: number;
    totalRejectedValue: number;
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

      const approvedInvoices = invoices?.filter((i) => i.status === "approved") || [];
      const pendingInvoices = invoices?.filter((i) => i.status === "pending") || [];
      const rejectedInvoices = invoices?.filter((i) => i.status === "rejected") || [];

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
        summary: {
          total: invoices?.length || 0,
          approved: approvedInvoices.length,
          pending: pendingInvoices.length,
          rejected: rejectedInvoices.length,
          totalApprovedValue: approvedInvoices.reduce((sum, i) => sum + i.total_value, 0),
          totalPendingValue: pendingInvoices.reduce((sum, i) => sum + i.total_value, 0),
          totalRejectedValue: rejectedInvoices.reduce((sum, i) => sum + i.total_value, 0),
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

  const downloadReportAsJSON = async (userId: string) => {
    const report = await generateUserReport(userId);
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${report.user.full_name?.replace(/\s+/g, "-") || userId}-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Relatório gerado",
      description: "O relatório foi baixado como JSON.",
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
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

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
    .summary-card h3 { font-size: 24px; margin-bottom: 4px; }
    .summary-card p { font-size: 12px; color: #666; }
    .invoices { margin-top: 30px; }
    .invoices h2 { color: #333; font-size: 20px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; color: #333; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status.approved { background: #d1fae5; color: #065f46; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .status.rejected { background: #fee2e2; color: #991b1b; }
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

  <div class="footer">
    <p>ExpenseFlow - Sistema de Gestão de Despesas</p>
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
    downloadReportAsJSON,
    downloadReportAsPDF,
  };
};
