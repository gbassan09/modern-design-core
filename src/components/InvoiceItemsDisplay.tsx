import { Package, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { InvoiceItem } from "./InvoiceItemsEditor";

interface InvoiceItemsDisplayProps {
  items: InvoiceItem[];
  compact?: boolean;
}

export const InvoiceItemsDisplay = ({ items, compact = false }: InvoiceItemsDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (!items || items.length === 0) return null;

  const displayItems = compact && !isExpanded ? items.slice(0, 2) : items;
  const hasMore = compact && items.length > 2;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mb-1"
      >
        <Package className="h-3 w-3" />
        <span>{items.length} {items.length === 1 ? "item" : "itens"}</span>
        {hasMore && (
          isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {(isExpanded || !compact) && (
        <div className="space-y-1 pl-4 border-l-2 border-white/10">
          {displayItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex-1 min-w-0">
                <span className="text-white/70 truncate block">{item.description}</span>
                <span className="text-white/40">
                  {item.quantity}x {formatCurrency(item.unit_price)}
                </span>
              </div>
              <span className="text-white/60 shrink-0 ml-2">
                {formatCurrency(item.total)}
              </span>
            </div>
          ))}
          {compact && !isExpanded && hasMore && (
            <p className="text-xs text-white/40">
              +{items.length - 2} mais...
            </p>
          )}
        </div>
      )}
    </div>
  );
};
