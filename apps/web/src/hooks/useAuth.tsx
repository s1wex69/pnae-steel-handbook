import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, type User } from "@/lib/api";

type AuthResponse = { token: string; user: User };

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name?: string) => Promise<User>;
  changeEmail: (newEmail: string, currentPassword: string) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api<{ user: User }>("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const applySession = useCallback((data: AuthResponse) => {
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return applySession(data);
    },
    [applySession]
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const data = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name: name?.trim() || undefined }),
      });
      return applySession(data);
    },
    [applySession]
  );

  const changeEmail = useCallback(
    async (newEmail: string, currentPassword: string) => {
      const data = await api<AuthResponse>("/auth/email", {
        method: "PATCH",
        body: JSON.stringify({ newEmail, currentPassword }),
      });
      return applySession(data);
    },
    [applySession]
  );

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const data = await api<AuthResponse & { message?: string }>("/auth/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    applySession(data);
  }, [applySession]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        changeEmail,
        changePassword,
        logout,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
