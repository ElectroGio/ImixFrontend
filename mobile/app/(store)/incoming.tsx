import { View, Text, FlatList, Pressable, Alert, RefreshControl } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";

type Order = {
    id: string;
    number: string;
    status: string;
    total: number;
    currency: string;
    createdAt: string;
    customerName?: string | null;
    customerPhone?: string | null;
    itemsCount: number;
};

const fmt = (n: number, c: string) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

export default function Incoming() {
    const [refreshing, setRefreshing] = useState(false);
    const qc = useQueryClient();

    const list = useQuery({
        queryKey: ["mobile", "store", "orders"],
        queryFn: async () => (await api.get<{ items: Order[] }>("/orders", { params: { size: 50 } })).data.items
    });

    const transitionMut = useMutation({
        mutationFn: async ({ id, action }: { id: string; action: string }) =>
            (await api.post(`/orders/${id}/transition`, { action })).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["mobile", "store", "orders"] }),
        onError: (e: any) => Alert.alert("Error", e?.response?.data?.detail ?? e?.message ?? "No se pudo transicionar la orden")
    });

    return (
        <View className="flex-1 bg-white">
            <View className="p-4 border-b border-slate-100">
                <Text className="text-2xl font-bold text-imixLeaf-700">Pedidos entrantes</Text>
                <Text className="text-xs text-slate-500 mt-1">Gestiona los pedidos asignados a tu tienda</Text>
            </View>
            <FlatList
                data={list.data ?? []}
                keyExtractor={(o) => o.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await list.refetch(); setRefreshing(false); }} />}
                ListEmptyComponent={<View className="p-8 items-center"><Text className="text-slate-400">Sin pedidos por atender.</Text></View>}
                renderItem={({ item }) => (
                    <View className="p-4 border-b border-slate-100">
                        <View className="flex-row justify-between">
                            <Text className="font-mono text-xs text-slate-500">{item.number}</Text>
                            <Text className="text-xs font-semibold text-imixLeaf-700">{item.status}</Text>
                        </View>
                        <Text className="mt-1 font-semibold">{item.customerName ?? "Cliente"}</Text>
                        <Text className="text-xs text-slate-500">{item.customerPhone ?? ""} · {item.itemsCount} items</Text>
                        <Text className="mt-1 font-bold">{fmt(item.total, item.currency)}</Text>
                        <View className="flex-row gap-2 mt-3">
                            {nextAction(item.status) && (
                                <Pressable
                                    onPress={() => transitionMut.mutate({ id: item.id, action: nextAction(item.status)!.action })}
                                    className="px-3 py-2 rounded bg-imixLeaf-700 active:opacity-70"
                                >
                                    <Text className="text-white text-xs font-semibold">{nextAction(item.status)!.label}</Text>
                                </Pressable>
                            )}
                            {canReject(item.status) && (
                                <Pressable
                                    onPress={() => Alert.alert("¿Rechazar pedido?", "Se liberará el inventario reservado.", [
                                        { text: "No" },
                                        { text: "Rechazar", style: "destructive", onPress: () => transitionMut.mutate({ id: item.id, action: "reject" }) }
                                    ])}
                                    className="px-3 py-2 rounded border border-rose-300 active:bg-rose-50"
                                >
                                    <Text className="text-rose-700 text-xs font-semibold">Rechazar</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

function nextAction(s: string): { action: string; label: string } | null {
    switch (s) {
        case "PaymentConfirmed": return { action: "notify", label: "Aceptar" };
        case "NotifiedToStore": return { action: "prepare", label: "Preparar" };
        case "InPreparation": return { action: "ship", label: "Marcar enviado" };
        case "Shipped": return { action: "deliver", label: "Entregado" };
        default: return null;
    }
}
function canReject(s: string) {
    return ["PaymentConfirmed", "NotifiedToStore", "InPreparation"].includes(s);
}
