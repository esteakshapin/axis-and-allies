import { useEffect, useRef } from 'react';
import { Application, Graphics, Container, Sprite, Assets, Text, TextStyle } from 'pixi.js';
import type { SpaceDef, Point, GameState } from '@aa/engine';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  VICTORY_CITIES,
  CAPITALS,
  DECORATIONS,
  POWER_COLORS,
  POWER_FOLDER_NAMES,
  UNIT_SPRITE_NAMES,
  FACILITY_SPRITE_NAMES,
  SPACES_BY_ID,
} from '@aa/engine';

interface BoardProps {
  spaces: SpaceDef[];
  gameState?: GameState;
  selectedSpaceId: string | null;
  hoveredSpaceId: string | null;
  onSpaceClick: (spaceId: string | null) => void;
  onSpaceHover: (spaceId: string | null) => void;
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

export function Board({
  spaces,
  gameState,
  selectedSpaceId,
  hoveredSpaceId,
  onSpaceClick,
  onSpaceHover,
}: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const overlayRef = useRef<Container | null>(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(0.15);
  const initializedRef = useRef(false);

  // Store callbacks in refs so event handlers always access the latest version
  const spacesRef = useRef(spaces);
  const gameStateRef = useRef(gameState);
  const onSpaceClickRef = useRef(onSpaceClick);
  const onSpaceHoverRef = useRef(onSpaceHover);
  const selectedSpaceIdRef = useRef(selectedSpaceId);
  const hoveredSpaceIdRef = useRef(hoveredSpaceId);

  // Update refs when props change
  spacesRef.current = spaces;
  gameStateRef.current = gameState;
  onSpaceClickRef.current = onSpaceClick;
  onSpaceHoverRef.current = onSpaceHover;
  selectedSpaceIdRef.current = selectedSpaceId;
  hoveredSpaceIdRef.current = hoveredSpaceId;

  // Find space at a world coordinate (with wrap-around support)
  const findSpaceAtPoint = (worldX: number, worldY: number): string | null => {
    const currentSpaces = spacesRef.current;

    // Normalize X coordinate for wrap-around
    let normalizedX = worldX;
    while (normalizedX < 0) normalizedX += MAP_WIDTH;
    while (normalizedX >= MAP_WIDTH) normalizedX -= MAP_WIDTH;

    // Check spaces - prioritize land over sea for overlapping areas
    const landSpaces = currentSpaces.filter(s => s.kind === 'land');
    const seaSpaces = currentSpaces.filter(s => s.kind === 'sea');

    // Check if point is in any of the space's polygons
    const isInSpace = (space: typeof currentSpaces[0]) => {
      for (const polygon of space.polygons) {
        if (pointInPolygon({ x: normalizedX, y: worldY }, polygon)) {
          return true;
        }
      }
      return false;
    };

    // Check land first
    for (const space of landSpaces) {
      if (isInSpace(space)) {
        return space.id;
      }
    }

    // Then check sea
    for (const space of seaSpaces) {
      if (isInSpace(space)) {
        return space.id;
      }
    }

    return null;
  };

  // Draw highlight overlays for hovered/selected territories
  const drawOverlays = () => {
    const overlay = overlayRef.current;
    const currentSpaces = spacesRef.current;
    const currentSelectedId = selectedSpaceIdRef.current;
    const currentHoveredId = hoveredSpaceIdRef.current;

    if (!overlay) return;

    overlay.removeChildren();

    // Draw hovered territory outline (all polygons)
    if (currentHoveredId) {
      const space = currentSpaces.find(s => s.id === currentHoveredId);
      if (space) {
        const graphics = new Graphics();
        for (const polygon of space.polygons) {
          const flatPoly = polygon.flatMap((p) => [p.x, p.y]);

          // Semi-transparent fill
          graphics.poly(flatPoly, true);
          graphics.fill({ color: space.kind === 'sea' ? 0x4488ff : 0xffffff, alpha: 0.2 });

          // White outline
          graphics.poly(flatPoly, true);
          graphics.stroke({ color: 0xffffff, width: 2, alpha: 0.8 });
        }
        overlay.addChild(graphics);
      }
    }

    // Draw selected territory outline (all polygons)
    if (currentSelectedId && currentSelectedId !== currentHoveredId) {
      const space = currentSpaces.find(s => s.id === currentSelectedId);
      if (space) {
        const graphics = new Graphics();
        for (const polygon of space.polygons) {
          const flatPoly = polygon.flatMap((p) => [p.x, p.y]);

          // Semi-transparent fill
          graphics.poly(flatPoly, true);
          graphics.fill({ color: 0xffd700, alpha: 0.25 });

          // Gold outline
          graphics.poly(flatPoly, true);
          graphics.stroke({ color: 0xffd700, width: 3 });
        }
        overlay.addChild(graphics);
      }
    }
  };

  // Initialize Pixi only once
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const initPixi = async () => {
      const app = new Application();
      await app.init({
        background: 0x1a3a5c,
        resizeTo: containerRef.current!,
        antialias: true,
      });

      containerRef.current!.appendChild(app.canvas);
      appRef.current = app;

      // Create world container for pan/zoom
      const world = new Container();

      // Calculate minimum scale that fits the map in the viewport
      const minScaleX = app.canvas.width / MAP_WIDTH;
      const minScaleY = app.canvas.height / MAP_HEIGHT;
      const minScale = Math.max(minScaleX, minScaleY);

      // Use at least the minimum scale
      const initialScale = Math.max(scaleRef.current, minScale);
      scaleRef.current = initialScale;
      world.scale.set(initialScale);

      // Center the map initially
      const mapScaledWidth = MAP_WIDTH * initialScale;
      const mapScaledHeight = MAP_HEIGHT * initialScale;
      world.position.set(
        (app.canvas.width - mapScaledWidth) / 2,
        (app.canvas.height - mapScaledHeight) / 2
      );
      app.stage.addChild(world);
      worldRef.current = world;

      // Create overlay container for highlights (on top of map)
      const overlay = new Container();
      world.addChild(overlay);
      overlayRef.current = overlay;

      // Load and add the map image
      try {
        const texture = await Assets.load('/map/baseTiles.png');
        const mapSprite = new Sprite(texture);
        mapSprite.anchor.set(0, 0);
        mapSprite.position.set(0, 0);
        world.addChildAt(mapSprite, 0);
        console.log('Map loaded successfully');

        // Create a container for territory colors (above base map)
        const territoryColorsContainer = new Container();
        world.addChildAt(territoryColorsContainer, 1);

        // Draw filled polygons for each land territory based on controller
        const currentSpaces = spacesRef.current;
        for (const space of currentSpaces) {
          if (space.kind === 'land' && space.originalController) {
            const colorHex = POWER_COLORS[space.originalController];
            // Convert hex string like '#5a5a5a' to number 0x5a5a5a
            const colorNum = parseInt(colorHex.replace('#', ''), 16);

            const territoryGraphics = new Graphics();
            for (const polygon of space.polygons) {
              const flatPoly = polygon.flatMap((p) => [p.x, p.y]);
              // Fill with territory color
              territoryGraphics.poly(flatPoly, true);
              territoryGraphics.fill({ color: colorNum, alpha: 1 });
              // Add black border
              territoryGraphics.poly(flatPoly, true);
              territoryGraphics.stroke({ color: 0x000000, width: 1 });
            }
            territoryColorsContainer.addChild(territoryGraphics);
          }
        }
        console.log(`Rendered territory colors for ${currentSpaces.filter(s => s.kind === 'land' && s.originalController).length} territories`);

        // Load relief tiles overlay (shows terrain variations like impassable regions)
        try {
          const reliefTexture = await Assets.load('/map/reliefTiles.png');
          const reliefSprite = new Sprite(reliefTexture);
          reliefSprite.anchor.set(0, 0);
          reliefSprite.position.set(0, 0);
          reliefSprite.alpha = 0.4; // Semi-transparent for blending with territory colors
          world.addChildAt(reliefSprite, 2);
          console.log('Relief tiles loaded successfully');
        } catch (err) {
          console.warn('Failed to load relief tiles:', err);
        }

        // Create a container for decorations
        const decorationsContainer = new Container();
        world.addChildAt(decorationsContainer, 3);

        // Load decoration sprites
        for (const decoration of DECORATIONS) {
          try {
            const decoTexture = await Assets.load(`/map/${decoration.file}`);
            const decoSprite = new Sprite(decoTexture);
            decoSprite.position.set(decoration.x, decoration.y);
            decorationsContainer.addChild(decoSprite);
          } catch (err) {
            console.warn(`Failed to load decoration: ${decoration.file}`);
          }
        }
        console.log(`Loaded ${DECORATIONS.length} decorations`);

        // Create a container for markers
        const markersContainer = new Container();
        world.addChildAt(markersContainer, 4);

        // Draw victory city markers
        for (const vc of VICTORY_CITIES) {
          const marker = new Graphics();
          marker.star(vc.x, vc.y, 5, 12, 6);
          marker.fill({ color: 0xffd700 });
          marker.stroke({ color: 0x8b6914, width: 1 });
          markersContainer.addChild(marker);
        }
        console.log(`Rendered ${VICTORY_CITIES.length} victory city markers`);

        // Draw capital markers
        for (const capital of CAPITALS) {
          const marker = new Graphics();
          marker.star(capital.x, capital.y, 5, 16, 8);
          marker.fill({ color: 0xff4444 });
          marker.stroke({ color: 0xffffff, width: 2 });
          markersContainer.addChild(marker);
        }
        console.log(`Rendered ${CAPITALS.length} capital markers`);

        // Create a container for units
        const unitsContainer = new Container();
        world.addChildAt(unitsContainer, 5);

        // Helper to render a row of items centered
        const renderRow = async (
          container: Container,
          items: { path: string; count: number }[],
          rowY: number,
          scale: number,
          spacing: number
        ) => {
          if (items.length === 0) return;
          const totalWidth = (items.length - 1) * spacing;
          const startX = -totalWidth / 2;

          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            try {
              const texture = await Assets.load(item.path);
              const sprite = new Sprite(texture);
              sprite.anchor.set(0.5, 0.5);
              sprite.scale.set(scale);
              sprite.position.set(startX + i * spacing, rowY);
              container.addChild(sprite);

              // Add count badge if more than 1
              if (item.count > 1) {
                const countText = new Text({
                  text: item.count.toString(),
                  style: new TextStyle({
                    fontSize: 18,
                    fontWeight: 'bold',
                    fill: 0xffffff,
                    stroke: { color: 0x000000, width: 4 },
                  }),
                });
                countText.anchor.set(0.5, 0.5);
                countText.position.set(startX + i * spacing + 15, rowY + 12);
                container.addChild(countText);
              }
            } catch (err) {
              // Skip missing sprites
            }
          }
        };

        // Render units from game state
        const currentGameState = gameStateRef.current;
        if (currentGameState) {
          let totalUnits = 0;
          const UNIT_SCALE = 0.7;
          const FACILITY_SCALE = 0.8;
          const UNIT_SPACING = 40;
          const ROW_HEIGHT = 45;

          // Define unit categories
          const LAND_UNITS = ['infantry', 'artillery', 'mechanized_infantry', 'tank', 'aaa'];
          const AIR_UNITS = ['fighter', 'tactical_bomber', 'strategic_bomber'];
          const SURFACE_SHIPS = ['cruiser', 'destroyer', 'transport'];

          for (const [spaceId, spaceState] of Object.entries(currentGameState.spaces)) {
            if (spaceState.units.length === 0 && spaceState.facilities.length === 0) continue;

            const spaceDef = SPACES_BY_ID.get(spaceId);
            if (!spaceDef) continue;

            const baseX = spaceDef.labelAnchor.x;
            const baseY = spaceDef.labelAnchor.y;
            const isSeaZone = spaceDef.kind === 'sea';

            // Create a container for this space centered at label anchor
            const spaceContainer = new Container();
            spaceContainer.position.set(baseX, baseY);

            if (isSeaZone) {
              // SEA ZONE LAYOUT:
              // Row 1: Carriers
              // Row 2: Battleships (with carriers if any)
              // Row 3: Cruisers, Destroyers, Transports
              // Row 4: Submarines
              // Air units on carriers shown with carriers

              const carriers = spaceState.units.filter(u => u.type === 'carrier');
              const capitalShips = spaceState.units.filter(u => u.type === 'battleship');
              const surfaceShips = spaceState.units.filter(u => SURFACE_SHIPS.includes(u.type));
              const subs = spaceState.units.filter(u => u.type === 'submarine');
              const airOnCarriers = spaceState.units.filter(u => AIR_UNITS.includes(u.type));

              // Collect rows of units
              const rowItems: { path: string; count: number }[][] = [];

              // Row for carriers + their aircraft
              if (carriers.length > 0 || airOnCarriers.length > 0) {
                const row1Items: { path: string; count: number }[] = [];
                for (const stack of carriers) {
                  row1Items.push({
                    path: `/map/units/${POWER_FOLDER_NAMES[stack.power]}/${UNIT_SPRITE_NAMES[stack.type]}.png`,
                    count: stack.count,
                  });
                }
                for (const stack of airOnCarriers) {
                  row1Items.push({
                    path: `/map/units/${POWER_FOLDER_NAMES[stack.power]}/${UNIT_SPRITE_NAMES[stack.type]}.png`,
                    count: stack.count,
                  });
                }
                if (row1Items.length > 0) rowItems.push(row1Items);
              }

              // Row for battleships
              if (capitalShips.length > 0) {
                const row2Items: { path: string; count: number }[] = [];
                for (const stack of capitalShips) {
                  row2Items.push({
                    path: `/map/units/${POWER_FOLDER_NAMES[stack.power]}/${UNIT_SPRITE_NAMES[stack.type]}.png`,
                    count: stack.count,
                  });
                }
                if (row2Items.length > 0) rowItems.push(row2Items);
              }

              // Row for surface ships
              if (surfaceShips.length > 0) {
                const row3Items: { path: string; count: number }[] = [];
                for (const stack of surfaceShips) {
                  row3Items.push({
                    path: `/map/units/${POWER_FOLDER_NAMES[stack.power]}/${UNIT_SPRITE_NAMES[stack.type]}.png`,
                    count: stack.count,
                  });
                }
                if (row3Items.length > 0) rowItems.push(row3Items);
              }

              // Row for submarines
              if (subs.length > 0) {
                const row4Items: { path: string; count: number }[] = [];
                for (const stack of subs) {
                  row4Items.push({
                    path: `/map/units/${POWER_FOLDER_NAMES[stack.power]}/${UNIT_SPRITE_NAMES[stack.type]}.png`,
                    count: stack.count,
                  });
                }
                if (row4Items.length > 0) rowItems.push(row4Items);
              }

              // Center all rows vertically
              const totalHeight = (rowItems.length - 1) * ROW_HEIGHT;
              const startY = -totalHeight / 2;

              for (let r = 0; r < rowItems.length; r++) {
                await renderRow(spaceContainer, rowItems[r], startY + r * ROW_HEIGHT, UNIT_SCALE, UNIT_SPACING);
                totalUnits += rowItems[r].length;
              }

            } else {
              // LAND TERRITORY LAYOUT:
              // Row 1: Facilities (ICs, bases)
              // Row 2: Land units
              // Row 3: Air units

              const controller = spaceState.controller;
              const rowItems: { path: string; count: number }[][] = [];

              // Row 1: Facilities
              if (spaceState.facilities.length > 0 && controller) {
                const facilityItems: { path: string; count: number }[] = [];
                for (const facility of spaceState.facilities) {
                  facilityItems.push({
                    path: `/map/units/${POWER_FOLDER_NAMES[controller]}/${FACILITY_SPRITE_NAMES[facility.type]}.png`,
                    count: 1,
                  });
                }
                if (facilityItems.length > 0) rowItems.push(facilityItems);
              }

              // Row 2: Land units
              const landUnits = spaceState.units.filter(u => LAND_UNITS.includes(u.type));
              if (landUnits.length > 0) {
                const landItems: { path: string; count: number }[] = [];
                for (const stack of landUnits) {
                  landItems.push({
                    path: `/map/units/${POWER_FOLDER_NAMES[stack.power]}/${UNIT_SPRITE_NAMES[stack.type]}.png`,
                    count: stack.count,
                  });
                }
                if (landItems.length > 0) rowItems.push(landItems);
              }

              // Row 3: Air units
              const airUnits = spaceState.units.filter(u => AIR_UNITS.includes(u.type));
              if (airUnits.length > 0) {
                const airItems: { path: string; count: number }[] = [];
                for (const stack of airUnits) {
                  airItems.push({
                    path: `/map/units/${POWER_FOLDER_NAMES[stack.power]}/${UNIT_SPRITE_NAMES[stack.type]}.png`,
                    count: stack.count,
                  });
                }
                if (airItems.length > 0) rowItems.push(airItems);
              }

              // Center all rows vertically
              const totalHeight = (rowItems.length - 1) * ROW_HEIGHT;
              const startY = -totalHeight / 2;

              for (let r = 0; r < rowItems.length; r++) {
                const scale = r === 0 ? FACILITY_SCALE : UNIT_SCALE; // Facilities slightly larger
                await renderRow(spaceContainer, rowItems[r], startY + r * ROW_HEIGHT, scale, UNIT_SPACING);
                totalUnits += rowItems[r].length;
              }
            }

            if (spaceContainer.children.length > 0) {
              unitsContainer.addChild(spaceContainer);
            }
          }
          console.log(`Rendered ${totalUnits} unit/facility sprites`);
        }

      } catch (error) {
        console.error('Failed to load map:', error);
      }

      // Mouse events for pan
      const canvas = app.canvas;

      // Helper to constrain world position so map stays in view
      const constrainWorldPosition = (world: Container, scale: number) => {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const mapScaledWidth = MAP_WIDTH * scale;
        const mapScaledHeight = MAP_HEIGHT * scale;

        // Constrain X: map edges should not go past viewport edges
        if (mapScaledWidth <= canvasWidth) {
          // Map fits in viewport, center it
          world.position.x = (canvasWidth - mapScaledWidth) / 2;
        } else {
          // Map is larger than viewport, constrain edges
          world.position.x = Math.min(0, Math.max(canvasWidth - mapScaledWidth, world.position.x));
        }

        // Constrain Y: map edges should not go past viewport edges
        if (mapScaledHeight <= canvasHeight) {
          // Map fits in viewport, center it
          world.position.y = (canvasHeight - mapScaledHeight) / 2;
        } else {
          // Map is larger than viewport, constrain edges
          world.position.y = Math.min(0, Math.max(canvasHeight - mapScaledHeight, world.position.y));
        }
      };

      canvas.addEventListener('mousedown', (e: MouseEvent) => {
        if (e.button === 0) {
          isDraggingRef.current = true;
          lastPosRef.current = { x: e.clientX, y: e.clientY };
        }
      });

      canvas.addEventListener('mousemove', (e: MouseEvent) => {
        const currentWorld = worldRef.current;
        if (!currentWorld) return;

        if (isDraggingRef.current) {
          const dx = e.clientX - lastPosRef.current.x;
          const dy = e.clientY - lastPosRef.current.y;
          currentWorld.position.x += dx;
          currentWorld.position.y += dy;
          lastPosRef.current = { x: e.clientX, y: e.clientY };
          // Constrain position while dragging
          constrainWorldPosition(currentWorld, scaleRef.current);
        } else {
          // Hit test for hover
          const rect = canvas.getBoundingClientRect();
          const canvasX = e.clientX - rect.left;
          const canvasY = e.clientY - rect.top;
          const worldX = (canvasX - currentWorld.position.x) / scaleRef.current;
          const worldY = (canvasY - currentWorld.position.y) / scaleRef.current;
          const spaceId = findSpaceAtPoint(worldX, worldY);
          onSpaceHoverRef.current(spaceId);
        }
      });

      canvas.addEventListener('mouseup', () => {
        isDraggingRef.current = false;
      });

      canvas.addEventListener('mouseleave', () => {
        isDraggingRef.current = false;
        onSpaceHoverRef.current(null);
      });

      canvas.addEventListener('click', (e: MouseEvent) => {
        const currentWorld = worldRef.current;
        if (!currentWorld) return;

        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const worldX = (canvasX - currentWorld.position.x) / scaleRef.current;
        const worldY = (canvasY - currentWorld.position.y) / scaleRef.current;
        const spaceId = findSpaceAtPoint(worldX, worldY);
        onSpaceClickRef.current(spaceId);
      });

      // Zoom with wheel
      canvas.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        const currentWorld = worldRef.current;
        if (!currentWorld) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate minimum scale that fits the map in the viewport
        const minScaleX = canvas.width / MAP_WIDTH;
        const minScaleY = canvas.height / MAP_HEIGHT;
        const minScale = Math.max(minScaleX, minScaleY);

        const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(minScale, Math.min(2, scaleRef.current * scaleFactor));

        const worldXBefore = (mouseX - currentWorld.position.x) / scaleRef.current;
        const worldYBefore = (mouseY - currentWorld.position.y) / scaleRef.current;

        scaleRef.current = newScale;
        currentWorld.scale.set(newScale);

        const worldXAfter = (mouseX - currentWorld.position.x) / newScale;
        const worldYAfter = (mouseY - currentWorld.position.y) / newScale;

        currentWorld.position.x += (worldXAfter - worldXBefore) * newScale;
        currentWorld.position.y += (worldYAfter - worldYBefore) * newScale;

        // Constrain position after zoom
        constrainWorldPosition(currentWorld, newScale);
      });

      // Initial overlay draw
      drawOverlays();
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
        initializedRef.current = false;
      }
    };
  }, []); // Empty dependency array - only run once

  // Redraw overlays when selection changes
  useEffect(() => {
    drawOverlays();
  }, [selectedSpaceId, hoveredSpaceId]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
      }}
    />
  );
}
