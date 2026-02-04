"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api-client";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { Icons } from "@/components/icons";
import { Eye, EyeOff } from "lucide-react";

/**
 * Login Page with Glassmorphism Styling
 * 
 * @requirements 22.1 - Centered GlassCard on mesh gradient background
 * @requirements 22.2 - Logo, email/password GlassInput fields, and primary GlassButton
 */

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.auth.login({ email, password });
      login(response.tokens, {
        id: response.caregiver.id,
        email: response.caregiver.email,
        name: response.caregiver.name,
        createdAt: response.caregiver.createdAt,
      });
      
      // Redirect to returnUrl if provided, otherwise go to home
      router.push(returnUrl ? decodeURIComponent(returnUrl) : "/");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Invalid email or password";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="w-full max-w-md" size="lg">
      {/* Header with Logo */}
      <div className="text-center mb-6">
        {/* Logo - Requirement 22.2 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
            <Icons.Diaper className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          Welcome back
        </h1>
        <p className="text-muted-foreground mt-1">
          Sign in to your BabyNest account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Message */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
            {error}
          </div>
        )}

        {/* Email Input - Requirement 22.2 */}
        <div className="space-y-2">
          <label 
            htmlFor="email" 
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <GlassInput
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        {/* Password Input - Requirement 22.2 */}
        <div className="space-y-2">
          <label 
            htmlFor="password" 
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <div className="relative">
            <GlassInput
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button - Requirement 22.2 */}
        <GlassButton 
          type="submit" 
          variant="primary" 
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Icons.Spinner className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </GlassButton>

        {/* Sign Up Link */}
        <p className="text-sm text-muted-foreground text-center pt-2">
          Don&apos;t have an account?{" "}
          <Link 
            href="/auth/signup" 
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </form>
    </GlassCard>
  );
}

export default function LoginPage() {
  return (
    // Requirement 22.1: Centered GlassCard on mesh gradient background
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Icons.Spinner className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
