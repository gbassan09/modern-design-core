import { useState } from "react";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Settings, 
  Bell, 
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Building2,
  BarChart3,
  Shield
} from "lucide-react";

const Admin = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const stats = [
    { label: "Usuários Ativos", value: "248", icon: Users, trend: "+12%", color: "from-blue-500 to-cyan-500" },
    { label: "Despesas Pendentes", value: "67", icon: Clock, trend: "-8%", color: "from-amber-500 to-orange-500" },
    { label: "Total Aprovado", value: "R$ 284.500", icon: CheckCircle2, trend: "+23%", color: "from-emerald-500 to-green-500" },
    { label: "Empresas", value: "12", icon: Building2, trend: "+2", color: "from-purple-500 to-pink-500" },
  ];

  const pendingApprovals = [
    { id: 1, user: "Carlos Mendes", department: "Marketing", value: "R$ 1.250,00", type: "Viagem", status: "pending" },
    { id: 2, user: "Ana Paula", department: "Vendas", value: "R$ 890,00", type: "Hospedagem", status: "pending" },
    { id: 3, user: "Roberto Lima", department: "TI", value: "R$ 2.100,00", type: "Equipamento", status: "pending" },
    { id: 4, user: "Mariana Costa", department: "RH", value: "R$ 450,00", type: "Alimentação", status: "pending" },
  ];

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "Usuários", icon: Users },
    { id: "expenses", label: "Despesas", icon: FileText },
    { id: "reports", label: "Relatórios", icon: TrendingUp },
    { id: "companies", label: "Empresas", icon: Building2 },
    { id: "policies", label: "Políticas", icon: Shield },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 glass-card-strong rounded-none border-r border-white/10 p-4 hidden lg:block">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-white/50">ExpenseFlow</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                activeSection === item.id
                  ? "bg-primary/20 text-primary"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard Administrativo</h1>
            <p className="text-white/60">Bem-vindo, Administrador</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Buscar..."
                className="glass-input pl-10 pr-4 py-2 w-64"
              />
            </div>
            <button className="relative p-2 glass-card rounded-xl hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs flex items-center justify-center text-white">
                5
              </span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
              AD
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="glass-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <span className="text-xs text-success mt-1 inline-block">{stat.trend}</span>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <div className="lg:col-span-2 glass-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Aprovações Pendentes</h2>
              <button className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                Ver todas <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {pendingApprovals.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-medium">
                      {item.user.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-white font-medium">{item.user}</p>
                      <p className="text-white/50 text-sm">{item.department} • {item.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-semibold">{item.value}</span>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card">
            <h2 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-white font-medium">Adicionar Usuário</p>
                  <p className="text-white/50 text-sm">Cadastrar novo colaborador</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-white font-medium">Gerar Relatório</p>
                  <p className="text-white/50 text-sm">Exportar dados do mês</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-white font-medium">Ajustar Limites</p>
                  <p className="text-white/50 text-sm">Configurar limites de gasto</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-white font-medium">Políticas</p>
                  <p className="text-white/50 text-sm">Gerenciar regras de aprovação</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
