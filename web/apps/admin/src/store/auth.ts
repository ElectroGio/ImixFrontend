import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
    token: string | null;
    refreshToken: string | null;
    user: { id: string; email: string; roles: string[] } | null;
    setSession: (t: string, r: string, u: AuthState["user"]) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            refreshToken: null,
            user: null,
            setSession: (token, refreshToken, user) => set({ token, refreshToken, user }),
            logout: () => set({ token: null, refreshToken: null, user: null })
        }),
        { name: "imix-admin-auth" }
    )
);
