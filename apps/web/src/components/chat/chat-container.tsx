'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api-client';
import { getTrackingData } from '@/lib/tracking';
import { trackLead, trackViewContent, generateEventId } from '@/lib/fb-pixel';
import { booksApi } from '@/lib/api/books';
import { BookCreationMode } from '@bestsellers/shared';
import { Loader2, Sparkles } from 'lucide-react';
import { usePlanningStream } from '@/hooks/use-planning-stream';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';

// Chat image paths per locale (extensions vary by locale)
const CHAT_IMAGES: Record<string, Record<string, string>> = {
  en: {
    img01: '/chat/en/img01.jpg',
    img02: '/chat/en/img02.jpg',
    img03: '/chat/en/img03.jpg',
    img04: '/chat/en/img04.jpg',
    'ai-text01': '/chat/en/ai-text01.png',
    'ai-text02': '/chat/en/ai-text02.png',
  },
  es: {
    img01: '/chat/es/img01.png',
    img02: '/chat/es/img02.png',
    img03: '/chat/es/img03.png',
    img04: '/chat/es/img04.png',
    'ai-text01': '/chat/es/ai-text01.png',
    'ai-text02': '/chat/es/ai-text02.png',
  },
  'pt-BR': {
    img01: '/chat/pt-br/img01.jpeg',
    img02: '/chat/pt-br/img02.jpeg',
    img03: '/chat/pt-br/img03.jpeg',
    img04: '/chat/pt-br/img04.jpeg',
    'ai-text01': '/chat/pt-br/ai-text01.jpeg',
    'ai-text02': '/chat/pt-br/ai-text02.jpeg',
  },
};

function getChatImage(locale: string, name: string): string {
  return CHAT_IMAGES[locale]?.[name] ?? CHAT_IMAGES['en'][name];
}

export function ChatContainer() {
  const t = useTranslations('chat');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const store = useChatStore();
  const { setAuth } = useAuthStore();
  const { startStream, isStreaming } = usePlanningStream();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const hasInitialized = useRef(false);

  // --- Auto-scroll ---
  useEffect(() => {
    // Immediate scroll
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Delayed scroll to catch input animations / layout shifts
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [store.messages, store.step, isTyping]);

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

      case 'ai_planning_approval':
        if (choice === t('aiPlanningYes')) {
          transitionToCollectAuthor();
        } else if (choice === t('aiPlanningRestart')) {
          store.setAiPlanningText(null);
          const { path } = useChatStore.getState();
          if (path === 'generate') {
            transitionToCollectTopic();
          } else {
            transitionToCollectTitle();
          }
        } else {
          // "TRY AGAIN" after error — retry AI planning
          transitionToAiPlanning();
        }
        break;

      case 'email_exists':
        router.push('/auth/login');
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
    await showTypingThenMessage('', 'image', 600, { imageUrl: getChatImage(locale, 'img01') });
    await showTypingThenMessage('', 'image', 400, { imageUrl: getChatImage(locale, 'img02') });
    await showTypingThenMessage('', 'image', 400, { imageUrl: getChatImage(locale, 'img03') });
    await showTypingThenMessage('', 'image', 400, { imageUrl: getChatImage(locale, 'img04') });
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
    await showTypingThenMessage('', 'image', 600, { imageUrl: getChatImage(locale, 'ai-text01') });
    await showTypingThenMessage(t('pitchCompare2'), 'text', 1000);
    // Our AI image
    await showTypingThenMessage(t('pitchCompare3'), 'text', 1000);
    await showTypingThenMessage('', 'image', 600, { imageUrl: getChatImage(locale, 'ai-text02') });
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
    trackViewContent({ content_name: 'Chat Registration', content_category: 'chat_registration' });
    await showTypingThenMessage(t('collectEmailPrompt'), 'text', 600);
    store.setStep('collect_email');
  }

  async function transitionToCollectPhone() {
    await showTypingThenMessage(t('collectPhonePrompt'), 'text', 600);
    store.setStep('collect_phone');
  }

  // ================================================================
  // AI PLANNING — Stream from OpenAI Assistants
  // ================================================================

  async function transitionToAiPlanning() {
    const state = useChatStore.getState();

    // Show thinking message
    await showTypingThenMessage(t('aiPlanningThinking'), 'text', 600);

    // Create streaming message placeholder
    store.addMessage({ role: 'bot', content: '', type: 'streaming' });
    const msgs = useChatStore.getState().messages;
    const streamMsgId = msgs[msgs.length - 1].id;

    store.setStep('ai_planning_streaming');

    // Start streaming
    const planningText = await startStream({
      path: state.path as 'generate' | 'custom',
      briefing: state.briefing,
      title: state.title || undefined,
      subtitle: state.subtitle || undefined,
      locale,
      messageId: streamMsgId,
    });

    // Change streaming message to regular text
    store.updateMessageType(streamMsgId, 'text');

    if (planningText) {
      store.setAiPlanningText(planningText);

      // Show approval choices as chat message
      await showTypingThenMessage(t('aiPlanningReady'), 'text', 500);
      store.addMessage({
        role: 'bot',
        content: '',
        type: 'choices',
        choices: [t('aiPlanningYes'), t('aiPlanningRestart')],
      });
      store.setStep('ai_planning_approval');
    } else {
      // Streaming failed
      await showTypingThenMessage(t('aiPlanningError'), 'text', 500);
      store.addMessage({
        role: 'bot',
        content: '',
        type: 'choices',
        choices: [t('aiPlanningRetry')],
      });
      store.setStep('ai_planning_approval');
    }
  }

  // ================================================================
  // HANDLE TEXT INPUT
  // ================================================================

  function handleInput(value: string) {
    const { step } = useChatStore.getState();
    store.addMessage({ role: 'user', content: value, type: 'text' });
    store.setStep('transitioning');

    switch (step) {
      case 'collect_name_early':
        store.setField('userName', value);
        transitionToPitchVideos();
        break;
      case 'collect_topic':
        store.setField('briefing', value);
        transitionToAiPlanning();
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
        transitionToAiPlanning();
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
      const tracking = getTrackingData();
      const leadEventId = generateEventId();
      const authResult = await authApi.register({
        ...tracking,
        email: state.userEmail,
        password,
        name: state.userName,
        locale,
        phoneNumber: state.userPhone,
        source: 'chat',
        leadEventId,
      });

      // Auto-login — must save to localStorage so Axios interceptor picks up the token
      tokenStorage.setTokens(authResult.tokens.accessToken, authResult.tokens.refreshToken);
      setAuth(authResult.user, authResult.tokens.accessToken, authResult.tokens.refreshToken);

      // Fire Lead event (browser-side, deduplicates with CAPI via leadEventId)
      trackLead({ content_name: 'chat', content_category: 'registration' }, leadEventId);

      await showTypingThenMessage(t('accountCreated'), 'text', 500);

      // 2. Create book
      store.setStep('creating_book');
      await showTypingThenMessage(t('creatingBook'), 'text', 500);

      // Enrich briefing with AI planning output
      const enrichedBriefing = state.aiPlanningText
        ? `${state.briefing}\n\n---\n\n${state.aiPlanningText}`
        : state.briefing;

      const bookSettings = {
        tone: 'professional',
        targetAudience: 'general',
        language: locale,
        pageTarget: 150,
        chapterCount: 10,
        includeExamples: true,
        includeCaseStudies: false,
      };

      const bookInput =
        state.path === 'generate'
          ? {
              mode: BookCreationMode.GUIDED,
              briefing: enrichedBriefing,
              author: state.authorName,
              settings: bookSettings,
            }
          : {
              mode: BookCreationMode.SIMPLE,
              title: state.title,
              subtitle: state.subtitle,
              briefing: enrichedBriefing,
              author: state.authorName,
              settings: bookSettings,
            };

      const book = await booksApi.create(bookInput);
      store.setField('bookId', book.id);

      // 3. Request preview (fire and forget)
      booksApi.generatePreview(book.id).catch(() => {});

      // Redirect to book detail — preview progress continues there
      router.push(`/dashboard/books/${book.id}`);
    } catch (err: unknown) {
      store.setProcessing(false);
      const status = (err as { response?: { status?: number } })?.response?.status;

      if (status === 409) {
        store.setStep('email_exists');
        addBotMessage(t('emailExists'));
        store.addMessage({
          role: 'bot',
          content: '',
          type: 'choices',
          choices: [t('btnGoToLogin')],
        });
      } else {
        store.setError(t('errorGeneric'));
        addBotMessage(t('errorGeneric'));
      }
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
        return { mode: 'textarea', placeholder: t('topicPlaceholder'), minLength: 100 };
      case 'collect_title':
        return { mode: 'text', placeholder: t('titlePlaceholder'), minLength: 3 };
      case 'collect_subtitle':
        return { mode: 'text', placeholder: t('subtitlePlaceholder'), minLength: 3 };
      case 'collect_briefing_custom':
        return { mode: 'textarea', placeholder: t('briefingPlaceholder'), minLength: 100 };
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

  const isCreating = store.step === 'creating_account' || store.step === 'creating_book';

  return (
    <div className="flex flex-col h-full">
      {/* Full-screen loader during account/book creation */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
            <div className="relative space-y-8 text-center px-6">
              <div className="flex justify-center">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-foreground">
                  {store.step === 'creating_account' ? t('creatingAccount') : t('creatingBook')}
                </h2>
              </div>
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="lg"
                className="mt-4 rounded-xl"
                onClick={() => router.push('/dashboard')}
              >
                {tCommon('goToDashboard')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3">
        {store.messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onChoice={handleChoice}
          />
        ))}

        {isTyping && <TypingIndicator />}
      </div>

      {/* Input area */}
      <ChatInput
        mode={inputConfig.mode}
        placeholder={inputConfig.placeholder}
        minLength={inputConfig.minLength}
        onSubmit={handleInput}
        disabled={store.isProcessing || isStreaming}
      />
    </div>
  );
}
