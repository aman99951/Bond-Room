import { apiClient } from './client.js';

export const settingsApi = {
  getPublicDonateLinkSetting: () =>
    apiClient.get('/site-settings/public/donate-link/', { auth: false }),
  updateAdminDonateLinkSetting: (enabled) =>
    apiClient.post('/site-settings/admin/donate-link/', { enabled: Boolean(enabled) }),
};
