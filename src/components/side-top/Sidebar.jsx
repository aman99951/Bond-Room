import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { getRoutesForLayout } from '../../config/routes';
import { menteeApi } from '../../apis/api/menteeApi';
import { mentorApi } from '../../apis/api/mentorApi';
import { useMenteeAuth } from '../../apis/apihook/useMenteeAuth';
import { getAuthSession, mapAppRoleToUiRole } from '../../apis/api/storage';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const summarizeAvailability = (preferredTimes) => {
  const entries = Array.isArray(preferredTimes) ? preferredTimes : [];
  const days = [...new Set(entries.map((item) => item?.day).filter(Boolean))];
  if (!days.length) return 'Not provided';

  const weekdaySet = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const weekendSet = new Set(['Saturday', 'Sunday']);

  const allWeekdays = days.every((day) => weekdaySet.has(day));
  if (allWeekdays) return 'Weekdays';

  const allWeekends = days.every((day) => weekendSet.has(day));
  if (allWeekends) return 'Weekends';

  if (days.length <= 2) return days.join(', ');
  return `${days.length} days selected`;
};

const Sidebar = ({ isOpen, onClose }) => {
  const [showLogout, setShowLogout] = useState(false);
  const [menteeName, setMenteeName] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [menteeId, setMenteeId] = useState(null);
  const [latestRequest, setLatestRequest] = useState(null);
  const [matchLanguage, setMatchLanguage] = useState('Not provided');
  const [matchAvailability, setMatchAvailability] = useState('Not provided');
  const [refreshingMatch, setRefreshingMatch] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const navigate = useNavigate();
  const { logout, loading } = useMenteeAuth();
  const { pathname } = useLocation();
  const role = (() => {
    const authRole = mapAppRoleToUiRole(getAuthSession()?.role);
    if (authRole) return authRole;
    try {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole) return storedRole;
    } catch {
      // ignore storage errors
    }
    const matchedRoute = getRoutesForLayout().find((route) => route.path === pathname);
    if (matchedRoute?.roles?.[0]) return matchedRoute.roles[0];
    if (pathname.startsWith('/mentor-')) return 'mentors';
    return 'menties';
  })();
  const navRoutes = getRoutesForLayout(role, { sidebarOnly: true });

  const loadMatchContext = async () => {
    if (role === 'mentors') return;
    const auth = getAuthSession();
    if (!auth?.email) return;

    try {
      const mentees = normalizeList(await menteeApi.getMentees({ email: auth.email }));
      const currentMentee = mentees[0] || null;

      setMenteeName(currentMentee?.first_name || '');
      setMenteeId(currentMentee?.id ?? null);

      if (!currentMentee?.id) {
        setLatestRequest(null);
        setMatchLanguage('Not provided');
        setMatchAvailability('Not provided');
        return;
      }

      const requests = normalizeList(
        await menteeApi.listMenteeRequests({ mentee_id: currentMentee.id })
      );
      const latest = requests[0] || null;
      setLatestRequest(latest);
      setMatchLanguage(latest?.language || 'Not provided');
      setMatchAvailability(summarizeAvailability(latest?.preferred_times));
    } catch {
      setLatestRequest(null);
      setMatchLanguage('Not provided');
      setMatchAvailability('Not provided');
    }
  };

  useEffect(() => {
    if (role === 'mentors') {
      const loadMentorContext = async () => {
        const auth = getAuthSession();
        if (!auth?.email) return;
        try {
          const mentors = normalizeList(await mentorApi.getMentors({ email: auth.email }));
          const currentMentor = mentors[0] || null;
          setMentorName(currentMentor?.first_name || '');
        } catch {
          setMentorName('');
        }
      };
      loadMentorContext();
    } else {
      loadMatchContext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setShowLogout(false);
      navigate('/login');
    }
  };

  const handleRefreshSuggestions = async () => {
    setRefreshMessage('');

    if (!menteeId || !latestRequest) {
      setRefreshMessage('Complete assessment first to generate matches.');
      return;
    }

    setRefreshingMatch(true);
    try {
      await menteeApi.createRequest({
        feeling: latestRequest?.feeling || '',
        feeling_cause: latestRequest?.feeling_cause || '',
        support_type: latestRequest?.support_type || '',
        comfort_level: latestRequest?.comfort_level || '',
        topics: Array.isArray(latestRequest?.topics) ? latestRequest.topics : [],
        free_text: latestRequest?.free_text || '',
        preferred_times: Array.isArray(latestRequest?.preferred_times)
          ? latestRequest.preferred_times
          : [],
        preferred_format: latestRequest?.preferred_format || '',
        language: latestRequest?.language || '',
        timezone: latestRequest?.timezone || '',
        access_needs: latestRequest?.access_needs || '',
        safety_notes: latestRequest?.safety_notes || '',
        session_mode: latestRequest?.session_mode || 'online',
        allow_auto_match: latestRequest?.allow_auto_match !== false,
        safety_flag: Boolean(latestRequest?.safety_flag),
      });
      await loadMatchContext();
      window.dispatchEvent(new CustomEvent('mentee:recommendations-updated'));
      setRefreshMessage('Suggestions refreshed successfully.');
    } catch (error) {
      setRefreshMessage(error?.message || 'Unable to refresh suggestions right now.');
    } finally {
      setRefreshingMatch(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-[#5D3699]/40 z-40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`w-full md:w-[260px] border-b md:border-r border-gray-100 bg-white md:h-screen z-50 overflow-y-auto ${
          isOpen ? 'fixed inset-y-0 left-0' : 'hidden md:block'
        }`}
      >
      <div className="px-5 py-5 flex items-center justify-between">
        <img src={logo} alt="Bond Room" className="w-[75px] h-[65.5px] object-contain" />
        <button
          className="md:hidden h-8 w-8 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="px-5 pt-2 pb-4">
        <div className="text-[#6b7280]" style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '24px', fontWeight: 400 }}>
          Good Morning
        </div>
        <div className="text-[#111827]" style={{ fontFamily: 'DM Sans', fontSize: '20px', lineHeight: '28px', fontWeight: 600 }}>
          {role === 'mentors' ? mentorName || 'Mentor' : menteeName || 'Rajeswari'}
        </div>
      </div>

      <nav className="px-4">
        <ul className="space-y-1">
          {navRoutes.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md ${
                      isActive ? 'bg-[#eef2ff] text-[#5b2c91]' : 'text-[#6b7280] hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 text-current" />
                  <span style={{ fontFamily: 'Inter', fontSize: '16px', lineHeight: '24px', fontWeight: 500 }}>
                    {item.label}
                  </span>
                </NavLink>
              </li>
            );
          })}
          <li className="pt-1">
            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#6b7280] hover:bg-gray-50"
              onClick={() => setShowLogout(true)}
            >
              <span className="h-4 w-4 text-current">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M14 5h6v14h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>

      {role !== 'mentors' && (
        <div className="px-5 pt-5 mt-6">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="text-sm font-semibold text-[#111827]">Why these matches?</div>
            <p className="mt-1 text-xs text-[#6b7280]">
              Our AI analyzed your recent input to find mentors best suited to support your current needs.
            </p>

            <div className="mt-3 space-y-2 text-xs text-[#6b7280]">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 text-current">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                  </svg>
                </span>
                <span>Language: {matchLanguage}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 text-current">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <span>Availability: {matchAvailability}</span>
              </div>
            </div>

            <button
              className="mt-3 text-xs text-[#5b2c91] underline disabled:opacity-60"
              onClick={handleRefreshSuggestions}
              disabled={refreshingMatch}
            >
              {refreshingMatch ? 'Refreshing Suggestions...' : 'Rematch / Refresh Suggestions'}
            </button>
            {refreshMessage && (
              <div className={`mt-2 text-[11px] ${refreshMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {refreshMessage}
              </div>
            )}
          </div>
        </div>
      )}
      {showLogout && (
        <div className="fixed inset-0 bg-[#5D3699]/40 flex items-center justify-center z-[60]">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-primary">Log out?</h2>
            <p className="mt-2 text-sm text-muted">Are you sure you want to log out of Bond Room?</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-md border border-default px-4 py-2 text-sm text-secondary"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-accent px-4 py-2 text-sm text-on-accent"
                onClick={handleLogout}
                disabled={loading}
              >
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
};

export default Sidebar;
