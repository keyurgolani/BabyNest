"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, PieChart, PlusCircle, Image as ImageIcon, Settings } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 glass-panel border-t border-white/20 dark:border-white/5 bg-background/80 backdrop-blur-lg">
      <nav className="flex justify-between items-center max-w-md mx-auto relative px-2">
        <Link href="/" className="flex flex-col items-center gap-1 min-w-[3.5rem] group">
          <div className={cn(
            "p-2 rounded-xl transition-all duration-300",
            isActive("/") 
              ? "bg-primary/10 text-primary scale-110" 
              : "text-muted-foreground group-hover:text-foreground group-active:scale-95"
          )}>
            <Home className="w-6 h-6" strokeWidth={isActive("/") ? 2.5 : 2} />
          </div>
          <span className={cn(
            "text-[10px] font-medium transition-colors",
            isActive("/") ? "text-primary" : "text-muted-foreground"
          )}>
            Home
          </span>
        </Link>

        <Link href="/tracking/timeline" className="flex flex-col items-center gap-1 min-w-[3.5rem] group">
          <div className={cn(
            "p-2 rounded-xl transition-all duration-300",
            isActive("/tracking/timeline") 
              ? "bg-secondary/10 text-secondary scale-110" 
              : "text-muted-foreground group-hover:text-foreground group-active:scale-95"
          )}>
            <PieChart className="w-6 h-6" strokeWidth={isActive("/tracking/timeline") ? 2.5 : 2} />
          </div>
          <span className={cn(
            "text-[10px] font-medium transition-colors",
            isActive("/tracking/timeline") ? "text-secondary" : "text-muted-foreground"
          )}>
            Stats
          </span>
        </Link>

        <Link href="/log" className="flex flex-col items-center gap-1 min-w-[3.5rem] group -mt-6">
          <div className={cn(
            "p-4 rounded-full transition-all duration-300 shadow-xl",
            isActive("/log") 
              ? "bg-primary text-primary-foreground scale-110 shadow-primary/30" 
              : "bg-foreground text-background shadow-foreground/20 hover:scale-105 active:scale-95"
          )}>
            <PlusCircle className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <span className={cn(
            "text-[10px] font-medium transition-colors",
            isActive("/log") ? "text-primary" : "text-muted-foreground"
          )}>
            Log
          </span>
        </Link>
        
        <Link href="/memories" className="flex flex-col items-center gap-1 min-w-[3.5rem] group">
          <div className={cn(
            "p-2 rounded-xl transition-all duration-300",
            isActive("/memories") 
              ? "bg-rose-500/10 text-rose-500 scale-110" 
              : "text-muted-foreground group-hover:text-foreground group-active:scale-95"
          )}>
            <ImageIcon className="w-6 h-6" strokeWidth={isActive("/memories") ? 2.5 : 2} />
          </div>
          <span className={cn(
            "text-[10px] font-medium transition-colors",
            isActive("/memories") ? "text-rose-500" : "text-muted-foreground"
          )}>
            Memories
          </span>
        </Link>

        <Link href="/settings" className="flex flex-col items-center gap-1 min-w-[3.5rem] group">
          <div className={cn(
            "p-2 rounded-xl transition-all duration-300",
            isActive("/settings") 
              ? "bg-slate-500/10 text-slate-500 scale-110" 
              : "text-muted-foreground group-hover:text-foreground group-active:scale-95"
          )}>
            <Settings className="w-6 h-6" strokeWidth={isActive("/settings") ? 2.5 : 2} />
          </div>
          <span className={cn(
            "text-[10px] font-medium transition-colors",
            isActive("/settings") ? "text-slate-500" : "text-muted-foreground"
          )}>
            Settings
          </span>
        </Link>
      </nav>
    </div>
  );
}
