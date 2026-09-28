import { useState } from "react";
import { AlertCircle, ArrowUpRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUSINESS } from "@/config/business";
import { authService } from "@/services/authService";

export default function LoginPage({ onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [first, ...rest] = BUSINESS.displayName.split(" ");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await authService.signIn({ email, password });

    if (error) {
      setError(error.message);
    } else {
      onAuthenticated();
    }
    setLoading(false);
  };

  return (
    <div className="grid min-h-dvh bg-background md:grid-cols-2">
      <section className="login-pattern relative flex min-h-[15rem] flex-col justify-end overflow-hidden bg-indigo p-8 text-white md:p-12">
        <h1 className="relative font-display text-5xl font-extrabold leading-[0.9] tracking-[-0.035em] md:text-7xl">
          {first}
          {rest.length > 0 && <span className="block text-marigold">{rest.join(" ")}</span>}
        </h1>
        <p className="relative mt-3 text-[15px] text-indigo-foreground">
          Billing, stock and accounts for the shop.
        </p>
        <a
          href="https://suit.varietyheaven.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="relative mt-5 inline-flex w-fit items-center gap-1 text-sm font-semibold text-marigold hover:underline"
        >
          suit.varietyheaven.in <ArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
      </section>

      <section className="grid place-items-center px-6 py-10">
        <form onSubmit={handleSignIn} className="grid w-full max-w-[21rem] gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} variant="rani" className="block-shadow h-12 text-base">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}
