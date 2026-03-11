import { apiClient } from '../api-client';
import type { AppConfigPayload } from '@bestsellers/shared';

export const configApi = {
  getConfig: () =>
    apiClient.get<AppConfigPayload>('/config').then((r) => r.data),
};
