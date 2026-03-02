// components/ui/Text.tsx
import { cn } from "@/lib/utils"; // Standard in Shadcn/ui

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'sm' | 'base' | 'lg' | 'xl';
}

export function Text({ children, size = 'base', className, ...props }: TextProps) {
  const sizes = {
    sm: "text-sm text-gray-400",
    base: "text-base text-foreground leading-relaxed",
    lg: "text-lg md:text-xl text-gray-300 font-medium",
    xl: "text-xl md:text-2xl font-bold"
  };

  return (
    <p className={cn(sizes[size], className)} {...props}>
      {children}
    </p>
  );
}
