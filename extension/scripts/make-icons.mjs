// Gera os ícones PNG da extensão (16/32/48/128) sem dependências: quadrado
// arredondado com gradiente violeta (marca do PMTT), brilho suave no topo e
// triângulo de "play" branco com sombra. Encoder PNG mínimo — zlib do Node +
// CRC32 manual.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}

function encodePng(size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // Linhas cruas prefixadas com filtro 0 (nenhum).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Gradiente diagonal da marca: violeta claro (topo-esquerda) → índigo profundo.
const GRAD_A = [157, 140, 255]; // #9d8cff
const GRAD_B = [70, 48, 168]; // #4630a8
const FG = [255, 255, 255];

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function insideRoundedSquare(u, v) {
  const radius = 0.24;
  const min = radius;
  const max = 1 - radius;
  const cx = u < min ? min : u > max ? max : u;
  const cy = v < min ? min : v > max ? max : v;
  const dx = u - cx;
  const dy = v - cy;
  return dx * dx + dy * dy <= radius * radius;
}

// Triângulo de play: A/B na vertical esquerda, C na ponta direita
// (levemente deslocado à direita para centralizar opticamente).
const TRI = { ax: 0.385, ay: 0.3, bx: 0.385, by: 0.7, cx: 0.77, cy: 0.5 };

function insideTriangle(u, v) {
  const { ax, ay, bx, by, cx, cy } = TRI;
  const d1 = (u - bx) * (ay - by) - (ax - bx) * (v - by);
  const d2 = (u - cx) * (by - cy) - (bx - cx) * (v - cy);
  const d3 = (u - ax) * (cy - ay) - (cx - ax) * (v - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/** Cor de um subpixel dentro do quadrado: gradiente + brilho + sombra + play. */
function samplePixel(u, v) {
  if (insideTriangle(u, v)) return FG;
  // Gradiente diagonal com leve brilho radial no topo.
  let color = mix(GRAD_A, GRAD_B, (u + v) / 2);
  const highlight = Math.max(0, 0.18 * (1 - v * 2.4));
  if (highlight > 0) color = mix(color, FG, highlight);
  // Sombra suave do play, deslocada para baixo.
  if (insideTriangle(u, v - 0.035)) color = mix(color, [0, 0, 0], 0.22);
  return color;
}

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const samples = 4; // supersampling 4x4 para bordas suaves
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const u = (x + (sx + 0.5) / samples) / size;
          const v = (y + (sy + 0.5) / samples) / size;
          if (!insideRoundedSquare(u, v)) continue;
          const [pr, pg, pb] = samplePixel(u, v);
          r += pr;
          g += pg;
          b += pb;
          a += 255;
        }
      }
      const total = samples * samples;
      const offset = (y * size + x) * 4;
      const alpha = a / total;
      // Componentes de cor médias apenas dos subpixels cobertos.
      const covered = a / 255 || 1;
      rgba[offset] = Math.round(r / covered);
      rgba[offset + 1] = Math.round(g / covered);
      rgba[offset + 2] = Math.round(b / covered);
      rgba[offset + 3] = Math.round(alpha);
    }
  }
  return rgba;
}

export function generateIcons(outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const size of [16, 32, 48, 128]) {
    const png = encodePng(size, renderIcon(size));
    writeFileSync(path.join(outDir, `icon${size}.png`), png);
  }
}

const isDirectRun =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectRun) {
  const extDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  generateIcons(path.join(extDir, "dist", "icons"));
  console.log("Ícones gerados em extension/dist/icons.");
}
