import { User, Bell, Shield, FileText, HelpCircle, LogOut, ChevronRight, Moon, Smartphone, Mail, Building } from "lucide-react";

const ProfileScreen = () => {
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
        { icon: Building, label: "Dados da Empresa", description: "Tech Solutions Ltda" },
        { icon: Shield, label: "Política de Despesas", description: "Regras e limites corporativos" },
        { icon: FileText, label: "Relatórios", description: "Exportar e visualizar dados" },
      ],
    },
    {
      section: "Suporte",
      items: [
        { icon: HelpCircle, label: "Central de Ajuda", description: "Dúvidas frequentes" },
        { icon: Mail, label: "Fale Conosco", description: "suporte@techsolutions.com" },
        { icon: Smartphone, label: "Versão do App", description: "v2.4.1" },
      ],
    },
  ];

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 mx-auto max-w-md">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-white/60">Gerencie sua conta</p>
      </header>

      {/* Profile Card */}
      <div className="glass-card-strong mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
              <span className="text-2xl font-bold text-white">JS</span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-background bg-success" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">João Silva</h2>
            <p className="text-sm text-white/60">Gerente Comercial</p>
            <p className="text-xs text-white/40">joao.silva@techsolutions.com</p>
          </div>
          <button className="glass-card rounded-xl px-3 py-2 text-sm font-medium text-white">
            Editar
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
          <div className="text-center">
            <p className="text-xl font-bold text-white">156</p>
            <p className="text-xs text-white/50">Despesas</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-success">R$ 24k</p>
            <p className="text-xs text-white/50">Total Ano</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">98%</p>
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
                  <div className={`h-6 w-11 rounded-full p-0.5 transition-all ${
                    item.toggleOn ? "bg-gradient-to-r from-primary to-accent" : "bg-white/20"
                  }`}>
                    <div className={`h-5 w-5 rounded-full bg-white shadow-md transition-all ${
                      item.toggleOn ? "translate-x-5" : "translate-x-0"
                    }`} />
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
      <button className="glass-card mt-2 flex w-full items-center justify-center gap-2 py-4 text-destructive transition-all hover:bg-destructive/10">
        <LogOut className="h-5 w-5" />
        <span className="font-semibold">Sair da Conta</span>
      </button>

      {/* Version */}
      <p className="mt-6 text-center text-xs text-white/30">
        Expense Manager v2.4.1 • © 2025 Tech Solutions
      </p>
    </div>
  );
};

export default ProfileScreen;
