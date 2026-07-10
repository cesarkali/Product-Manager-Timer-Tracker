// Build da extensão Chrome do PMTT (esbuild). Uso:
//   npm run ext:build          → build único em extension/dist
//   npm run ext:watch          → rebuild automático ao salvar
//
// A configuração do Firebase é lida do .env da raiz (mesmos NEXT_PUBLIC_* do
// app web) e injetada nos bundles — a extensão sempre aponta para o mesmo
// ambiente (produção/homolog) que estiver ativo no .env.
import esbuild from "esbuild";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateIcons } from "./scripts/make-icons.mjs";

const extDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(extDir, "..");
const distDir = path.join(extDir, "dist");
const watch = process.argv.includes("--watch");

function parseEnvFile(file) {
  const map = {};
  if (!existsSync(file)) return map;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    map[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return map;
}

const env = {
  ...parseEnvFile(path.join(rootDir, ".env")),
  ...parseEnvFile(path.join(rootDir, ".env.local")),
};

const FIREBASE_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const missing = FIREBASE_KEYS.filter((key) => !env[key]);
if (missing.length > 0) {
  console.error(`Faltam variáveis no .env da raiz: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Firebase: projeto "${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}" (do .env da raiz)`);

const define = { "process.env.NODE_ENV": '"production"' };
for (const key of FIREBASE_KEYS) {
  define[`process.env.${key}`] = JSON.stringify(env[key]);
}

function copyStatic() {
  mkdirSync(distDir, { recursive: true });
  copyFileSync(path.join(extDir, "manifest.json"), path.join(distDir, "manifest.json"));
  const publicDir = path.join(extDir, "public");
  for (const file of readdirSync(publicDir)) {
    copyFileSync(path.join(publicDir, file), path.join(distDir, file));
  }
  generateIcons(path.join(distDir, "icons"));
}

const buildOptions = {
  entryPoints: {
    background: path.join(extDir, "src", "background", "index.ts"),
    popup: path.join(extDir, "src", "popup", "index.tsx"),
    options: path.join(extDir, "src", "options", "index.tsx"),
    content: path.join(extDir, "src", "content", "index.tsx"),
  },
  bundle: true,
  outdir: distDir,
  format: "iife",
  target: ["chrome120"],
  jsx: "automatic",
  define,
  alias: { "@": path.join(rootDir, "src") },
  minify: true,
  sourcemap: false,
  legalComments: "none",
  logLevel: "info",
};

copyStatic();

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("Observando mudanças… (Ctrl+C para sair)");
} else {
  await esbuild.build(buildOptions);
  console.log(`Extensão pronta em ${distDir}`);
}
