import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-2xl border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "shadow-[0_4px_16px_-2px_rgba(244,162,97,0.15),0_8px_32px_-4px_rgba(74,64,58,0.12),0_0_0_1px_rgba(244,162,97,0.08),0_0_20px_rgba(244,162,97,0.08)] hover:shadow-[0_8px_24px_-2px_rgba(244,162,97,0.25),0_16px_48px_-4px_rgba(74,64,58,0.18),0_0_0_1px_rgba(244,162,97,0.15),0_0_40px_rgba(244,162,97,0.15)] hover:-translate-y-1",
        glass: "glass border-0 backdrop-blur-md bg-white/60 dark:bg-black/40 shadow-[0_4px_24px_-4px_rgba(244,162,97,0.15),0_0_30px_rgba(244,162,97,0.1)] hover:bg-white/70 dark:hover:bg-black/50 hover:shadow-[0_8px_32px_-4px_rgba(244,162,97,0.25),0_0_50px_rgba(244,162,97,0.15)]",
        aurora: "aurora border-0 bg-gradient-to-br from-white/90 via-[#FFF8F2]/95 to-[#FFF5EB]/90 dark:from-[#2A231E]/80 dark:via-[#1A1512]/90 dark:to-[#2A231E]/80 backdrop-blur-md shadow-[0_4px_24px_-4px_rgba(244,162,97,0.2),0_0_0_1px_rgba(244,162,97,0.1),0_0_30px_rgba(244,162,97,0.12)]",
        "aurora-static": "border-0 bg-gradient-to-br from-white/90 via-[#FFF8F2]/95 to-[#FFF5EB]/90 dark:from-[#2A231E]/80 dark:via-[#1A1512]/90 dark:to-[#2A231E]/80 backdrop-blur-md shadow-[0_4px_24px_-4px_rgba(244,162,97,0.2),0_0_30px_rgba(244,162,97,0.12)]",
        glow: "border-0 shadow-[0_0_30px_rgba(244,162,97,0.25),0_8px_24px_rgba(244,162,97,0.18),0_0_0_1px_rgba(244,162,97,0.12)] hover:shadow-[0_0_45px_rgba(244,162,97,0.35),0_12px_32px_rgba(244,162,97,0.25),0_0_0_1px_rgba(244,162,97,0.18)] hover:-translate-y-1",
        elevated: "shadow-[0_8px_24px_-4px_rgba(244,162,97,0.18),0_16px_48px_-8px_rgba(74,64,58,0.18),0_0_30px_rgba(244,162,97,0.1)] hover:shadow-[0_12px_32px_-4px_rgba(244,162,97,0.25),0_24px_64px_-8px_rgba(74,64,58,0.22),0_0_50px_rgba(244,162,97,0.15)] hover:-translate-y-1.5",
        neumorphic: "border-0 bg-[#FFF8F2] dark:bg-[#2A231E] shadow-[6px_6px_12px_rgba(232,226,220,0.8),-6px_-6px_12px_rgba(255,255,255,0.9)] dark:shadow-[6px_6px_12px_rgba(10,8,6,0.5),-6px_-6px_12px_rgba(50,42,36,0.3)]",
        ghost: "border-0 shadow-none bg-transparent hover:bg-accent/50",
        soft: "border-0 bg-gradient-to-br from-white to-[#FFF8F2] dark:from-[#2A231E] dark:to-[#1A1512] shadow-[0_4px_20px_-4px_rgba(74,64,58,0.12),0_0_25px_rgba(244,162,97,0.08)] hover:shadow-[0_8px_28px_-4px_rgba(74,64,58,0.18),0_0_40px_rgba(244,162,97,0.12)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type CardProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight font-heading",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
