import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "../lib/auth";
import "../global.css";

const qc = new QueryClient();

export default function RootLayout() {
  const hydrate = useAuth((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return (
    <QueryClientProvider client={qc}>
      <Stack screenOptions={{ headerStyle: { backgroundColor: "#1e7a35" }, headerTintColor: "white" }} />
    </QueryClientProvider>
  );
}
