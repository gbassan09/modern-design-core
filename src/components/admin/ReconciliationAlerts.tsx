import { AlertTriangle, AlertCircle, Info, FileText, DollarSign, FileX } from "lucide-react";
import { ReconciliationAlert } from "@/hooks/useReconciliation";

interface ReconciliationAlertsProps {
  alerts: ReconciliationAlert[];
  compact?: boolean;
}

const severityConfig = {
  error: {
    bg: "bg-destructive/20",
    border: "border-destructive/30",
    text: "text-destructive",
    icon: AlertCircle,
  },
  warning: {
    bg: "bg-warning/20",
    border: "border-warning/30",
    text: "text-warning",
    icon: AlertTriangle,
  },
  info: {
    bg: "bg-primary/20",
    border: "border-primary/30",
    text: "text-primary",
    icon: Info,
  },
};

const typeIcons = {
  missing_invoice: FileX,
  extra_expense: DollarSign,
  value_mismatch: AlertTriangle,
  incomplete_statement: FileText,
};

export const ReconciliationAlerts = ({ alerts, compact = false }: ReconciliationAlertsProps) => {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-success">
        <Info className="w-4 h-4" />
        <span className="text-sm">Nenhuma inconsistência encontrada</span>
      </div>
    );
  }

  if (compact) {
    const errorCount = alerts.filter((a) => a.severity === "error").length;
    const warningCount = alerts.filter((a) => a.severity === "warning").length;

    return (
      <div className="flex items-center gap-3">
        {errorCount > 0 && (
          <span className="flex items-center gap-1 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            {errorCount} crítico{errorCount > 1 ? "s" : ""}
          </span>
        )}
        {warningCount > 0 && (
          <span className="flex items-center gap-1 text-warning text-sm">
            <AlertTriangle className="w-4 h-4" />
            {warningCount} alerta{warningCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity];
        const TypeIcon = typeIcons[alert.type];
        const SeverityIcon = config.icon;

        return (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border ${config.bg} ${config.border}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${config.text}`}>
                <SeverityIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <TypeIcon className="w-3.5 h-3.5 text-white/50" />
                  <p className="font-medium text-white text-sm">{alert.title}</p>
                </div>
                <p className="text-white/60 text-xs mt-1">{alert.description}</p>
                {alert.value !== undefined && alert.value !== 0 && (
                  <p className={`text-xs mt-1 ${config.text}`}>
                    Valor: R$ {Math.abs(alert.value).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
