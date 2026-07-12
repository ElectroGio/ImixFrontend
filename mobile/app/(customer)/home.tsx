import { View, Text } from "react-native";
import { useAuth } from "../../lib/auth";

export default function Home() {
  const email = useAuth((s) => s.email);
  return (
    <View className="flex-1 bg-imixLeaf-50 p-6">
      <Text className="text-2xl font-bold text-imixLeaf-700">Hola, {email}</Text>
      <Text className="mt-2 text-slate-600">Bienvenido a Imix · Nutriendo el ser.</Text>
    </View>
  );
}
