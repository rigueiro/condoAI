"use client";

import { useState, useEffect, ReactNode } from "react";
import AuthContext, { User, AuthContextType } from "../contexts/auth-context";

// Simulated API calls (replace with real ones, e.g., fetch to your backend)
const simulateLogin = (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === "admin@condoai.pt" && password === "admin123") {
        resolve({ id: 1, email, name: "John Doe" });
      } else {
        reject(new Error("invalidCredentials"));
      }
    }, 1000);
  });
};

const simulateLogout = (): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, 500));
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const userData: User = await simulateLogin(email, password);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "loginFailed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await simulateLogout();
      setUser(null);
      localStorage.removeItem("user");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "logoutFailed");
      throw err;
    }
  };

  const value: AuthContextType = { user, login, logout, isLoading, error };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
