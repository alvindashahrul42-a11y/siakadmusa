import { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { getMenuItemByPath } from '../constants/menuItems';

export default function DashboardLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { menuItem } = getMenuItemByPath(location.pathname);
  const isHomePage   = location.pathname === '/dashboard';
  const pageTitle    = menuItem?.title || 'Dashboard';
  const pageDesc     = isHomePage ? 'Selamat datang kembali!' : `Kelola ${pageTitle.toLowerCase()}`;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Sidebar (desktop inline + mobile drawer) */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm flex-shrink-0">
          <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
            {/* Left: hamburger (mobile) + page title */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
                aria-label="Buka menu"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="min-w-0">
                <h2 className="text-lg md:text-2xl font-bold text-gray-800 truncate">{pageTitle}</h2>
                <p className="text-xs md:text-sm text-gray-500 hidden sm:block">{pageDesc}</p>
              </div>
            </div>

            {/* Right: user info */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 md:gap-3 hover:bg-gray-50 px-2 md:px-3 py-2 rounded-lg transition"
              >
                {/* Name — hidden on xs */}
                <div className="text-right hidden sm:block">
                  <div className="font-semibold text-gray-800 text-sm truncate max-w-[120px] md:max-w-none">
                    {user?.profile?.full_name || user?.username}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                </div>
                {/* Avatar */}
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {/* Show name on mobile since it's hidden in header */}
                  <div className="sm:hidden px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="font-semibold text-gray-800 text-sm">{user?.profile?.full_name || user?.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
