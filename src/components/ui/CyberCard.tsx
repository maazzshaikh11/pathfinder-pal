import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, Easing } from "framer-motion";

interface CyberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'accent';
  animated?: boolean;
  delay?: number;
}

const CyberCard = React.forwardRef<HTMLDivElement, CyberCardProps>(
  ({ className, variant = 'default', animated = true, delay = 0, children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-card border border-border",
      glow: "bg-card border border-primary/30 glow-primary",
      accent: "bg-card border border-accent/30 glow-accent",
    };

    if (!animated) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative rounded-lg p-6 overflow-hidden",
            variantStyles[variant],
            className
          )}
          {...props}
        >
          <div className="absolute inset-0 pointer-events-none opacity-30 scanline" />
          <div className="relative z-10">{children}</div>
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-lg p-6 overflow-hidden",
          variantStyles[variant],
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" as Easing }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-30 scanline" />
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);
CyberCard.displayName = "CyberCard";

export { CyberCard };
