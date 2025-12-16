import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { EditorWorkspace } from './components/EditorWorkspace';
import { ViewMode, User } from './types';

import { InviteModal } from './components/InviteModal';

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewMode>(ViewMode.AUTH);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const [pendingInviteRoomId, setPendingInviteRoomId] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for room invite
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get('roomId');
    if (inviteId) {
      setPendingInviteRoomId(inviteId);
    }

    // Check configuration first
    if (!isSupabaseConfigured()) {
      setIsConfigured(false);
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setView(prev => prev === ViewMode.AUTH && session ? ViewMode.DASHBOARD : prev);
      setLoading(false);
    }).catch(err => {
      console.error("Supabase session check failed:", err);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        setView(prev => prev === ViewMode.AUTH ? ViewMode.DASHBOARD : prev);
      } else {
        setView(ViewMode.AUTH);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Run once on mount

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
    // Update URL without reloading
    window.history.pushState({}, '', `/?roomId=${roomId}`);
  };

  const handleLeaveRoom = () => {
    setCurrentRoomId(null);
    setView(ViewMode.DASHBOARD);
    // Reset URL
    window.history.pushState({}, '', '/');
  };

  const handleAcceptInvite = () => {
    if (pendingInviteRoomId) {
      handleJoinRoom(pendingInviteRoomId);
      setPendingInviteRoomId(null);
    }
  };

  const handleDeclineInvite = () => {
    setPendingInviteRoomId(null);
    window.history.pushState({}, '', '/');
  };

  if (loading) {
    return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  if (!isConfigured) {
    // ... (This block unchanged, omitted for brevity if simple generic replacement but doing full file for safety)
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white p-4">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-bold mb-4 text-red-500">Configuration Missing</h2>
          <p className="text-gray-300 mb-4">
            Supabase environment variables are missing. Please add the following to your .env file:
          </p>
          <pre className="bg-[#111] p-4 rounded text-left text-sm text-gray-400 overflow-x-auto mb-4">
            VITE_SUPABASE_URL=...{'\n'}
            VITE_SUPABASE_ANON_KEY=...
          </pre>
          <p className="text-xs text-gray-500">
            Check .env.example for reference.
          </p>
        </div>
      </div>
    );
  }

  // View Routing
  if (!session) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <>
      {pendingInviteRoomId && view === ViewMode.DASHBOARD && (
        <InviteModal
          roomId={pendingInviteRoomId}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
        />
      )}

      {view === ViewMode.DASHBOARD && (
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
      )}

      {view === ViewMode.EDITOR && currentRoomId && (
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
      )}
    </>
  );
};

export default App;