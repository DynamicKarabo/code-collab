import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, Github } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1">
            <button
                onClick={() => setTheme('vercel-dark')}
                className={`p-1.5 rounded-full transition-all ${theme === 'vercel-dark' ? 'bg-white text-black shadow-sm' : 'text-secondary hover:text-primary'
                    }`}
                title="Vercel Dark"
            >
                <Moon size={14} />
            </button>
            <button
                onClick={() => setTheme('dracula')}
                className={`p-1.5 rounded-full transition-all ${theme === 'dracula' ? 'bg-purple-500 text-white shadow-sm' : 'text-secondary hover:text-primary'
                    }`}
                title="Dracula"
            >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
            </button>
            <button
                onClick={() => setTheme('github-light')}
                className={`p-1.5 rounded-full transition-all ${theme === 'github-light' ? 'bg-black text-white shadow-sm' : 'text-secondary hover:text-primary'
                    }`}
                title="GitHub Light"
            >
                <Sun size={14} />
            </button>
        </div>
    );
};
