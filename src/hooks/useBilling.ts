import * as Linking from "expo-linking";
import { useMutation } from "@tanstack/react-query";

import { createPixPayment, createSubscriptionCheckout, type PixPayment } from "@/services/billingService";

export function useCreateCheckout() {
  return useMutation({
    mutationFn: async () => {
      const { checkoutUrl } = await createSubscriptionCheckout();
      await Linking.openURL(checkoutUrl);
    }
  });
}

export function useCreatePixPayment() {
  return useMutation<PixPayment>({
    mutationFn: createPixPayment
  });
}
