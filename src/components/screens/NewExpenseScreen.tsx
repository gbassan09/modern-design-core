import { Camera, Upload, Receipt, Calendar, Tag, Building2, FileText, ChevronDown } from "lucide-react";

const NewExpenseScreen = () => {
  const categories = [
    "Transporte",
    "Alimentação",
    "Hospedagem",
    "Suprimentos",
    "Tecnologia",
    "Outros",
  ];

  return (
    <div className="min-h-screen px-4 pb-24 pt-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Nova Despesa</h1>
        <p className="text-sm text-white/60">Registre sua despesa corporativa</p>
      </header>

      {/* OCR Upload Area */}
      <div className="glass-card-strong mb-6 border-2 border-dashed border-white/20">
        <div className="flex flex-col items-center py-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <h3 className="mb-1 font-semibold text-white">
            Escaneie o comprovante
          </h3>
          <p className="mb-4 text-center text-sm text-white/50">
            Tire uma foto ou faça upload do recibo para preenchimento automático
          </p>
          <div className="flex gap-3">
            <button className="gradient-btn flex items-center gap-2 py-2.5 text-sm">
              <Camera className="h-4 w-4" />
              Câmera
            </button>
            <button className="glass-card flex items-center gap-2 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15">
              <Upload className="h-4 w-4" />
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Value */}
        <div className="glass-card">
          <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
            <Receipt className="h-4 w-4" />
            Valor
          </label>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white/60">R$</span>
            <input
              type="text"
              placeholder="0,00"
              className="flex-1 bg-transparent text-3xl font-bold text-white outline-none placeholder:text-white/30"
            />
          </div>
        </div>

        {/* Date */}
        <div className="glass-card">
          <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
            <Calendar className="h-4 w-4" />
            Data
          </label>
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-white">07/01/2025</span>
            <ChevronDown className="h-5 w-5 text-white/50" />
          </div>
        </div>

        {/* Category */}
        <div className="glass-card">
          <label className="mb-3 flex items-center gap-2 text-sm text-white/60">
            <Tag className="h-4 w-4" />
            Categoria
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <button
                key={category}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  index === 0
                    ? "bg-gradient-to-r from-primary to-accent text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Cost Center */}
        <div className="glass-card">
          <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
            <Building2 className="h-4 w-4" />
            Centro de Custo
          </label>
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-white">Comercial - Vendas</span>
            <ChevronDown className="h-5 w-5 text-white/50" />
          </div>
        </div>

        {/* Description */}
        <div className="glass-card">
          <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
            <FileText className="h-4 w-4" />
            Descrição
          </label>
          <textarea
            placeholder="Descreva a despesa..."
            rows={3}
            className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/30"
          />
        </div>

        {/* Attachment Preview */}
        <div className="glass-card">
          <label className="mb-3 text-sm text-white/60">Comprovante anexado</label>
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10">
              <Receipt className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">recibo_uber.jpg</p>
              <p className="text-xs text-white/50">245 KB • Carregado agora</p>
            </div>
            <button className="text-sm text-destructive">Remover</button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button className="gradient-btn w-full py-4 text-lg">
          Enviar Despesa
        </button>
        <p className="mt-3 text-center text-xs text-white/40">
          A despesa será enviada para aprovação do gestor
        </p>
      </div>
    </div>
  );
};

export default NewExpenseScreen;
