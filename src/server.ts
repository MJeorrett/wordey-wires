import { watch } from "node:fs";
import { createServer, type Server, type ServerResponse } from "node:http";
import { handleRequest } from "./handler.js";
import { loadWireFolder } from "./loadFolder.js";
import { RELOAD_PATH } from "./page.js";

export interface ServeOptions {
  /** Folder containing .wire files (and the .csv files they reference). */
  dir: string;
  /** Id of the wireframe `/` redirects to. */
  home: string;
  port: number;
}

/** Serves the wireframes in `dir` and reloads connected browsers when .wire/.csv files change. */
export function startServer({ dir, home, port }: ServeOptions): Server {
  const clients = new Set<ServerResponse>();

  const server = createServer((req, res) => {
    const url = req.url ?? "/";

    if (url === RELOAD_PATH) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write(": connected\n\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    const response = handleRequest(url, { load: () => loadWireFolder(dir), home });
    if (response.location !== undefined) {
      res.writeHead(response.status, { Location: response.location });
      res.end();
      return;
    }
    res.writeHead(response.status, { "Content-Type": "text/html; charset=utf-8" });
    res.end(response.html ?? "");
  });

  // Editors fire several fs events per save, so coalesce them into one reload.
  let timer: NodeJS.Timeout | undefined;
  const watcher = watch(dir, { recursive: true }, (_event, filename) => {
    if (filename && !/\.(wire|csv)$/.test(filename)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      for (const client of clients) client.write("data: reload\n\n");
    }, 50);
  });
  server.on("close", () => {
    clearTimeout(timer);
    watcher.close();
  });

  server.listen(port, () => {
    console.log(`Serving ${dir} at http://localhost:${port} (home: #${home})`);
  });
  return server;
}
