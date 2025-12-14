import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { EditorWorkspace } from './components/EditorWorkspace';
import { ViewMode, User } from './types';

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewMode>(ViewMode.AUTH);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setView(ViewMode.DASHBOARD);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && view === ViewMode.AUTH) {
        setView(ViewMode.DASHBOARD);
      } else if (!session) {
        setView(ViewMode.AUTH);
      }
    });

    return () => subscription.unsubscribe();
  }, [view]);

  const handleLogin = (sessionData: any) => {
    setSession(sessionData);
    setView(ViewMode.DASHBOARD);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView(ViewMode.AUTH);
    setSession(null);
  };

  const handleJoinRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setView(ViewMode.EDITOR);
  };

  const handleLeaveRoom = () => {
    setCurrentRoomId(null);
    setView(ViewMode.DASHBOARD);
  };

  if (loading) {
    return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  // View Routing
  if (!session) {
    return <Auth onLogin={handleLogin} />;
  }

  if (view === ViewMode.DASHBOARD) {
    return (
      <Dashboard 
        user={{ 
          id: session.user.id, 
          name: session.user.email || 'User', 
          email: session.user.email,
          color: '#3b82f6' 
        }} 
        onJoinRoom={handleJoinRoom}
        onLogout={handleLogout}
      />
    );
  }

  if (view === ViewMode.EDITOR && currentRoomId) {
    return (
      <EditorWorkspace 
        roomId={currentRoomId}
        currentUser={{ 
          id: session.user.id, 
          name: session.user.email || 'User', 
          email: session.user.email,
          color: '#3b82f6' 
        }} 
        onLeave={handleLeaveRoom}
      />
    );
  }

  return <div>Error: Unknown State</div>;
};

export default App;