import { useMutation } from "@tanstack/react-query";

import type { LoginForm, RegisterForm } from "@/lib/schemas";
import { signIn, signUp, signOut } from "@/services/authService";

export function useAuthActions() {
  const login = useMutation({
    mutationFn: (data: LoginForm) => signIn(data.email, data.password)
  });

  const register = useMutation({
    mutationFn: (data: RegisterForm) => signUp(data)
  });

  const logout = useMutation({
    mutationFn: signOut
  });

  return { login, register, logout };
}
