"use client";

import { useCallback, useEffect, useState } from "react";

const NAME_KEY = "stardew-cc:name";

export function useDisplayName() {
  const [name, setNameState] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setNameState(localStorage.getItem(NAME_KEY) ?? "");
    setHydrated(true);
  }, []);

  const setName = useCallback((next: string) => {
    const trimmed = next.trim();
    setNameState(trimmed);
    localStorage.setItem(NAME_KEY, trimmed);
  }, []);

  return { name, setName, hydrated };
}
