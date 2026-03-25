import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Brain, Search, Network, Folder, LogOut, Plus, HelpCircle, MessageSquare } from 'lucide-react';
import AddItemModal from '../AddItemModal';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const navItems = [
    { to: '/', icon: Brain, label: 'Dashboard' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/chat', icon: MessageSquare, label: 'AI Assistant' },
    { to: '/graph', icon: Network, label: 'Knowledge Graph' },
    { to: '/collections', icon: Folder, label: 'Collections' },
    { to: '/help', icon: HelpCircle, label: 'Help & Guide' },
  ];

  return (
    <>
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-zinc-100" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Second Brain</span>
        </div>

        <div className="px-4 mb-6">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Content
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 bg-zinc-800 rounded-full" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{user?.displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {isAddModalOpen && (
        <AddItemModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </>
  );
}
