import { apiClient } from './client.js';

export const authApi = {
  registerAdmin: (payload) => apiClient.post('/auth/register/admin/', payload, { auth: false }),
  registerMentee: (payload) => apiClient.post('/auth/register/mentee/', payload, { auth: false }),
  registerMentor: (payload) => apiClient.post('/auth/register/mentor/', payload, { auth: false }),
  sendParentOtp: (payload) => apiClient.post('/auth/parent-consent/send-otp/', payload, { auth: false }),
  verifyParentOtp: (payload) => apiClient.post('/auth/parent-consent/verify-otp/', payload, { auth: false }),
  sendMentorOtp: (payload) => apiClient.post('/auth/mentor-contact/send-otp/', payload, { auth: false }),
  verifyMentorOtp: (payload) => apiClient.post('/auth/mentor-contact/verify-otp/', payload, { auth: false }),
  login: (payload) => apiClient.post('/login/', payload, { auth: false }),
  logout: () => apiClient.post('/auth/logout/', {}),
};
