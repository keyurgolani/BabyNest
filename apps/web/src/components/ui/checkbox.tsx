"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Checkbox Component
 * 
 * A checkbox with glassmorphism styling and 48px minimum touch target.
 * The visual checkbox is 20px but wrapped in a 48px touch target area.
 * 
 * @requirements 20.2 - 48px minimum touch target
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Visual checkbox size (20px for better visibility)
      "peer h-5 w-5 shrink-0 rounded-md",
      // Glassmorphism styling
      "border border-[var(--glass-border)] bg-transparent",
      // Focus and interaction states
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Checked state
      "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary",
      // Touch target: use relative positioning with pseudo-element for 48px hit area
      "relative before:absolute before:inset-[-14px] before:content-['']",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
