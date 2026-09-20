import { useState, useEffect } from "react";

export function useSavedTraces() {
  const [savedTraces, setSavedTraces] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lifetrace-saved");
      if (stored) {
        setSavedTraces(JSON.parse(stored));
      }
    } catch (err) {
      // ignore
    }

    // Listen for cross-tab or same-tab changes
    const onStorage = () => {
      try {
        const stored = localStorage.getItem("lifetrace-saved");
        if (stored) {
          setSavedTraces(JSON.parse(stored));
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("lifetrace-saved-update", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("lifetrace-saved-update", onStorage);
    };
  }, []);

  const toggleTrace = (id: string) => {
    setSavedTraces((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      try {
        localStorage.setItem("lifetrace-saved", JSON.stringify(next));
        window.dispatchEvent(new Event("lifetrace-saved-update"));
      } catch (err) {
        // ignore
      }
      return next;
    });
  };

  return {
    savedTraces,
    toggleTrace,
    isSaved: (id: string) => savedTraces.includes(id),
  };
}
