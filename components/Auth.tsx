import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';

interface AuthProps {
  onLogin: (session: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("Setup Required: Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) onLogin(data.session);
        else setError("Check your email for confirmation link.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin(data.session);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="flex flex-col items-center">
          <Logo className="w-16 h-16 mb-4" />
          <h2 className="text-3xl font-bold tracking-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-2 text-sm text-secondary">
            {mode === 'signin' ? 'Enter your credentials to access your projects' : 'Start collaborating in seconds'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="relative block w-full rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-gray-100 placeholder-gray-500 focus:z-10 focus:border-white focus:outline-none focus:ring-1 focus:ring-white sm:text-sm transition-colors"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-gray-100 placeholder-gray-500 focus:z-10 focus:border-white focus:outline-none focus:ring-1 focus:ring-white sm:text-sm transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-md border border-red-500/20">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-70 transition-colors"
            >
              {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" />}
              {mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
            }}
            className="font-medium text-gray-400 hover:text-white transition-colors"
          >
            {mode === 'signin' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};