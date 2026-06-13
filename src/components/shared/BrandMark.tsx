import { cn } from "@/lib/utils";

type BrandMarkProps = {
  tone?: "default" | "muted";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZES: Record<NonNullable<BrandMarkProps["size"]>, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-4xl",
};

export function BrandMark({ tone = "default", size = "md", className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "font-serif font-medium tracking-[-0.02em]",
        SIZES[size],
        tone === "muted" ? "text-muted-foreground" : "text-foreground",
        className,
      )}
    >
      Mabuh-ai
    </span>
  );
}

type BrandLogoProps = {
  variant?: "default" | "light" | "dark";
  size?: number;
  className?: string;
  alt?: string;
};

export function BrandLogo({
  variant = "default",
  size = 72,
  className,
  alt = "Mabuh-ai",
}: BrandLogoProps) {
  const src =
    variant === "light"
      ? "/app-logo-light.svg"
      : variant === "dark"
        ? "/app-logo-dark.svg"
        : "/app-logo.svg";

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
