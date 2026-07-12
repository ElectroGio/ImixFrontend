import { View, Text, FlatList, Pressable, TextInput, Alert, RefreshControl, Modal } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "../../lib/api";

type Store = { id: string; tradeName: string; city: string; managerEmail?: string | null };
type InvItem = {
    inventoryId: string;
    productId: string;
    sku: string;
    name: string;
    imageUrl?: string | null;
    onHand: number;
    reserved: number;
    available: number;
    minStock: number;
    maxStock: number;
    price: number;
    currency: string;
};

const fmt = (n: number, c: string) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

export default function Stock() {
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [action, setAction] = useState<{ kind: "receive" | "adjust"; item: InvItem } | null>(null);
    const qc = useQueryClient();

    const storeQ = useQuery({
        queryKey: ["mobile", "store", "mine"],
        queryFn: async () => (await api.get<Store[]>("/stores")).data
    });
    const myStore = useMemo(() => storeQ.data?.[0], [storeQ.data]);
    const storeId = myStore?.id;

    const inv = useQuery({
        enabled: !!storeId,
        queryKey: ["mobile", "store", "inventory", storeId, search],
        queryFn: async () => (await api.get<InvItem[]>(`/stores/${storeId}/inventory`, { params: { search: search || undefined } })).data
    });

    const receiveMut = useMutation({
        mutationFn: async (body: { storeId: string; productId: string; quantity: number; note?: string }) =>
            (await api.post("/inventory/receive", body)).data,
        onSuccess: () => { setAction(null); qc.invalidateQueries({ queryKey: ["mobile", "store", "inventory"] }); },
        onError: (e: any) => Alert.alert("Error", e?.response?.data?.detail ?? e?.message)
    });
    const adjustMut = useMutation({
        mutationFn: async (body: { storeId: string; productId: string; delta: number; reason: string }) =>
            (await api.post("/inventory/adjust", body)).data,
        onSuccess: () => { setAction(null); qc.invalidateQueries({ queryKey: ["mobile", "store", "inventory"] }); },
        onError: (e: any) => Alert.alert("Error", e?.response?.data?.detail ?? e?.message)
    });

    return (
        <View className="flex-1 bg-white">
            <View className="p-4 border-b border-slate-100">
                <Text className="text-2xl font-bold text-imixLeaf-700">Stock</Text>
                {myStore && <Text className="text-xs text-slate-500">{myStore.tradeName} · {myStore.city}</Text>}
                <TextInput
                    className="mt-2 border border-slate-200 rounded px-3 py-2"
                    placeholder="Buscar producto…"
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                />
            </View>

            {!storeId && <View className="p-8"><Text className="text-slate-400 text-center">No tienes tienda asignada. Contacta al admin.</Text></View>}

            <FlatList
                data={inv.data ?? []}
                keyExtractor={(i) => i.productId}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await inv.refetch(); setRefreshing(false); }} />}
                ListEmptyComponent={storeId ? <View className="p-8"><Text className="text-slate-400 text-center">Sin productos.</Text></View> : null}
                renderItem={({ item }) => {
                    const low = item.onHand < item.minStock;
                    return (
                        <View className={`p-4 border-b border-slate-100 ${low ? "bg-amber-50/50" : ""}`}>
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="font-mono text-[10px] text-slate-500">{item.sku}</Text>
                                    <Text className="font-semibold">{item.name}</Text>
                                    <Text className="text-xs text-slate-500 mt-0.5">{fmt(item.price, item.currency)} · min {item.minStock} / max {item.maxStock}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className={`text-2xl font-bold ${low ? "text-amber-700" : "text-slate-900"}`}>{item.onHand}</Text>
                                    <Text className="text-[10px] text-slate-500">reserv. {item.reserved} · disp. {item.available}</Text>
                                </View>
                            </View>
                            <View className="flex-row gap-2 mt-3">
                                <Pressable onPress={() => setAction({ kind: "receive", item })} className="px-3 py-1.5 rounded bg-imixLeaf-700 active:opacity-70">
                                    <Text className="text-white text-xs font-semibold">Recibir</Text>
                                </Pressable>
                                <Pressable onPress={() => setAction({ kind: "adjust", item })} className="px-3 py-1.5 rounded border border-slate-300 active:bg-slate-50">
                                    <Text className="text-slate-700 text-xs font-semibold">Ajustar</Text>
                                </Pressable>
                            </View>
                        </View>
                    );
                }}
            />

            {action && storeId && (
                <StockActionSheet
                    kind={action.kind}
                    item={action.item}
                    saving={receiveMut.isPending || adjustMut.isPending}
                    onClose={() => setAction(null)}
                    onSubmit={(qty, note) => {
                        if (action.kind === "receive") receiveMut.mutate({ storeId, productId: action.item.productId, quantity: qty, note });
                        else adjustMut.mutate({ storeId, productId: action.item.productId, delta: qty, reason: note });
                    }}
                />
            )}
        </View>
    );
}

function StockActionSheet({ kind, item, saving, onClose, onSubmit }: {
    kind: "receive" | "adjust";
    item: InvItem;
    saving: boolean;
    onClose: () => void;
    onSubmit: (qty: number, note: string) => void;
}) {
    const [qty, setQty] = useState(kind === "receive" ? "1" : "0");
    const [note, setNote] = useState("");
    return (
        <Modal transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/40">
                <View className="bg-white rounded-t-3xl p-6">
                    <Text className="text-lg font-bold mb-1">{kind === "receive" ? "Recibir stock" : "Ajustar stock"}</Text>
                    <Text className="text-xs text-slate-500 mb-4">{item.name} · Actual: {item.onHand}</Text>
                    <Text className="text-xs font-medium text-slate-600 mb-1">{kind === "receive" ? "Unidades a recibir" : "Delta (positivo o negativo)"}</Text>
                    <TextInput className="border border-slate-300 rounded px-3 py-2 mb-3" keyboardType="numeric" value={qty} onChangeText={setQty} />
                    <Text className="text-xs font-medium text-slate-600 mb-1">{kind === "receive" ? "Nota (opcional)" : "Razón"}</Text>
                    <TextInput className="border border-slate-300 rounded px-3 py-2 mb-4" value={note} onChangeText={setNote} placeholder={kind === "receive" ? "Ej: OC #123" : "Ej: Conteo físico"} />
                    <View className="flex-row justify-end gap-2">
                        <Pressable onPress={onClose} className="px-4 py-2 rounded border border-slate-300"><Text>Cancelar</Text></Pressable>
                        <Pressable
                            onPress={() => onSubmit(Number(qty), note)}
                            disabled={saving || !qty || (kind === "adjust" && !note.trim())}
                            className="px-4 py-2 rounded bg-imixLeaf-700 active:opacity-70 disabled:opacity-50"
                        ><Text className="text-white font-semibold">{saving ? "Guardando…" : "Confirmar"}</Text></Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
