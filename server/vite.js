import { createServer as createViteServer } from "vite";

export async function setupVite(httpServer, app) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
