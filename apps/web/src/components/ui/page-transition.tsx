"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Page transition animation variants
 * Provides smooth fade and slide-up animation for page enter/exit
 */
const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  enter: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] // Material Design easing
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  },
};

/**
 * Reduced motion variants for users who prefer reduced animations
 * Respects prefers-reduced-motion media query
 */
const reducedMotionVariants = {
  initial: { opacity: 0 },
  enter: { 
    opacity: 1,
    transition: { duration: 0.15 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.1 }
  },
};

export interface PageTransitionProps {
  children: React.ReactNode;
  /** Optional className to apply to the motion container */
  className?: string;
}

/**
 * PageTransition Component
 * 
 * Wraps page content with framer-motion AnimatePresence for smooth
 * page transitions. Automatically detects route changes via usePathname
 * and applies fade/slide animations.
 * 
 * Features:
 * - Fade and subtle slide-up animation on page enter
 * - Fade and slide-up animation on page exit
 * - Respects prefers-reduced-motion for accessibility
 * - Uses AnimatePresence mode="wait" for proper exit animations
 * 
 * @requirements 9.5
 * 
 * @example
 * ```tsx
 * <PageTransition>
 *   <YourPageContent />
 * </PageTransition>
 * ```
 */
export function PageTransition({ children, className = "" }: PageTransitionProps) {
  const pathname = usePathname();
  
  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  
  React.useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Listen for changes to the preference
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const variants = prefersReducedMotion ? reducedMotionVariants : pageVariants;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="enter"
        exit="exit"
        className={`h-full ${className}`.trim()}
      >
        <>{children}</>
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
