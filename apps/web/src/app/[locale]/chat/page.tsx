'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { ChatContainer } from '@/components/chat/chat-container';
import { trackViewContent } from '@/lib/fb-pixel';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    trackViewContent({
      content_name: 'Chat Funnel',
      content_category: 'chat',
    });
  }, []);

  if (isAuthenticated) return null;

  return <ChatContainer />;
}
