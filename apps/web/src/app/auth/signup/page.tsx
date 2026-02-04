"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api-client";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { Icons } from "@/components/icons";
import { Eye, EyeOff, Check, X, ArrowRight, ArrowLeft, User, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Signup Page with Glassmorphism Styling and Multi-Step Wizard
 * 
 * @requirements 22.3 - Multi-step wizard with progress indicator
 * Uses GlassCard, GlassInput, GlassButton components
 */

// Password strength calculator
function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  checks: { label: string; passed: boolean }[];
} {
  const checks = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "Contains uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Contains number", passed: /\d/.test(password) },
    { label: "Contains special character", passed: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const score = checks.filter(c => c.passed).length;

  let label = "Weak";
  let color = "bg-red-500";

  if (score >= 5) {
    label = "Very Strong";
    color = "bg-green-500";
  } else if (score >= 4) {
    label = "Strong";
    color = "bg-green-500";
  } else if (score >= 3) {
    label = "Medium";
    color = "bg-yellow-500";
  } else if (score >= 2) {
    label = "Fair";
    color = "bg-orange-500";
  }

  return { score, label, color, checks };
}

// Step configuration
const STEPS = [
  { id: 1, title: "Account", description: "Email & Password", icon: Mail },
  { id: 2, title: "Profile", description: "Your Details", icon: User },
];

// Progress Indicator Component
function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const StepIcon = step.icon;
        
        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-white/10 text-muted-foreground border border-white/20"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>
              <span className={cn(
                "text-xs mt-1.5 font-medium",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.title}
              </span>
            </div>
            
            {/* Connector Line */}
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-2 mb-5 transition-colors duration-300",
                  isCompleted ? "bg-green-500" : "bg-white/20"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Step 1: Account Details (Email & Password)
function AccountStep({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordStrength,
  onNext,
}: {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  passwordStrength: ReturnType<typeof calculatePasswordStrength>;
  onNext: () => void;
}) {
  const isValid = email && password && confirmPassword && password === confirmPassword && passwordStrength.score >= 3;

  return (
    <div className="space-y-5">
      {/* Email Input */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email Address
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

      {/* Password Input */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
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
            autoComplete="new-password"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Password strength:</span>
              <span
                className={cn(
                  "font-medium",
                  passwordStrength.score >= 4
                    ? "text-green-500"
                    : passwordStrength.score >= 3
                    ? "text-yellow-500"
                    : passwordStrength.score >= 2
                    ? "text-orange-500"
                    : "text-red-500"
                )}
              >
                {passwordStrength.label}
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    level <= passwordStrength.score ? passwordStrength.color : "bg-white/20"
                  )}
                />
              ))}
            </div>
            <div className="space-y-1 pt-1">
              {passwordStrength.checks.map((check, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {check.passed ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <X className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className={cn(check.passed ? "text-foreground" : "text-muted-foreground")}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm Password
        </label>
        <div className="relative">
          <GlassInput
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <X className="w-3 h-3" />
            Passwords do not match
          </p>
        )}
        {confirmPassword && password === confirmPassword && (
          <p className="text-xs text-green-500 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Passwords match
          </p>
        )}
      </div>

      {/* Next Button */}
      <GlassButton
        type="button"
        variant="primary"
        className="w-full"
        onClick={onNext}
        disabled={!isValid}
      >
        Continue
        <ArrowRight className="w-4 h-4 ml-2" />
      </GlassButton>
    </div>
  );
}

// Step 2: Profile Details (Name)
function ProfileStep({
  name,
  setName,
  email,
  onBack,
  onSubmit,
  loading,
}: {
  name: string;
  setName: (value: string) => void;
  email: string;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const isValid = name.trim().length >= 2;

  return (
    <div className="space-y-5">
      {/* Summary of Step 1 */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Account email</p>
            <p className="text-sm font-medium text-foreground">{email}</p>
          </div>
        </div>
      </div>

      {/* Name Input */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Your Name
        </label>
        <GlassInput
          id="name"
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          This is how you&apos;ll appear in BabyNest
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <GlassButton
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={onBack}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </GlassButton>
        <GlassButton
          type="button"
          variant="primary"
          className="flex-1"
          onClick={onSubmit}
          disabled={!isValid || loading}
        >
          {loading ? (
            <>
              <Icons.Spinner className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Account
              <Check className="w-4 h-4 ml-2" />
            </>
          )}
        </GlassButton>
      </div>
    </div>
  );
}

export default function SignupPage() {
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

  const handleNext = () => {
    setError("");
    setCurrentStep(2);
  };

  const handleBack = () => {
    setError("");
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setCurrentStep(1);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, and number");
      setCurrentStep(1);
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.register({ name, email, password });
      login(response.tokens, {
        id: response.caregiver.id,
        email: response.caregiver.email,
        name: response.caregiver.name,
        createdAt: response.caregiver.createdAt,
      });
      router.push("/onboarding");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create account";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Requirement 22.3: Multi-step wizard on mesh gradient background
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
      <GlassCard className="w-full max-w-md" size="lg">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
              <Icons.Diaper className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Create your account
          </h1>
          <p className="text-muted-foreground mt-1">
            Start tracking your baby&apos;s journey
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} totalSteps={STEPS.length} />

        {/* Error Message */}
        {error && (
          <div className="p-3 mb-5 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
            {error}
          </div>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <AccountStep
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            passwordStrength={passwordStrength}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <ProfileStep
            name={name}
            setName={setName}
            email={email}
            onBack={handleBack}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}

        {/* Sign In Link */}
        <p className="text-sm text-muted-foreground text-center pt-6 mt-6 border-t border-white/10">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
