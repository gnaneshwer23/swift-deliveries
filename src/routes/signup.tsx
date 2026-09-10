import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { MarketingLogo } from "@/components/marketing/marketing-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Start — DeliverX" },
      { name: "description", content: "Create your DeliverX account." },
      { property: "og:title", content: "Start — DeliverX" },
      { property: "og:description", content: "Create your DeliverX account." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate({ to: "/" }), 1500);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Google sign-up failed");
    }
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
              Create your account
            </h1>
            <p className="mt-2 text-sm text-[var(--mkt-text3)]">
              Start building your Professional Intelligence.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 w-full rounded-full border-[var(--mkt-border)] bg-white py-5 text-sm font-medium text-[var(--mkt-text1)] hover:bg-[var(--mkt-s2)]"
          >
            <svg className="mr-2 size-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.85 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.86-2.6 3.29-4.53 6.15-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--mkt-border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--mkt-s1)] px-2 text-[var(--mkt-text3)]">or</span>
            </div>
          </div>

          {success ? (
            <div className="mt-6 rounded-lg bg-green-50 px-4 py-6 text-center text-sm text-green-700">
              Account created. Redirecting you…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm text-[var(--mkt-text2)]">
                  Full name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  required
                  className="border-[var(--mkt-border)] bg-white"
                />
              </div>
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
                  minLength={8}
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
                Start for free
              </Button>
            </form>
          )}
          <div className="mt-6 text-center text-sm text-[var(--mkt-text3)]">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-[var(--mkt-green)] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
