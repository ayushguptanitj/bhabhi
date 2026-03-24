import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, FileText, Users, Star, Calendar,
  LogOut, Microscope, ChevronRight, Bell
} from 'lucide-react';

const roleNavItems = {
  author: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/submit', icon: FileText, label: 'Submit Paper' },
    { to: '/my-papers', icon: Star, label: 'My Papers' },
  ],
  chairperson: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/papers', icon: FileText, label: 'All Papers' },
    { to: '/reviewers', icon: Users, label: 'Reviewers' },
    { to: '/schedule', icon: Calendar, label: 'Schedule' },
  ],
  reviewer: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/assigned', icon: Microscope, label: 'Assigned Papers' },
    { to: '/my-reviews', icon: Star, label: 'My Reviews' },
  ],
};

const roleColors = {
  author: 'from-purple-500 to-indigo-600',
  chairperson: 'from-amber-500 to-orange-600',
  reviewer: 'from-teal-500 to-cyan-600',
};

const roleLabels = {
  author: 'Author',
  chairperson: 'Chairperson',
  reviewer: 'Reviewer',
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = roleNavItems[user?.role] || [];
  const colorClass = roleColors[user?.role] || 'from-blue-500 to-blue-600';

  return (
    <aside className="w-64 min-h-screen flex flex-col glass border-r border-white/[0.08] shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-apple-blue to-blue-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">ConferenceMS</h1>
            <p className="text-apple-gray-500 text-[10px]">Management System</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-lg`}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gradient-to-r ${colorClass} text-white`}>
              {roleLabels[user?.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-apple-xs text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-apple-blue/20 text-apple-blue border border-apple-blue/30'
                  : 'text-apple-gray-400 hover:text-white hover:bg-white/[0.06]'
              }`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
            <ChevronRight size={12} className="ml-auto opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/[0.08]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-apple-xs text-sm font-medium text-apple-gray-400 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-150"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
