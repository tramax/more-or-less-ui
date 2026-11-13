import { useEffect, useRef } from 'react';
import styles from './site.module.css';

const TAU = Math.PI * 2;

/**
 * Three groups, one per step of the scale (the large one `more`, the small one `less`), set at the
 * points of a larger triangle that slowly turns. `size` is the group's reach as a fraction of the mark's
 * half-width, `angle` its place on that triangle, `speed` how fast its triangles turn (the small group is
 * the quickest) and `depth` how far the pointer pulls it. `probe` picks one of the two colors in
 * site.module.css (the theme's brand color and its strong one) and `alpha` how much of it shows, so the
 * three groups are three strengths of the one brand color: the strong one at 55% is the one between.
 */
const GROUPS = [
  { size: 0.48, angle: -90, speed: 0.7, depth: 0.04, probe: 0, alpha: 1 },
  { size: 0.38, angle: 30, speed: 1, depth: 0.08, probe: 1, alpha: 0.55 },
  { size: 0.28, angle: 150, speed: 1.4, depth: 0.12, probe: 1, alpha: 1 },
] as const;

/** The distance of a group's center from the middle, as a fraction of the half-width. */
const ORBIT = 0.5;

/** The orbit's turn, in radians per second: slower than any triangle, so it reads as drift. */
const ORBIT_SPEED = 0.05;

/**
 * The three triangles in a group, all outlines on one center, from the outside in: a large one, half its
 * size, and a small one. All start pointing down, one inside the next, and each turns at its own speed
 * (the middle one against the others). The line is the same width on all three.
 */
const LAYERS = [
  { scale: 1, speed: -0.14 },
  { scale: 0.5, speed: 0.22 },
  { scale: 0.18, speed: -0.38 },
] as const;

/** The line's width in CSS pixels, and the points' rounding as a fraction of the group's reach. */
const LINE = 2.5;
const CORNER = 0.08;

/**
 * A triangle with rounded points, as one path, pointing down when `turn` is 0. The rounding is the same
 * on every triangle in a group, so the small one is rounder, as in the drawing this follows; it is held
 * under what the small one's edges can give.
 */
function triangle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  turn: number,
  corner: number,
) {
  const vertex = (i: number): [number, number] => {
    const a = turn + (i * TAU) / 3 + Math.PI / 2;
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
  };
  const [lastX, lastY] = vertex(2);
  const [firstX, firstY] = vertex(0);
  ctx.beginPath();
  ctx.moveTo((lastX + firstX) / 2, (lastY + firstY) / 2);
  for (let i = 0; i < 3; i++) {
    const [x, y] = vertex(i);
    const [nextX, nextY] = vertex((i + 1) % 3);
    ctx.arcTo(x, y, nextX, nextY, Math.min(corner, radius * 0.38));
  }
  ctx.closePath();
}

/**
 * The site's mark: three groups of three nested, outlined triangles for the three steps, each turning at its own
 * speed and leaning toward the pointer. The colors are the theme's derived brand colors (probes in the
 * CSS), so it restyles with the customiser and the theme toggle. Decorative. Still under `prefers-reduced-motion`; stops while off screen or in a hidden tab.
 */
export function HeroMark() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const box = wrap.current;
    const ctx = el?.getContext('2d');
    if (!el || !box || !ctx) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colors: string[] = [];
    let colorsStale = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;
    let last = 0;
    let frame = 0;
    let onScreen = true;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const readColors = () => {
      box.querySelectorAll<HTMLElement>('[data-probe]').forEach((probe, i) => {
        colors[i] = getComputedStyle(probe).color;
      });
      colorsStale = false;
    };

    const draw = () => {
      if (width === 0 || height === 0) return;
      if (colorsStale) readColors();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const half = (Math.min(width, height) / 2) * 0.94;
      GROUPS.forEach((group, i) => {
        const place = (group.angle * Math.PI) / 180 + time * ORBIT_SPEED;
        const cx = width / 2 + (Math.cos(place) * ORBIT + pointer.x * group.depth) * half;
        const cy = height / 2 + (Math.sin(place) * ORBIT + pointer.y * group.depth) * half;
        const reach = group.size * half * (1 + 0.03 * Math.sin(time * 0.9 + i * 2));
        const color = colors[group.probe] ?? 'currentColor';
        ctx.strokeStyle = color;
        ctx.globalAlpha = group.alpha;
        ctx.lineWidth = LINE;
        LAYERS.forEach((layer) => {
          const turn = time * layer.speed * group.speed;
          triangle(ctx, cx, cy, reach * layer.scale, turn, reach * CORNER);
          ctx.stroke();
        });
      });
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      draw();
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const sync = () => {
      stop();
      if (!motion.matches && onScreen && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      } else {
        draw();
      }
    };

    const resize = () => {
      const rect = el.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      if (!frame) draw();
    };

    const onPointer = (event: PointerEvent) => {
      pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    // The customiser sets variables on the root, and the theme toggle sets `data-theme` there
    const watcher = new MutationObserver(() => {
      colorsStale = true;
      if (!frame) draw();
    });
    watcher.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'data-theme'],
    });

    const resizer = new ResizeObserver(resize);
    resizer.observe(el);
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      sync();
    });
    visibility.observe(el);

    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    resize();
    sync();

    return () => {
      stop();
      watcher.disconnect();
      resizer.disconnect();
      visibility.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
    };
  }, []);

  return (
    <div ref={wrap} className={styles.mark} aria-hidden="true">
      <canvas ref={canvas} className={styles.markCanvas} />
      <span data-probe className={`${styles.probe} ${styles.probeBrand}`} />
      <span data-probe className={`${styles.probe} ${styles.probeStrong}`} />
    </div>
  );
}
