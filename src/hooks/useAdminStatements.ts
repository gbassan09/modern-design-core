import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PDFStatement, PDFExpense } from "./usePDFStatements";

export interface StatementWithUser extends PDFStatement {
  user_name?: string;
  user_department?: string;
}

export const useAdminStatements = () => {
  const [statements, setStatements] = useState<StatementWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, session } = useAuth();
  const { toast } = useToast();

  const fetchAllStatements = useCallback(async () => {
    if (!isAdmin || !session) {
      setStatements([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all statements
      const { data: statementsData, error: statementsError } = await supabase
        .from("pdf_statements")
        .select("*")
        .order("created_at", { ascending: false });

      if (statementsError) throw statementsError;

      // Fetch all profiles to map user names
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, department");

      if (profilesError) throw profilesError;

      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );

      const statementsWithUsers: StatementWithUser[] = (statementsData || []).map((stmt) => {
        const profile = profilesMap.get(stmt.user_id);
        return {
          ...stmt,
          user_name: profile?.full_name || "Usuário",
          user_department: profile?.department || undefined,
        } as StatementWithUser;
      });

      setStatements(statementsWithUsers);
    } catch (error) {
      console.error("Error fetching statements:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as faturas PDF.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, session, toast]);

  const getExpensesForStatement = useCallback(async (
    statementId: string
  ): Promise<PDFExpense[]> => {
    try {
      const { data, error } = await supabase
        .from("pdf_expenses")
        .select("*")
        .eq("statement_id", statementId)
        .order("expense_date", { ascending: true });

      if (error) throw error;

      return (data || []) as PDFExpense[];
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchAllStatements();
  }, [fetchAllStatements]);

  return {
    statements,
    isLoading,
    refetch: fetchAllStatements,
    getExpensesForStatement,
  };
};
