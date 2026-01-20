import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(244,162,97,0.3),0_0_25px_rgba(244,162,97,0.2)] hover:bg-primary/90 hover:shadow-[0_8px_24px_rgba(244,162,97,0.4),0_0_40px_rgba(244,162,97,0.3)] hover:-translate-y-1",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_4px_16px_rgba(231,111,81,0.3),0_0_25px_rgba(231,111,81,0.2)] hover:bg-destructive/90 hover:shadow-[0_8px_24px_rgba(231,111,81,0.4),0_0_40px_rgba(231,111,81,0.3)]",
        outline:
          "border-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-[0_4px_16px_rgba(244,162,97,0.15),0_0_20px_rgba(244,162,97,0.1)] hover:border-primary/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_4px_16px_rgba(233,196,106,0.25),0_0_20px_rgba(233,196,106,0.15)] hover:bg-secondary/80 hover:shadow-[0_8px_24px_rgba(233,196,106,0.35),0_0_35px_rgba(233,196,106,0.25)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Premium Variants with enhanced glow effects
        glass: "glass hover:bg-white/20 text-foreground shadow-[0_4px_16px_rgba(244,162,97,0.1)] backdrop-blur-md hover:shadow-[0_8px_24px_rgba(244,162,97,0.2)]",
        glow: "bg-primary text-primary-foreground shadow-[0_0_30px_rgba(244,162,97,0.4),0_8px_24px_rgba(244,162,97,0.3)] hover:shadow-[0_0_50px_rgba(244,162,97,0.6),0_12px_32px_rgba(244,162,97,0.4)] hover:-translate-y-1",
        soft: "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_4px_16px_rgba(244,162,97,0.2),0_0_20px_rgba(244,162,97,0.15)]",
        aurora: "relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] text-primary-foreground animate-shimmer shadow-[0_4px_20px_rgba(244,162,97,0.3),0_0_30px_rgba(244,162,97,0.2)] hover:shadow-[0_8px_28px_rgba(244,162,97,0.4),0_0_50px_rgba(244,162,97,0.3)]",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-3",
        lg: "h-14 rounded-2xl px-10 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
