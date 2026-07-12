import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";

type Store = { id: string; tradeName: string; city: string; inventorySkuCount: number; onHandTotal: number };
type Order = { id: string; status: string; total: number; currency: string; createdAt: string };

const fmt = (n: number, c: string) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
    const [refreshing, setRefreshing] = useState(false);

    const storeQ = useQuery({
        queryKey: ["mobile", "store", "dashboard", "store"],
        queryFn: async () => (await api.get<Store[]>("/stores")).data[0]
    });
    const ordersQ = useQuery({
        queryKey: ["mobile", "store", "dashboard", "orders"],
        queryFn: async () => (await api.get<{ items: Order[] }>("/orders", { params: { size: 100 } })).data.items
    });

    const store = storeQ.data;
    const orders = ordersQ.data ?? [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
    const inFlight = orders.filter((o) => ["PaymentConfirmed", "NotifiedToStore", "InPreparation", "Shipped"].includes(o.status));
    const revenueToday = todayOrders
        .filter((o) => ["Delivered", "Shipped", "InPreparation", "PaymentConfirmed", "NotifiedToStore"].includes(o.status))
        .reduce((s, o) => s + o.total, 0);
    const currency = orders[0]?.currency ?? "COP";

    return (
        <ScrollView
            className="flex-1 bg-white"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
                setRefreshing(true);
                await Promise.all([storeQ.refetch(), ordersQ.refetch()]);
                setRefreshing(false);
            }} />}
        >
            <View className="p-4">
                <Text className="text-2xl font-bold text-imixLeaf-700">Dashboard</Text>
                {store && <Text className="text-xs text-slate-500 mt-1">{store.tradeName} · {store.city}</Text>}
            </View>

            <View className="px-4 flex-row flex-wrap gap-3">
                <Stat label="Pedidos hoy" value={todayOrders.length.toString()} />
                <Stat label="En curso" value={inFlight.length.toString()} accent />
                <Stat label="SKUs" value={store?.inventorySkuCount?.toString() ?? "—"} />
                <Stat label="Unidades" value={store?.onHandTotal?.toString() ?? "—"} />
            </View>

            <View className="p-4">
                <Text className="text-sm text-slate-500">Ingresos hoy</Text>
                <Text className="text-3xl font-bold text-imixLeaf-700">{fmt(revenueToday, currency)}</Text>
            </View>

            <View className="p-4 border-t border-slate-100">
                <Text className="font-semibold mb-2">Pedidos en curso</Text>
                {inFlight.length === 0 && <Text className="text-slate-400 text-sm">Todo al día.</Text>}
                {inFlight.slice(0, 10).map((o) => (
                    <View key={o.id} className="flex-row justify-between py-2 border-b border-slate-50">
                        <Text className="text-xs text-slate-600">{o.status}</Text>
                        <Text className="text-sm font-semibold">{fmt(o.total, o.currency)}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <View className={`rounded-xl p-3 flex-1 min-w-[45%] ${accent ? "bg-imixLeaf-700" : "bg-slate-50"}`}>
            <Text className={`text-xs ${accent ? "text-white/80" : "text-slate-500"}`}>{label}</Text>
            <Text className={`text-2xl font-bold ${accent ? "text-white" : "text-slate-900"}`}>{value}</Text>
        </View>
    );
}
