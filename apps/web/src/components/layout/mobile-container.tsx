"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

interface MobileContainerProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
}

export function MobileContainer({ 
  children, 
  showBackButton = false,
  backHref = "/"
}: MobileContainerProps) {
  return (
    <main className="flex flex-col h-full bg-card overflow-hidden">
      {showBackButton && (
        <div className="flex items-center gap-4 p-6 pt-12 flex-shrink-0">
          <Link href={backHref} className="p-2 rounded-full bg-muted hover:bg-muted/80">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
        </div>
      )}
      <div className="flex-1 overflow-y-auto pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </main>
  );
}
