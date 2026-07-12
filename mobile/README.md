# Imix Mobile (Expo)

App móvil unificada con dos experiencias enrutadas por rol:

- **Customer** (`app/(customer)/`): catálogo, pedidos, chat AI.
- **Store Manager** (`app/(store)/`): dashboard, pedidos entrantes, stock.

## Stack
- Expo SDK 52 + Expo Router 4
- React Native 0.76 (New Architecture)
- NativeWind + Tailwind
- TanStack Query + Zustand + SecureStore

## Comandos
```bash
pnpm install
pnpm start
```
Configura el endpoint del API en `app.json` → `extra.apiBaseUrl`.
