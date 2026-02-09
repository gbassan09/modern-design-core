import { useState, useCallback, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";

export interface ParsedExpense {
  description: string;
  value: number;
  date: string | null;
}

export interface ParsedStatement {
  periodMonth: number | null;
  periodYear: number | null;
  totalValue: number | null;
  expenses: ParsedExpense[];
  rawText: string;
}

export const usePDFParser = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }, []);

  const extractTextFromPDF = useCallback(async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  }, []);

  const parseStatementData = useCallback((text: string): ParsedStatement => {
    const result: ParsedStatement = {
      periodMonth: null,
      periodYear: null,
      totalValue: null,
      expenses: [],
      rawText: text,
    };

    // Try to extract period (month/year)
    // Common patterns: "Fatura de Janeiro/2024", "01/2024", "JAN/24", etc.
    const monthNames: Record<string, number> = {
      janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4,
      maio: 5, junho: 6, julho: 7, agosto: 8,
      setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
      jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
      jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
    };

    // Pattern: month name + year
    const monthYearPattern = /(?:fatura\s+(?:de\s+)?)?(\w+)[\/\s-]+(\d{2,4})/gi;
    let match;
    while ((match = monthYearPattern.exec(text)) !== null) {
      const monthStr = match[1].toLowerCase();
      const yearStr = match[2];
      
      if (monthNames[monthStr]) {
        result.periodMonth = monthNames[monthStr];
        result.periodYear = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);
        break;
      }
    }

    // Pattern: MM/YYYY
    if (!result.periodMonth) {
      const mmYYYYPattern = /(\d{2})[\/\-](\d{4})/;
      const mmMatch = text.match(mmYYYYPattern);
      if (mmMatch) {
        const month = parseInt(mmMatch[1]);
        if (month >= 1 && month <= 12) {
          result.periodMonth = month;
          result.periodYear = parseInt(mmMatch[2]);
        }
      }
    }

    // Extract total value
    // Common patterns: "Total: R$ 1.234,56", "Valor Total R$1234,56", "TOTAL DA FATURA: 1.234,56"
    const totalPatterns = [
      /total\s*(?:da\s*fatura)?[:\s]*R?\$?\s*([\d.,]+)/gi,
      /valor\s*total[:\s]*R?\$?\s*([\d.,]+)/gi,
      /saldo\s*(?:devedor)?[:\s]*R?\$?\s*([\d.,]+)/gi,
    ];

    for (const pattern of totalPatterns) {
      const totalMatch = pattern.exec(text);
      if (totalMatch) {
        const valueStr = totalMatch[1]
          .replace(/\./g, "")
          .replace(",", ".");
        const value = parseFloat(valueStr);
        if (!isNaN(value) && value > 0) {
          result.totalValue = value;
          break;
        }
      }
    }

    // Extract individual expenses/transactions
    // Common pattern: date + description + value
    // E.g., "15/01/2024 UBER TRIP 45,00"
    const standardLinePattern = /(\d{2}[\/\-]\d{2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+(?:R?\$?\s*)?(\d+[.,]\d{2,})(?:\s|$)/g;
    // Nubank pattern: DD MMM Description Value (e.g. "15 FEV Uber 19,90")
    const nubankLinePattern = /(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.+?)\s+(?:R?\$?\s*)?(\d+[.,]\d{2,})(?:\s|$)/gi;
    
    const lines = text.split("\n");
    const shouldInclude = (desc: string) => {
      const lower = desc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lower.length <= 2) return false;
      if (lower.includes("periodo vigente")) return false;
      if (lower.includes("emissao e envio")) return false;
      if (lower.includes("total da fatura")) return false;
      if (lower.includes("saldo anterior")) return false;
      if (lower.includes("pagamento")) return false;
      if (lower.includes("credito")) return false;
      if (lower.includes("vencimento")) return false;
      if (lower.includes("fechamento")) return false;
      if (lower.includes("obrigado")) return false;
      if (lower.includes("autenticacao")) return false;
      if (/^(de|a)\s+\d{2}\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/.test(lower)) return false;
      return true;
    };
    for (const line of lines) {
      // Find all matches in the page text (treated as one line)
      
      // 1. Try Standard Pattern
      let standardMatch;
      while ((standardMatch = standardLinePattern.exec(line)) !== null) {
        const dateStr = standardMatch[1];
        const description = standardMatch[2].trim();
        const valueStr = standardMatch[3];
        
        // Parse standard date
        const dateParts = dateStr.split(/[\/\-]/);
        if (dateParts.length >= 2) {
          const day = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]);
          let year = dateParts[2] ? parseInt(dateParts[2]) : (result.periodYear || new Date().getFullYear());
          if (year < 100) year += 2000;
          
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
            const parsedDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
             const value = parseFloat(valueStr.replace(/\./g, "").replace(",", "."));

            if (!isNaN(value) && value > 0 && description.length > 2) {
              if (shouldInclude(description)) {
                result.expenses.push({
                  description,
                  value,
                  date: parsedDate,
                });
              }
            }
          }
        }
      }

      // 2. Try Nubank Pattern
      let nubankMatch;
      while ((nubankMatch = nubankLinePattern.exec(line)) !== null) {
        const day = parseInt(nubankMatch[1]);
        const monthStr = nubankMatch[2].toLowerCase();
        const description = nubankMatch[3].trim();
        const valueStr = nubankMatch[4];

        if (monthNames[monthStr]) {
          const month = monthNames[monthStr];
          const year = result.periodYear || new Date().getFullYear();
          const parsedDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const value = parseFloat(valueStr.replace(/\./g, "").replace(",", "."));

          if (!isNaN(value) && value > 0 && description.length > 2) {
             if (shouldInclude(description)) {
                result.expenses.push({
                  description,
                  value,
                  date: parsedDate,
                });
             }
          }
        }
      }
    }

    // Sort expenses by date
    result.expenses.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return result;
  }, []);

  const parsePDF = useCallback(async (file: File): Promise<ParsedStatement | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const text = await extractTextFromPDF(file);
      const parsed = parseStatementData(text);
      return parsed;
    } catch (err) {
      console.error("Error parsing PDF:", err);
      setError("Não foi possível processar o PDF. Tente novamente.");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [extractTextFromPDF, parseStatementData]);

  return {
    parsePDF,
    isProcessing,
    error,
  };
};
