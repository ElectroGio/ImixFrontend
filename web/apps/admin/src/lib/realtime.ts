import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";

type OrderChangedEvent = { orderId: string; status: string; storeId: string | null; at: string };
type InventoryChangedEvent = { storeId: string; productId: string; onHand: number; reserved: number; at: string };

/**
 * Se conecta al hub /hubs/notifications con JWT.
 * Cuando llegan eventos, invalida las queries relevantes para forzar refetch.
 * Silencioso: no rompe la app si SignalR falla.
 */
export function useRealtimeNotifications() {
    const qc = useQueryClient();
    const token = useAuthStore((s) => s.token);
    const ref = useRef<HubConnection | null>(null);

    useEffect(() => {
        if (!token) return;
        const url = `${window.location.origin}/hubs/notifications`;
        const conn = new HubConnectionBuilder()
            .withUrl(url, { accessTokenFactory: () => token })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(LogLevel.Warning)
            .build();

        conn.on("order.changed", (_e: OrderChangedEvent) => {
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["order"] });
            qc.invalidateQueries({ queryKey: ["dashboard", "orders"] });
        });

        conn.on("inventory.changed", (_e: InventoryChangedEvent) => {
            qc.invalidateQueries({ queryKey: ["inventory"] });
            qc.invalidateQueries({ queryKey: ["stores"] });
        });

        conn.start()
            .then(() => { ref.current = conn; })
            .catch((e) => console.warn("[SignalR] connect failed", e));

        return () => {
            if (conn.state !== HubConnectionState.Disconnected) conn.stop().catch(() => { });
        };
    }, [token, qc]);
}
