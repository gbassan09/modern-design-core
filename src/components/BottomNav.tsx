import { Home, FileText, Plus, Clock, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const navItems = [
    { id: "home", icon: Home, label: "Início" },
    { id: "invoices", icon: FileText, label: "Faturas" },
    { id: "new", icon: Plus, label: "Nova" },
    { id: "history", icon: Clock, label: "Histórico" },
    { id: "profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map((item) => {
          const isCenter = item.id === "new";
          const isActive = activeTab === item.id;

          if (isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="gradient-btn -mt-6 flex h-14 w-14 items-center justify-center rounded-full p-0 shadow-lg"
              >
                <item.icon className="h-6 w-6" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
