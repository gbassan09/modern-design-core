import { TrendingUp, TrendingDown, Clock, CheckCircle, ArrowUpRight, Wallet, CreditCard, ShoppingBag, Coffee, Car } from "lucide-react";

const DashboardScreen = () => {
  const stats = [
    {
      label: "Saldo Disponível",
      value: "R$ 4.850,00",
      icon: Wallet,
      trend: null,
      highlight: true,
    },
    {
      label: "Despesas do Mês",
      value: "R$ 2.340,50",
      icon: CreditCard,
      trend: { value: "12%", up: true },
      highlight: false,
    },
    {
      label: "Pendentes",
      value: "5",
      icon: Clock,
      trend: null,
      highlight: false,
      status: "pending",
    },
    {
      label: "Aprovadas",
      value: "23",
      icon: CheckCircle,
      trend: null,
      highlight: false,
      status: "approved",
    },
  ];

  const recentTransactions = [
    { id: 1, title: "Uber - Reunião Cliente", category: "Transporte", value: "R$ 45,90", date: "Hoje", icon: Car, status: "approved" },
    { id: 2, title: "Almoço de Negócios", category: "Alimentação", value: "R$ 189,00", date: "Ontem", icon: Coffee, status: "pending" },
    { id: 3, title: "Material de Escritório", category: "Suprimentos", value: "R$ 234,50", date: "03/01", icon: ShoppingBag, status: "approved" },
  ];

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 w-full">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Bem-vindo de volta,</p>
          <h1 className="text-2xl font-bold text-white">João Silva</h1>
        </div>
        <div className="glass-card flex h-12 w-12 items-center justify-center rounded-full p-0">
          <span className="text-lg font-semibold">JS</span>
        </div>
      </header>

      {/* Main Balance Card */}
      <div className="glass-card-strong mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-2xl" />
        <div className="relative">
          <p className="mb-1 text-sm text-white/60">Limite Corporativo</p>
          <h2 className="gradient-text text-4xl font-bold">R$ 4.850,00</h2>
          <p className="mt-2 text-sm text-white/60">
            de R$ 10.000,00 disponíveis
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[48%] rounded-full bg-gradient-to-r from-primary to-accent" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {stats.slice(1).map((stat, index) => (
          <div key={index} className="glass-card">
            <div className="mb-2 flex items-center justify-between">
              <stat.icon className={`h-5 w-5 ${
                stat.status === "pending" ? "text-warning" : 
                stat.status === "approved" ? "text-success" : 
                "text-primary"
              }`} />
              {stat.trend && (
                <span className={`flex items-center text-xs ${stat.trend.up ? "text-success" : "text-destructive"}`}>
                  {stat.trend.up ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                  {stat.trend.value}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-white/60">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="glass-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">Últimas Despesas</h3>
          <button className="flex items-center text-sm text-primary">
            Ver todas
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <tx.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{tx.title}</p>
                <p className="text-xs text-white/50">{tx.category} • {tx.date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">{tx.value}</p>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                  tx.status === "approved" ? "status-approved" : "status-pending"
                }`}>
                  {tx.status === "approved" ? "Aprovada" : "Pendente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
