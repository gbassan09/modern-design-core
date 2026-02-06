import { useState } from "react";
import { FileText, Paperclip, ChevronRight, Filter, Search, Loader2, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { useInvoices, InvoiceStatus } from "@/hooks/useInvoices";
import { usePDFStatements } from "@/hooks/usePDFStatements";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InvoiceItemsDisplay } from "@/components/InvoiceItemsDisplay";
import { InvoiceItem } from "@/components/InvoiceItemsEditor";

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

const statementStatusLabels: Record<string, string> = {
  em_analise: "Em Análise",
  batida: "Batida",
  divergente: "Divergente",
};

type TabType = "notas" | "faturas";

const HistoryScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>("notas");
  const [notasFilter, setNotasFilter] = useState<InvoiceStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { invoices, isLoading: invoicesLoading } = useInvoices("all");
  const { statements, isLoading: statementsLoading } = usePDFStatements();

  const tabs: { key: TabType; label: string }[] = [
    { key: "notas", label: "Notas Fiscais" },
    { key: "faturas", label: "Faturas PDF" },
  ];

  const notasFilters: { key: InvoiceStatus | "all"; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "pending", label: "Pendentes" },
    { key: "approved", label: "Aprovadas" },
    { key: "rejected", label: "Rejeitadas" },
  ];

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = 
      inv.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = notasFilter === "all" || inv.status === notasFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredStatements = statements.filter((stmt) =>
    `${stmt.period_month}/${stmt.period_year}`.includes(searchQuery)
  );

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

  const getStatementStatusIcon = (status: string) => {
    switch (status) {
      case "batida":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "divergente":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Loader2 className="h-5 w-5 text-warning animate-spin" />;
    }
  };

  const getStatementStatusColor = (status: string) => {
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
        <h1 className="text-2xl font-bold text-white">Histórico</h1>
        <p className="text-sm text-white/60">Visualize suas notas e faturas</p>
      </header>

      {/* Main Tabs */}
      <div className="glass-card mb-4 flex gap-1 p-1">
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

      {/* Search Bar */}
      <div className="mb-4 flex gap-2">
        <div className="glass-input flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder={activeTab === "notas" ? "Buscar notas..." : "Buscar faturas..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
          />
        </div>
        <button className="glass-card flex h-12 w-12 items-center justify-center rounded-xl p-0">
          <Filter className="h-5 w-5 text-white/70" />
        </button>
      </div>

      {/* Notas Tab Content */}
      {activeTab === "notas" && (
        <>
          {/* Sub-filters for notas */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {notasFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setNotasFilter(filter.key)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-all ${
                  notasFilter === filter.key
                    ? "bg-primary text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="mb-4 flex gap-3">
            <div className="glass-card flex-1 py-3">
              <p className="text-2xl font-bold text-white">{invoices.length}</p>
              <p className="text-xs text-white/60">Total de notas</p>
            </div>
            <div className="glass-card flex-1 py-3">
              <p className="text-2xl font-bold text-success">
                {invoices.filter((i) => i.status === "approved").length}
              </p>
              <p className="text-xs text-white/60">Aprovadas</p>
            </div>
            <div className="glass-card flex-1 py-3">
              <p className="text-2xl font-bold text-warning">
                {invoices.filter((i) => i.status === "pending").length}
              </p>
              <p className="text-xs text-white/60">Pendentes</p>
            </div>
          </div>

          {/* Invoice List */}
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="glass-card text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-white/30 mb-4" />
              <p className="text-white/60">Nenhuma nota encontrada</p>
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
                      {formatDate(invoice.invoice_date)}
                    </p>
                    {invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0 && (
                      <InvoiceItemsDisplay 
                        items={invoice.items as unknown as InvoiceItem[]} 
                        compact 
                      />
                    )}
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
          )}
        </>
      )}

      {/* Faturas Tab Content */}
      {activeTab === "faturas" && (
        <>
          {/* Summary */}
          <div className="mb-4 flex gap-3">
            <div className="glass-card flex-1 py-3">
              <p className="text-2xl font-bold text-white">{statements.length}</p>
              <p className="text-xs text-white/60">Total de faturas</p>
            </div>
            <div className="glass-card flex-1 py-3">
              <p className="text-2xl font-bold text-success">
                {statements.filter((s) => s.status === "batida").length}
              </p>
              <p className="text-xs text-white/60">Batidas</p>
            </div>
            <div className="glass-card flex-1 py-3">
              <p className="text-2xl font-bold text-destructive">
                {statements.filter((s) => s.status === "divergente").length}
              </p>
              <p className="text-xs text-white/60">Divergentes</p>
            </div>
          </div>

          {/* Statements List */}
          {statementsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : filteredStatements.length === 0 ? (
            <div className="glass-card text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-white/30 mb-4" />
              <p className="text-white/60">Nenhuma fatura encontrada</p>
              <p className="text-white/40 text-sm mt-2">
                Envie uma fatura PDF na aba Faturas
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
                    {getStatementStatusIcon(stmt.status)}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-white">
                      Fatura {stmt.period_month}/{stmt.period_year}
                    </p>
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
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${getStatementStatusColor(stmt.status)}`}>
                      {statementStatusLabels[stmt.status]}
                    </span>
                  </div>

                  <ChevronRight className="h-5 w-5 text-white/30" />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryScreen;
