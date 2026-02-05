import { Link } from "react-router-dom";
import { Clock, CheckCircle, ArrowUpRight, Wallet, CreditCard, Car, Coffee, ShoppingBag, LogIn, FileText, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useInvoices } from "@/hooks/useInvoices";
import { usePDFStatements } from "@/hooks/usePDFStatements";

const DashboardScreen = ({ onNavigateToHistory }: { onNavigateToHistory?: () => void }) => {
  const { user, profile, isLoading: authLoading, isAdmin } = useAuth();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { statements, isLoading: statementsLoading } = usePDFStatements();

  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const approvedCount = invoices.filter((i) => i.status === "approved").length;
  const monthlyTotal = invoices.reduce((sum, i) => sum + i.total_value, 0);
  
  const statementsTotal = statements.reduce((sum, s) => sum + s.total_value, 0);
  const divergentStatements = statements.filter((s) => s.status === "divergente").length;

  const recentInvoices = invoices.slice(0, 3);
  const recentStatements = statements.slice(0, 2);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transporte":
        return Car;
      case "alimentacao":
        return Coffee;
      default:
        return ShoppingBag;
    }
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  // Show login prompt if not authenticated
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen px-4 pb-24 pt-6 w-full flex flex-col items-center justify-center">
        <div className="glass-card-strong text-center max-w-sm">
          <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30">
            <LogIn className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao XpenseFlow</h2>
          <p className="text-white/60 mb-6">
            Faça login para gerenciar suas despesas corporativas
          </p>
          <Link to="/login" className="gradient-btn block w-full py-3">
            Fazer Login
          </Link>
          <p className="mt-4 text-sm text-white/50">
            Não tem conta?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 w-full">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Bem-vindo de volta,</p>
          <h1 className="text-2xl font-bold text-white">{firstName}</h1>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="glass-card px-3 py-2 text-xs font-medium text-primary hover:bg-white/10"
            >
              Admin
            </Link>
          )}
          <div className="glass-card flex h-12 w-12 items-center justify-center rounded-full p-0">
            <span className="text-lg font-semibold">{initials}</span>
          </div>
        </div>
      </header>

      {/* Main Balance Card */}
      <div className="glass-card-strong mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-2xl" />
        <div className="relative">
          <p className="mb-1 text-sm text-white/60">Despesas do Mês</p>
          <h2 className="gradient-text text-4xl font-bold">
            {formatCurrency(monthlyTotal)}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {invoices.length} notas registradas
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="glass-card">
          <div className="mb-2 flex items-center justify-between">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(statementsTotal)}</p>
          <p className="text-xs text-white/60">Faturas PDF</p>
        </div>

        <div className="glass-card">
          <div className="mb-2 flex items-center justify-between">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <p className="text-2xl font-bold text-white">{pendingCount}</p>
          <p className="text-xs text-white/60">Notas Pendentes</p>
        </div>

        <div className="glass-card">
          <div className="mb-2 flex items-center justify-between">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <p className="text-2xl font-bold text-white">{approvedCount}</p>
          <p className="text-xs text-white/60">Notas Aprovadas</p>
        </div>

        <div className="glass-card">
          <div className="mb-2 flex items-center justify-between">
            <Wallet className="h-5 w-5 text-accent" />
          </div>
          <p className="text-2xl font-bold text-white">{statements.length}</p>
          <p className="text-xs text-white/60">Faturas Cadastradas</p>
        </div>
      </div>

      {/* Recent Statements */}
      {recentStatements.length > 0 && (
        <div className="glass-card mb-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Últimas Faturas PDF</h3>
            <button onClick={() => onNavigateToHistory?.()} className="flex items-center text-sm text-primary">
              Ver todas
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </button>
          </div>

          {statementsLoading ? (
            <div className="py-4 text-center text-white/50">Carregando...</div>
          ) : (
            <div className="space-y-2">
              {recentStatements.map((stmt) => (
                <div
                  key={stmt.id}
                  className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    {stmt.status === "divergente" ? (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      Fatura {stmt.period_month}/{stmt.period_year}
                    </p>
                    <p className="text-xs text-white/50">
                      {stmt.status === "batida" ? "Valores conferem" : 
                       stmt.status === "divergente" ? `Diferença: ${formatCurrency(Math.abs(stmt.difference))}` :
                       "Em análise"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatCurrency(stmt.total_value)}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        stmt.status === "batida"
                          ? "status-approved"
                          : stmt.status === "divergente"
                          ? "status-rejected"
                          : "status-pending"
                      }`}
                    >
                      {stmt.status === "batida" ? "Batida" : 
                       stmt.status === "divergente" ? "Divergente" : "Em Análise"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Invoices/Notes */}
      <div className="glass-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">Últimas Notas</h3>
          <button onClick={() => onNavigateToHistory?.()} className="flex items-center text-sm text-primary">
            Ver todas
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </button>
        </div>

        {invoicesLoading ? (
          <div className="py-8 text-center text-white/50">Carregando...</div>
        ) : recentInvoices.length === 0 ? (
          <div className="py-8 text-center text-white/50">
            Nenhuma nota registrada ainda
          </div>
        ) : (
          <div className="space-y-3">
            {recentInvoices.map((invoice) => {
              const Icon = getCategoryIcon(invoice.category);
              return (
                <div
                  key={invoice.id}
                  className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{invoice.supplier}</p>
                    <p className="text-xs text-white/50">
                      {invoice.category} •{" "}
                      {invoice.invoice_date
                        ? new Date(invoice.invoice_date).toLocaleDateString("pt-BR")
                        : "Hoje"}
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
                      {invoice.status === "approved"
                        ? "Aprovada"
                        : invoice.status === "rejected"
                        ? "Rejeitada"
                        : "Pendente"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardScreen;
