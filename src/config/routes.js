import Dashboard from '../components/pages/Dashboard';
import MySessions from '../components/pages/MySessions';
import Mentors from '../components/pages/Mentors';
import Profile from '../components/pages/Profile';
import { Home, Calendar, Users, User } from 'lucide-react';

export const navRoutes = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: Home,
    component: Dashboard,
    active: true,
  },
  {
    label: 'My Sessions',
    path: '/my-sessions',
    icon: Calendar,
    component: MySessions,
  },
  {
    label: 'Mentors',
    path: '/mentors',
    icon: Users,
    component: Mentors,
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: User,
    component: Profile,
  },
];

export const getRoutesForLayout = () => navRoutes;
