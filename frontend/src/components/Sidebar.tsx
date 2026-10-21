import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logoSmk from '../assets/logo-smk.png';
import { getFilteredMenuGroups, getMenuItemByPath } from '../constants/menuItems';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** Mobile: sidebar ditampilkan sebagai drawer overlay */
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, mobileOpen = false, setMobileOpen }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuGroups = getFilteredMenuGroups(user?.role);
  const { menuItem: activeMenuItem, groupName: activeGroupName } = getMenuItemByPath(location.pathname);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (activeGroupName) initial[activeGroupName] = true;
    return initial;
  });

  useEffect(() => {
    if (activeGroupName) {
      setExpandedGroups(prev => ({ ...prev, [activeGroupName]: true }));
    }
  }, [activeGroupName]);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileOpen?.(false);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleNavigate = (href: string) => {
    navigate(href);
    setMobileOpen?.(false);
  };

  const sidebarContent = (collapsed: boolean) => (
    <aside className={`bg-gray-900 text-white flex flex-col h-full ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo + toggle */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <img src={logoSmk} alt="Logo SMK" className="w-10 h-10 object-contain flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm font-bold leading-tight truncate">SMK Muh. Sempor</h1>
                <p className="text-xs text-gray-400">SIAKAD</p>
              </div>
            </div>
          )}
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex p-2 hover:bg-gray-800 rounded-lg flex-shrink-0"
            aria-label={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            {collapsed ? '▶' : '◀'}
          </button>
          {/* Mobile close button */}
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen?.(false)}
              className="md:hidden p-2 hover:bg-gray-800 rounded-lg flex-shrink-0"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        <nav className="space-y-1">
          {menuGroups.map(group => {
            const GroupIcon = group.icon;

            if (!group.children) {
              const isActive = activeMenuItem?.name === group.name;
              return (
                <button
                  key={group.name}
                  onClick={() => handleNavigate(group.href!)}
                  title={collapsed ? group.title : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <GroupIcon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{group.title}</span>}
                </button>
              );
            }

            const isExpanded = !!expandedGroups[group.name];
            const hasActiveChild = activeGroupName === group.name;

            return (
              <div key={group.name}>
                <button
                  onClick={() => !collapsed && toggleGroup(group.name)}
                  title={collapsed ? group.title : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    hasActiveChild && !isExpanded
                      ? 'bg-gray-700 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <GroupIcon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-semibold flex-1 text-left">{group.title}</span>
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 shrink-0" />
                        : <ChevronRight className="w-4 h-4 shrink-0" />}
                    </>
                  )}
                </button>

                {!collapsed && isExpanded && (
                  <div className="mt-1 ml-4 pl-3 border-l border-gray-700 space-y-1">
                    {group.children!.map(item => {
                      const ItemIcon = item.icon;
                      const isActive = activeMenuItem?.name === item.name;
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleNavigate(item.href)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4 shrink-0" />
                          <span>{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {collapsed && hasActiveChild && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 mx-auto -mt-1 mb-1" />
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always in flow */}
      <div className="hidden md:flex h-screen flex-shrink-0">
        {sidebarContent(!sidebarOpen)}
      </div>

      {/* Mobile drawer — overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileOpen?.(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 md:hidden flex">
            {sidebarContent(false)}
          </div>
        </>
      )}
    </>
  );
}
