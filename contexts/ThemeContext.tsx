import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'vercel-dark' | 'dracula' | 'github-light';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('theme') as Theme) || 'vercel-dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('theme-vercel-dark', 'theme-dracula', 'theme-github-light');
        root.classList.add(`theme-${theme}`);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
