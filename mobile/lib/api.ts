import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const baseURL = (Constants.expoConfig?.extra as any)?.apiBaseUrl ?? "http://localhost:5080/api";

export const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use(async (cfg) => {
    const token = await SecureStore.getItemAsync("imix.token");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});
