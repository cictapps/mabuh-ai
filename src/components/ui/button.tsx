import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-[0.01em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 outline-none focus-visible:ring-[4px] focus-visible:ring-ring/60",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground shadow-[0_18px_48px_-24px_rgba(188,194,255,0.75)] hover:-translate-y-0.5 hover:brightness-105",
        secondary:
          "bg-surface-highest text-foreground shadow-[0_18px_44px_-28px_rgba(10,12,20,0.85)] hover:bg-surface-high",
        outline:
          "border border-white/10 bg-white/5 text-foreground shadow-[0_14px_36px_-28px_rgba(10,12,20,0.8)] hover:bg-white/10",
        ghost: "text-muted-foreground hover:bg-white/5 hover:text-foreground",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-8 text-sm",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { Button, buttonVariants };
