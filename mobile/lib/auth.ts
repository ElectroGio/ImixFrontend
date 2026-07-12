import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

type Role = "customer" | "store_manager";

type AuthState = {
    token: string | null;
    role: Role | null;
    email: string | null;
    hydrate: () => Promise<void>;
    setSession: (token: string, role: Role, email: string) => Promise<void>;
    logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
    token: null,
    role: null,
    email: null,
    hydrate: async () => {
        const token = await SecureStore.getItemAsync("imix.token");
        const role = (await SecureStore.getItemAsync("imix.role")) as Role | null;
        const email = await SecureStore.getItemAsync("imix.email");
        set({ token, role, email });
    },
    setSession: async (token, role, email) => {
        await SecureStore.setItemAsync("imix.token", token);
        await SecureStore.setItemAsync("imix.role", role);
        await SecureStore.setItemAsync("imix.email", email);
        set({ token, role, email });
    },
    logout: async () => {
        await SecureStore.deleteItemAsync("imix.token");
        await SecureStore.deleteItemAsync("imix.role");
        await SecureStore.deleteItemAsync("imix.email");
        set({ token: null, role: null, email: null });
    }
}));
