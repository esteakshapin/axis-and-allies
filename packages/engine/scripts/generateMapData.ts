/**
 * Script to parse TripleA map files and generate globalMap.ts
 * Run with: npx tsx scripts/generateMapData.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAP_DIR = path.join(__dirname, '../../../map');
const OUTPUT_FILE = path.join(__dirname, '../src/globalMap.ts');

// Power type from types.ts
type Power =
  | 'germany'
  | 'soviet_union'
  | 'japan'
  | 'united_states'
  | 'china'
  | 'united_kingdom'
  | 'italy'
  | 'anzac'
  | 'france'
  | 'dutch'
  | 'mongolians'
  | 'neutral_true'
  | 'neutral_allies'
  | 'neutral_axis';

// Map TripleA faction names to our Power type
const TRIPLEA_TO_POWER: Record<string, Power> = {
  'Germans': 'germany',
  'Russians': 'soviet_union',
  'Japanese': 'japan',
  'Americans': 'united_states',
  'Chinese': 'china',
  'British': 'united_kingdom',
  'Italians': 'italy',
  'ANZAC': 'anzac',
  'French': 'france',
  'Dutch': 'dutch',
  'Mongolians': 'mongolians',
  'Neutral_True': 'neutral_true',
  'Neutral_Allies': 'neutral_allies',
  'Neutral_Axis': 'neutral_axis',
};

function normalizePower(tripleaName: string): Power | undefined {
  return TRIPLEA_TO_POWER[tripleaName];
}

interface Point {
  x: number;
  y: number;
}

interface TerritoryData {
  id: string;
  name: string;
  kind: 'land' | 'sea';
  polygons: Point[][];  // Array of polygons (for islands, etc.)
  labelAnchor: Point;
  neighbors: string[];
  ipcValue?: number;
  isVictoryCity?: boolean;
  originalController?: Power;
}

// Parse polygons.txt - territory boundary polygons
// Format: Territory Name  <  (x1,y1) (x2,y2) ... >  <  (x1,y1) ... >
// Territories can have multiple polygons (e.g., islands)
function parsePolygons(content: string): Map<string, Point[][]> {
  const result = new Map<string, Point[][]>();

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Split by '<' to get territory name and polygon sections
    const firstLt = trimmed.indexOf('<');
    if (firstLt < 0) continue;

    const name = trimmed.substring(0, firstLt).trim();
    if (!name) continue;

    const polygonsPart = trimmed.substring(firstLt);

    // Extract each polygon section between < and >
    const polygonMatches = polygonsPart.matchAll(/<\s*(.*?)\s*>/g);
    const polygons: Point[][] = [];

    for (const polygonMatch of polygonMatches) {
      const polygonContent = polygonMatch[1];
      const coordMatches = polygonContent.matchAll(/\((\d+),(\d+)\)/g);
      const points: Point[] = [];

      for (const match of coordMatches) {
        points.push({
          x: parseInt(match[1], 10),
          y: parseInt(match[2], 10),
        });
      }

      if (points.length >= 3) {
        polygons.push(points);
      }
    }

    if (polygons.length > 0) {
      result.set(name, polygons);
    }
  }

  return result;
}

// Parse centers.txt - territory center points
function parseCenters(content: string): Map<string, Point> {
  const result = new Map<string, Point>();

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Format: Territory Name  (x, y)
    const match = trimmed.match(/^(.+?)\s+\((\d+),\s*(\d+)\)/);
    if (match) {
      result.set(match[1].trim(), {
        x: parseInt(match[2], 10),
        y: parseInt(match[3], 10),
      });
    }
  }

  return result;
}

// Parse XML for territory data
function parseXML(content: string): {
  seaZones: Set<string>;
  connections: Map<string, Set<string>>;
  production: Map<string, number>;
  victoryCities: Set<string>;
  originalOwners: Map<string, string>;
} {
  const seaZones = new Set<string>();
  const connections = new Map<string, Set<string>>();
  const production = new Map<string, number>();
  const victoryCities = new Set<string>();
  const originalOwners = new Map<string, string>();

  // Find sea zones: <territory name="X Sea Zone" water="true"/>
  const waterMatches = content.matchAll(/<territory\s+name="([^"]+)"\s+water="true"/g);
  for (const match of waterMatches) {
    seaZones.add(match[1]);
  }

  // Find connections: <connection t1="X" t2="Y"/>
  const connMatches = content.matchAll(/<connection\s+t1="([^"]+)"\s+t2="([^"]+)"/g);
  for (const match of connMatches) {
    const t1 = match[1];
    const t2 = match[2];

    if (!connections.has(t1)) connections.set(t1, new Set());
    if (!connections.has(t2)) connections.set(t2, new Set());

    connections.get(t1)!.add(t2);
    connections.get(t2)!.add(t1);
  }

  // Find territory attachments for production values and victory cities
  // <attachment name="territoryAttachment" attachTo="Germany" ... type="territory">
  //   <option name="production" value="5"/>
  //   <option name="victoryCity" value="1"/>
  // </attachment>
  const attachmentRegex = /<attachment[^>]*attachTo="([^"]+)"[^>]*type="territory"[^>]*>([\s\S]*?)<\/attachment>/g;
  let attachMatch;
  while ((attachMatch = attachmentRegex.exec(content)) !== null) {
    const territory = attachMatch[1];
    const attachmentContent = attachMatch[2];

    // Production value
    const prodMatch = attachmentContent.match(/<option\s+name="production"\s+value="(\d+)"/);
    if (prodMatch) {
      production.set(territory, parseInt(prodMatch[1], 10));
    }

    // Victory city
    const vcMatch = attachmentContent.match(/<option\s+name="victoryCity"\s+value="(\d+)"/);
    if (vcMatch && parseInt(vcMatch[1], 10) > 0) {
      victoryCities.add(territory);
    }
  }

  // Find original ownership from <initialize> section
  // <unitInitialize>
  //   <unitPlacement unitType="infantry" territory="Germany" quantity="2" owner="Germans"/>
  // </unitInitialize>
  // Actually, let's get it from ownerInitialize:
  // <ownerInitialize>
  //   <territoryOwner territory="Caroline Islands" owner="Japanese"/>
  // </ownerInitialize>
  const ownerMatches = content.matchAll(/<territoryOwner\s+territory="([^"]+)"\s+owner="([^"]+)"/g);
  for (const match of ownerMatches) {
    originalOwners.set(match[1], match[2]);
  }

  return { seaZones, connections, production, victoryCities, originalOwners };
}

// Main generation function
function generateMapData() {
  console.log('Reading TripleA map files...');

  const polygonsContent = fs.readFileSync(path.join(MAP_DIR, 'polygons.txt'), 'utf-8');
  const centersContent = fs.readFileSync(path.join(MAP_DIR, 'centers.txt'), 'utf-8');
  const xmlContent = fs.readFileSync(path.join(MAP_DIR, 'games/global_40_expansion.xml'), 'utf-8');

  console.log('Parsing polygons.txt...');
  const polygonsMap = parsePolygons(polygonsContent);
  console.log(`  Found ${polygonsMap.size} territories with polygons`);

  console.log('Parsing centers.txt...');
  const centers = parseCenters(centersContent);
  console.log(`  Found ${centers.size} territory centers`);

  console.log('Parsing XML...');
  const { seaZones, connections, production, victoryCities, originalOwners } = parseXML(xmlContent);
  console.log(`  Found ${seaZones.size} sea zones`);
  console.log(`  Found ${connections.size} territories with connections`);
  console.log(`  Found ${production.size} territories with production values`);
  console.log(`  Found ${victoryCities.size} victory cities`);
  console.log(`  Found ${originalOwners.size} territories with owners`);

  // Combine all data
  const territories: TerritoryData[] = [];

  for (const [name, polygons] of polygonsMap) {
    const center = centers.get(name);
    const neighborSet = connections.get(name);

    // Calculate centroid if no center defined (use first polygon)
    let labelAnchor: Point;
    if (center) {
      labelAnchor = center;
    } else {
      // Calculate centroid of first polygon
      const firstPoly = polygons[0];
      const sumX = firstPoly.reduce((sum, p) => sum + p.x, 0);
      const sumY = firstPoly.reduce((sum, p) => sum + p.y, 0);
      labelAnchor = {
        x: Math.round(sumX / firstPoly.length),
        y: Math.round(sumY / firstPoly.length),
      };
    }

    const territory: TerritoryData = {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      kind: seaZones.has(name) ? 'sea' : 'land',
      polygons,
      labelAnchor,
      neighbors: neighborSet ? Array.from(neighborSet) : [],
    };

    // Add land-specific properties
    if (territory.kind === 'land') {
      const prodValue = production.get(name);
      if (prodValue !== undefined) {
        territory.ipcValue = prodValue;
      }

      if (victoryCities.has(name)) {
        territory.isVictoryCity = true;
      }

      const owner = originalOwners.get(name);
      if (owner) {
        const normalizedPower = normalizePower(owner);
        if (normalizedPower) {
          territory.originalController = normalizedPower;
        } else {
          console.warn(`  Warning: Unknown owner "${owner}" for territory "${name}"`);
        }
      }
    }

    territories.push(territory);
  }

  console.log(`\nTotal territories: ${territories.length}`);
  console.log(`  Land: ${territories.filter(t => t.kind === 'land').length}`);
  console.log(`  Sea: ${territories.filter(t => t.kind === 'sea').length}`);

  // Parse additional coordinate files
  console.log('\nParsing additional coordinate files...');

  // Victory cities
  const vcContent = fs.readFileSync(path.join(MAP_DIR, 'vc.txt'), 'utf-8');
  const victoryCityCoords = parseCenters(vcContent);
  console.log(`  Found ${victoryCityCoords.size} victory city coordinates`);

  // Capitals
  const capitolsContent = fs.readFileSync(path.join(MAP_DIR, 'capitols.txt'), 'utf-8');
  const capitalCoords = parseCenters(capitolsContent);
  console.log(`  Found ${capitalCoords.size} capital coordinates`);

  // PU placements
  const puContent = fs.readFileSync(path.join(MAP_DIR, 'pu_place.txt'), 'utf-8');
  const puPlacements = parseCenters(puContent);
  console.log(`  Found ${puPlacements.size} PU placement coordinates`);

  // Convert to arrays for export
  const victoryCitiesArray = Array.from(victoryCityCoords.entries()).map(([territory, coord]) => ({
    territory,
    x: coord.x,
    y: coord.y,
  }));

  const capitalsArray = Array.from(capitalCoords.entries()).map(([territory, coord]) => ({
    territory,
    x: coord.x,
    y: coord.y,
  }));

  const puPlacementsRecord: Record<string, { x: number; y: number }> = {};
  for (const [territory, coord] of puPlacements) {
    puPlacementsRecord[territory] = { x: coord.x, y: coord.y };
  }

  // Parse decorations
  const decorationsContent = fs.readFileSync(path.join(MAP_DIR, 'decorations.txt'), 'utf-8');
  const decorationsArray: Array<{ file: string; x: number; y: number }> = [];
  for (const line of decorationsContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    // Format: filename.png (x,y)
    const match = trimmed.match(/^(.+\.png)\s+\((\d+),\s*(\d+)\)/);
    if (match) {
      decorationsArray.push({
        file: match[1],
        x: parseInt(match[2], 10),
        y: parseInt(match[3], 10),
      });
    }
  }
  console.log(`  Found ${decorationsArray.length} decorations`);

  // Filter to only include key decorations we've copied to public folder
  const keyDecorations = decorationsArray.filter(d =>
    d.file.startsWith('cs_') ||
    d.file.startsWith('Impassable-') ||
    d.file.startsWith('Pro-')
  );
  console.log(`  Filtered to ${keyDecorations.length} key decorations`);

  // Generate TypeScript file
  console.log('\nGenerating globalMap.ts...');

  const output = `// AUTO-GENERATED FILE - DO NOT EDIT
// Generated from TripleA map files by generateMapData.ts

import type { SpaceDef, Point } from './types';

export const MAP_WIDTH = 7705;
export const MAP_HEIGHT = 3213;
export const MAP_SCROLL_WRAP_X = true;

export const GLOBAL_SPACES: SpaceDef[] = ${JSON.stringify(territories, null, 2)
    .replace(/"id":/g, 'id:')
    .replace(/"name":/g, 'name:')
    .replace(/"kind":/g, 'kind:')
    .replace(/"polygons":/g, 'polygons:')
    .replace(/"labelAnchor":/g, 'labelAnchor:')
    .replace(/"neighbors":/g, 'neighbors:')
    .replace(/"ipcValue":/g, 'ipcValue:')
    .replace(/"isVictoryCity":/g, 'isVictoryCity:')
    .replace(/"originalController":/g, 'originalController:')
    .replace(/"x":/g, 'x:')
    .replace(/"y":/g, 'y:')
    .replace(/"land"/g, "'land'")
    .replace(/"sea"/g, "'sea'")
};

// Victory city coordinates from vc.txt
export const VICTORY_CITIES: Array<{ territory: string; x: number; y: number }> = ${JSON.stringify(victoryCitiesArray, null, 2)
    .replace(/"territory":/g, 'territory:')
    .replace(/"x":/g, 'x:')
    .replace(/"y":/g, 'y:')
};

// Capital coordinates from capitols.txt
export const CAPITALS: Array<{ territory: string; x: number; y: number }> = ${JSON.stringify(capitalsArray, null, 2)
    .replace(/"territory":/g, 'territory:')
    .replace(/"x":/g, 'x:')
    .replace(/"y":/g, 'y:')
};

// PU (IPC) placement coordinates from pu_place.txt
export const PU_PLACEMENTS: Record<string, { x: number; y: number }> = ${JSON.stringify(puPlacementsRecord, null, 2)
    .replace(/"x":/g, 'x:')
    .replace(/"y":/g, 'y:')
};

// Decoration overlays (canals, impassable markers, neutral markers)
export const DECORATIONS: Array<{ file: string; x: number; y: number }> = ${JSON.stringify(keyDecorations, null, 2)
    .replace(/"file":/g, 'file:')
    .replace(/"x":/g, 'x:')
    .replace(/"y":/g, 'y:')
};

// Quick lookup by ID
export const SPACES_BY_ID = new Map<string, SpaceDef>(
  GLOBAL_SPACES.map(space => [space.id, space])
);

// Quick lookup by name
export const SPACES_BY_NAME = new Map<string, SpaceDef>(
  GLOBAL_SPACES.map(space => [space.name, space])
);

export function getSpaceById(id: string): SpaceDef | undefined {
  return SPACES_BY_ID.get(id);
}

export function getSpaceByName(name: string): SpaceDef | undefined {
  return SPACES_BY_NAME.get(name);
}
`;

  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`Written to ${OUTPUT_FILE}`);
}

generateMapData();
