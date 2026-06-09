import { supabase } from "@/services/supabase";

type RegisterPayload = {
  nome: string;
  empresa: string;
  email: string;
  password: string;
};

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function signUp({ nome, empresa, email, password }: RegisterPayload) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome, empresa }
    }
  });

  if (error) {
    throw error;
  }

  const user = data.user;

  if (!user) {
    throw new Error("Cadastro iniciado, confirme seu email para entrar.");
  }

  if (!data.session) {
    return { user, profile: null, needsEmailConfirmation: true };
  }

  const { data: profile, error: profileError } = await supabase.rpc("create_initial_profile", {
    p_nome: nome,
    p_empresa: empresa,
    p_email: email
  });

  if (profileError) {
    throw profileError;
  }

  return { user, profile, needsEmailConfirmation: false };
}
