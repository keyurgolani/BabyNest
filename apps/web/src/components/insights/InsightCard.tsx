import { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Get the variant type from Card component
type CardVariant = "default" | "glass" | "aurora" | "neumorphic" | "ghost";

interface InsightCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  iconClassName?: string;
}

export function InsightCard({ 
  title, 
  icon: Icon, 
  children, 
  className = "",
  variant = "default",
  iconClassName = "bg-primary/10 text-primary dark:bg-primary/20"
}: InsightCardProps) {
  return (
    <Card variant={variant} className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors",
              iconClassName
            )}>
              <Icon size={20} />
            </div>
          )}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {children}
      </CardContent>
    </Card>
  );
}
