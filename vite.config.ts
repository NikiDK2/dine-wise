import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    // Eenvoudige optimalisaties zonder terser
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Split chunks voor betere caching
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          utils: ["date-fns", "clsx", "class-variance-authority"],
        },
        // Kleinere chunk namen
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Verwijder source maps in productie
    sourcemap: false,
    // Optimaliseer CSS
    cssCodeSplit: true,
    // Verklein build output
    target: "es2015",
    outDir: "dist",
    assetsDir: "assets",
  },
  // Optimaliseer development server
  server: {
    port: 8081,
  },
  // Tree shaking optimalisaties
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "date-fns",
    ],
  },
});
