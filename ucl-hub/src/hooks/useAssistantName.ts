"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";

const DEFAULT_NAME = "Manu";
const STORAGE_PREFIX = "ucl-hub-assistant-name:";
const NAME_EVENT = "ucl-hub-assistant-name-changed";

export function useAssistantName() {
  const { user } = useAuth();
  const storageKey = `${STORAGE_PREFIX}${user?.uid ?? "public"}`;
  const [name, setName] = useState(DEFAULT_NAME);

  useEffect(() => {
    const refresh = () => setName(window.localStorage.getItem(storageKey)?.trim() || DEFAULT_NAME);
    refresh();
    const onNameChanged = (event: Event) => {
      if ((event as CustomEvent<{ key?: string }>).detail?.key === storageKey) refresh();
    };
    window.addEventListener(NAME_EVENT, onNameChanged);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(NAME_EVENT, onNameChanged);
      window.removeEventListener("storage", refresh);
    };
  }, [storageKey]);

  const saveName = (nextName: string) => {
    const cleanName = nextName.trim() || DEFAULT_NAME;
    setName(cleanName);
    window.localStorage.setItem(storageKey, cleanName);
    window.dispatchEvent(new CustomEvent(NAME_EVENT, { detail: { key: storageKey } }));
  };

  return { name, saveName, defaultName: DEFAULT_NAME };
}