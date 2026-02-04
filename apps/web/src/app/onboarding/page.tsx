"use client";

import { useState, useRef, FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { Icons } from "@/components/icons";
import { api, CreateBabyDto } from "@/lib/api-client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Check, ArrowRight, ArrowLeft, Baby, Calendar, Camera, Sparkles } from "lucide-react";

/**
 * Onboarding Page with Glassmorphism Styling and Wizard Flow
 * 
 * @requirements 22.5 - Wizard flow with swipeable steps
 * Uses GlassCard, GlassInput, GlassButton components
 */

interface FormData {
  name: string;
  dateOfBirth: string;
  gender: string;
  photoUrl: string;
}

interface FormErrors {
  name?: string;
  dateOfBirth?: string;
  gender?: string;
  general?: string;
}

// Step configuration
const STEPS = [
  { id: 1, title: "Welcome", description: "Get Started", icon: Sparkles },
  { id: 2, title: "Name", description: "Baby's Name", icon: Baby },
  { id: 3, title: "Birthday", description: "Date of Birth", icon: Calendar },
  { id: 4, title: "Photo", description: "Add Photo", icon: Camera },
];

// Progress Indicator Component
function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 sm:mb-8">
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
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-white/10 text-muted-foreground border border-white/20"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
              <span className={cn(
                "text-[10px] sm:text-xs mt-1 sm:mt-1.5 font-medium hidden sm:block",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.title}
              </span>
            </div>
            
            {/* Connector Line */}
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  "w-6 sm:w-10 h-0.5 mx-1 sm:mx-2 sm:mb-5 transition-colors duration-300",
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

// Step 1: Welcome Step
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6 text-center"
    >
      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-4 ring-white/10">
        <Icons.Diaper className="w-12 h-12 text-primary" />
      </div>
      
      <div>
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">
          Welcome to BabyNest
        </h2>
        <p className="text-muted-foreground">
          Let&apos;s set up your baby&apos;s profile in just a few steps
        </p>
      </div>

      <div className="space-y-3 text-left">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Baby className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Track Everything</p>
            <p className="text-xs text-muted-foreground">Feedings, sleep, diapers & more</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">AI Insights</p>
            <p className="text-xs text-muted-foreground">Smart patterns & recommendations</p>
          </div>
        </div>
      </div>

      <GlassButton
        type="button"
        variant="primary"
        className="w-full"
        onClick={onNext}
      >
        Get Started
        <ArrowRight className="w-4 h-4 ml-2" />
      </GlassButton>
    </motion.div>
  );
}

// Step 2: Name & Gender Step
function NameStep({
  name,
  setName,
  gender,
  setGender,
  error,
  onNext,
  onBack,
}: {
  name: string;
  setName: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  error?: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid = name.trim().length >= 2 && gender;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-5"
    >
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground">
          What&apos;s your baby&apos;s name?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us about your little one
        </p>
      </div>

      {/* Name Input */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Baby&apos;s Name <span className="text-red-500">*</span>
        </label>
        <GlassInput
          id="name"
          type="text"
          placeholder="Enter baby's name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!error}
          autoFocus
        />
        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <Icons.AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>

      {/* Gender Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Gender <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "male", label: "Boy", icon: "👦" },
            { value: "female", label: "Girl", icon: "👧" },
            { value: "other", label: "Other", icon: "👶" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGender(option.value)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200",
                "flex flex-col items-center gap-2 min-h-[48px]",
                gender === option.value
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-white/20 hover:border-primary/50 hover:bg-white/5"
              )}
            >
              <span className="text-2xl">{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <GlassButton
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </GlassButton>
        <GlassButton
          type="button"
          variant="primary"
          className="flex-1"
          onClick={onNext}
          disabled={!isValid}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </GlassButton>
      </div>
    </motion.div>
  );
}

// Step 3: Birthday Step
function BirthdayStep({
  dateOfBirth,
  setDateOfBirth,
  error,
  onNext,
  onBack,
}: {
  dateOfBirth: string;
  setDateOfBirth: (value: string) => void;
  error?: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid = !!dateOfBirth;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-5"
    >
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground">
          When was your baby born?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          This helps us track milestones and growth
        </p>
      </div>

      {/* Date of Birth Input */}
      <div className="space-y-2">
        <label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
          Date of Birth <span className="text-red-500">*</span>
        </label>
        <GlassInput
          id="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          error={!!error}
          max={new Date().toISOString().split('T')[0]}
        />
        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <Icons.AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>

      {/* Helpful Info */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <p className="text-xs text-muted-foreground">
          💡 We&apos;ll use this to calculate your baby&apos;s age and track developmental milestones
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <GlassButton
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </GlassButton>
        <GlassButton
          type="button"
          variant="primary"
          className="flex-1"
          onClick={onNext}
          disabled={!isValid}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </GlassButton>
      </div>
    </motion.div>
  );
}

// Step 4: Photo Step (Final)
function PhotoStep({
  photoPreview,
  isUploading,
  isDragging,
  fileInputRef,
  onFileSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  onClearPhoto,
  onBack,
  onSubmit,
  loading,
  error,
}: {
  photoPreview: string | null;
  isUploading: boolean;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onClearPhoto: () => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-5"
    >
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground">
          Add a photo
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optional - you can add this later
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-2">
          <Icons.AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Photo Upload */}
      <div className="space-y-2">
        {photoPreview ? (
          <div className="relative flex justify-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-lg">
              <Image
                src={photoPreview}
                alt="Baby photo preview"
                fill
                sizes="128px"
                className="object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Icons.Loader className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClearPhoto}
              disabled={loading || isUploading}
              className="absolute top-0 right-1/2 translate-x-20 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md disabled:opacity-50"
            >
              <Icons.Close className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !loading && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isDragging
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-white/20 hover:border-primary hover:bg-white/5",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Camera className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">
              Drop photo here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse
            </p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
          disabled={loading || isUploading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <GlassButton
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={onBack}
          disabled={loading || isUploading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </GlassButton>
        <GlassButton
          type="button"
          variant="primary"
          className="flex-1"
          onClick={onSubmit}
          disabled={loading || isUploading}
        >
          {loading ? (
            <>
              <Icons.Loader className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : isUploading ? (
            <>
              <Icons.Loader className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Create Profile
            </>
          )}
        </GlassButton>
      </div>

      {/* Skip Option */}
      {!photoPreview && (
        <p className="text-center text-xs text-muted-foreground">
          You can skip this step and add a photo later in Settings
        </p>
      )}
    </motion.div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    dateOfBirth: "",
    gender: "",
    photoUrl: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Swipe direction tracking
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleSwipe = useCallback((direction: number) => {
    if (direction > 0 && currentStep > 1) {
      // Swipe right - go back
      setCurrentStep(prev => prev - 1);
    } else if (direction < 0 && currentStep < STEPS.length) {
      // Swipe left - go forward (only if current step is valid)
      // Validation is handled by the step components
    }
  }, [currentStep]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipe = swipePower(info.offset.x, info.velocity.x);
    if (swipe > swipeConfidenceThreshold) {
      handleSwipe(1); // Swipe right
    } else if (swipe < -swipeConfidenceThreshold) {
      handleSwipe(-1); // Swipe left
    }
  }, [handleSwipe]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrors(prev => ({ ...prev, general: "Please select an image file" }));
      return;
    }

    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    setErrors({});
    try {
      const result = await api.upload(file);
      setFormData(prev => ({ ...prev, photoUrl: result.url }));
    } catch (err) {
      setErrors(prev => ({ ...prev, general: err instanceof Error ? err.message : "Failed to upload image" }));
      setPhotoPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearPhoto = () => {
    setFormData(prev => ({ ...prev, photoUrl: "" }));
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 2) {
      if (!formData.name.trim()) {
        newErrors.name = "Baby's name is required";
      } else if (formData.name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }
      if (!formData.gender) {
        newErrors.gender = "Please select a gender";
      }
    }

    if (step === 3) {
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required";
      } else {
        const [year, month, day] = formData.dateOfBirth.split('-').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (birthDate > today) {
          newErrors.dateOfBirth = "Date of birth cannot be in the future";
        }
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(today.getFullYear() - 10);
        if (birthDate < tenYearsAgo) {
          newErrors.dateOfBirth = "Please enter a valid date of birth";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(2) || !validateStep(3)) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const babyData: CreateBabyDto = {
        name: formData.name.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        ...(formData.photoUrl.trim() && { photoUrl: formData.photoUrl.trim() }),
      };

      await api.babies.create(babyData);
      
      // Redirect to dashboard after successful creation
      router.push("/");
    } catch (error) {
      console.error("Failed to create baby profile:", error);
      setErrors({
        general: error instanceof Error 
          ? error.message 
          : "Failed to create baby profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Requirement 22.5: Wizard flow on mesh gradient background
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="w-full max-w-md"
      >
        <GlassCard className="w-full" size="lg">
          {/* Progress Indicator */}
          <ProgressIndicator currentStep={currentStep} totalSteps={STEPS.length} />

          {/* Step Content with AnimatePresence for smooth transitions */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <WelcomeStep
                key="welcome"
                onNext={handleNext}
              />
            )}

            {currentStep === 2 && (
              <NameStep
                key="name"
                name={formData.name}
                setName={(value) => setFormData(prev => ({ ...prev, name: value }))}
                gender={formData.gender}
                setGender={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                error={errors.name || errors.gender}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 3 && (
              <BirthdayStep
                key="birthday"
                dateOfBirth={formData.dateOfBirth}
                setDateOfBirth={(value) => setFormData(prev => ({ ...prev, dateOfBirth: value }))}
                error={errors.dateOfBirth}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 4 && (
              <PhotoStep
                key="photo"
                photoPreview={photoPreview}
                isUploading={isUploading}
                isDragging={isDragging}
                fileInputRef={fileInputRef}
                onFileSelect={handleFileInputChange}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClearPhoto={clearPhoto}
                onBack={handleBack}
                onSubmit={handleSubmit}
                loading={loading}
                error={errors.general}
              />
            )}
          </AnimatePresence>

          {/* Footer Note */}
          <p className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-white/10">
            You can update this information later in Settings
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
