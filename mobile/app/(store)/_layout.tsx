import { Tabs } from "expo-router";
export default function StoreLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#1e7a35" }}>
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="incoming" options={{ title: "Pedidos" }} />
      <Tabs.Screen name="stock" options={{ title: "Stock" }} />
    </Tabs>
  );
}
