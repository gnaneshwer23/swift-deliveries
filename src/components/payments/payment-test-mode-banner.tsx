const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Live checkout is not ready.
      </div>
    );
  }

  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="border-b border-border bg-muted px-4 py-2 text-center text-sm text-muted-foreground">
        Test payment only. No money will be charged.
      </div>
    );
  }

  return null;
}