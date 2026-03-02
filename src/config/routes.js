import Dashboard from '../components/menties/pages/Dashboard';
import MySessions from '../components/menties/pages/MySessions';
import Mentors from '../components/menties/pages/Mentors';
import Profile from '../components/menties/pages/Profile';
import MentorDetails from '../components/menties/pages/MentorDetails';
import MentorProfile from '../components/menties/pages/MentorProfile';
import BookSession from '../components/menties/pages/BookSession';
import BookingSuccess from '../components/menties/pages/BookingSuccess';
import Feedback from '../components/menties/pages/Feedback';
import SessionRequests from '../components/menties/pages/SessionRequests';
import MentorImpactDashboard from '../components/mentors/pages/ImpactDashboard';
import MentorSessions from '../components/mentors/pages/MySessions';
import MentorSessionRequests from '../components/mentors/pages/SessionRequests';
import MentorAvailability from '../components/mentors/pages/ManageAvailability';
import MentorMyprofilePage from '../components/mentors/pages/Myprofile';
import SessionRecords from '../components/shared/SessionRecords';
import { Home, Calendar, Users, User, FileText, ClipboardList } from 'lucide-react';

export const navRoutes = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: Home,
    component: Dashboard,
    active: true,
    roles: ['menties'],
  },
  {
    label: 'My Sessions',
    path: '/my-sessions',
    icon: Calendar,
    component: MySessions,
    roles: ['menties'],
  },
  {
    label: 'Session Requested',
    path: '/session-requests',
    icon: ClipboardList,
    component: SessionRequests,
    roles: ['menties'],
  },
  {
    label: 'Mentors',
    path: '/mentors',
    icon: Users,
    component: Mentors,
    roles: ['menties'],
  },
  {
    label: 'Session Records',
    path: '/session-records',
    icon: FileText,
    component: SessionRecords,
    roles: ['menties'],
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: User,
    component: Profile,
    roles: ['menties'],
  },
  {
    label: 'Mentor Details',
    path: '/mentor-details',
    component: MentorDetails,
    roles: ['menties'],
    sidebar: false,
  },
  {
    label: 'Mentor Profile',
    path: '/mentor-profile',
    component: MentorProfile,
    roles: ['menties'],
    sidebar: false,
  },
  {
    label: 'Book Session',
    path: '/book-session',
    component: BookSession,
    roles: ['menties'],
    sidebar: false,
  },
  {
    label: 'Booking Success',
    path: '/booking-success',
    component: BookingSuccess,
    roles: ['menties'],
    sidebar: false,
  },
  {
    label: 'Feedback',
    path: '/feedback',
    component: Feedback,
    roles: ['menties'],
    sidebar: false,
  },
  {
    label: 'Dashboard',
    path: '/mentor-dashboard',
    icon: Home,
    component: MentorImpactDashboard,
    roles: ['mentors'],
  },
  {
    label: 'My Sessions',
    path: '/mentor-sessions',
    icon: Calendar,
    component: MentorSessions,
    roles: ['mentors'],
  },
  {
    label: 'Session Requests',
    path: '/mentor-session-requests',
    icon: Calendar,
    component: MentorSessionRequests,
    roles: ['mentors'],
  },
  {
    label: 'Availability',
    path: '/mentor-availability',
    icon: Calendar,
    component: MentorAvailability,
    roles: ['mentors'],
  },
  {
    label: 'Session Records',
    path: '/mentor-session-records',
    icon: FileText,
    component: SessionRecords,
    roles: ['mentors'],
  },
  {
    label: 'Profile',
    path: '/mentor-myprofile',
    icon: User,
    component: MentorMyprofilePage,
    roles: ['mentors'],
  },
];

export const getRoutesForLayout = (role, { sidebarOnly = false } = {}) => {
  if (!role) return navRoutes;
  const routes = navRoutes.filter((route) => !route.roles || route.roles.includes(role));
  if (sidebarOnly) return routes.filter((route) => route.sidebar !== false);
  return routes;
};
