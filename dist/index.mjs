import * as fs from 'node:fs';
import { promises } from 'node:fs';
import * as path from 'node:path';
import { win32, posix } from 'node:path';
import { spawn } from 'node:child_process';
import kill from 'tree-kill';
import colors from 'picocolors';
import { onDeath } from '@breadc/death';
import fg from 'fast-glob';
import { findExportNames } from 'mlly';
import createDebug from 'debug';

const debug = createDebug("cloudflare-functions");
function normalizePath(filename) {
  return filename.split(win32.sep).join(posix.sep);
}

async function generate(functionsRoot, dtsPath) {
  const files = (await fg(["**/*.ts", "**/*.js", "!**/*.d.ts", "!node_modules/**/*"], {
    cwd: functionsRoot
  })).sort();
  const removeSuffix = (file) => file.replace(/\.\w+$/, "");
  const ensureRoute = (file) => {
    file = removeSuffix(file);
    if (file.endsWith("_middleware")) {
      file = file.replace(/_middleware$/, "**");
    }
    if (!file.startsWith("/")) {
      file = "/" + file;
    }
    if (file.endsWith("/index")) {
      file = file.replace(/index$/, "");
    }
    file = file.replace(/\[\[([\w]+)\]\]$/g, "**:$1");
    file = file.replace(/\[([\w]+)\]/g, ":$1");
    return file;
  };
  const routes = await Promise.all(
    files.map(async (f) => {
      const absPath = path.join(functionsRoot, f);
      const exports = await getExports(absPath);
      if (exports.length > 0) {
        const route = ensureRoute(f);
        return [
          `'${route}': {`,
          ...exports.map((name) => {
            const method = name.slice().slice(9).toUpperCase();
            const realpath = normalizePath(path.relative(dtsPath, removeSuffix(absPath)));
            return `  ${!!method ? method : "ALL"}: CloudflareResponseBody<typeof import('${realpath}')['${name}']>;`;
          }),
          `};`
        ].map((t) => "    " + t);
      } else {
        return [];
      }
    })
  );
  const lines = routes.flat();
  if (lines.length === 0)
    return "";
  return [
    `import type { CloudflareResponseBody } from 'vite-plugin-cloudflare-functions/worker';
`,
    `import 'vite-plugin-cloudflare-functions/client';
`,
    `declare module 'vite-plugin-cloudflare-functions/client' {`,
    `  interface PagesResponseBody {`,
    ...lines,
    `  }`,
    `}
`
  ].join("\n");
}
const ALLOW_EXPORTS = /* @__PURE__ */ new Map([
  ["onRequest", 0],
  ["onRequestGet", 1],
  ["onRequestHead", 2],
  ["onRequestPost", 3],
  ["onRequestPut", 4],
  ["onRequestDelete", 5],
  ["onRequestOptions", 6],
  ["onRequestPatch", 7]
]);
async function getExports(filepath) {
  const code = await promises.readFile(filepath, "utf-8");
  const exports = findExportNames(code);
  return exports.filter((n) => ALLOW_EXPORTS.has(n)).sort((a, b) => ALLOW_EXPORTS.get(a) - ALLOW_EXPORTS.get(b));
}

const DefaultPort = 5173;
const DefaultWranglerPort = 8788;
function CloudflarePagesFunctions(userConfig = {}) {
  let root;
  let port;
  let functionsRoot;
  let preparePromise;
  let wranglerProcess;
  let workerProcess;
  const killProcess = async () => {
    if (wranglerProcess) {
      const pid = wranglerProcess.pid;
      debug(`Kill wrangler (PID: ${pid})`);
      wranglerProcess = void 0;
      if (pid) {
        await new Promise((res) => kill(pid, () => res(void 0)));
      }
    }
    if (workerProcess) {
      const pid = workerProcess.pid;
      debug(`Kill wrangler (PID: ${pid})`);
      workerProcess = void 0;
      if (pid) {
        await new Promise((res) => kill(pid, () => res(void 0)));
      }
    }
  };
  onDeath(async () => {
    await killProcess();
  });
  if (typeof userConfig.dts !== "boolean" && typeof userConfig.dts !== "string") {
    userConfig.dts = true;
  }
  let shouldGen = false;
  const doAutoGen = async () => {
    if (userConfig.dts) {
      const dts = userConfig.dts === true ? "cloudflare.d.ts" : userConfig.dts;
      const dtsPath = path.resolve(root, dts);
      const content = await generate(functionsRoot, path.dirname(dtsPath));
      if (content && content.length > 0) {
        await fs.promises.writeFile(dtsPath, content, "utf-8");
      }
    }
  };
  async function startWrangler() {
    if (wranglerProcess) {
      await killProcess();
    }
    const wranglerPort = userConfig.wrangler?.port ?? DefaultWranglerPort;
    const bindings = [];
    if (userConfig.wrangler?.binding) {
      for (const [key, value] of Object.entries(userConfig.wrangler.binding)) {
        bindings.push("--binding");
        bindings.push(`${key}=${value}`);
      }
    }
    if (userConfig.wrangler?.kv) {
      const kvs = Array.isArray(userConfig.wrangler.kv) ? userConfig.wrangler.kv : [userConfig.wrangler.kv];
      for (const kv of kvs) {
        bindings.push("--kv");
        bindings.push(kv);
      }
    }
    if (userConfig.wrangler?.d1) {
      const d1s = Array.isArray(userConfig.wrangler.d1) ? userConfig.wrangler.d1 : [userConfig.wrangler.d1];
      for (const d1 of d1s) {
        bindings.push("--d1");
        bindings.push(d1);
      }
    }
    if (userConfig.wrangler?.do) {
      for (const [key, value] of Object.entries(userConfig.wrangler.do)) {
        const config = typeof value === "string" ? value : `${value.class}@${value.script}`;
        bindings.push("--do");
        bindings.push(`"${key}=${config}"`);
      }
    }
    if (userConfig.wrangler?.r2) {
      const r2s = Array.isArray(userConfig.wrangler.r2) ? userConfig.wrangler.r2 : [userConfig.wrangler.r2];
      for (const r2 of r2s) {
        bindings.push("--r2");
        bindings.push(r2);
      }
    }
    if (userConfig.wrangler?.ai) {
      const ais = Array.isArray(userConfig.wrangler.ai) ? userConfig.wrangler.ai : [userConfig.wrangler.ai];
      for (const ai of ais) {
        bindings.push("--ai");
        bindings.push(ai);
      }
    }
    const command = [
      "wrangler",
      "pages",
      "dev",
      "--local",
      "--ip",
      "localhost",
      "--port",
      String(wranglerPort),
      "--proxy",
      String(port),
      "--persist-to",
      path.join(functionsRoot, ".wrangler/state"),
      ...bindings
    ];
    const compatibilityDate = userConfig.wrangler?.compatibilityDate;
    if (compatibilityDate) {
      command.push("--compatibility-date");
      command.push(compatibilityDate);
    }
    debug(command);
    const wranglerEnv = { ...process.env };
    for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"]) {
      if (key in wranglerEnv) {
        delete wranglerEnv[key];
      }
    }
    wranglerProcess = spawn("npx", command, {
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
      env: wranglerEnv,
      cwd: path.dirname(functionsRoot)
    });
    let firstTime = true;
    wranglerProcess.stdout.on("data", (chunk) => {
      const text = chunk.toString("utf8").slice(0, -1);
      if (text.indexOf("Compiled Worker successfully") !== -1) {
        if (firstTime) {
          doAutoGen();
          firstTime = false;
          const colorUrl = (url) => colors.cyan(url.replace(/:(\d+)\//, (_, port2) => `:${colors.bold(port2)}/`));
          console.log(
            `  ${colors.green("\u279C")}  ${colors.bold("Pages")}:   ${colorUrl(
              `http://localhost:${wranglerPort}/`
            )}
`
          );
        } else {
          shouldGen = true;
          console.log(
            `${colors.dim(( new Date()).toLocaleTimeString())} ${colors.cyan(
              colors.bold("[cloudflare pages]")
            )} ${colors.green("functions reload")}`
          );
        }
      }
      if (userConfig.wrangler?.log && text) {
        console.log(text);
      }
    });
    wranglerProcess.stderr.on("data", (chunk) => {
      if (userConfig.wrangler?.log) {
        const text = chunk.toString("utf8").slice(0, -1);
        console.error(text);
      }
    });
    if (userConfig.wrangler?.do) {
      const command2 = [
        "wrangler",
        "dev",
        "--persist-to",
        path.join(functionsRoot, ".wrangler/state")
      ];
      if (compatibilityDate) {
        command2.push(`--compatibility-date=${compatibilityDate}`);
      }
      workerProcess = spawn("npx", command2, {
        shell: process.platform === "win32",
        stdio: ["ignore", "pipe", "pipe"],
        env: wranglerEnv,
        cwd: functionsRoot
      });
      workerProcess.stdout.on("data", (chunk) => {
        const text = chunk.toString("utf8").slice(0, -1);
        if (userConfig.wrangler?.log && text) {
          console.log(text);
        }
      });
      workerProcess.stderr.on("data", (chunk) => {
        const text = chunk.toString("utf8").slice(0, -1);
        if (userConfig.wrangler?.log && text) {
          console.error(text);
        }
      });
    }
  }
  return {
    name: "vite-plugin-cloudflare-functions",
    config(config) {
      return {
        server: {
          strictPort: true,
          hmr: {
            port: (config.server?.port ?? DefaultPort) + 1
          }
        }
      };
    },
    configResolved(resolvedConfig) {
      root = resolvedConfig.root;
      port = resolvedConfig.server.port ?? DefaultPort;
      functionsRoot = normalizePath(
        !!userConfig.root ? path.resolve(userConfig.root) : path.resolve(resolvedConfig.root, "functions")
      );
      debug(`Functions root: ${functionsRoot}`);
      if (!functionsRoot.endsWith("functions") && functionsRoot.endsWith("functions/")) {
        console.log("You should put your worker in directory named as functions/");
      }
      if (!preparePromise) {
        preparePromise = doAutoGen();
      }
    },
    async configureServer(_server) {
      if (userConfig.dts) {
        setInterval(async () => {
          if (shouldGen) {
            shouldGen = false;
            await doAutoGen();
          }
        }, 1e3);
      }
      await startWrangler();
    },
    async closeBundle() {
      await killProcess();
    },
    renderStart() {
      if (userConfig.outDir) {
        const functionsDst = normalizePath(
          userConfig.outDir === true ? path.resolve(root, "functions") : path.resolve(root, userConfig.outDir, "functions")
        );
        console.log(
          `Copying cloudflare functions directory from '${path.relative(
            ".",
            functionsRoot
          )}' to '${path.relative(".", functionsDst)}' ...`
        );
        try {
          fs.rmSync(functionsDst, { recursive: true });
        } catch {
        }
        try {
          fs.cpSync(functionsRoot, functionsDst, { recursive: true });
        } catch {
        }
      }
    }
  };
}

export { CloudflarePagesFunctions as default };
