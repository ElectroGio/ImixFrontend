import { Tabs } from "expo-router";
export default function CustomerLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#1e7a35" }}>
      <Tabs.Screen name="home" options={{ title: "Inicio" }} />
      <Tabs.Screen name="catalog" options={{ title: "Catálogo" }} />
      <Tabs.Screen name="orders" options={{ title: "Mis pedidos" }} />
      <Tabs.Screen name="chat" options={{ title: "AI" }} />
    </Tabs>
  );
}
