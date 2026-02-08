import { useState, useRef } from "react";
import { Camera, Upload, Receipt, Calendar, Tag, Building2, FileText, ChevronDown, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOCR, OCRResult } from "@/hooks/useOCR";
import { useInvoices } from "@/hooks/useInvoices";
import { useToast } from "@/hooks/use-toast";
import YoloCameraModal from "@/components/YoloCameraModal";
import { InvoiceItemsEditor, InvoiceItem } from "@/components/InvoiceItemsEditor";

const categories = [
  { value: "transporte", label: "Transporte" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "hospedagem", label: "Hospedagem" },
  { value: "suprimentos", label: "Suprimentos" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "outros", label: "Outros" },
] as const;

const NewExpenseScreen = () => {
  const { user } = useAuth();
  const { processImage, uploadImage, isProcessing } = useOCR();
  const { createInvoice } = useInvoices();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Form state
  const [supplier, setSupplier] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [description, setDescription] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [taxValue, setTaxValue] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<string>("outros");
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    // Process with OCR
    const result = await processImage(file);
    if (result) {
      fillFormWithOCRData(result);
    }
  };

  const fillFormWithOCRData = (data: OCRResult) => {
    if (data.supplier) setSupplier(data.supplier);
    if (data.cnpj) setCnpj(data.cnpj);
    if (data.description) setDescription(data.description);
    if (data.total_value) setTotalValue(data.total_value.toFixed(2));
    if (data.tax_value) setTaxValue(data.tax_value.toFixed(2));
    if (data.invoice_date) setInvoiceDate(data.invoice_date);
    if (data.due_date) setDueDate(data.due_date);
    if (data.category) setCategory(data.category);
    
    // Auto-fill items from OCR
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      const convertedItems: InvoiceItem[] = data.items.map((item) => ({
        description: item.name || "Item",
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total: item.total || (item.quantity || 1) * (item.unit_price || 0),
      }));
      setItems(convertedItems);
    }
  };

  const handleCameraClick = () => {
    setIsCameraOpen(true);
  };

  const handleCameraCapture = async (imageBase64: string) => {
    // Convert base64 to file
    const response = await fetch(imageBase64);
    const blob = await response.blob();
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });

    setSelectedFile(file);
    setPreviewUrl(imageBase64);

    // Process with OCR
    const result = await processImage(file);
    if (result) {
      fillFormWithOCRData(result);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.accept = "image/*,.pdf";
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para enviar despesas.",
        variant: "destructive",
      });
      return;
    }

    if (!supplier || !totalValue) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o fornecedor e o valor.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;
      
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile, user.id);
      }

      const { error } = await createInvoice(
        {
          supplier,
          cnpj: cnpj || null,
          description: description || null,
          total_value: parseFloat(totalValue.replace(",", ".")),
          tax_value: taxValue ? parseFloat(taxValue.replace(",", ".")) : null,
          invoice_date: invoiceDate || null,
          due_date: dueDate || null,
          category: category as any,
          items: items.length > 0 ? JSON.parse(JSON.stringify(items)) : null,
          image_url: imageUrl,
          raw_ocr_data: null,
        },
        items // Pass items to be saved individually
      );

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Despesa enviada para aprovação.",
      });

      // Reset form
      setSupplier("");
      setCnpj("");
      setDescription("");
      setTotalValue("");
      setTaxValue("");
      setInvoiceDate(new Date().toISOString().split("T")[0]);
      setDueDate("");
      setCategory("outros");
      setItems([]);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a despesa.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 w-full">
      {/* YOLO Camera Modal */}
      <YoloCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Nova Despesa</h1>
        <p className="text-sm text-white/60">Registre sua despesa corporativa</p>
      </header>

      {/* OCR Upload Area */}
      <div className="glass-card-strong mb-6 border-2 border-dashed border-white/20">
        <div className="flex flex-col items-center py-6">
          {isProcessing ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <h3 className="font-semibold text-white">Processando imagem...</h3>
              <p className="text-sm text-white/50">Extraindo dados da nota fiscal</p>
            </>
          ) : previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Preview"
                className="h-32 w-auto rounded-xl mb-4 object-cover"
              />
              <p className="text-sm text-white/60 mb-2">{selectedFile?.name}</p>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="text-sm text-destructive hover:underline"
              >
                Remover
              </button>
            </>
          ) : (
            <>
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
                <button
                  onClick={handleCameraClick}
                  className="gradient-btn flex items-center gap-2 py-2.5 text-sm"
                >
                  <Camera className="h-4 w-4" />
                  Câmera
                </button>
                <button
                  onClick={handleUploadClick}
                  className="glass-card flex items-center gap-2 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Supplier */}
        <div className="glass-card">
          <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
            <Building2 className="h-4 w-4" />
            Fornecedor
          </label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Nome do fornecedor"
            className="w-full bg-transparent text-lg font-medium text-white outline-none placeholder:text-white/30"
          />
        </div>

        {/* CNPJ */}
        <div className="glass-card">
          <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
            <FileText className="h-4 w-4" />
            CNPJ
          </label>
          <input
            type="text"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="00.000.000/0000-00"
            className="w-full bg-transparent text-lg font-medium text-white outline-none placeholder:text-white/30"
          />
        </div>

        {/* Value */}
        <div className="glass-card">
          <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
            <Receipt className="h-4 w-4" />
            Valor Total
          </label>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white/60">R$</span>
            <input
              type="text"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              placeholder="0,00"
              className="flex-1 bg-transparent text-3xl font-bold text-white outline-none placeholder:text-white/30"
            />
          </div>
        </div>

        {/* Tax Value */}
        <div className="glass-card">
          <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
            <Receipt className="h-4 w-4" />
            Impostos (opcional)
          </label>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white/60">R$</span>
            <input
              type="text"
              value={taxValue}
              onChange={(e) => setTaxValue(e.target.value)}
              placeholder="0,00"
              className="flex-1 bg-transparent text-xl font-medium text-white outline-none placeholder:text-white/30"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card">
            <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
              <Calendar className="h-4 w-4" />
              Data Emissão
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full bg-transparent text-white outline-none"
            />
          </div>
          <div className="glass-card">
            <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
              <Calendar className="h-4 w-4" />
              Vencimento
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-transparent text-white outline-none"
            />
          </div>
        </div>

        {/* Category */}
        <div className="glass-card">
          <label className="mb-3 flex items-center gap-2 text-sm text-white/60">
            <Tag className="h-4 w-4" />
            Categoria
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  category === cat.value
                    ? "bg-gradient-to-r from-primary to-accent text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="glass-card">
          <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
            <FileText className="h-4 w-4" />
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a despesa..."
            rows={3}
            className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/30"
          />
        </div>

        {/* Invoice Items */}
        <div className="glass-card">
          <InvoiceItemsEditor items={items} onChange={setItems} />
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isProcessing}
          className="gradient-btn w-full py-4 text-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando...
            </span>
          ) : (
            "Enviar Despesa"
          )}
        </button>
        <p className="mt-3 text-center text-xs text-white/40">
          A despesa será enviada para aprovação do gestor
        </p>
      </div>
    </div>
  );
};

export default NewExpenseScreen;
