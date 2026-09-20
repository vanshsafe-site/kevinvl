import { useCallback, useEffect, useState } from "react";

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...initial, ...JSON.parse(raw) } : initial;
    } catch {
      return initial;
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
