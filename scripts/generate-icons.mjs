// One-off generator: rasterizes app/icon.svg into favicon.ico and apple-icon.png
// using the sharp instance bundled with Next (no new dependency).
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("public/icons", { recursive: true });

const ICON_SVG = "app/icon.svg";

const MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="0" y="0" width="64" height="64" fill="#005a71" />
  <g transform="translate(8 8) scale(2)" fill="#ffffff">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </g>
</svg>`;

const APPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="0" y="0" width="64" height="64" fill="#005a71" />
  <g transform="translate(8 8) scale(2)" fill="#ffffff">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </g>
</svg>`;

function icoFromPngs(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dirEntrySize = 16;
  const dirStart = 6;
  const dirSize = dirEntrySize * entries.length;

  let cursor = dirStart + dirSize;
  const dirChunks = [];
  const pngChunks = [];
  for (const { size, png } of entries) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(cursor, 12);
    cursor += png.length;
    dirChunks.push(entry);
    pngChunks.push(png);
  }

  return Buffer.concat([header, ...dirChunks, ...pngChunks]);
}

const svg = await readFile(ICON_SVG);
const sizes = [16, 32, 48];

const pngs = await Promise.all(
  sizes.map(async (size) => {
    const png = await sharp(svg).resize(size, size).png().toBuffer();
    return { size, png };
  }),
);

await writeFile("app/favicon.ico", icoFromPngs(pngs));

const appleIcon = await sharp(Buffer.from(APPLE_SVG))
  .resize(180, 180)
  .png()
  .toBuffer();
await writeFile("app/apple-icon.png", appleIcon);

const pwaIcons = [
  { file: "public/icons/icon-192.png", size: 192, src: svg, maskable: false },
  { file: "public/icons/icon-512.png", size: 512, src: svg, maskable: false },
  {
    file: "public/icons/icon-maskable-192.png",
    size: 192,
    src: Buffer.from(MASKABLE_SVG),
    maskable: true,
  },
  {
    file: "public/icons/icon-maskable-512.png",
    size: 512,
    src: Buffer.from(MASKABLE_SVG),
    maskable: true,
  },
];

for (const icon of pwaIcons) {
  const png = await sharp(icon.src).resize(icon.size, icon.size).png().toBuffer();
  await writeFile(icon.file, png);
}

console.log("generated app/favicon.ico, app/apple-icon.png and public/icons/*");