'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { booksApi } from '@/lib/api/books';
import { useBookEvents } from '@/hooks/use-book-events';
import { BookCreationMode } from '@bestsellers/shared';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { PlanningCard } from './planning-card';

export function ChatContainer() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const router = useRouter();

  const store = useChatStore();
  const { setAuth } = useAuthStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const hasInitialized = useRef(false);

  // --- SSE for preview ---
  const [previewBookId, setPreviewBookId] = useState<string | null>(null);

  useBookEvents(previewBookId, (type, data) => {
    if (type === 'preview-complete' || type === 'preview-result') {
      setPreviewBookId(null);
      handlePreviewReady(data);
    } else if (type === 'preview-failed' || type === 'error') {
      setPreviewBookId(null);
      store.setProcessing(false);
      store.setError(t('errorPreview'));
      addBotMessage(t('errorPreview'));
    }
  });

  // --- Auto-scroll ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [store.messages, isTyping]);

  // --- Initialize welcome ---
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    runWelcomeSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Helpers ---
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const addBotMessage = useCallback(
    (content: string, type: 'text' | 'choices' | 'image' = 'text', extra?: Record<string, unknown>) => {
      store.addMessage({ role: 'bot', content, type, ...extra });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const showTypingThenMessage = useCallback(
    async (content: string, type: 'text' | 'choices' | 'image' = 'text', delayMs = 1500, extra?: Record<string, unknown>) => {
      setIsTyping(true);
      await delay(delayMs);
      setIsTyping(false);
      store.addMessage({ role: 'bot', content, type, ...extra });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ================================================================
  // WELCOME — Intro + ask name
  // ================================================================
  async function runWelcomeSequence() {
    await showTypingThenMessage(t('welcome1'), 'text', 600);
    await showTypingThenMessage(t('welcome2'), 'text', 1200);
    // First interaction: buttons
    store.addMessage({
      role: 'bot',
      content: '',
      type: 'choices',
      choices: [t('btnSure'), t('btnOfCourse')],
    });
    store.setStep('welcome');
  }

  // ================================================================
  // HANDLE CHOICES
  // ================================================================
  function handleChoice(choice: string) {
    store.addMessage({ role: 'user', content: choice, type: 'text' });
    const { step } = useChatStore.getState();

    switch (step) {
      case 'welcome':
        // After "Sure!" -> ask name
        transitionToCollectNameEarly();
        break;

      case 'pitch_videos':
        // After "I already knew" / "Never imagined" -> pitch difficulty
        transitionToPitchDifficulty();
        break;

      case 'pitch_difficulty':
        // After "I think so" / "I don't think so" -> pitch solution
        transitionToPitchSolution();
        break;

      case 'pitch_solution':
        // After "I WANT MY BOOK!" -> pitch CTA details
        transitionToPitchCta();
        break;

      case 'pitch_cta':
        // After "YES, LET'S DO IT!" -> choose path
        transitionToChoosePath();
        break;

      case 'choose_path':
        if (choice === t('choiceGenerate')) {
          store.setPath('generate');
          transitionToCollectTopic();
        } else {
          store.setPath('custom');
          transitionToCollectTitle();
        }
        break;
    }
  }

  // ================================================================
  // PITCH FLOW — mirrors original Typebot
  // ================================================================

  async function transitionToCollectNameEarly() {
    await showTypingThenMessage(t('askName'), 'text', 600);
    store.setStep('collect_name_early');
  }

  async function transitionToPitchVideos() {
    const { userName } = useChatStore.getState();
    // Personalized message with name
    await showTypingThenMessage(t('pitchVideos1', { name: userName }), 'text', 800);
    await showTypingThenMessage(t('pitchVideos2'), 'text', 1000);
    // YouTube screenshots
    await showTypingThenMessage('', 'image', 600, { imageUrl: '/chat/img01.png' });
    await showTypingThenMessage('', 'image', 400, { imageUrl: '/chat/img02.png' });
    await showTypingThenMessage('', 'image', 400, { imageUrl: '/chat/img03.png' });
    await showTypingThenMessage('', 'image', 400, { imageUrl: '/chat/img04.png' });
    // Question
    await showTypingThenMessage(t('pitchVideos3'), 'text', 1000);
    await showTypingThenMessage(t('pitchVideos4'), 'text', 800);
    store.addMessage({
      role: 'bot',
      content: '',
      type: 'choices',
      choices: [t('btnKnew'), t('btnNeverImagined')],
    });
    store.setStep('pitch_videos');
  }

  async function transitionToPitchDifficulty() {
    await showTypingThenMessage(t('pitchDifficulty1'), 'text', 800);
    await showTypingThenMessage(t('pitchDifficulty2'), 'text', 1000);
    await showTypingThenMessage(t('pitchDifficulty3'), 'text', 1000);
    // Thinking image
    await showTypingThenMessage('', 'image', 600, { imageUrl: '/chat/thinking.gif' });
    await showTypingThenMessage(t('pitchDifficulty4'), 'text', 800);
    store.addMessage({
      role: 'bot',
      content: '',
      type: 'choices',
      choices: [t('btnThinkYes'), t('btnThinkNo')],
    });
    store.setStep('pitch_difficulty');
  }

  async function transitionToPitchSolution() {
    await showTypingThenMessage(t('pitchSolution1'), 'text', 800);
    await showTypingThenMessage(t('pitchSolution2'), 'text', 1000);
    await showTypingThenMessage(t('pitchSolution3'), 'text', 1000);
    await showTypingThenMessage(t('pitchSolution4'), 'text', 800);
    await showTypingThenMessage(t('pitchSolution5'), 'text', 800);
    await showTypingThenMessage(t('pitchSolution6'), 'text', 1200);
    await showTypingThenMessage(t('pitchSolution7'), 'text', 1000);
    // GPT comparison image
    await showTypingThenMessage(t('pitchCompare1'), 'text', 1000);
    await showTypingThenMessage('', 'image', 600, { imageUrl: '/chat/ai-text01.jpeg' });
    await showTypingThenMessage(t('pitchCompare2'), 'text', 1000);
    // Our AI image
    await showTypingThenMessage(t('pitchCompare3'), 'text', 1000);
    await showTypingThenMessage('', 'image', 600, { imageUrl: '/chat/ai-text02.jpeg' });
    await showTypingThenMessage(t('pitchCompare4'), 'text', 1000);
    // CTA
    await showTypingThenMessage(t('pitchCta'), 'text', 800);
    store.addMessage({
      role: 'bot',
      content: '',
      type: 'choices',
      choices: [t('ctaWantBook')],
    });
    store.setStep('pitch_solution');
  }

  async function transitionToPitchCta() {
    await showTypingThenMessage(t('letsStart'), 'text', 600);
    await showTypingThenMessage(t('bookIntro'), 'text', 1200);
    await showTypingThenMessage(t('bookDetail1'), 'text', 800);
    await showTypingThenMessage(t('bookDetail2'), 'text', 600);
    await showTypingThenMessage(t('bookDetail3'), 'text', 600);
    await showTypingThenMessage(t('bookDetail4'), 'text', 800);
    await showTypingThenMessage(t('bookDetail5'), 'text', 600);
    store.addMessage({
      role: 'bot',
      content: '',
      type: 'choices',
      choices: [t('btnLetsDoIt')],
    });
    store.setStep('pitch_cta');
  }

  async function transitionToChoosePath() {
    await showTypingThenMessage(t('choosePathIntro'), 'text', 800);
    await showTypingThenMessage(t('choosePathPrompt'), 'text', 600);
    store.addMessage({
      role: 'bot',
      content: '',
      type: 'choices',
      choices: [t('choiceGenerate'), t('choiceHaveTitle')],
    });
    store.setStep('choose_path');
  }

  // ================================================================
  // DATA COLLECTION
  // ================================================================

  async function transitionToCollectTopic() {
    await showTypingThenMessage(t('collectTopicPrompt'), 'text', 800);
    store.setStep('collect_topic');
  }

  async function transitionToCollectTitle() {
    await showTypingThenMessage(t('collectTitlePrompt'), 'text', 800);
    store.setStep('collect_title');
  }

  async function transitionToCollectSubtitle() {
    await showTypingThenMessage(t('collectSubtitlePrompt'), 'text', 600);
    store.setStep('collect_subtitle');
  }

  async function transitionToCollectBriefingCustom() {
    await showTypingThenMessage(t('collectBriefingCustomPrompt'), 'text', 600);
    store.setStep('collect_briefing_custom');
  }

  async function transitionToCollectAuthor() {
    await showTypingThenMessage(t('collectAuthorPrompt'), 'text', 600);
    store.setStep('collect_author');
  }

  async function transitionToCollectEmail() {
    await showTypingThenMessage(t('collectEmailPrompt'), 'text', 600);
    store.setStep('collect_email');
  }

  async function transitionToCollectPhone() {
    await showTypingThenMessage(t('collectPhonePrompt'), 'text', 600);
    store.setStep('collect_phone');
  }

  // ================================================================
  // HANDLE TEXT INPUT
  // ================================================================

  function handleInput(value: string) {
    const { step } = useChatStore.getState();
    store.addMessage({ role: 'user', content: value, type: 'text' });

    switch (step) {
      case 'collect_name_early':
        store.setField('userName', value);
        transitionToPitchVideos();
        break;
      case 'collect_topic':
        store.setField('briefing', value);
        transitionToCollectAuthor();
        break;
      case 'collect_title':
        store.setField('title', value);
        transitionToCollectSubtitle();
        break;
      case 'collect_subtitle':
        store.setField('subtitle', value);
        transitionToCollectBriefingCustom();
        break;
      case 'collect_briefing_custom':
        store.setField('briefing', value);
        transitionToCollectAuthor();
        break;
      case 'collect_author':
        store.setField('authorName', value);
        transitionToCollectEmail();
        break;
      case 'collect_email':
        store.setField('userEmail', value);
        transitionToCollectPhone();
        break;
      case 'collect_phone':
        store.setField('userPhone', value);
        runAccountAndBook();
        break;
    }
  }

  // ================================================================
  // ACCOUNT + BOOK + PREVIEW
  // ================================================================

  async function runAccountAndBook() {
    const state = useChatStore.getState();
    store.setProcessing(true);
    store.setStep('creating_account');

    await showTypingThenMessage(t('creatingAccount'), 'text', 500);

    try {
      // 1. Create account
      const password = crypto.randomUUID().slice(0, 16);
      const authResult = await authApi.register({
        email: state.userEmail,
        password,
        name: state.userName,
        locale,
        phoneNumber: state.userPhone,
      });

      // Auto-login
      setAuth(authResult.user, authResult.tokens.accessToken, authResult.tokens.refreshToken);

      await showTypingThenMessage(t('accountCreated'), 'text', 500);

      // 2. Create book
      store.setStep('creating_book');
      await showTypingThenMessage(t('creatingBook'), 'text', 500);

      const bookInput =
        state.path === 'generate'
          ? {
              mode: BookCreationMode.GUIDED,
              briefing: state.briefing,
              author: state.authorName,
            }
          : {
              mode: BookCreationMode.SIMPLE,
              title: state.title,
              subtitle: state.subtitle,
              briefing: state.briefing,
              author: state.authorName,
            };

      const book = await booksApi.create(bookInput);
      store.setField('bookId', book.id);

      // 3. Request preview
      await booksApi.generatePreview(book.id);

      store.setStep('generating_preview');
      await showTypingThenMessage(t('generatingPreview'), 'text', 500);

      // Start SSE listening
      setPreviewBookId(book.id);

      // Polling fallback
      startPolling(book.id);
    } catch (err: unknown) {
      store.setProcessing(false);
      const status = (err as { response?: { status?: number } })?.response?.status;

      if (status === 409) {
        store.setStep('welcome');
        addBotMessage(t('emailExists'));
      } else {
        store.setError(t('errorGeneric'));
        addBotMessage(t('errorGeneric'));
      }
    }
  }

  // --- Polling fallback ---
  function startPolling(bookId: string) {
    const interval = setInterval(async () => {
      try {
        const result = await booksApi.getPreviewStatus(bookId);
        if (result.status === 'PREVIEW_READY' || result.status === 'PLANNING_READY') {
          clearInterval(interval);
          setPreviewBookId(null);

          const book = await booksApi.getById(bookId);
          handlePreviewReady({
            title: book.title,
            subtitle: book.subtitle,
            planning: book.planning,
          });
        } else if (result.status === 'PREVIEW_FAILED' || result.status === 'FAILED') {
          clearInterval(interval);
          setPreviewBookId(null);
          store.setProcessing(false);
          addBotMessage(t('errorPreview'));
        }
      } catch {
        // Polling will retry
      }
    }, 3000);

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  }

  // --- Preview ready ---
  function handlePreviewReady(data: Record<string, unknown>) {
    store.setProcessing(false);
    store.setStep('preview_ready');

    const planning = data.planning as { chapters?: Array<{ title: string }> } | undefined;
    const title = (data.title as string) || t('yourBook');
    const subtitle = data.subtitle as string | undefined;
    const chapters = planning?.chapters || [];

    store.addMessage({
      role: 'bot',
      content: '',
      type: 'planning',
      planning: { title, subtitle, chapters },
    });
  }

  // --- Redirect to dashboard ---
  function handleViewBook() {
    const { bookId } = useChatStore.getState();
    if (bookId) {
      router.push(`/dashboard/books/${bookId}`);
    }
  }

  // ================================================================
  // INPUT CONFIG
  // ================================================================

  function getInputConfig(): {
    mode: 'text' | 'textarea' | 'email' | 'phone' | 'hidden';
    placeholder: string;
    minLength: number;
  } {
    switch (store.step) {
      case 'collect_name_early':
        return { mode: 'text', placeholder: t('namePlaceholder'), minLength: 2 };
      case 'collect_topic':
        return { mode: 'textarea', placeholder: t('topicPlaceholder'), minLength: 50 };
      case 'collect_title':
        return { mode: 'text', placeholder: t('titlePlaceholder'), minLength: 3 };
      case 'collect_subtitle':
        return { mode: 'text', placeholder: t('subtitlePlaceholder'), minLength: 3 };
      case 'collect_briefing_custom':
        return { mode: 'textarea', placeholder: t('briefingPlaceholder'), minLength: 30 };
      case 'collect_author':
        return { mode: 'text', placeholder: t('authorPlaceholder'), minLength: 2 };
      case 'collect_email':
        return { mode: 'email', placeholder: t('emailPlaceholder'), minLength: 5 };
      case 'collect_phone':
        return { mode: 'phone', placeholder: t('phonePlaceholder'), minLength: 8 };
      default:
        return { mode: 'hidden', placeholder: '', minLength: 0 };
    }
  }

  const inputConfig = getInputConfig();

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3">
        {store.messages.map((msg) => {
          if (msg.type === 'planning' && msg.planning) {
            return (
              <PlanningCard
                key={msg.id}
                title={msg.planning.title}
                subtitle={msg.planning.subtitle}
                chapters={msg.planning.chapters}
                onContinue={handleViewBook}
              />
            );
          }

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              onChoice={handleChoice}
            />
          );
        })}

        {isTyping && <TypingIndicator />}
      </div>

      {/* Input area */}
      <ChatInput
        mode={inputConfig.mode}
        placeholder={inputConfig.placeholder}
        minLength={inputConfig.minLength}
        onSubmit={handleInput}
        disabled={store.isProcessing}
      />
    </div>
  );
}
