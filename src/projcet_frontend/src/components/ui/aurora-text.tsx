// AuroraText.tsx
import { motion, MotionProps } from "framer-motion";
import { cn } from "../../lib/tvMerge";
import "../../styles/aurora.css";

interface AuroraTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps> {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

export function AuroraText({
  className,
  children,
  as: Component = "span",
  ...props
}: AuroraTextProps) {
  const MotionComponent = motion(Component);
  return (
    <MotionComponent
      className={cn(
        "relative inline-block overflow-hidden bg-transparent py-2",
        className
      )}
      {...props}
    >
      {/* Initial state: Aurora text */}
      <span
        className="
    relative 
    z-10 
    bg-gradient-to-br 
    from-[hsl(var(--aurora-color-1))] 
    via-[hsl(var(--aurora-color-2))] 
    to-[hsl(var(--aurora-color-4))] 
    bg-clip-text 
    animate-aurora-gradient
    text-transparent
    dark:selection:text-blue-950
    selection:text-white
    selection:bg-clip-border
  "
      >
        {children}
        {/* Background for selection */}
      </span>

      {/* <span className="pointer-events-none absolute inset-0 opacity-0 selection:opacity-100">
        <span className="absolute inset-0 z-20 text-transparent selection:text-transparent">
          {children}
        </span>

        <div className="absolute inset-0 z-10">
          <div className="absolute -inset-[100%] animate-aurora-spin">
            <div
              className="
                absolute top-1/2 left-1/2 h-[100%] w-[100%] -translate-x-1/2 -translate-y-1/2
                bg-gradient-to-br 
                from-[hsl(var(--aurora-color-1))] 
                via-[hsl(var(--aurora-color-2))] 
                to-[hsl(var(--aurora-color-4))] 
                blur-xl
              "
            />
          </div>
        </div>
      </span> */}
    </MotionComponent>
  );
}
