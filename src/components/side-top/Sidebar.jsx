import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { getRoutesForLayout } from '../../config/routes';
import { menteeApi } from '../../apis/api/menteeApi';
import { mentorApi } from '../../apis/api/mentorApi';
import { useMenteeAuth } from '../../apis/apihook/useMenteeAuth';
import { getAuthSession, mapAppRoleToUiRole } from '../../apis/api/storage';
import {
  X,
  LogOut,
  ChevronRight,
  Globe,
  Clock,
  RefreshCw,
  Sparkles
} from 'lucide-react';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) {
    const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return base ? `${base}${value}` : value;
  }
  return value;
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
  const [menteeAvatar, setMenteeAvatar] = useState('');
  const [mentorAvatar, setMentorAvatar] = useState('');
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
  const displayName = role === 'mentors' ? mentorName || 'Mentor' : menteeName || 'User';
  const displayAvatar = role === 'mentors' ? mentorAvatar : menteeAvatar;

  const loadMatchContext = async () => {
    if (role === 'mentors') return;
    const auth = getAuthSession();
    if (!auth?.email) return;

    try {
      const mentees = normalizeList(await menteeApi.getMentees({ email: auth.email }));
      const currentMentee = mentees[0] || null;

      setMenteeName(currentMentee?.first_name || '');
      setMenteeAvatar(resolveMediaUrl(currentMentee?.avatar || currentMentee?.profile_photo || ''));
      setMenteeId(currentMentee?.id ?? null);

      if (!currentMentee?.id) {
        setLatestRequest(null);
        setMatchLanguage('Not provided');
        setMatchAvailability('Not provided');
        setMenteeAvatar('');
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
      setMenteeAvatar('');
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
          setMentorAvatar(resolveMediaUrl(currentMentor?.profile_photo || currentMentor?.avatar || ''));
        } catch {
          setMentorName('');
          setMentorAvatar('');
        }
      };
      loadMentorContext();
    } else {
      loadMatchContext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (role !== 'mentors') return undefined;

    const handleMentorAvatarUpdated = (event) => {
      const nextAvatar = resolveMediaUrl(event?.detail?.avatar || '');
      if (!nextAvatar) return;
      setMentorAvatar(nextAvatar);
    };

    window.addEventListener('mentor:avatar-updated', handleMentorAvatarUpdated);
    return () => {
      window.removeEventListener('mentor:avatar-updated', handleMentorAvatarUpdated);
    };
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
    {/* Mobile Overlay */}
    <div
      className={`fixed inset-0 bg-[#5D3699]/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
      aria-hidden="true"
    />

    {/* Sidebar */}
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] sm:w-[300px] lg:w-[260px] bg-white border-r border-[#e5e7eb] flex flex-col h-screen transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
        <img
          src={logo}
          alt="Bond Room"
          className="w-[70px] h-[60px] object-contain"
        />
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#5D3699] transition-colors hover:bg-[#ede9fe]"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#f5f3ff] text-[#5D3699] font-semibold text-lg">
            {displayAvatar ? (
              <img src={displayAvatar} alt={`${displayName} profile`} className="h-full w-full object-cover" />
            ) : (
              displayName?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#6b7280]">Good Morning</p>
            <p className="text-base font-semibold text-[#111827] truncate">
              {displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
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
                    `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#5D3699] text-white shadow-md shadow-[#5D3699]/20'
                        : 'text-[#6b7280] hover:bg-[#f5f3ff] hover:text-[#5D3699]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-[#9ca3af] group-hover:text-[#5D3699]'
                      }`} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-white/70" />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Logout Button */}
        <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
          <button
            type="button"
            onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#6b7280] transition-all duration-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Match Info Card (for mentees only) */}
      {role !== 'mentors' && (
        <div className="p-4 border-t border-[#e5e7eb]">
          <div className="rounded-2xl bg-[#f5f3ff] p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5D3699]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-[#111827]">
                Why these matches?
              </h3>
            </div>
            
            <p className="mt-2 text-xs text-[#6b7280] leading-relaxed">
              Our AI analyzed your recent input to find mentors best suited to support your needs.
            </p>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
                  <Globe className="h-3.5 w-3.5 text-[#5D3699]" />
                </div>
                <span>{matchLanguage}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
                  <Clock className="h-3.5 w-3.5 text-[#5D3699]" />
                </div>
                <span>{matchAvailability}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefreshSuggestions}
              disabled={refreshingMatch}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-medium text-[#5D3699] ring-1 ring-[#5D3699]/20 transition-all hover:bg-[#5D3699] hover:text-white disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshingMatch ? 'animate-spin' : ''}`} />
              {refreshingMatch ? 'Refreshing...' : 'Refresh Suggestions'}
            </button>

            {refreshMessage && (
              <p className={`mt-2 text-[11px] text-center ${
                refreshMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'
              }`}>
                {refreshMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </aside>

    {/* Logout Modal */}
    {showLogout && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#5D3699]/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <LogOut className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Log out?</h2>
              <p className="text-sm text-[#6b7280]">You'll need to sign in again.</p>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-[#6b7280]">
            Are you sure you want to log out of Bond Room?
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLogout(false)}
              className="flex-1 rounded-xl bg-[#f5f3ff] px-4 py-2.5 text-sm font-medium text-[#5D3699] transition-all hover:bg-[#ede9fe]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Logging out...
                </>
              ) : (
                'Logout'
              )}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};

export default Sidebar;
