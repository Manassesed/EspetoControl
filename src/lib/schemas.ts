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

export const productSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  categoria: z.string().min(2, "Informe a categoria"),
  preco: z.coerce.number().positive("Informe um preco valido")
});

export const expenseSchema = z.object({
  descricao: z.string().min(2, "Informe a descricao"),
  categoria: z.string().min(2, "Informe a categoria"),
  valor: z.coerce.number().positive("Informe um valor valido")
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ProductForm = z.infer<typeof productSchema>;
export type ExpenseForm = z.infer<typeof expenseSchema>;
