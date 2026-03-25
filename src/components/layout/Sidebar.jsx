import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Brain, Search, Network, Folder, LogOut, Plus, HelpCircle, MessageSquare } from 'lucide-react';
import AddItemModal from '../AddItemModal';

export default function Sidebar({ isOpen, onClose }) {
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
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-zinc-100" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Second Brain</span>
        </div>

        <div className="px-4 mb-6 mt-6 md:mt-0">
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              onClose?.();
            }}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Content
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
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

        <div className="p-4 border-t border-zinc-800 mt-auto">
          <div className="flex items-center gap-3 mb-4 px-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 bg-zinc-800 rounded-full flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{user?.displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              onClose?.();
            }}
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
