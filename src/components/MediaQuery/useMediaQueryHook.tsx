import { useState } from "react";
import { useIsomorphicLayoutEffect } from "motion/react";

type UseMediaQueryOptions = {
  defaultValue?: boolean
  initializeWithValue?: boolean
}

export function useMediaQuery(query:string,{defaultValue = false, initializeWithValue = true}: UseMediaQueryOptions = {}) {
  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  });

  useIsomorphicLayoutEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQueryList.addEventListener("change", listener);
    setMatches(mediaQueryList.matches);

    return () => {
      mediaQueryList.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}