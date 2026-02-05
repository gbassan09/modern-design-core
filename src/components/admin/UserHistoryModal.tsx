import { useState, useEffect } from "react";
import { X, FileText, Loader2, ChevronDown, ChevronRight, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { useReconciliation, UserReconciliationSummary } from "@/hooks/useReconciliation";
import { ReconciliationAlerts } from "./ReconciliationAlerts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserHistoryModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

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

export const UserHistoryModal = ({ userId, userName, onClose }: UserHistoryModalProps) => {
  const [summary, setSummary] = useState<UserReconciliationSummary | null>(null);
  const [expandedStatements, setExpandedStatements] = useState<Set<string>>(new Set());
  const { isLoading, generateUserReconciliation } = useReconciliation();

  useEffect(() => {
    generateUserReconciliation(userId).then(setSummary);
  }, [userId, generateUserReconciliation]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const toggleStatement = (id: string) => {
    setExpandedStatements((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="glass-card-strong w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Histórico Completo</h2>
            <p className="text-white/60 text-sm">{userName}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : !summary ? (
            <div className="text-center py-12">
              <p className="text-white/60">Erro ao carregar dados</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-white">{summary.totalStatements}</p>
                  <p className="text-xs text-white/60">Faturas PDF</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-white">{summary.totalInvoices}</p>
                  <p className="text-xs text-white/60">Notas Fiscais</p>
                </div>
                <div className="p-3 rounded-xl bg-success/20">
                  <p className="text-2xl font-bold text-success">{formatCurrency(summary.totalApprovedValue)}</p>
                  <p className="text-xs text-white/60">{summary.invoicesApproved} aprovadas</p>
                </div>
                <div className="p-3 rounded-xl bg-warning/20">
                  <p className="text-2xl font-bold text-warning">{formatCurrency(summary.totalPendingValue)}</p>
                  <p className="text-xs text-white/60">{summary.invoicesPending} pendentes</p>
                </div>
              </div>

              {/* Alerts Section */}
              {summary.alerts.length > 0 && (
                <div>
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Alertas e Inconsistências ({summary.alerts.length})
                  </h3>
                  <ReconciliationAlerts alerts={summary.alerts} />
                </div>
              )}

              {/* PDF Statements with Reconciliation */}
              {summary.statements.length > 0 && (
                <div>
                  <h3 className="text-white font-medium mb-3">Faturas PDF</h3>
                  <div className="space-y-2">
                    {summary.statements.map((recon) => (
                      <div key={recon.statement.id} className="rounded-xl bg-white/5 overflow-hidden">
                        <button
                          onClick={() => toggleStatement(recon.statement.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {expandedStatements.has(recon.statement.id) ? (
                              <ChevronDown className="w-4 h-4 text-white/50" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-white/50" />
                            )}
                            <FileText className="w-5 h-5 text-primary" />
                            <div className="text-left">
                              <p className="text-white font-medium">
                                Fatura {recon.statement.period_month}/{recon.statement.period_year}
                              </p>
                              <p className="text-white/50 text-xs">
                                {recon.expenses.length} itens • {recon.matchedInvoices.length} notas vinculadas
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white font-semibold">
                              {formatCurrency(recon.statement.total_value)}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                recon.statement.status === "batida"
                                  ? "bg-success/20 text-success"
                                  : recon.statement.status === "divergente"
                                  ? "bg-destructive/20 text-destructive"
                                  : "bg-warning/20 text-warning"
                              }`}
                            >
                              {statusLabels[recon.statement.status]}
                            </span>
                          </div>
                        </button>

                        {expandedStatements.has(recon.statement.id) && (
                          <div className="px-4 pb-4 space-y-4">
                            {/* Statement Details */}
                            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-white/5">
                              <div>
                                <p className="text-white/50 text-xs">Valor declarado</p>
                                <p className="text-white font-medium">{formatCurrency(recon.statement.total_value)}</p>
                              </div>
                              <div>
                                <p className="text-white/50 text-xs">Total calculado</p>
                                <p className="text-white font-medium">{formatCurrency(recon.statement.calculated_total)}</p>
                              </div>
                              <div>
                                <p className="text-white/50 text-xs">Diferença</p>
                                <p className={`font-medium ${recon.statement.difference !== 0 ? "text-destructive" : "text-success"}`}>
                                  {formatCurrency(Math.abs(recon.statement.difference))}
                                </p>
                              </div>
                            </div>

                            {/* Expenses Table */}
                            {recon.expenses.length > 0 && (
                              <div>
                                <p className="text-white/70 text-sm mb-2">Despesas da Fatura</p>
                                <div className="space-y-1">
                                  {recon.expenses.map((exp) => {
                                    const isUnmatched = recon.unmatchedExpenses.some((u) => u.id === exp.id);
                                    return (
                                      <div
                                        key={exp.id}
                                        className={`flex items-center justify-between p-2 rounded-lg ${
                                          isUnmatched ? "bg-warning/10 border border-warning/20" : "bg-white/5"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          {isUnmatched && <AlertTriangle className="w-3 h-3 text-warning" />}
                                          <span className="text-white text-sm truncate max-w-[200px]">
                                            {exp.description}
                                          </span>
                                          <span className="text-white/40 text-xs">
                                            {exp.expense_date ? format(new Date(exp.expense_date), "dd/MM", { locale: ptBR }) : "-"}
                                          </span>
                                        </div>
                                        <span className="text-white font-medium text-sm">
                                          {formatCurrency(exp.value)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Unmatched Invoices */}
                            {recon.invoicesNotInStatement.length > 0 && (
                              <div>
                                <p className="text-warning text-sm mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Notas fora da fatura ({recon.invoicesNotInStatement.length})
                                </p>
                                <div className="space-y-1">
                                  {recon.invoicesNotInStatement.map((inv) => (
                                    <div
                                      key={inv.id}
                                      className="flex items-center justify-between p-2 rounded-lg bg-warning/10 border border-warning/20"
                                    >
                                      <span className="text-white text-sm">{inv.supplier}</span>
                                      <span className="text-white font-medium text-sm">
                                        {formatCurrency(inv.total_value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Invoices */}
              {summary.invoices.length > 0 && (
                <div>
                  <h3 className="text-white font-medium mb-3">Todas as Notas Fiscais</h3>
                  <div className="space-y-2">
                    {summary.invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            {inv.status === "approved" ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : inv.status === "rejected" ? (
                              <XCircle className="w-4 h-4 text-destructive" />
                            ) : (
                              <Clock className="w-4 h-4 text-warning" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{inv.supplier}</p>
                            <p className="text-white/50 text-xs">
                              {categoryLabels[inv.category]} • {inv.invoice_date ? format(new Date(inv.invoice_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{formatCurrency(inv.total_value)}</p>
                          <span
                            className={`text-xs ${
                              inv.status === "approved"
                                ? "text-success"
                                : inv.status === "rejected"
                                ? "text-destructive"
                                : "text-warning"
                            }`}
                          >
                            {statusLabels[inv.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {summary.totalStatements === 0 && summary.totalInvoices === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-white/30 mb-4" />
                  <p className="text-white/60">Nenhum registro encontrado</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
