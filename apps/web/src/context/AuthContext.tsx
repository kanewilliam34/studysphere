"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, User, NexconnToken, getAccessToken, clearAccessToken } from "@/lib/api";
import { nexconnManager, ConnectionStatus } from "@/lib/nexconn";

interface AuthContextType {
  user: User | null;
  nexconnToken: NexconnToken | null;
  nexconnStatus: ConnectionStatus;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [nexconnToken, setNexconnToken] = useState<NexconnToken | null>(null);
  const [nexconnStatus, setNexconnStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initNexconn = async (currentUser: User) => {
    try {
      const tokenData = await api.getNexconnToken();
      setNexconnToken(tokenData);

      // Initialize Nexconn SDK with App Key
      await nexconnManager.initialize(tokenData.app_key);
      await nexconnManager.connect(tokenData.access_token, currentUser.id, currentUser.name);
    } catch (err) {
      console.warn("Failed to initialize Nexconn token:", err);
    }
  };

  const refreshProfile = async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await api.getMe();
      setUser(profile);
      await initNexconn(profile);
    } catch (e) {
      console.warn("Auth check failed:", e);
      clearAccessToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
    const unsubscribeStatus = nexconnManager.onStatusChange((status) => {
      setNexconnStatus(status);
    });
    return () => {
      unsubscribeStatus();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      setUser(res.user);
      await initNexconn(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.register({ name, email, password: pass });
      setUser(res.user);
      await initNexconn(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      await nexconnManager.disconnect();
    } catch {
      // Ignored
    } finally {
      setUser(null);
      setNexconnToken(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        nexconnToken,
        nexconnStatus,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
