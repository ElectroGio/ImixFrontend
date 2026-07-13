import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwind()],
    server: {
		port: 3000,
		host: '0.0.0.0',
		allowedHosts: true,
		watch: {
		  ignored: ['**/.git/**', '**/node_modules/**', '**/dist/**'],
		},
		// Barrera adicional: niega archivos .git del escaneo de Vite
		fs: {
		  deny: ['.git'],
		},
  }
});
