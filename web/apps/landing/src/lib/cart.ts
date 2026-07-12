import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
    productId: string;
    sku: string;
    name: string;
    imageUrl?: string | null;
    price: number;
    currency: string;
    quantity: number;
};

type CartState = {
    items: CartItem[];
    add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
    setQuantity: (productId: string, qty: number) => void;
    remove: (productId: string) => void;
    clear: () => void;
    subtotal: () => number;
    count: () => number;
};

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            add: (item, qty = 1) => {
                const existing = get().items.find((i) => i.productId === item.productId);
                if (existing) {
                    set({ items: get().items.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i) });
                } else {
                    set({ items: [...get().items, { ...item, quantity: qty }] });
                }
            },
            setQuantity: (productId, qty) => {
                if (qty <= 0) { get().remove(productId); return; }
                set({ items: get().items.map((i) => i.productId === productId ? { ...i, quantity: qty } : i) });
            },
            remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
            clear: () => set({ items: [] }),
            subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
            count: () => get().items.reduce((s, i) => s + i.quantity, 0)
        }),
        { name: "imix.cart" }
    )
);

export const fmt = (n: number, c = "COP") =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);
