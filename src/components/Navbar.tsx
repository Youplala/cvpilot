import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const links = [
  { to: '/chat', label: '💬 Chat' },
  { to: '/profile', label: '👤 Profile' },
  { to: '/jobs', label: '💼 Jobs' },
  { to: '/cvs', label: '📄 CVs' },
  { to: '/settings', label: '⚙️ Settings' },
];

export default function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100"
    >
      <div className="max-w-5xl mx-auto px-4 flex items-center h-14 gap-1">
        <NavLink to="/" className="font-bold text-accent-600 text-lg mr-6">
          CVPilot
        </NavLink>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-50 text-accent-700'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </motion.nav>
  );
}
