/**
 * Script to combine relief tiles into a single image
 * Run with: npx tsx scripts/combineReliefTiles.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TILES_DIR = path.join(__dirname, '../../../map/reliefTiles');
const OUTPUT_FILE = path.join(__dirname, '../../../map/reliefTiles.png');

const TILE_SIZE = 256;
const COLS = 31;  // 0-30
const ROWS = 13;  // 0-12

async function combineReliefTiles() {
  console.log('Combining relief tiles...');
  console.log(`Grid: ${COLS}x${ROWS} tiles (${TILE_SIZE}px each)`);

  // Create array of composite operations
  const composites: { input: string; left: number; top: number }[] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tilePath = path.join(TILES_DIR, `${col}_${row}.png`);
      if (fs.existsSync(tilePath)) {
        composites.push({
          input: tilePath,
          left: col * TILE_SIZE,
          top: row * TILE_SIZE,
        });
      } else {
        console.warn(`Missing tile: ${col}_${row}.png`);
      }
    }
  }

  console.log(`Found ${composites.length} tiles`);

  // Create blank canvas and composite all tiles
  const width = COLS * TILE_SIZE;
  const height = ROWS * TILE_SIZE;

  console.log(`Creating ${width}x${height} image...`);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(OUTPUT_FILE);

  console.log(`Written to ${OUTPUT_FILE}`);

  // Get file size
  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

combineReliefTiles().catch(console.error);
