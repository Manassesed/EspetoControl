import * as Linking from "expo-linking";
import { useMutation } from "@tanstack/react-query";

import { createSubscriptionCheckout } from "@/services/billingService";

export function useCreateCheckout() {
  return useMutation({
    mutationFn: async () => {
      const { checkoutUrl } = await createSubscriptionCheckout();
      await Linking.openURL(checkoutUrl);
    }
  });
}
