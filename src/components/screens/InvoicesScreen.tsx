import { FileText, Paperclip, ChevronRight, Filter, Search } from "lucide-react";

const InvoicesScreen = () => {
  const tabs = ["Em Aberto", "Conferidas", "Todas"];
  const activeTab = "Em Aberto";

  const invoices = [
    {
      id: 1,
      supplier: "Uber Brasil",
      description: "Corridas corporativas - Dezembro",
      value: "R$ 1.245,80",
      date: "05/01/2025",
      dueDate: "15/01/2025",
      status: "pending",
      hasAttachment: true,
      items: 12,
    },
    {
      id: 2,
      supplier: "Amazon AWS",
      description: "Serviços de Cloud Computing",
      value: "R$ 3.890,00",
      date: "03/01/2025",
      dueDate: "10/01/2025",
      status: "pending",
      hasAttachment: true,
      items: 1,
    },
    {
      id: 3,
      supplier: "Restaurante Fasano",
      description: "Almoço executivo - Cliente ABC",
      value: "R$ 580,00",
      date: "02/01/2025",
      dueDate: "02/01/2025",
      status: "overdue",
      hasAttachment: false,
      items: 1,
    },
    {
      id: 4,
      supplier: "Hotel Ibis",
      description: "Hospedagem - Viagem SP",
      value: "R$ 890,00",
      date: "28/12/2024",
      dueDate: "05/01/2025",
      status: "pending",
      hasAttachment: true,
      items: 2,
    },
  ];

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 w-full">
      {/* Header */}
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
            key={tab}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white/15 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="mb-4 flex gap-3">
        <div className="glass-card flex-1 py-3">
          <p className="text-2xl font-bold text-white">4</p>
          <p className="text-xs text-white/60">Em aberto</p>
        </div>
        <div className="glass-card flex-1 py-3">
          <p className="text-2xl font-bold text-warning">R$ 6.6k</p>
          <p className="text-xs text-white/60">Total pendente</p>
        </div>
        <div className="glass-card flex-1 py-3">
          <p className="text-2xl font-bold text-destructive">1</p>
          <p className="text-xs text-white/60">Vencida</p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {invoices.map((invoice) => (
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
                {invoice.hasAttachment && (
                  <Paperclip className="h-3 w-3 text-white/40" />
                )}
              </div>
              <p className="text-xs text-white/50">{invoice.description}</p>
              <p className="mt-1 text-xs text-white/40">
                {invoice.items} {invoice.items > 1 ? "itens" : "item"} • Vence {invoice.dueDate}
              </p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-white">{invoice.value}</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                invoice.status === "overdue" ? "status-rejected" : "status-pending"
              }`}>
                {invoice.status === "overdue" ? "Vencida" : "Pendente"}
              </span>
            </div>

            <ChevronRight className="h-5 w-5 text-white/30" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoicesScreen;
