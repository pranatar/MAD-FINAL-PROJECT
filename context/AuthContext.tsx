import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persisted session
    const loadSession = async () => {
      try {
        let storedUser = null;
        if (Platform.OS === 'web') {
          storedUser = localStorage.getItem('user_session');
        } else {
          storedUser = await SecureStore.getItemAsync('user_session');
        }
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const signIn = async (newUser: User) => {
    setUser(newUser);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('user_session', JSON.stringify(newUser));
      } else {
        await SecureStore.setItemAsync('user_session', JSON.stringify(newUser));
      }
    } catch (error) {
      console.error('Failed to persist session:', error);
    }
  };

  const signOut = async () => {
    setUser(null);
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('user_session');
      } else {
        await SecureStore.deleteItemAsync('user_session');
      }
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
