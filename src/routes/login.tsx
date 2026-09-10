import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MarketingLogo } from "@/components/marketing/marketing-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — DeliverX" },
      { name: "description", content: "Sign in to DeliverX." },
      { property: "og:title", content: "Sign in — DeliverX" },
      { property: "og:description", content: "Sign in to DeliverX." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <div className="marketing-page flex min-h-screen flex-col bg-[var(--mkt-ink)]">
      <header className="fixed left-0 right-0 top-0 z-50 h-[var(--mkt-navh)] border-b border-[var(--mkt-border)] bg-[var(--mkt-s1)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[var(--mkt-maxw)] items-center px-5 lg:px-8">
          <MarketingLogo />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pt-[var(--mkt-navh)]">
        <div className="w-full max-w-sm rounded-[var(--mkt-radius-panel)] border border-[var(--mkt-border)] bg-[var(--mkt-s1)] p-8 shadow-xl">
          <div className="text-center">
            <h1 className="font-serif text-2xl tracking-[-0.02em] text-[var(--mkt-text1)]">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-[var(--mkt-text3)]">
              Sign in to continue your DeliverX journey.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-[var(--mkt-text2)]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="border-[var(--mkt-border)] bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-[var(--mkt-text2)]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border-[var(--mkt-border)] bg-white"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--mkt-green)] py-5 text-base font-semibold text-white hover:bg-[var(--mkt-green-m)]"
            >
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 size-4" />
              )}
              Sign in
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-[var(--mkt-text3)]">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-[var(--mkt-green)] hover:underline">
              Start for free
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
