import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionTitleProps = {
  icon: ReactNode;
  title: string;
  className?: string;
};

export function SectionTitle({ icon, title, className }: SectionTitleProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-2xl text-base text-foreground">
        {icon}
      </span>
      <h2 className="font-serif text-lg tracking-[-0.02em] text-foreground">{title}</h2>
    </div>
  );
}
