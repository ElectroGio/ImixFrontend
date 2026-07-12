import { View, Text } from "react-native";
export default function Dashboard() {
  return (
    <View className="flex-1 bg-imixLeaf-50 p-6">
      <Text className="text-2xl font-bold text-imixLeaf-700">Dashboard tienda</Text>
      <Text className="mt-2 text-slate-600">Pedidos hoy, stock crítico y métricas.</Text>
    </View>
  );
}
