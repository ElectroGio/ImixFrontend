import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function Login() {
  const [email, setEmail] = useState("customer@imix.dev");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);

  async function submit() {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const role = data.user.roles?.includes("store_manager") ? "store_manager" : "customer";
      await setSession(data.accessToken, role, data.user.email);
      router.replace(role === "store_manager" ? "/(store)/dashboard" : "/(customer)/home");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.title ?? "No se pudo iniciar sesión");
    } finally { setLoading(false); }
  }

  return (
    <View className="flex-1 justify-center bg-imixLeaf-50 px-6">
      <Text className="text-4xl font-bold text-imixLeaf-700">Imix</Text>
      <Text className="text-sm text-slate-500 mb-8">Nutriendo el ser</Text>
      <Text className="font-semibold mb-1">Email</Text>
      <TextInput autoCapitalize="none" value={email} onChangeText={setEmail}
                 className="bg-white border border-slate-200 rounded px-3 py-3 mb-3" />
      <Text className="font-semibold mb-1">Contraseña</Text>
      <TextInput secureTextEntry value={password} onChangeText={setPassword}
                 className="bg-white border border-slate-200 rounded px-3 py-3 mb-6" />
      <Pressable onPress={submit} disabled={loading}
                 className="bg-imixLeaf-700 rounded py-3 items-center">
        <Text className="text-white font-semibold">{loading ? "Ingresando…" : "Ingresar"}</Text>
      </Pressable>
    </View>
  );
}
