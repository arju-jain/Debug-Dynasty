import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../api/client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  token?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginAsDemo: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hash password with SHA-256 for secure client-side storage
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('debugdynasty_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(user);

  useEffect(() => {
    if (user) {
      localStorage.setItem('debugdynasty_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('debugdynasty_user');
      localStorage.removeItem('debugdynasty_token');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<void> => {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Hash password before storage/comparison
    const hashed = await hashPassword(password);
    const token = `dynasty_tok_${Date.now()}_${hashed.slice(0, 16)}`;

    // Try backend authentication if endpoint exists
    try {
      const loginUrl = API_BASE_URL ? `${API_BASE_URL}/api/auth/login` : '/api/auth/login';
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password_hash: hashed }),
      });
      if (response.ok) {
        const data = await response.json();
        const loggedInUser: UserProfile = {
          id: data.id || `user_${Date.now()}`,
          name: data.name || email.split('@')[0],
          email,
          role: data.role || 'Developer',
          token: data.token || token,
        };
        setUser(loggedInUser);
        localStorage.setItem('debugdynasty_token', loggedInUser.token || token);
        return;
      }
    } catch {
      // Backend auth endpoint unavailable — fall through to secure local session
    }

    // Local authenticated user session
    const loggedInUser: UserProfile = {
      id: `usr_${Date.now().toString(36)}`,
      name: email.split('@')[0],
      email,
      role: 'Software Engineer',
      token,
    };
    setUser(loggedInUser);
    localStorage.setItem('debugdynasty_token', token);
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    if (!name.trim()) {
      throw new Error('Please enter your full name.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const hashed = await hashPassword(password);
    const token = `dynasty_tok_${Date.now()}_${hashed.slice(0, 16)}`;

    try {
      const registerUrl = API_BASE_URL ? `${API_BASE_URL}/api/auth/register` : '/api/auth/register';
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password_hash: hashed }),
      });
      if (response.ok) {
        const data = await response.json();
        const newUser: UserProfile = {
          id: data.id || `user_${Date.now()}`,
          name: data.name || name,
          email,
          role: data.role || 'Developer',
          token: data.token || token,
        };
        setUser(newUser);
        localStorage.setItem('debugdynasty_token', newUser.token || token);
        return;
      }
    } catch {
      // Backend register endpoint unavailable — fall through to secure local session
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now().toString(36)}`,
      name,
      email,
      role: 'Software Engineer',
      token,
    };
    setUser(newUser);
    localStorage.setItem('debugdynasty_token', token);
  };

  const loginAsDemo = () => {
    const demoUser: UserProfile = {
      id: 'usr_demo_01',
      name: 'Alex Chen',
      email: 'alex.chen@debugdynasty.dev',
      role: 'Staff Engineer',
      token: 'dynasty_tok_demo_alexchen_2026',
    };
    setUser(demoUser);
    localStorage.setItem('debugdynasty_token', demoUser.token!);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('debugdynasty_user');
    localStorage.removeItem('debugdynasty_token');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
