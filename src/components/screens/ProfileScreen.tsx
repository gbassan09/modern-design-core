import { Link } from "react-router-dom";
import { User, Bell, Shield, FileText, HelpCircle, LogOut, ChevronRight, Moon, Smartphone, Mail, Building, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useInvoices } from "@/hooks/useInvoices";

const ProfileScreen = () => {
  const { user, profile, isAdmin, signOut, isLoading } = useAuth();
  const { invoices } = useInvoices();

  const approvedInvoices = invoices.filter((i) => i.status === "approved");
  const totalApproved = approvedInvoices.reduce((sum, i) => sum + i.total_value, 0);
  const approvalRate = invoices.length > 0 
    ? Math.round((approvedInvoices.length / invoices.length) * 100) 
    : 0;

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const fullName = profile?.full_name || "Usuário";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const menuItems = [
    {
      section: "Conta",
      items: [
        { icon: User, label: "Editar Perfil", description: "Nome, foto e dados pessoais" },
        { icon: Bell, label: "Notificações", description: "Alertas e lembretes", hasToggle: true, toggleOn: true },
        { icon: Moon, label: "Tema Escuro", description: "Aparência do app", hasToggle: true, toggleOn: true },
      ],
    },
    {
      section: "Empresa",
      items: [
        { icon: Building, label: "Departamento", description: profile?.department || "Não definido" },
        { icon: Shield, label: "Política de Despesas", description: "Regras e limites corporativos" },
        { icon: FileText, label: "Relatórios", description: "Exportar e visualizar dados" },
      ],
    },
    {
      section: "Suporte",
      items: [
        { icon: HelpCircle, label: "Central de Ajuda", description: "Dúvidas frequentes" },
        { icon: Mail, label: "Fale Conosco", description: "suporte@xpenseflow.com" },
        { icon: Smartphone, label: "Versão do App", description: "v2.4.1" },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen px-4 pb-24 pt-6 w-full flex flex-col items-center justify-center">
        <div className="glass-card-strong text-center max-w-sm">
          <p className="text-white/60 mb-4">Faça login para ver seu perfil</p>
          <Link to="/login" className="gradient-btn block w-full py-3">
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 w-full">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-sm text-white/60">Gerencie sua conta</p>
        </div>
        {isAdmin && (
          <Link
            to="/admin"
            className="glass-card px-3 py-2 text-xs font-medium text-primary hover:bg-white/10"
          >
            Painel Admin
          </Link>
        )}
      </header>

      {/* Profile Card */}
      <div className="glass-card-strong mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-background bg-success" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{fullName}</h2>
            <p className="text-sm text-white/60">{profile?.department || "Colaborador"}</p>
            <p className="text-xs text-white/40">{user.email}</p>
            {isAdmin && (
              <span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                Administrador
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{invoices.length}</p>
            <p className="text-xs text-white/50">Despesas</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-success">{formatCurrency(totalApproved)}</p>
            <p className="text-xs text-white/50">Aprovado</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">{approvalRate}%</p>
            <p className="text-xs text-white/50">Aprovação</p>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      {menuItems.map((section) => (
        <div key={section.section} className="mb-4">
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-white/40">
            {section.section}
          </h3>
          <div className="glass-card space-y-1 p-2">
            {section.items.map((item, index) => (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/10 ${
                  index !== section.items.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-xs text-white/50">{item.description}</p>
                </div>
                {item.hasToggle ? (
                  <div
                    className={`h-6 w-11 rounded-full p-0.5 transition-all ${
                      item.toggleOn ? "bg-gradient-to-r from-primary to-accent" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white shadow-md transition-all ${
                        item.toggleOn ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                ) : (
                  <ChevronRight className="h-5 w-5 text-white/30" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <button
        onClick={signOut}
        className="glass-card mt-2 flex w-full items-center justify-center gap-2 py-4 text-destructive transition-all hover:bg-destructive/10"
      >
        <LogOut className="h-5 w-5" />
        <span className="font-semibold">Sair da Conta</span>
      </button>

      {/* Version */}
      <p className="mt-6 text-center text-xs text-white/30">
        XpenseFlow v2.4.1 • © 2025
      </p>
    </div>
  );
};

export default ProfileScreen;
