"use client";

import { useEffect, useRef, useCallback } from "react";
import { tokenStorage } from "@/lib/api-client";

interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * Hook to listen for SSE events on a book via fetch + ReadableStream.
 * Uses fetch (not EventSource) to send Authorization header.
 */
export function useBookEvents(
  bookId: string | null,
  onEvent: (type: string, data: Record<string, unknown>) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(
    (id: string, signal: AbortSignal) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
      const url = `${baseUrl}/books/${id}/events`;
      const token = tokenStorage.getAccessToken();

      let attempt = 0;
      const maxRetries = 3;
      const baseDelay = 1000;

      async function startStream() {
        try {
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "text/event-stream",
            },
            signal,
          });

          if (!res.ok || !res.body) return;

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() ?? "";

            for (const part of parts) {
              const parsed = parseSSE(part);
              if (parsed) {
                onEventRef.current(parsed.type, parsed.data);
              }
            }
          }
        } catch (err: unknown) {
          if (signal.aborted) return;
          if (
            err instanceof DOMException &&
            err.name === "AbortError"
          )
            return;

          attempt++;
          if (attempt <= maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise((r) => setTimeout(r, delay));
            if (!signal.aborted) {
              return startStream();
            }
          }
        }
      }

      startStream();
    },
    [],
  );

  useEffect(() => {
    if (!bookId) return;

    const controller = new AbortController();
    connect(bookId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [bookId, connect]);
}

function parseSSE(raw: string): SSEEvent | null {
  let type = "message";
  let dataStr = "";

  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) {
      type = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataStr += line.slice(5).trim();
    }
  }

  if (!dataStr) return null;

  try {
    return { type, data: JSON.parse(dataStr) };
  } catch {
    return null;
  }
}
