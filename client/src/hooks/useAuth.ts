import { useState, useEffect, createContext, useContext } from "react";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";

interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  role: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedOut: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isLoggedOut: localStorage.getItem("hasLoggedOut") === "true",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }
    apiRequest("GET", "/api/auth/user")
      .then(user => setState({ user, isLoading: false, isLoggedOut: false }))
      .catch(() => {
        localStorage.removeItem("token");
        setState(prev => ({ ...prev, isLoading: false }));
      });
  }, []);

  const login = async (username: string, password: string) => {
    const data = await apiRequest("POST", "/api/auth/login", { username, password });
    localStorage.setItem("token", data.token);
    localStorage.removeItem("hasLoggedOut");
    setState({ user: data.user, isLoading: false, isLoggedOut: false });
    queryClient.clear();
    return data.user;
  };

  const loginDemo = async () => {
    const data = await apiRequest("POST", "/api/auth/demo");
    localStorage.setItem("token", "demo-token");
    localStorage.removeItem("hasLoggedOut");
    setState({ user: data.user, isLoading: false, isLoggedOut: false });
    queryClient.clear();
    return data.user;
  };

  const register = async (formData: any) => {
    const data = await apiRequest("POST", "/api/auth/register", formData);
    localStorage.setItem("token", data.token);
    localStorage.removeItem("hasLoggedOut");
    setState({ user: data.user, isLoading: false, isLoggedOut: false });
    queryClient.clear();
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.setItem("hasLoggedOut", "true");
    setState({ user: null, isLoading: false, isLoggedOut: true });
    queryClient.clear();
  };

  return { ...state, login, loginDemo, register, logout };
}
