import { useState, useRef } from "react";
import { FileText, Paperclip, ChevronRight, Filter, Search, Loader2, Upload, CheckCircle2, AlertCircle, X, FileUp } from "lucide-react";
import { useInvoices, InvoiceStatus } from "@/hooks/useInvoices";
import { usePDFParser, ParsedStatement } from "@/hooks/usePDFParser";
import { usePDFStatements, PDFStatement } from "@/hooks/usePDFStatements";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

const InvoicesScreen = () => {
  const [activeTab, setActiveTab] = useState<InvoiceStatus | "all" | "statements">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedStatement | null>(null);
  const [manualPeriodMonth, setManualPeriodMonth] = useState("");
  const [manualPeriodYear, setManualPeriodYear] = useState("");
  const [manualTotalValue, setManualTotalValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { invoices, isLoading } = useInvoices(activeTab === "statements" ? "all" : activeTab);
  const { parsePDF, isProcessing } = usePDFParser();
  const { statements, isLoading: statementsLoading, createStatement, refetch: refetchStatements } = usePDFStatements();
  const { toast } = useToast();

  const tabs: { key: InvoiceStatus | "all" | "statements"; label: string }[] = [
    { key: "pending", label: "Em Aberto" },
    { key: "approved", label: "Aprovadas" },
    { key: "statements", label: "Faturas PDF" },
    { key: "all", label: "Todas" },
  ];

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStatements = statements.filter(
    (stmt) =>
      `${stmt.period_month}/${stmt.period_year}`.includes(searchQuery)
  );

  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const pendingTotal = invoices
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + i.total_value, 0);
  const overdueCount = invoices.filter(
    (i) => i.status === "pending" && i.due_date && new Date(i.due_date) < new Date()
  ).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      });
      return;
    }

    const result = await parsePDF(file);
    if (result) {
      setParsedData(result);
      setManualPeriodMonth(result.periodMonth?.toString() || "");
      setManualPeriodYear(result.periodYear?.toString() || "");
      setManualTotalValue(result.totalValue?.toString() || "");
      setShowUploadModal(true);
    }
  };

  const handleSubmitStatement = async () => {
    if (!parsedData) return;

    const month = parseInt(manualPeriodMonth);
    const year = parseInt(manualPeriodYear);
    const total = parseFloat(manualTotalValue);

    if (!month || month < 1 || month > 12) {
      toast({
        title: "Mês inválido",
        description: "Informe um mês válido (1-12).",
        variant: "destructive",
      });
      return;
    }

    if (!year || year < 2000 || year > 2100) {
      toast({
        title: "Ano inválido",
        description: "Informe um ano válido.",
        variant: "destructive",
      });
      return;
    }

    if (!total || total <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe o valor total da fatura.",
        variant: "destructive",
      });
      return;
    }

    const { statement, error } = await createStatement(
      month,
      year,
      total,
      parsedData.expenses,
      { rawText: parsedData.rawText }
    );

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Fatura cadastrada!",
      description: `Fatura de ${month}/${year} criada com ${parsedData.expenses.length} despesas.`,
    });

    setShowUploadModal(false);
    setParsedData(null);
    setManualPeriodMonth("");
    setManualPeriodYear("");
    setManualTotalValue("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    refetchStatements();
    setActiveTab("statements");
  };

  const closeModal = () => {
    setShowUploadModal(false);
    setParsedData(null);
    setManualPeriodMonth("");
    setManualPeriodYear("");
    setManualTotalValue("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "batida":
        return "bg-success/20 text-success";
      case "divergente":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-warning/20 text-warning";
    }
  };

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Conferência de Faturas</h1>
        <p className="text-sm text-white/60">Gerencie suas faturas corporativas</p>
      </header>

      {/* Search Bar */}
      <div className="mb-4 flex gap-2">
        <div className="glass-input flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Buscar faturas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
          />
        </div>
        <button className="glass-card flex h-12 w-12 items-center justify-center rounded-xl p-0">
          <Filter className="h-5 w-5 text-white/70" />
        </button>
      </div>

      {/* PDF Upload Button */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="glass-card flex items-center justify-center gap-2 py-3 cursor-pointer hover:bg-white/10 transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="text-white/70">Processando PDF...</span>
            </>
          ) : (
            <>
              <FileUp className="h-5 w-5 text-primary" />
              <span className="text-white/70">Enviar Fatura em PDF</span>
            </>
          )}
        </label>
      </div>

      {/* Tabs */}
      <div className="glass-card mb-6 flex gap-1 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white/15 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="mb-4 flex gap-3">
        <div className="glass-card flex-1 py-3">
          <p className="text-2xl font-bold text-white">{pendingCount}</p>
          <p className="text-xs text-white/60">Em aberto</p>
        </div>
        <div className="glass-card flex-1 py-3">
          <p className="text-2xl font-bold text-warning">
            {formatCurrency(pendingTotal).replace("R$", "R$ ")}
          </p>
          <p className="text-xs text-white/60">Total pendente</p>
        </div>
        <div className="glass-card flex-1 py-3">
          <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
          <p className="text-xs text-white/60">Vencidas</p>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "statements" ? (
        // PDF Statements List
        statementsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filteredStatements.length === 0 ? (
          <div className="glass-card text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-white/30 mb-4" />
            <p className="text-white/60">Nenhuma fatura PDF cadastrada</p>
            <p className="text-white/40 text-sm mt-2">
              Envie um PDF de fatura para começar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStatements.map((stmt) => (
              <div
                key={stmt.id}
                className="glass-card flex items-center gap-3 transition-all hover:bg-white/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">
                      Fatura {stmt.period_month}/{stmt.period_year}
                    </p>
                  </div>
                  <p className="text-xs text-white/50">
                    Cadastrada em {formatDate(stmt.created_at)}
                  </p>
                  {stmt.status === "divergente" && (
                    <p className="text-xs text-destructive mt-1">
                      Diferença: {formatCurrency(Math.abs(stmt.difference))}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-semibold text-white">
                    {formatCurrency(stmt.total_value)}
                  </p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${getStatusColor(stmt.status)}`}>
                    {statusLabels[stmt.status]}
                  </span>
                </div>

                <ChevronRight className="h-5 w-5 text-white/30" />
              </div>
            ))}
          </div>
        )
      ) : (
        // Invoice List
        isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="glass-card text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-white/30 mb-4" />
            <p className="text-white/60">Nenhuma fatura encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="glass-card flex items-center gap-3 transition-all hover:bg-white/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{invoice.supplier}</p>
                    {invoice.image_url && (
                      <Paperclip className="h-3 w-3 text-white/40" />
                    )}
                  </div>
                  <p className="text-xs text-white/50">
                    {invoice.description || categoryLabels[invoice.category]}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Vence {formatDate(invoice.due_date)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-white">
                    {formatCurrency(invoice.total_value)}
                  </p>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                      invoice.status === "approved"
                        ? "status-approved"
                        : invoice.status === "rejected"
                        ? "status-rejected"
                        : "status-pending"
                    }`}
                  >
                    {statusLabels[invoice.status]}
                  </span>
                </div>

                <ChevronRight className="h-5 w-5 text-white/30" />
              </div>
            ))}
          </div>
        )
      )}

      {/* Upload Modal */}
      {showUploadModal && parsedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="glass-card-strong w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Dados da Fatura</h2>
              <button onClick={closeModal} className="text-white/60 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Period Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="month" className="text-white/70">Mês</Label>
                  <Input
                    id="month"
                    type="number"
                    min="1"
                    max="12"
                    value={manualPeriodMonth}
                    onChange={(e) => setManualPeriodMonth(e.target.value)}
                    placeholder="Ex: 1"
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label htmlFor="year" className="text-white/70">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={manualPeriodYear}
                    onChange={(e) => setManualPeriodYear(e.target.value)}
                    placeholder="Ex: 2024"
                    className="glass-input"
                  />
                </div>
              </div>

              {/* Total Value */}
              <div>
                <Label htmlFor="total" className="text-white/70">Valor Total</Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  value={manualTotalValue}
                  onChange={(e) => setManualTotalValue(e.target.value)}
                  placeholder="Ex: 1234.56"
                  className="glass-input"
                />
              </div>

              {/* Extracted Expenses */}
              <div>
                <Label className="text-white/70">
                  Despesas Extraídas ({parsedData.expenses.length})
                </Label>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-2">
                  {parsedData.expenses.length === 0 ? (
                    <p className="text-white/40 text-sm">
                      Nenhuma despesa identificada automaticamente.
                    </p>
                  ) : (
                    parsedData.expenses.map((expense, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 rounded-lg bg-white/5"
                      >
                        <div className="flex-1">
                          <p className="text-white text-sm truncate">{expense.description}</p>
                          <p className="text-white/40 text-xs">{expense.date || "Sem data"}</p>
                        </div>
                        <p className="text-white font-medium text-sm">
                          {formatCurrency(expense.value)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Soma das despesas:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(parsedData.expenses.reduce((sum, e) => sum + e.value, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-white/60">Valor informado:</span>
                  <span className="text-white font-medium">
                    {manualTotalValue ? formatCurrency(parseFloat(manualTotalValue)) : "-"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitStatement}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Cadastrar Fatura
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesScreen;
