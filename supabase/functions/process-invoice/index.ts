import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvoiceData {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing invoice image with AI Vision...");

    const systemPrompt = `Você é um especialista em extração de dados de notas fiscais brasileiras.
Analise a imagem da nota fiscal e extraia as seguintes informações:
- supplier: Nome do fornecedor/empresa
- cnpj: CNPJ do fornecedor (formato XX.XXX.XXX/XXXX-XX)
- description: Descrição geral da compra
- total_value: Valor total (número decimal)
- tax_value: Valor dos impostos se visível (número decimal ou null)
- invoice_date: Data de emissão (formato YYYY-MM-DD)
- due_date: Data de vencimento se existir (formato YYYY-MM-DD ou null)
- category: Categoria que melhor descreve (transporte, alimentacao, hospedagem, suprimentos, tecnologia, outros)
- items: Array de itens com {name, quantity, unit_price, total}

Retorne APENAS um objeto JSON válido, sem markdown ou explicações.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia os dados desta nota fiscal:",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log("AI Response:", content);

    let invoiceData: InvoiceData;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      invoiceData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a default structure if parsing fails
      invoiceData = {
        supplier: "Fornecedor não identificado",
        cnpj: null,
        description: "Nota fiscal processada",
        total_value: 0,
        tax_value: null,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: null,
        category: "outros",
        items: [],
      };
    }

    // Validate and normalize the category
    const validCategories = ["transporte", "alimentacao", "hospedagem", "suprimentos", "tecnologia", "outros"];
    if (!validCategories.includes(invoiceData.category?.toLowerCase())) {
      invoiceData.category = "outros";
    } else {
      invoiceData.category = invoiceData.category.toLowerCase();
    }

    // Ensure total_value is a number
    if (typeof invoiceData.total_value !== "number") {
      invoiceData.total_value = parseFloat(String(invoiceData.total_value).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    }

    console.log("Parsed invoice data:", invoiceData);

    return new Response(
      JSON.stringify({
        success: true,
        data: invoiceData,
        raw_response: content,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing invoice:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
