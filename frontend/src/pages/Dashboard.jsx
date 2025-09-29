import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiClient } from '@/App';
import { FolderLock, Key, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, setUser } = useContext(AuthContext);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/stats/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeMeAdmin = async () => {
    try {
      const response = await apiClient.post('/admin/make-me-admin');
      toast.success(response.data.message);
      
      // Update user in context
      const userResponse = await apiClient.get('/auth/me');
      setUser(userResponse.data);
      
      // Reload page to show admin features
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error making admin:', error);
      toast.error('Failed to update role');
    }
  };

  const statCards = [
    {
      title: 'Total Vaults',
      value: stats?.total_vaults || 0,
      icon: FolderLock,
      color: 'bg-blue-500',
      testId: 'stat-total-vaults'
    },
    {
      title: 'Total Items',
      value: stats?.total_items || 0,
      icon: Key,
      color: 'bg-[#ff2c2c]',
      testId: 'stat-total-items'
    },
    {
      title: 'Expiring Soon',
      value: stats?.expiring_soon || 0,
      icon: AlertCircle,
      color: 'bg-[#f59e0b]',
      testId: 'stat-expiring-soon'
    },
    {
      title: 'Pending JIT',
      value: stats?.pending_jit_requests || 0,
      icon: Clock,
      color: 'bg-[#ef4444]',
      testId: 'stat-pending-jit'
    }
  ];

  const quickAccessCards = [
    { title: 'Manage Vaults', description: 'Create and organize password vaults', link: '/vaults', icon: FolderLock, testId: 'quick-access-vaults' },
    { title: 'JIT Requests', description: 'Approve or deny temporary access', link: '/jit', icon: Clock, testId: 'quick-access-jit' },
    { title: 'Audit Logs', description: 'View security audit trail', link: '/audit', icon: AlertCircle, testId: 'quick-access-audit' },
  ];

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      
      <div className="flex-1">
        <Header 
          title="Dashboard" 
          description="Overview of your password management system"
        />
        
        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div 
                key={index} 
                data-testid={stat.testId}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#e5e7eb] hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#1f2937] mb-1">{stat.value}</p>
                  <p className="text-sm text-[#6b7280]">{stat.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Access */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#1f2937] mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickAccessCards.map((card, index) => (
                <Link
                  key={index}
                  to={card.link}
                  data-testid={card.testId}
                  className="bg-white rounded-xl p-6 shadow-sm border border-[#e5e7eb] hover:border-[#ff2c2c] hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 bg-[#ff2c2c]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#ff2c2c] transition-colors">
                    <card.icon className="w-6 h-6 text-[#ff2c2c] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-[#1f2937] mb-2">{card.title}</h3>
                  <p className="text-sm text-[#6b7280]">{card.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-bold text-[#1f2937] mb-4">Recent Activity</h2>
            <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-[#6b7280]">Loading...</div>
              ) : stats?.recent_activity?.length > 0 ? (
                <div className="divide-y divide-[#e5e7eb]">
                  {stats.recent_activity.map((log, index) => (
                    <div 
                      key={index} 
                      data-testid={`recent-activity-${index}`}
                      className="p-4 hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#1f2937]">{log.event_type.replace(/_/g, ' ').toUpperCase()}</p>
                          <p className="text-xs text-[#6b7280] mt-1">{log.user_email}</p>
                        </div>
                        <p className="text-xs text-[#9ca3af]">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-[#e5e7eb] mx-auto mb-3" />
                  <p className="text-[#6b7280]">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
