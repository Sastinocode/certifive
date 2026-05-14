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
const EXPLICIT_DEMO_KEY = "explicitDemo";

function isDemoUser(user: any) {
  return user?.username === "demo" || user?.email === "demo@certifive.es";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveToken = (t: string) => {
    setToken(t);
    localStorage.setItem(TOKEN_KEY, t);
  };

  const clearAll = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("demo_user");
    localStorage.removeItem(EXPLICIT_DEMO_KEY);
    localStorage.removeItem("hasLoggedOut");
    localStorage.removeItem("has_logged_out");
  };

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await apiRequest("GET", "/api/auth/user");

        // Demo tokens only count if the user explicitly chose demo mode
        if (isDemoUser(userData) && localStorage.getItem(EXPLICIT_DEMO_KEY) !== "true") {
          clearAll();
          setIsLoading(false);
          return;
        }

        setUser(userData);
        setToken(savedToken);
      } catch {
        clearAll();
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      localStorage.removeItem(EXPLICIT_DEMO_KEY);
      setUser(response.user);
      saveToken(response.token);
      if (response.refreshToken) localStorage.setItem("refreshToken", response.refreshToken);
    } catch (error: any) {
      throw new Error(error.message || "Error en el inicio de sesión");
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const payload = {
        ...userData,
        username: userData.email.trim().toLowerCase(),
        licenseNumber: (userData as any).license ?? undefined,
      };
      const response = await apiRequest("POST", "/api/auth/register", payload);
      localStorage.removeItem(EXPLICIT_DEMO_KEY);
      setUser(response.user);
      saveToken(response.token);
      if (response.refreshToken) localStorage.setItem("refreshToken", response.refreshToken);
    } catch (error: any) {
      throw new Error(error.message || "Error en el registro");
    }
  };

  const logout = async () => {
    try {
      if (token) await apiRequest("POST", "/api/auth/logout", {});
    } catch {
      // ignore
    }
    clearAll();
    window.location.href = "/";
  };

  const loginDemo = async () => {
    try {
      const response = await apiRequest("POST", "/api/auth/demo", {});
      // Mark this as an intentional demo session
      localStorage.setItem(EXPLICIT_DEMO_KEY, "true");
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
