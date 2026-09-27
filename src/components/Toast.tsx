import { useEffect } from "react";

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/10">
      <div className="pointer-events-auto rounded-lg border border-green-200 bg-green-50 px-6 py-4 text-base font-medium text-green-800 shadow-lg">
        {message}
      </div>
    </div>
  );
}
