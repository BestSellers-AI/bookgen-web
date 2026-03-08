'use client';

import { motion } from 'framer-motion';
import { useChatStore, type ChatMessage } from '@/stores/chat-store';

interface MessageBubbleProps {
  message: ChatMessage;
  onChoice?: (choice: string) => void;
}

export function MessageBubble({ message, onChoice }: MessageBubbleProps) {
  const answerMessage = useChatStore((s) => s.answerMessage);
  const isBot = message.role === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-2 px-4 ${isBot ? '' : 'justify-end'}`}
    >
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-semibold text-primary">AI</span>
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[70%] ${
          isBot
            ? 'bg-card border border-border/50 rounded-2xl rounded-tl-sm'
            : 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
        } px-4 py-2.5`}
      >
        {message.type === 'image' && message.imageUrl && (
          <img
            src={message.imageUrl}
            alt=""
            className="rounded-lg max-w-full mb-2"
            loading="lazy"
          />
        )}

        {message.type === 'text' && (
          <p className="text-sm whitespace-pre-line leading-relaxed">
            {message.content}
          </p>
        )}

        {message.type === 'choices' && (
          <div className="space-y-3">
            {message.content && (
              <p className="text-sm whitespace-pre-line leading-relaxed">
                {message.content}
              </p>
            )}
            <div className="flex flex-col gap-2">
              {message.choices?.map((choice) => (
                <button
                  key={choice}
                  disabled={message.answered}
                  onClick={() => {
                    if (message.answered) return;
                    answerMessage(message.id);
                    onChoice?.(choice);
                  }}
                  className={`px-4 py-2.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors text-left ${
                    message.answered
                      ? 'border-muted bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60'
                      : 'border-primary/30 bg-primary/5 hover:bg-primary/15 text-primary'
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
