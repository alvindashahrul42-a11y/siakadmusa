import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logoSmk from '../assets/logo-smk.png';
import { getFilteredMenuGroups, getMenuItemByPath } from '../constants/menuItems';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuGroups = getFilteredMenuGroups(user?.role);
  const { menuItem: activeMenuItem, groupName: activeGroupName } = getMenuItemByPath(location.pathname);

  // Track which groups are expanded; default open the group that contains the active route
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (activeGroupName) initial[activeGroupName] = true;
    return initial;
  });

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside
      className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Logo + toggle */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img
                src={logoSmk}
                alt="Logo SMK"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold">SMK Muh. Sempor</h1>
                <p className="text-xs text-gray-400">SIAKAD</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg"
            aria-label={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="space-y-1">
          {menuGroups.map((group) => {
            const GroupIcon = group.icon;

            // ── Standalone item (Dashboard / Pengaturan) ──────────────────
            if (!group.children) {
              const isActive = activeMenuItem?.name === group.name;
              return (
                <button
                  key={group.name}
                  onClick={() => navigate(group.href!)}
                  title={!sidebarOpen ? group.title : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <GroupIcon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{group.title}</span>}
                </button>
              );
            }

            // ── Group dengan children ─────────────────────────────────────
            const isExpanded = !!expandedGroups[group.name];
            const hasActiveChild = activeGroupName === group.name;

            return (
              <div key={group.name}>
                {/* Parent button */}
                <button
                  onClick={() => sidebarOpen && toggleGroup(group.name)}
                  title={!sidebarOpen ? group.title : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    hasActiveChild && !isExpanded
                      ? 'bg-gray-700 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <GroupIcon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="text-sm font-semibold flex-1 text-left">
                        {group.title}
                      </span>
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 shrink-0" />
                        : <ChevronRight className="w-4 h-4 shrink-0" />}
                    </>
                  )}
                </button>

                {/* Children */}
                {sidebarOpen && isExpanded && (
                  <div className="mt-1 ml-4 pl-3 border-l border-gray-700 space-y-1">
                    {group.children!.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = activeMenuItem?.name === item.name;
                      return (
                        <button
                          key={item.name}
                          onClick={() => navigate(item.href)}
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

                {/* Collapsed: show active child indicator dot */}
                {!sidebarOpen && hasActiveChild && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 mx-auto -mt-1 mb-1" />
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
