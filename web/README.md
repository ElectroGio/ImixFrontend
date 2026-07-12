# Imix Web

Monorepo de frontends para Imix Control Inventario — _Nutriendo el ser_.

## Apps
- `apps/admin` — Panel administrativo (distribuidores, productos, inventario, pedidos, AI).
- `apps/landing` — Landing pública del producto.

## Stack
- Vite + React 19 + TypeScript
- Tailwind CSS 4
- TanStack Query + Zustand
- React Router 7

## Comandos
```bash
pnpm install
pnpm --filter @imix/admin dev
pnpm --filter @imix/landing dev
```
