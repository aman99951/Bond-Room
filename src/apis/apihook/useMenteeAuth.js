import { useCallback, useState } from 'react';
import { authApi } from '../api/authApi';
import {
  clearAuthSession,
  decodeJwtPayload,
  getAuthSession,
  setAuthSession,
} from '../api/storage';

export const useMenteeAuth = () => {
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

  const registerMentee = useCallback(
    (payload) =>
      run(async () => {
        return authApi.registerMentee(payload);
      }),
    [run]
  );

  const sendParentOtp = useCallback(
    (menteeId, parentMobile) =>
      run(async () =>
        authApi.sendParentOtp({
          mentee_id: menteeId,
          parent_mobile: parentMobile || '',
        })
      ),
    [run]
  );

  const verifyParentOtp = useCallback(
    (menteeId, otp) =>
      run(async () =>
        authApi.verifyParentOtp({
          mentee_id: menteeId,
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
    registerMentee,
    sendParentOtp,
    verifyParentOtp,
    login,
    logout,
  };
};
