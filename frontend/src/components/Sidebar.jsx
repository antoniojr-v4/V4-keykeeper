import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderLock, History, Clock, Upload, LogOut } from 'lucide-react';
import { AuthContext } from '@/App';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard', testId: 'sidebar-menu-dashboard' },
    { path: '/vaults', icon: FolderLock, label: 'Vaults', testId: 'sidebar-menu-vaults' },
    { path: '/jit', icon: Clock, label: 'JIT Requests', testId: 'sidebar-menu-jit' },
    { path: '/audit', icon: History, label: 'Audit Logs', testId: 'sidebar-menu-audit' },
    { path: '/import', icon: Upload, label: 'Import', testId: 'sidebar-menu-import' },
  ];

  return (
    <div className="w-64 bg-[#1e1e1e] min-h-screen flex flex-col text-white">
      {/* Logo */}
      <div className="p-6 border-b border-[#2d2d2d]">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FolderLock className="w-6 h-6 text-[#10b981]" />
          <span>V4 KeyKeeper</span>
        </h1>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={item.testId}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#10b981] text-white'
                  : 'text-gray-300 hover:bg-[#2d2d2d] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-[#2d2d2d]">
        <button
          onClick={logout}
          data-testid="logout-btn"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-[#2d2d2d] hover:text-white w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 text-xs text-gray-500 border-t border-[#2d2d2d]">
        <p>V4 Company © 2025</p>
        <p className="mt-1">Secure Password Manager</p>
      </div>
    </div>
  );
};

export default Sidebar;