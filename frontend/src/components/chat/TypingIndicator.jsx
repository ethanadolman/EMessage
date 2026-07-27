import { useEffect, useState } from "react";

export function TypingIndicator({ className = "", label = "Typing" }) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDotCount((current) => (current >= 3 ? 1 : current + 1));
    }, 250);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-live="polite">
      <span>{label}</span>
      <span className="inline-flex min-w-4" aria-hidden="true">
        {Array.from({ length: dotCount }).map((_, index) => (
          <span key={`${label}-${index}`} className="leading-none">
            .
          </span>
        ))}
      </span>
    </span>
  );
}
