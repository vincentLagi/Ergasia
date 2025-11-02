import { useEffect, useRef, useState } from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "../../lib/tvMerge";

interface TypingAnimationProps extends MotionProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
}

export function TypingAnimation({
  children,
  className,
  duration = 100,
  delay = 0,
  as: Component = "div",
  ...props
}: TypingAnimationProps) {
  const MotionComponent = motion(Component);
  const [displayedText, setDisplayedText] = useState<string>("");
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          observerRef.current?.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.01, // Trigger when 1% of the element is visible
      }
    );

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingEffect);
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [children, duration, hasStarted]);

  return (
    <MotionComponent
      ref={elementRef}
      className={cn(
        "text-4xl font-bold leading-[3rem] tracking-[-0.02em]",
        className
      )}
      {...props}
    >
      {displayedText}
      {/* Blinking cursor */}
      {/* <span className="ml-1 inline-block h-8 w-1 animate-blink bg-current align-middle" />   */}
    </MotionComponent>
  );
}
