import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cyberButtonVariants = cva(
  "relative inline-flex items-center justify-center font-display font-semibold text-sm uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cyber-clip",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 glow-secondary",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 glow-accent",
        tertiary: "bg-tertiary text-tertiary-foreground hover:bg-tertiary/90 glow-tertiary",
        ghost: "bg-transparent text-primary border border-primary/50 hover:bg-primary/10 hover:border-primary",
        success: "bg-success text-success-foreground hover:bg-success/90 glow-success",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface CyberButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof cyberButtonVariants> {
  glowing?: boolean;
}

const CyberButton = React.forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant, size, glowing = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          cyberButtonVariants({ variant, size }),
          glowing && "animate-pulse-glow",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
CyberButton.displayName = "CyberButton";

export { CyberButton, cyberButtonVariants };
