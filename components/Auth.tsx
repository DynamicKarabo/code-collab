import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#030303] text-white p-4 overflow-hidden relative selection:bg-blue-500/30">

      {/* Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[5000ms]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[7000ms]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]">
            <img src="https://i.postimg.cc/FFpw39rP/codecollab-(1)-(1).jpg" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            codecollab
          </h1>
          <p className="text-gray-400 text-center">
            {mode === 'signin' ? 'Welcome back. Ready to code?' : 'Create your account and start building.'}
          </p>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label htmlFor="email-address" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-start gap-3 text-red-400 text-sm bg-red-500/5 p-4 rounded-lg border border-red-500/10"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span className="leading-snug">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-semibold text-black hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.4)]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
            }}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};