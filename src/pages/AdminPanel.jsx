import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { getAnalytics, getUsers, updateUserRole, updateUserDisabledFeatures, updateUserPermissions, getSettings, updateSettings, deleteUserDocument } from '../services/db';
import { Shield, Users, Activity, Settings, Check, X, Trash2 } from 'lucide-react';

const AdminPanel = () => {
  const { userDetails, loading } = useAuth();
  const [analytics, setAnalytics] = useState({ count: 0 });
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({ features: {} });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (userDetails?.role === 'admin') {
      loadData();
    }
  }, [userDetails]);

  const loadData = async () => {
    try {
      const [analyticsData, usersData, settingsData] = await Promise.all([
        getAnalytics(),
        getUsers(),
        getSettings()
      ]);
      setAnalytics(analyticsData);
      setUsers(usersData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  
  if (!userDetails || userDetails.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role');
    }
  };

  const handleGlobalFeatureToggle = async (feature) => {
    try {
      const newFeatures = { ...settings.features, [feature]: !settings.features[feature] };
      await updateSettings({ features: newFeatures });
      setSettings({ ...settings, features: newFeatures });
    } catch (error) {
      console.error('Failed to update global feature:', error);
      alert('Failed to update global feature');
    }
  };

  const handleUserFeatureToggle = async (userId, feature) => {
    try {
      const user = users.find(u => u.id === userId);
      const disabledFeatures = user.disabledFeatures || [];
      
      let newDisabledFeatures;
      if (disabledFeatures.includes(feature)) {
        newDisabledFeatures = disabledFeatures.filter(f => f !== feature);
      } else {
        newDisabledFeatures = [...disabledFeatures, feature];
      }
      
      await updateUserDisabledFeatures(userId, newDisabledFeatures);
      setUsers(users.map(u => u.id === userId ? { ...u, disabledFeatures: newDisabledFeatures } : u));
    } catch (error) {
      console.error('Failed to update user feature:', error);
      alert('Failed to update user feature');
    }
  };

  const handleUserPermissionToggle = async (userId, permission) => {
    try {
      const user = users.find(u => u.id === userId);
      const permissions = user.permissions || [];
      
      let newPermissions;
      if (permissions.includes(permission)) {
        newPermissions = permissions.filter(p => p !== permission);
      } else {
        newPermissions = [...permissions, permission];
      }
      
      await updateUserPermissions(userId, newPermissions);
      setUsers(users.map(u => u.id === userId ? { ...u, permissions: newPermissions } : u));
    } catch (error) {
      console.error('Failed to update user permission:', error);
      alert('Failed to update user permission');
    }
  };

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUserDocument(userToDelete);
      setUsers(users.filter(u => u.id !== userToDelete));
      setUserToDelete(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const availableFeatures = ['aiChat', 'voiceJournal', 'publicCollections'];
  const availablePermissions = ['manage_users', 'manage_features', 'view_analytics'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
          <Shield className="w-8 h-8 text-indigo-500" />
          Admin Panel
        </h1>
        <p className="text-zinc-400 mt-2">Manage users, features, and view analytics.</p>
      </div>

      <div className="flex border-b border-zinc-800 mb-8">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-4 px-6 font-medium text-sm focus:outline-none ${activeTab === 'dashboard' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          <div className="flex items-center gap-2"><Activity className="w-4 h-4" /> Dashboard</div>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-4 px-6 font-medium text-sm focus:outline-none ${activeTab === 'users' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Users</div>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-4 px-6 font-medium text-sm focus:outline-none ${activeTab === 'settings' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          <div className="flex items-center gap-2"><Settings className="w-4 h-4" /> Global Settings</div>
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-800">
            <h3 className="text-lg font-medium text-zinc-100 mb-2">Total Visitors</h3>
            <p className="text-4xl font-bold text-indigo-400">{analytics.count}</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-800">
            <h3 className="text-lg font-medium text-zinc-100 mb-2">Total Users</h3>
            <p className="text-4xl font-bold text-indigo-400">{users.length}</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-zinc-900 shadow-sm rounded-xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Role & Permissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Feature Access</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {u.photoURL ? (
                            <img className="h-10 w-10 rounded-full" src={u.photoURL} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 font-bold">
                              {u.displayName?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-zinc-100">{u.displayName}</div>
                          <div className="text-sm text-zinc-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.email === 'ektak144@gmail.com'}
                        className="mb-3 block w-full pl-3 pr-10 py-2 text-base bg-zinc-800 border-zinc-700 text-zinc-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      
                      {u.role === 'admin' && (
                        <div className="flex flex-col gap-1 mt-2 border-t border-zinc-800 pt-2">
                          <span className="text-xs text-zinc-400 font-medium mb-1">Admin Permissions:</span>
                          {availablePermissions.map(permission => {
                            const hasPermission = (u.permissions || []).includes(permission);
                            return (
                              <label key={permission} className="flex items-center gap-2 text-xs text-zinc-300">
                                <input
                                  type="checkbox"
                                  checked={hasPermission}
                                  onChange={() => handleUserPermissionToggle(u.id, permission)}
                                  disabled={u.email === 'ektak144@gmail.com'}
                                  className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 h-3 w-3"
                                />
                                {permission.replace('_', ' ')}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {availableFeatures.map(feature => {
                          const isDisabled = (u.disabledFeatures || []).includes(feature);
                          return (
                            <label key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                              <input
                                type="checkbox"
                                checked={!isDisabled}
                                onChange={() => handleUserFeatureToggle(u.id, feature)}
                                className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
                              />
                              {feature}
                            </label>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.email === 'ektak144@gmail.com'}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-md hover:bg-zinc-800 transition-colors"
                        title="Delete User Record"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-800 max-w-2xl">
          <h3 className="text-lg font-medium text-zinc-100 mb-4">Global Feature Flags</h3>
          <p className="text-sm text-zinc-400 mb-6">Enable or disable features for all users across the application.</p>
          
          <div className="space-y-4">
            {availableFeatures.map(feature => {
              // Default to true if not explicitly disabled
              const isEnabled = settings.features[feature] !== false;
              
              return (
                <div key={feature} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="font-medium text-zinc-100">{feature}</p>
                    <p className="text-sm text-zinc-400">Toggle {feature} functionality globally.</p>
                  </div>
                  <button
                    onClick={() => handleGlobalFeatureToggle(feature)}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isEnabled ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Delete User</h3>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to delete this user's data record? This action cannot be undone and will remove them from the admin panel.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
