"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { AI, STORAGE_KEYS } from "@/config/app";
import { toUserMessage } from "@/utils/errors";
import type { AssistantProfile, AssistantResponse } from "../types";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  /** Present on assistant messages that came from the assistant service. */
  response?: AssistantResponse;
  /** Set when the request itself failed (network, rate limit...). */
  error?: string;
}

interface Stored {
  next: number;
  messages: ChatMessage[];
}

const MAX_STORED = 40;

function storageKey(uid: string): string {
  return `${STORAGE_KEYS.assistantChat}:${uid}`;
}

function load(uid: string): Stored {
  try {
    const raw = sessionStorage.getItem(storageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      if (Array.isArray(parsed.messages)) return parsed;
    }
  } catch {
    // Unreadable or unavailable storage: start with an empty conversation.
  }
  return { next: 1, messages: [] };
}

/**
 * Conversation state for the assistant. The chat lives for the browser tab
 * (sessionStorage), never leaves the device except as questions to the assistant,
 * and stale answers from a cleared conversation are ignored.
 */
export function useAssistantChat() {
  const { assistant } = useServices();
  const { user, profile, access } = useCurrentUser();
  const [state, setState] = useState<Stored>(() => load(user.uid));
  const [pending, setPending] = useState(false);
  const generation = useRef(0);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    try {
      sessionStorage.setItem(storageKey(user.uid), JSON.stringify({ next: state.next, messages: state.messages.slice(-MAX_STORED) }));
    } catch {
      // Storage full or blocked: the chat still works for this page view.
    }
  }, [state, user.uid]);

  const assistantProfile: AssistantProfile = {
    name: profile.name,
    role: access.role === "student" ? "student" : (access.staffRole ?? access.role),
    faculty: profile.faculty,
    programme: profile.programme,
    year: profile.year,
  };
  const profileRef = useRef(assistantProfile);
  useEffect(() => {
    profileRef.current = assistantProfile;
  });

  const send = useCallback(
    async (text: string) => {
      const message = text.replace(/\s+/g, " ").trim();
      if (!message || pending) return;
      if (message.length > AI.maxQuestionChars) {
        setState((s) => ({
          next: s.next + 1,
          messages: [...s.messages, { id: s.next, role: "assistant", content: `Please keep questions under ${AI.maxQuestionChars} characters.`, error: "too-long" }],
        }));
        return;
      }

      const history = stateRef.current.messages.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content }));
      const ticket = generation.current;
      setState((s) => ({ next: s.next + 1, messages: [...s.messages, { id: s.next, role: "user", content: message }] }));
      setPending(true);

      try {
        const response = await assistant.ask({ message, history, profile: profileRef.current });
        if (ticket !== generation.current) return;
        setState((s) => ({ next: s.next + 1, messages: [...s.messages, { id: s.next, role: "assistant", content: response.answer, response }] }));
      } catch (error) {
        if (ticket !== generation.current) return;
        setState((s) => ({
          next: s.next + 1,
          messages: [...s.messages, { id: s.next, role: "assistant", content: toUserMessage(error), error: "failed" }],
        }));
      } finally {
        if (ticket === generation.current) setPending(false);
      }
    },
    [assistant, pending],
  );

  const clear = useCallback(() => {
    generation.current += 1;
    setPending(false);
    setState({ next: 1, messages: [] });
  }, []);

  return { messages: state.messages, pending, send, clear };
}
