"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

export default function Logo({ size = "md", className = "" }: LogoProps) {
  return (
    <span className={`font-bold tracking-tight ${sizes[size]} ${className}`}>
      <span className="text-brand-gold">L</span>
      <span>egitas</span>
    </span>
  );
}
