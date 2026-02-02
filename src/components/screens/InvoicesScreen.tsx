import { useState } from "react";
import { FileText, Paperclip, ChevronRight, Filter, Search, Loader2 } from "lucide-react";
import { useInvoices, InvoiceStatus } from "@/hooks/useInvoices";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const InvoicesScreen = () => {
  const [activeTab, setActiveTab] = useState<InvoiceStatus | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const { invoices, isLoading } = useInvoices(activeTab);

  const tabs: { key: InvoiceStatus | "all"; label: string }[] = [
    { key: "pending", label: "Em Aberto" },
    { key: "approved", label: "Aprovadas" },
    { key: "all", label: "Todas" },
  ];

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.description?.toLowerCase().includes(searchQuery.toLowerCase())
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

      {/* Invoice List */}
      {isLoading ? (
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
      )}
    </div>
  );
};

export default InvoicesScreen;
