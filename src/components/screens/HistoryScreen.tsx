import { Clock, CheckCircle, XCircle, Car, Coffee, ShoppingBag, Plane, Monitor, Filter, Search } from "lucide-react";

const HistoryScreen = () => {
  const filters = ["Todas", "Aprovadas", "Pendentes", "Rejeitadas"];
  const activeFilter = "Todas";

  const expenses = [
    {
      id: 1,
      title: "Uber para Aeroporto",
      category: "Transporte",
      value: "R$ 89,50",
      date: "07/01/2025",
      time: "14:32",
      status: "approved",
      icon: Car,
    },
    {
      id: 2,
      title: "Almoço com Cliente",
      category: "Alimentação",
      value: "R$ 245,00",
      date: "06/01/2025",
      time: "12:45",
      status: "pending",
      icon: Coffee,
    },
    {
      id: 3,
      title: "Material de Escritório",
      category: "Suprimentos",
      value: "R$ 156,80",
      date: "05/01/2025",
      time: "10:20",
      status: "approved",
      icon: ShoppingBag,
    },
    {
      id: 4,
      title: "Passagem Aérea SP-RJ",
      category: "Viagem",
      value: "R$ 890,00",
      date: "04/01/2025",
      time: "09:15",
      status: "rejected",
      icon: Plane,
    },
    {
      id: 5,
      title: "Software Anual",
      category: "Tecnologia",
      value: "R$ 1.200,00",
      date: "03/01/2025",
      time: "16:00",
      status: "approved",
      icon: Monitor,
    },
    {
      id: 6,
      title: "Uber Reunião",
      category: "Transporte",
      value: "R$ 45,00",
      date: "02/01/2025",
      time: "08:30",
      status: "approved",
      icon: Car,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprovada";
      case "rejected":
        return "Rejeitada";
      default:
        return "Pendente";
    }
  };

  return (
    <div className="min-h-screen px-4 pb-24 pt-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Histórico</h1>
        <p className="text-sm text-white/60">Suas despesas anteriores</p>
      </header>

      {/* Search Bar */}
      <div className="mb-4 flex gap-2">
        <div className="glass-input flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Buscar despesas..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
          />
        </div>
        <button className="glass-card flex h-12 w-12 items-center justify-center rounded-xl p-0">
          <Filter className="h-5 w-5 text-white/70" />
        </button>
      </div>

      {/* Filter Pills */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeFilter === filter
                ? "bg-gradient-to-r from-primary to-accent text-white"
                : "bg-white/10 text-white/60 hover:bg-white/15 hover:text-white"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="glass-card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">Total em Janeiro</p>
            <p className="text-2xl font-bold text-white">R$ 2.626,30</p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-success">5</p>
              <p className="text-xs text-white/50">Aprovadas</p>
            </div>
            <div>
              <p className="text-lg font-bold text-warning">1</p>
              <p className="text-xs text-white/50">Pendentes</p>
            </div>
            <div>
              <p className="text-lg font-bold text-destructive">1</p>
              <p className="text-xs text-white/50">Rejeitadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="glass-card flex items-center gap-3 transition-all hover:bg-white/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <expense.icon className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1">
              <p className="font-medium text-white">{expense.title}</p>
              <p className="text-xs text-white/50">
                {expense.category} • {expense.date} às {expense.time}
              </p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-white">{expense.value}</p>
              <div className="mt-1 flex items-center justify-end gap-1">
                {getStatusIcon(expense.status)}
                <span className={`text-xs ${
                  expense.status === "approved" ? "text-success" :
                  expense.status === "rejected" ? "text-destructive" :
                  "text-warning"
                }`}>
                  {getStatusText(expense.status)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryScreen;
