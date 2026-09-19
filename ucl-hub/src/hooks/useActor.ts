"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import type { ActorRef } from "@/types";

/** The signed-in person as the `{ id, name }` reference stored on records they create or change. */
export function useActor(): ActorRef {
  const { user, profile } = useCurrentUser();
  return useMemo(() => ({ id: user.uid, name: profile.name }), [user.uid, profile.name]);
}
