import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tables, Enums } from "@/integrations/supabase/types";

export type Invoice = Tables<"invoices">;
export type InvoiceStatus = Enums<"invoice_status">;

export const useInvoices = (statusFilter?: InvoiceStatus | "all") => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();
  const { toast } = useToast();

  const fetchInvoices = async () => {
    if (!session) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as faturas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createInvoice = async (invoiceData: Omit<Tables<"invoices">, "id" | "created_at" | "updated_at" | "user_id" | "approved_at" | "approved_by" | "rejection_reason" | "status">) => {
    if (!session?.user) return { error: new Error("Not authenticated") };

    try {
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          ...invoiceData,
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setInvoices((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error("Error creating invoice:", error);
      return { data: null, error };
    }
  };

  const updateInvoiceStatus = async (
    invoiceId: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ) => {
    if (!session?.user) return { error: new Error("Not authenticated") };

    try {
      const updateData: Partial<Tables<"invoices">> = {
        status,
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
      };

      if (status === "rejected" && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", invoiceId);

      if (error) throw error;

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, ...updateData } as Invoice : inv
        )
      );

      return { error: null };
    } catch (error) {
      console.error("Error updating invoice:", error);
      return { error };
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [session, statusFilter]);

  return {
    invoices,
    isLoading,
    refetch: fetchInvoices,
    createInvoice,
    updateInvoiceStatus,
  };
};
