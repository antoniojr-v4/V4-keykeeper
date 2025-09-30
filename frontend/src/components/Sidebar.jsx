import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FolderLock, History, Clock, Upload, LogOut, Settings, ChevronLeft, ChevronRight, Shield, HelpCircle } from 'lucide-react';
import { AuthContext } from '@/App';

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard', testId: 'sidebar-menu-dashboard' },
    { path: '/vaults', icon: FolderLock, label: 'Vaults', testId: 'sidebar-menu-vaults' },
    { path: '/jit', icon: Clock, label: 'JIT Requests', testId: 'sidebar-menu-jit' },
    { path: '/breakglass', icon: Shield, label: 'Break-Glass', testId: 'sidebar-menu-breakglass', adminOnly: true },
    { path: '/audit', icon: History, label: 'Audit Logs', testId: 'sidebar-menu-audit' },
    { path: '/import', icon: Upload, label: 'Import', testId: 'sidebar-menu-import' },
    { path: '/help', icon: HelpCircle, label: 'Help', testId: 'sidebar-menu-help' },
  ];

  return (
    <div className={`bg-[#1e1e1e] min-h-screen flex flex-col text-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-6 border-b border-[#2d2d2d] flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_keykeeper-9/artifacts/vspn4e79_Canecas.png" 
              alt="V4 Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold">V4 KeyKeeper</h1>
          </div>
        )}
        {isCollapsed && (
          <img 
            src="https://customer-assets.emergentagent.com/job_keykeeper-9/artifacts/vspn4e79_Canecas.png" 
            alt="V4 Logo" 
            className="w-8 h-8 mx-auto"
          />
        )}
      </div>

      {/* Toggle Button */}
      <div className="px-4 py-3 border-b border-[#2d2d2d] flex justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          data-testid="toggle-sidebar-btn"
          className="p-2 rounded-lg hover:bg-[#2d2d2d] transition-colors text-gray-300"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          // Hide admin-only items if not admin/manager
          if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'manager') {
            return null;
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={item.testId}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#ff2c2c] text-white'
                  : 'text-gray-300 hover:bg-[#2d2d2d] hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings Button */}
      {(user?.role === 'admin' || user?.role === 'manager') && (
        <div className="p-4 border-t border-[#2d2d2d]">
          <Link
            to="/settings"
            data-testid="settings-btn"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/settings'
                ? 'bg-[#ff2c2c] text-white'
                : 'text-gray-300 hover:bg-[#2d2d2d] hover:text-white'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Settings' : ''}
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium">Settings</span>}
          </Link>
        </div>
      )}

      {/* Logout Button */}
      <div className="p-4 border-t border-[#2d2d2d]">
        <button
          onClick={logout}
          data-testid="logout-btn"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-[#2d2d2d] hover:text-white w-full ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 text-xs text-gray-500 border-t border-[#2d2d2d]">
          <p>V4 Company © 2025</p>
          <p className="mt-1">Secure Password Manager</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;