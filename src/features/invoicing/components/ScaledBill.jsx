import { useLayoutEffect, useRef, useState } from "react";

const PAGE_WIDTH_MM = 148;
const MM_TO_PX = 96 / 25.4;

/** Shows the printed bill shrunk to fit the screen width instead of scrolling sideways. */
export function ScaledBill({ children }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const [fit, setFit] = useState({ scale: 1, height: undefined });

  useLayoutEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return;
      const scale = Math.min(1, outer.current.clientWidth / (PAGE_WIDTH_MM * MM_TO_PX));
      setFit({ scale, height: inner.current.scrollHeight * scale });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer.current);
    observer.observe(inner.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={outer} className="overflow-hidden rounded-xl bg-secondary" style={{ height: fit.height }}>
      <div
        ref={inner}
        style={{ width: `${PAGE_WIDTH_MM}mm`, transform: `scale(${fit.scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
