import { useState, useEffect } from 'react';

/**
 * Debounces a value by the specified delay.
 * Returns the debounced value that updates only after the user
 * stops changing the input for `delay` milliseconds.
 *
 * Usage:
 *   const debouncedSections = useDebounce(sections, 200);
 *   <ResumeRenderer sections={debouncedSections} />
 */
export default function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
