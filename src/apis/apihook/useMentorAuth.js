import { useCallback, useState } from 'react';
import { authApi } from '../api/authApi';
import {
  clearAuthSession,
  decodeJwtPayload,
  getAuthSession,
  setAuthSession,
} from '../api/storage';

export const useMentorAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async (task) => {
    setLoading(true);
    setError('');
    try {
      return await task();
    } catch (err) {
      const message = err?.message || 'Something went wrong. Please try again.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerMentor = useCallback(
    (payload) =>
      run(async () => {
        return authApi.registerMentor(payload);
      }),
    [run]
  );

  const sendMentorOtp = useCallback(
    (mentorId, channel) =>
      run(async () =>
        authApi.sendMentorOtp({
          mentor_id: mentorId,
          channel,
        })
      ),
    [run]
  );

  const verifyMentorOtp = useCallback(
    (mentorId, channel, otp) =>
      run(async () =>
        authApi.verifyMentorOtp({
          mentor_id: mentorId,
          channel,
          otp,
        })
      ),
    [run]
  );

  const login = useCallback(
    (email, password, selectedRole = null) =>
      run(async () => {
        const tokens = await authApi.login({ email, password });
        const payload = decodeJwtPayload(tokens?.access);
        const role = payload?.role || (selectedRole === 'mentors' ? 'mentor' : 'mentee');
        if (selectedRole) {
          const appRole = selectedRole === 'mentors' ? 'mentor' : 'mentee';
          if (role !== appRole) {
            throw new Error(`This account is registered as ${role}, not ${appRole}.`);
          }
        }
        return setAuthSession({
          accessToken: tokens?.access,
          refreshToken: tokens?.refresh,
          role,
          email: payload?.email || email,
        });
      }),
    [run]
  );

  const loginWithMobile = useCallback(
    (mobile, otp, selectedRole = null) =>
      run(async () => {
        const requestedRole =
          selectedRole === 'mentors' || selectedRole === 'mentor'
            ? 'mentor'
            : selectedRole === 'menties' || selectedRole === 'mentee'
              ? 'mentee'
              : null;
        const tokens = await authApi.verifyMobileLoginOtp({
          mobile,
          otp,
          role: requestedRole,
        });
        const payload = decodeJwtPayload(tokens?.access);
        const role = payload?.role || requestedRole || 'mentor';
        if (requestedRole && role !== requestedRole) {
          throw new Error(`This mobile is registered as ${role}, not ${requestedRole}.`);
        }
        return setAuthSession({
          accessToken: tokens?.access,
          refreshToken: tokens?.refresh,
          role,
          email: payload?.email || '',
        });
      }),
    [run]
  );

  const logout = useCallback(
    () =>
      run(async () => {
        const session = getAuthSession();
        try {
          if (session?.accessToken) {
            await authApi.logout();
          }
        } finally {
          clearAuthSession();
        }
      }),
    [run]
  );

  return {
    auth: getAuthSession(),
    loading,
    error,
    registerMentor,
    sendMentorOtp,
    verifyMentorOtp,
    login,
    loginWithMobile,
    logout,
  };
};
