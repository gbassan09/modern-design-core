import { useState, useRef } from "react";
import { FileText, Loader2, FileUp, X, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { usePDFParser, ParsedStatement } from "@/hooks/usePDFParser";
import { usePDFStatements, PDFStatement } from "@/hooks/usePDFStatements";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, string> = {
  em_analise: "Em Análise",
  batida: "Batida",
  divergente: "Divergente",
};

const InvoicesScreen = () => {
  const [parsedData, setParsedData] = useState<ParsedStatement | null>(null);
  const [manualPeriodMonth, setManualPeriodMonth] = useState("");
  const [manualPeriodYear, setManualPeriodYear] = useState("");
  const [manualTotalValue, setManualTotalValue] = useState("");
  const [showExpenses, setShowExpenses] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { parsePDF, isProcessing, error: parseError } = usePDFParser();
  const { statements, isLoading: statementsLoading, createStatement, refetch: refetchStatements } = usePDFStatements();
  const { toast } = useToast();

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
      setShowExpenses(true);
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

    setIsSaving(true);
    const { statement, error } = await createStatement(
      month,
      year,
      total,
      parsedData.expenses,
      { rawText: parsedData.rawText }
    );
    setIsSaving(false);

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

    clearForm();
    refetchStatements();
  };

  const clearForm = () => {
    setParsedData(null);
    setManualPeriodMonth("");
    setManualPeriodYear("");
    setManualTotalValue("");
    setShowExpenses(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "batida":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "divergente":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Loader2 className="h-5 w-5 text-warning animate-spin" />;
    }
  };

  const expensesSum = parsedData?.expenses.reduce((sum, e) => sum + e.value, 0) || 0;

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Carregar Fatura</h1>
        <p className="text-sm text-white/60">Envie o PDF da sua fatura do cartão</p>
      </header>

      {/* PDF Upload Area */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="pdf-upload"
        />
        
        {!parsedData ? (
          <label
            htmlFor="pdf-upload"
            className="glass-card-strong flex flex-col items-center justify-center py-12 cursor-pointer hover:bg-white/10 transition-colors border-2 border-dashed border-white/20"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <span className="text-white/70">Processando PDF...</span>
                <span className="text-white/40 text-sm mt-1">Extraindo dados da fatura</span>
              </>
            ) : (
              <>
                <FileUp className="h-12 w-12 text-primary mb-4" />
                <span className="text-white font-medium">Clique para enviar PDF</span>
                <span className="text-white/40 text-sm mt-1">ou arraste o arquivo aqui</span>
              </>
            )}
          </label>
        ) : (
          /* Parsed Data Display */
          <div className="glass-card-strong">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Fatura Carregada</h2>
                  <p className="text-sm text-white/50">Confira os dados extraídos</p>
                </div>
              </div>
              <button onClick={clearForm} className="text-white/60 hover:text-white p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Period and Total Fields */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="month" className="text-white/70 text-sm">Mês</Label>
                  <Input
                    id="month"
                    type="number"
                    min="1"
                    max="12"
                    value={manualPeriodMonth}
                    onChange={(e) => setManualPeriodMonth(e.target.value)}
                    placeholder="Ex: 1"
                    className="glass-input mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="year" className="text-white/70 text-sm">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={manualPeriodYear}
                    onChange={(e) => setManualPeriodYear(e.target.value)}
                    placeholder="Ex: 2024"
                    className="glass-input mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="total" className="text-white/70 text-sm">Valor Total da Fatura</Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  value={manualTotalValue}
                  onChange={(e) => setManualTotalValue(e.target.value)}
                  placeholder="Ex: 1234.56"
                  className="glass-input mt-1"
                />
              </div>
            </div>

            {/* Expenses Toggle */}
            <button
              onClick={() => setShowExpenses(!showExpenses)}
              className="flex items-center justify-between w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors mb-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">
                  Despesas Extraídas ({parsedData.expenses.length})
                </span>
                <span className="text-white/50 text-sm">
                  Total: {formatCurrency(expensesSum)}
                </span>
              </div>
              {showExpenses ? (
                <ChevronUp className="h-5 w-5 text-white/50" />
              ) : (
                <ChevronDown className="h-5 w-5 text-white/50" />
              )}
            </button>

            {/* Expenses List */}
            {showExpenses && (
              <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                {parsedData.expenses.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-4">
                    Nenhuma despesa identificada automaticamente.
                  </p>
                ) : (
                  parsedData.expenses.map((expense, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 rounded-lg bg-white/5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{expense.description}</p>
                        <p className="text-white/40 text-xs">{expense.date || "Sem data"}</p>
                      </div>
                      <p className="text-white font-medium text-sm ml-3">
                        {formatCurrency(expense.value)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Summary */}
            <div className="p-4 rounded-lg bg-white/5 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Valor declarado:</span>
                <span className="text-white font-medium">
                  {manualTotalValue ? formatCurrency(parseFloat(manualTotalValue)) : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Soma das despesas:</span>
                <span className="text-white font-medium">{formatCurrency(expensesSum)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                <span className="text-white/60">Diferença:</span>
                <span className={`font-medium ${
                  Math.abs((parseFloat(manualTotalValue) || 0) - expensesSum) < 0.01 
                    ? "text-success" 
                    : "text-warning"
                }`}>
                  {formatCurrency(Math.abs((parseFloat(manualTotalValue) || 0) - expensesSum))}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitStatement}
              disabled={isSaving}
              className="w-full gradient-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Cadastrar Fatura"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Recent Statements */}
      <div className="glass-card">
        <h3 className="font-semibold text-white mb-4">Faturas Cadastradas</h3>
        
        {statementsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : statements.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-10 w-10 text-white/20 mb-2" />
            <p className="text-white/40 text-sm">Nenhuma fatura cadastrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {statements.slice(0, 5).map((stmt) => (
              <div
                key={stmt.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
              >
                {getStatusIcon(stmt.status)}
                <div className="flex-1">
                  <p className="text-white font-medium">
                    {stmt.period_month}/{stmt.period_year}
                  </p>
                  <p className="text-white/40 text-xs">
                    {formatDate(stmt.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">
                    {formatCurrency(stmt.total_value)}
                  </p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${getStatusColor(stmt.status)}`}>
                    {statusLabels[stmt.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesScreen;
