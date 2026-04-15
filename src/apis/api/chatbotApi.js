import { apiClient } from './client';

export const chatbotApi = {
  respond: ({ message, history = [] }) =>
    apiClient.post(
      '/chatbot/respond/',
      {
        message,
        history,
      },
      { auth: false }
    ),
};

