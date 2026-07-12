import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";

export default function Index() {
  const { token, role } = useAuth();
  if (!token) return <Redirect href="/(auth)/login" />;
  return <Redirect href={role === "store_manager" ? "/(store)/dashboard" : "/(customer)/home"} />;
}
