'use client';

import { useEffect } from 'react';
import { useConfigStore } from '@/stores/config-store';

export function ConfigInitializer() {
  const fetchConfig = useConfigStore((s) => s.fetchConfig);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return null;
}
