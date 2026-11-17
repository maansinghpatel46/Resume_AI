import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const expired = () => setUser(null);
    window.addEventListener("auth:expired", expired);
    return () => window.removeEventListener("auth:expired", expired);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (email, password) =>
        setUser((await api.post("/auth/login", { email, password })).data.user),
      register: async (name, email, password) =>
        setUser(
          (await api.post("/auth/register", { name, email, password })).data
            .user,
        ),
      refreshUser: (nextUser) => setUser(nextUser),
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          setUser(null);
        }
      },
    }),
    [user, loading],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
