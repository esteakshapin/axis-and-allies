'use client';

import { useEffect, useRef } from 'react';
import { Application, Graphics, Container, Sprite, Assets, Text, TextStyle } from 'pixi.js';
import type { SpaceDef, Point } from '@aa/engine';
import { MAP_WIDTH, MAP_HEIGHT, VICTORY_CITIES, CAPITALS, DECORATIONS, POWER_COLORS } from '@aa/engine';

interface BoardProps {
  spaces: SpaceDef[];
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
  const onSpaceClickRef = useRef(onSpaceClick);
  const onSpaceHoverRef = useRef(onSpaceHover);
  const selectedSpaceIdRef = useRef(selectedSpaceId);
  const hoveredSpaceIdRef = useRef(hoveredSpaceId);

  // Update refs when props change
  spacesRef.current = spaces;
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
      const initialScale = scaleRef.current;
      world.scale.set(initialScale);
      world.position.set(
        -2000 * initialScale + app.canvas.width / 2,
        -500 * initialScale + app.canvas.height / 2
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

      } catch (error) {
        console.error('Failed to load map:', error);
      }

      // Mouse events for pan
      const canvas = app.canvas;

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

        const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.05, Math.min(2, scaleRef.current * scaleFactor));

        const worldXBefore = (mouseX - currentWorld.position.x) / scaleRef.current;
        const worldYBefore = (mouseY - currentWorld.position.y) / scaleRef.current;

        scaleRef.current = newScale;
        currentWorld.scale.set(newScale);

        const worldXAfter = (mouseX - currentWorld.position.x) / newScale;
        const worldYAfter = (mouseY - currentWorld.position.y) / newScale;

        currentWorld.position.x += (worldXAfter - worldXBefore) * newScale;
        currentWorld.position.y += (worldYAfter - worldYBefore) * newScale;
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
