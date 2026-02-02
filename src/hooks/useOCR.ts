import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OCRResult {
  supplier: string;
  cnpj: string | null;
  description: string | null;
  total_value: number;
  tax_value: number | null;
  invoice_date: string | null;
  due_date: string | null;
  category: string;
  items: Array<{ name: string; quantity: number; unit_price: number; total: number }>;
}

export const useOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processImage = async (imageFile: File): Promise<OCRResult | null> => {
    setIsProcessing(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const { data, error } = await supabase.functions.invoke("process-invoice", {
        body: { imageBase64: base64 },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Falha ao processar imagem");
      }

      toast({
        title: "Sucesso!",
        description: "Nota fiscal processada com sucesso.",
      });

      return data.data as OCRResult;
    } catch (error) {
      console.error("OCR Error:", error);
      
      let errorMessage = "Não foi possível processar a imagem.";
      if (error instanceof Error) {
        if (error.message.includes("429")) {
          errorMessage = "Limite de requisições atingido. Tente novamente mais tarde.";
        } else if (error.message.includes("402")) {
          errorMessage = "Créditos insuficientes. Adicione créditos para continuar.";
        }
      }

      toast({
        title: "Erro no OCR",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("invoice-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("invoice-images")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    processImage,
    uploadImage,
    isProcessing,
  };
};
