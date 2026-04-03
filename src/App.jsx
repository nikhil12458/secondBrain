import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { useFeatures } from './hooks/useFeatures';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import GraphView from './pages/GraphView';
import Search from './pages/Search';
import Chat from './pages/Chat';
import Collections from './pages/Collections';
import PublicCollection from './pages/PublicCollection';
import Login from './pages/Login';
import Help from './pages/Help';
import Journal from './pages/Journal';
import ItemDetail from './pages/ItemDetail';
import AdminPanel from './pages/AdminPanel';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function FeatureRoute({ children, feature }) {
  const { isFeatureEnabled } = useFeatures();
  if (!isFeatureEnabled(feature)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/c/:collectionId" element={<FeatureRoute feature="publicCollections"><PublicCollection /></FeatureRoute>} />
            <Route path="/shared/item/:itemId" element={<ItemDetail />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="item/:itemId" element={<ItemDetail />} />
              <Route path="graph" element={<GraphView />} />
              <Route path="search" element={<Search />} />
              <Route path="chat" element={<FeatureRoute feature="aiChat"><Chat /></FeatureRoute>} />
              <Route path="journal" element={<FeatureRoute feature="voiceJournal"><Journal /></FeatureRoute>} />
              <Route path="collections" element={<Collections />} />
              <Route path="help" element={<Help />} />
              <Route path="malik-admin" element={<AdminPanel />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
