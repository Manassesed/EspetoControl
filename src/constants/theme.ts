export const colors = {
  canvas: "#F8FAFC",
  surface: "#FFFFFF",
  ink: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
  brand: "#10B981",
  brandDark: "#047857",
  danger: "#EF4444",
  warning: "#F59E0B"
};

export const spacing = {
  screen: 20,
  radius: 8
};

export const paymentMethods = [
  { label: "PIX", value: "pix" },
  { label: "Dinheiro", value: "dinheiro" },
  { label: "Cartao", value: "cartao" }
] as const;
