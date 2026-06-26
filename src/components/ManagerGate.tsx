import { Redirect } from "expo-router";
import type { PropsWithChildren } from "react";

import { useAuth } from "@/context/AuthContext";

/** Blinda uma tela inteira para gerente. Colaborador é redirecionado pro caixa. */
export function ManagerGate({ children }: PropsWithChildren) {
  const { profile, loading } = useAuth();

  if (loading && !profile) return null;
  if (profile && profile.role !== "gerente") return <Redirect href="/venda" />;

  return <>{children}</>;
}
