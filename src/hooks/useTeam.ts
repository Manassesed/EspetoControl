import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoTeam, isDemoCompany } from "@/constants/demo";
import {
  inviteMember,
  listTeam,
  resetMemberPassword,
  updateMemberRole,
  updateMemberStatus
} from "@/services/teamService";
import type { AccessRole } from "@/types/database";

export function useTeam(empresaId?: string) {
  return useQuery({
    queryKey: ["team", empresaId],
    enabled: Boolean(empresaId),
    queryFn: () => (isDemoCompany(empresaId) ? Promise.resolve(demoTeam) : listTeam(empresaId!))
  });
}

export function useTeamMutations(empresaId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["team", empresaId] });
  const demo = isDemoCompany(empresaId);

  const invite = useMutation({
    mutationFn: ({ email, role }: { email: string; role: AccessRole }) =>
      demo ? Promise.resolve({ ok: true as const }) : inviteMember(email, role),
    onSuccess: invalidate
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AccessRole }) =>
      demo ? Promise.resolve() : updateMemberRole(userId, role).then(() => undefined),
    onSuccess: invalidate
  });

  const changeStatus = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: "ativo" | "inativo" }) =>
      demo ? Promise.resolve() : updateMemberStatus(userId, status).then(() => undefined),
    onSuccess: invalidate
  });

  const resetPassword = useMutation({
    mutationFn: ({ email }: { email: string }) => (demo ? Promise.resolve() : resetMemberPassword(email))
  });

  return { invite, changeRole, changeStatus, resetPassword };
}
