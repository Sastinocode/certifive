import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loginDemo: () => void;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoggedOut, setHasLoggedOut] = useState(() => {
    return localStorage.getItem("has_logged_out") === "true";
  });

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("auth_token");
      if (savedToken) {
        try {
          const userData = await apiRequest("GET", "/api/auth/me", undefined, {
            Authorization: `Bearer ${savedToken}`
          });
          setUser(userData);
          setToken(savedToken);
        } catch (error) {
          localStorage.removeItem("auth_token");
          setToken(null);
        }
      } else if (!hasLoggedOut) {
        // Demo mode - create a demo user for immediate access (only if not explicitly logged out)
        const demoUser = {
          id: "demo-user",
          email: "demo@certificacion.com",
          firstName: "Usuario",
          lastName: "Demo",
          company: "Empresa Demo",
          role: "demo"
        };
        const demoToken = "demo-token-" + Date.now();
        
        setUser(demoUser);
        setToken(demoToken);
        localStorage.setItem("auth_token", demoToken);
        localStorage.setItem("demo_user", JSON.stringify(demoUser));
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
      });
      
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("auth_token", response.token);
    } catch (error: any) {
      throw new Error(error.message || "Error en el inicio de sesión");
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("auth_token", response.token);
    } catch (error: any) {
      throw new Error(error.message || "Error en el registro");
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint if token exists
      if (token) {
        await apiRequest("POST", "/api/auth/logout", {}, {
          Authorization: `Bearer ${token}`
        });
      }
    } catch (error) {
      console.log("Logout API call failed, continuing with local cleanup");
    }
    
    // Mark as explicitly logged out
    setHasLoggedOut(true);
    
    // Clear all local state and storage
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth-token");
    localStorage.removeItem("demo_user");
    
    // Store logout flag BEFORE clearing localStorage
    localStorage.setItem("has_logged_out", "true");
    
    // Clear session storage but preserve logout flag in localStorage
    sessionStorage.clear();
    
    // Clear any cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Force page reload to ensure complete state reset and redirect to landing
    window.location.href = "/";
    window.location.reload();
  };

  const loginDemo = () => {
    setHasLoggedOut(false);
    // Clear logout flag when demo is explicitly requested
    localStorage.removeItem("has_logged_out");
    
    const demoUser = {
      id: "demo-user",
      email: "demo@certificacion.com",
      firstName: "Usuario",
      lastName: "Demo",
      company: "Empresa Demo",
      role: "demo"
    };
    const demoToken = "demo-token-" + Date.now();
    
    setUser(demoUser);
    setToken(demoToken);
    localStorage.setItem("auth_token", demoToken);
    localStorage.setItem("demo_user", JSON.stringify(demoUser));
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