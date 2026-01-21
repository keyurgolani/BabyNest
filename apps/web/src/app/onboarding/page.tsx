"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { api, CreateBabyDto } from "@/lib/api-client";
import Image from "next/image";

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

export default function OnboardingPage() {
  const router = useRouter();
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Baby's name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Validate date of birth
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = formData.dateOfBirth.split('-').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (birthDate > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
      // Check if date is not too far in the past (e.g., 10 years)
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(today.getFullYear() - 10);
      if (birthDate < tenYearsAgo) {
        newErrors.dateOfBirth = "Please enter a valid date of birth";
      }
    }

    // Validate gender
    if (!formData.gender) {
      newErrors.gender = "Please select a gender";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <MobileContainer>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-slide-up">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Icons.Diaper className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
            Welcome to BabyNest
          </h1>
          <p className="text-muted-foreground text-lg">
            Let&apos;s create your baby&apos;s profile
          </p>
        </div>

        {/* Onboarding Form */}
        <Card variant="aurora-static" className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Baby Profile</CardTitle>
            <CardDescription>
              Tell us about your little one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* General Error */}
              {errors.general && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Icons.AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{errors.general}</p>
                  </div>
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Baby&apos;s Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter baby&apos;s name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  disabled={loading}
                  autoFocus
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <Icons.AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Date of Birth Field */}
              <div className="space-y-2">
                <label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className={errors.dateOfBirth ? "border-red-500 focus-visible:ring-red-500" : ""}
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <Icons.AlertCircle className="w-3 h-3" />
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* Gender Field */}
              <div className="space-y-2">
                <label id="gender-label" className="text-sm font-medium text-foreground">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3" role="group" aria-labelledby="gender-label">
                  {[
                    { value: "male", label: "Boy", icon: "👦" },
                    { value: "female", label: "Girl", icon: "👧" },
                    { value: "other", label: "Other", icon: "👶" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange("gender", option.value)}
                      disabled={loading}
                      className={`
                        p-4 rounded-xl border-2 transition-all duration-200
                        flex flex-col items-center gap-2
                        ${
                          formData.gender === option.value
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-muted hover:border-primary/50 hover:bg-muted/50"
                        }
                        ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <Icons.AlertCircle className="w-3 h-3" />
                    {errors.gender}
                  </p>
                )}
              </div>

              {/* Photo Upload Field (Optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Photo <span className="text-muted-foreground text-xs">(Optional)</span>
                </label>
                
                {photoPreview ? (
                  <div className="relative">
                    <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden ring-4 ring-primary/20 shadow-lg">
                      <Image
                        src={photoPreview}
                        alt="Baby photo preview"
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Icons.Loader className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      disabled={loading || isUploading}
                      className="absolute top-0 right-1/2 translate-x-14 -translate-y-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md disabled:opacity-50"
                    >
                      <Icons.Close className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !loading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-primary bg-primary/10 scale-[1.02]"
                        : "border-muted-foreground/30 hover:border-primary hover:bg-muted/50"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Icons.Memories className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
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
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={loading || isUploading}
                />
                <p className="text-xs text-muted-foreground text-center">
                  You can add a photo now or skip this for later
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || isUploading}
                >
                  {loading ? (
                    <>
                      <Icons.Loader className="w-5 h-5 mr-2 animate-spin" />
                      Creating Profile...
                    </>
                  ) : isUploading ? (
                    <>
                      <Icons.Loader className="w-5 h-5 mr-2 animate-spin" />
                      Uploading Photo...
                    </>
                  ) : (
                    <>
                      <Icons.Check className="w-5 h-5 mr-2" />
                      Create Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          You can update this information later in Settings
        </p>
      </div>
    </MobileContainer>
  );
}
