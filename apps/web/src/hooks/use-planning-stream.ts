'use client';

import { useRef, useCallback, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';

interface StartStreamParams {
  path: 'generate' | 'custom';
  briefing: string;
  title?: string;
  subtitle?: string;
  locale: string;
  messageId: string;
}

export function usePlanningStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async ({
      path,
      briefing,
      title,
      subtitle,
      locale,
      messageId,
    }: StartStreamParams): Promise<string | null> => {
      setIsStreaming(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      const { updateMessageContent } = useChatStore.getState();

      let fullContent = '';
      let batchBuffer = '';
      let batchTimer: ReturnType<typeof setTimeout> | null = null;

      const flushBatch = () => {
        if (batchBuffer) {
          fullContent += batchBuffer;
          updateMessageContent(messageId, fullContent);
          batchBuffer = '';
        }
        batchTimer = null;
      };

      try {
        const res = await fetch('/api/chat/planning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, briefing, title, subtitle, locale }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data: ')) continue;

            const payload = line.slice(6);
            if (payload === '[DONE]') {
              flushBatch();
              continue;
            }

            try {
              const parsed = JSON.parse(payload);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.token) {
                // Batch tokens (~50ms) to avoid excessive re-renders
                batchBuffer += parsed.token;
                if (!batchTimer) {
                  batchTimer = setTimeout(flushBatch, 50);
                }
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== 'Run failed') {
                // Ignore JSON parse errors for malformed chunks
              }
            }
          }
        }

        // Final flush
        flushBatch();
        if (batchTimer) {
          clearTimeout(batchTimer);
          flushBatch();
        }

        setIsStreaming(false);
        return fullContent || null;
      } catch (err) {
        if (batchTimer) clearTimeout(batchTimer);

        if (err instanceof DOMException && err.name === 'AbortError') {
          setIsStreaming(false);
          return null;
        }

        const message =
          err instanceof Error ? err.message : 'Stream error';
        setError(message);
        setIsStreaming(false);
        return null;
      }
    },
    [],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { startStream, cancelStream, isStreaming, error };
}
