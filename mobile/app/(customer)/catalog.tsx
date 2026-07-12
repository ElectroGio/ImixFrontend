import { View, Text, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

type P = { id: string; sku: string; name: string; price: { amount: number; currency: string } };

export default function Catalog() {
  const { data } = useQuery({ queryKey: ["products"], queryFn: async () => (await api.get<P[]>("/products")).data });
  return (
    <View className="flex-1 bg-white">
      <FlatList data={data ?? []} keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <View className="p-4 border-b border-slate-100">
            <Text className="font-semibold">{item.name}</Text>
            <Text className="text-xs text-slate-500">{item.sku}</Text>
            <Text className="text-imixLeaf-700 font-bold mt-1">{item.price?.amount} {item.price?.currency}</Text>
          </View>
        )} />
    </View>
  );
}
