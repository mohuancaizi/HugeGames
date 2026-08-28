import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";

const base = process.env.VITE_DEPLOY_TARGET === "github-pages" ? "/HugeGamesRelease/" : "/";

const legacyRedirects: Record<string, string> = {
  "/home": "/zh",
  "/games": "/zh/games",
};

function legacyRedirectPlugin(): Plugin {
  const middleware = (request: { url?: string }, response: { statusCode: number; setHeader: (name: string, value: string) => void; end: () => void }, next: () => void): void => {
    const path = request.url?.split("?", 1)[0] ?? "";
    const target = legacyRedirects[path];
    if (!target) return next();
    response.statusCode = 302;
    response.setHeader("Location", target);
    response.end();
  };
  return {
    name: "legacy-route-redirects",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  base,
  plugins: [vue(), legacyRedirectPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
