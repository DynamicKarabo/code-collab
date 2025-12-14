import { File, User } from './types';

export const INITIAL_FILES: File[] = [
  {
    id: '1',
    name: 'App.tsx',
    language: 'typescript',
    content: `import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Hello CodeCollab!</h1>
      <p className="mb-4">Count: {count}</p>
      <button 
        className="px-4 py-2 bg-blue-500 rounded text-white"
        onClick={() => setCount(c => c + 1)}
      >
        Increment
      </button>
    </div>
  );
}

export default App;`
  },
  {
    id: '2',
    name: 'utils.ts',
    language: 'typescript',
    content: `export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US').format(date);
};

export const calculateFactorial = (n: number): number => {
  if (n <= 1) return 1;
  return n * calculateFactorial(n - 1);
};`
  },
  {
    id: '3',
    name: 'styles.css',
    language: 'css',
    content: `.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.btn {
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.8;
}`
  }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex (You)', color: '#3b82f6' },
  { id: 'u2', name: 'Sarah', color: '#10b981' }, // Emerald
  { id: 'u3', name: 'Mike', color: '#f59e0b' },  // Amber
];

export const GEMINI_MODEL = 'gemini-2.5-flash';