import { useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceItemsEditorProps {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
  readOnly?: boolean;
}

export const InvoiceItemsEditor = ({ items, onChange, readOnly = false }: InvoiceItemsEditorProps) => {
  const [newItem, setNewItem] = useState<InvoiceItem>({
    description: "",
    quantity: 1,
    unit_price: 0,
    total: 0,
  });

  const handleAddItem = () => {
    if (!newItem.description || newItem.unit_price <= 0) return;
    
    const itemWithTotal = {
      ...newItem,
      total: newItem.quantity * newItem.unit_price,
    };
    
    onChange([...items, itemWithTotal]);
    setNewItem({ description: "", quantity: 1, unit_price: 0, total: 0 });
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Package className="h-4 w-4" />
        <span>Itens da Nota ({items.length})</span>
        {items.length > 0 && (
          <span className="ml-auto text-white/80">
            Total: {formatCurrency(itemsTotal)}
          </span>
        )}
      </div>

      {/* Lista de itens existentes */}
      {items.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.description}</p>
                <p className="text-xs text-white/50">
                  {item.quantity}x {formatCurrency(item.unit_price)}
                </p>
              </div>
              <span className="text-sm font-medium text-white shrink-0">
                {formatCurrency(item.total)}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-1 rounded hover:bg-destructive/20 text-destructive/70 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulário para adicionar novo item */}
      {!readOnly && (
        <div className="space-y-2 p-3 rounded-lg bg-white/5 border border-dashed border-white/20">
          <Input
            placeholder="Descrição do item"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Qtd"
              min={1}
              value={newItem.quantity || ""}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
              className="w-20 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
            <div className="flex-1 flex items-center gap-1">
              <span className="text-white/50 text-sm">R$</span>
              <Input
                type="number"
                placeholder="Valor unitário"
                step="0.01"
                min={0}
                value={newItem.unit_price || ""}
                onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddItem}
              disabled={!newItem.description || newItem.unit_price <= 0}
              className="border-primary/50 text-primary hover:bg-primary/20"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 && !readOnly && (
        <p className="text-xs text-white/40 text-center">
          Adicione itens para detalhar melhor esta nota fiscal
        </p>
      )}
    </div>
  );
};
