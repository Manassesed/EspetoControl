import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um email valido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres")
});

export const registerSchema = z.object({
  nome: z.string().min(2, "Informe seu nome"),
  empresa: z.string().min(2, "Informe o nome da empresa"),
  email: z.string().email("Informe um email valido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres")
});

const localNumber = (msg: string) =>
  z.preprocess(
    (v) => typeof v === "string" ? parseFloat((v as string).replace(",", ".")) : v,
    z.number({ invalid_type_error: msg }).positive(msg)
  );

// Aceita vazio -> 0 e permite zero (custo pode ser desconhecido).
const optionalCost = (msg: string) =>
  z.preprocess(
    (v) => {
      if (v === "" || v === undefined || v === null) return 0;
      return typeof v === "string" ? parseFloat((v as string).replace(",", ".")) : v;
    },
    z.number({ invalid_type_error: msg }).min(0, msg)
  );

export const productSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  categoria: z.string().min(2, "Informe a categoria"),
  preco: localNumber("Informe um preco valido"),
  custo: optionalCost("Informe um custo valido")
});

export const expenseSchema = z.object({
  descricao: z.string().min(2, "Informe a descricao"),
  categoria: z.string().min(2, "Informe a categoria"),
  valor: localNumber("Informe um valor valido")
});

export const inviteSchema = z.object({
  email: z.string().email("Informe um email valido"),
  role: z.enum(["gerente", "colaborador"])
});

export const setPasswordSchema = z
  .object({
    nome: z.string().min(2, "Informe seu nome"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme a senha")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem",
    path: ["confirmPassword"]
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ProductForm = z.infer<typeof productSchema>;
export type ExpenseForm = z.infer<typeof expenseSchema>;
export type InviteForm = z.infer<typeof inviteSchema>;
export type SetPasswordForm = z.infer<typeof setPasswordSchema>;
