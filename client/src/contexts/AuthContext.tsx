import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string | number;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  company?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loginDemo: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  dni: string;
  license?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "token";
const LOGOUT_KEY = "has_logged_out";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoggedOut] = useState(() => {
    return localStorage.getItem(LOGOUT_KEY) === "true" ||
           localStorage.getItem("hasLoggedOut") === "true";
  });

  const saveToken = (t: string) => {
    setToken(t);
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.removeItem(LOGOUT_KEY);
    localStorage.removeItem("hasLoggedOut");
  };

  const clearToken = () => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("demo_user");
  };

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        try {
          const userData = await apiRequest("GET", "/api/auth/user");
          setUser(userData);
          setToken(savedToken);
        } catch {
          clearToken();
        }
      } else if (!hasLoggedOut) {
        try {
          const response = await apiRequest("POST", "/api/auth/demo", {});
          setUser(response.user);
          saveToken(response.token);
          if (response.refreshToken) localStorage.setItem("refreshToken", response.refreshToken);
        } catch {
          // Stay logged out if demo fails
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      setUser(response.user);
      saveToken(response.token);
      if (response.refreshToken) localStorage.setItem("refreshToken", response.refreshToken);
    } catch (error: any) {
      throw new Error(error.message || "Error en el inicio de sesión");
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      setUser(response.user);
      saveToken(response.token);
      if (response.refreshToken) localStorage.setItem("refreshToken", response.refreshToken);
    } catch (error: any) {
      throw new Error(error.message || "Error en el registro");
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiRequest("POST", "/api/auth/logout", {});
      }
    } catch {
      // Ignore logout API errors
    }
    setUser(null);
    clearToken();
    localStorage.setItem(LOGOUT_KEY, "true");
    localStorage.setItem("hasLoggedOut", "true");
    window.location.href = "/";
  };

  const loginDemo = async () => {
    localStorage.removeItem(LOGOUT_KEY);
    localStorage.removeItem("hasLoggedOut");
    try {
      const response = await apiRequest("POST", "/api/auth/demo", {});
      setUser(response.user);
      saveToken(response.token);
      if (response.refreshToken) localStorage.setItem("refreshToken", response.refreshToken);
    } catch (error: any) {
      throw new Error(error.message || "Error al acceder a la demo");
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loginDemo,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
