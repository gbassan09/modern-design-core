import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserWithProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
  email?: string;
  roles: string[];
}

interface AdminStats {
  totalUsers: number;
  pendingInvoices: number;
  approvedTotal: number;
  rejectedCount: number;
}

export const useAdminData = () => {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingInvoices: 0,
    approvedTotal: 0,
    rejectedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, session } = useAuth();
  const { toast } = useToast();

  const fetchAdminData = async () => {
    if (!isAdmin || !session) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithProfile[] = (profilesData || []).map((profile) => ({
        ...profile,
        roles: rolesData
          ?.filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role) || [],
      }));

      setUsers(usersWithRoles);

      // Fetch invoice stats
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("status, total_value");

      if (invoicesError) throw invoicesError;

      const pending = invoicesData?.filter((i) => i.status === "pending").length || 0;
      const approved = invoicesData?.filter((i) => i.status === "approved") || [];
      const approvedTotal = approved.reduce((sum, i) => sum + (i.total_value || 0), 0);
      const rejected = invoicesData?.filter((i) => i.status === "rejected").length || 0;

      setStats({
        totalUsers: usersWithRoles.length,
        pendingInvoices: pending,
        approvedTotal,
        rejectedCount: rejected,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar dados administrativos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserRole = async (userId: string, role: "admin" | "user", action: "add" | "remove") => {
    try {
      if (action === "add") {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);

        if (error) throw error;
      }

      await fetchAdminData();
      
      toast({
        title: "Sucesso",
        description: `Role ${role} ${action === "add" ? "adicionada" : "removida"} com sucesso.`,
      });
    } catch (error) {
      console.error("Error toggling role:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a role do usuário.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [isAdmin, session]);

  return {
    users,
    stats,
    isLoading,
    refetch: fetchAdminData,
    toggleUserRole,
  };
};
