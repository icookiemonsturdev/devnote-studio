import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";

interface Props {
  priceId: string;
  skinId?: string;
  returnUrl?: string;
  theme?: {
    backgroundColor?: string;
    buttonColor?: string;
  };
}

export function StripeEmbeddedCheckout({ priceId, skinId, returnUrl, theme }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const secret = await createCheckoutSession({
      data: {
        priceId,
        skinId,
        returnUrl: returnUrl || `${window.location.origin}/skins?checkout=success`,
        environment: getStripeEnvironment(),
        theme,
      },
    });
    if (!secret) throw new Error("Failed to create checkout session");
    return secret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
