const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;
  return (
    <div className="w-full bg-orange-500/10 border-b border-orange-500/30 px-4 py-1.5 text-center text-xs text-orange-300">
      Test mode — use card 4242 4242 4242 4242 with any future expiry & CVC.
    </div>
  );
}
