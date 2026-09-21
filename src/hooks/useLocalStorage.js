import { useCallback, useEffect, useState } from "react";

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      const merged = { ...initial, ...parsed };
      if (merged.preferredDevice !== "cpu") merged.preferredDevice = "gpu";
      return merged;
    } catch {
      return { ...initial, preferredDevice: "gpu" };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — settings just won't persist */
    }
  }, [key, value]);

  const update = useCallback((patch) => setValue((v) => ({ ...v, ...patch })), []);
  return [value, update];
}
