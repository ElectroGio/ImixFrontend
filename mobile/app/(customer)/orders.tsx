import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";

type Order = {
    id: string;
    number: string;
    status: string;
    total: number;
    currency: string;
    createdAt: string;
    storeName?: string | null;
    itemsCount: number;
};

const statusLabel: Record<string, string> = {
    PendingPayment: "Pendiente de pago",
    InventoryReserved: "Reservado",
    PaymentInProgress: "Procesando pago",
    PaymentConfirmed: "Pago confirmado",
    NotifiedToStore: "Enviado a tienda",
    InPreparation: "En preparación",
    Shipped: "En camino",
    Delivered: "Entregado",
    Cancelled: "Cancelado",
    Rejected: "Rechazado"
};

const fmt = (n: number, c: string) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

export default function Orders() {
    const [refreshing, setRefreshing] = useState(false);
    const q = useQuery({
        queryKey: ["mobile", "customer", "orders"],
        queryFn: async () => (await api.get<{ items: Order[] }>("/orders", { params: { size: 50 } })).data.items
    });

    return (
        <View className="flex-1 bg-white">
            <View className="p-4 border-b border-slate-100">
                <Text className="text-2xl font-bold text-imixLeaf-700">Mis pedidos</Text>
                <Text className="text-xs text-slate-500 mt-1">Seguimiento de todas tus compras</Text>
            </View>
            <FlatList
                data={q.data ?? []}
                keyExtractor={(o) => o.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await q.refetch(); setRefreshing(false); }} />}
                ListEmptyComponent={
                    <View className="p-8 items-center">
                        <Text className="text-slate-400">No has hecho pedidos aún.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <Pressable className="p-4 border-b border-slate-100 active:bg-slate-50">
                        <View className="flex-row items-center justify-between">
                            <Text className="font-mono text-xs text-slate-500">{item.number}</Text>
                            <Text className="text-xs text-imixLeaf-700 font-semibold">{statusLabel[item.status] ?? item.status}</Text>
                        </View>
                        <View className="flex-row items-center justify-between mt-2">
                            <View>
                                <Text className="text-sm text-slate-700">{item.storeName ?? "Sin tienda asignada"}</Text>
                                <Text className="text-xs text-slate-400 mt-0.5">{new Date(item.createdAt).toLocaleString("es-CO")} · {item.itemsCount} items</Text>
                            </View>
                            <Text className="font-bold text-slate-900">{fmt(item.total, item.currency)}</Text>
                        </View>
                    </Pressable>
                )}
            />
        </View>
    );
}
