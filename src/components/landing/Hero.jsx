import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";

/**
 * Hero concept:
 *  - a giant headline sits behind a realistic hex dumbbell that hides the letters it crosses
 *  - the dumbbell is drawn on a <canvas> with no 3D library, lit by two lights, and you can drag it to turn it
 *  - text is stamped onto the rubber and the end plates, and follows the surface as it turns
 *  - viewfinder corners, a live angle readout and a rotation ruler frame the stage like a camera HUD
 * It reads the page's own background and text colours, so light and dark themes both work.
 */

/* ---------- 3D model: a rubber hex dumbbell with a knurled steel handle ---------- */

const TAU = Math.PI * 2;
const HEX = Math.PI / 6;

const RUBBER = 0; // matte, chamfered hex heads
const STEEL = 1; // glossy handle, collars and end plates

const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

// A frustum along the X axis (a prism when r0 === r1).
// Every part is convex, so back-face culling is enough to hide its far side.
function frustum(x0, x1, r0, r1, sides, rotation = 0, mat = STEEL) {
  const len = x1 - x0;
  const dir = Math.sign(len);
  const slope = (r1 - r0) / len;
  const norm = Math.hypot(1, slope);

  const ringAt = (x, r) =>
    Array.from({ length: sides }, (_, i) => {
      const a = rotation + (i / sides) * TAU;
      return [x, Math.cos(a) * r, Math.sin(a) * r];
    });

  const a = ringAt(x0, r0);
  const b = ringAt(x1, r1);
  const faces = [];

  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    const mid = rotation + ((i + 0.5) / sides) * TAU;
    faces.push({
      pts: [a[i], a[j], b[j], b[i]],
      n: [-slope / norm, Math.cos(mid) / norm, Math.sin(mid) / norm],
      mat,
    });
  }

  if (r0 > 0) faces.push({ pts: a, n: [-dir, 0, 0], mat });
  if (r1 > 0) faces.push({ pts: b, n: [dir, 0, 0], mat });

  return faces;
}

// Stamp text onto a face. u and v are the two world axes the text lies along.
function stamp(face, text, { u, v, size, width, lift = 0.012, alpha = 0.8 }) {
  const count = face.pts.length;
  const center = [0, 0, 0];
  for (const p of face.pts) {
    center[0] += p[0] / count;
    center[1] += p[1] / count;
    center[2] += p[2] / count;
  }
  face.label = {
    text,
    u,
    v,
    size,
    width,
    alpha,
    center: [
      center[0] + face.n[0] * lift,
      center[1] + face.n[1] * lift,
      center[2] + face.n[2] * lift,
    ],
  };
}

function buildDumbbell() {
  const faces = [];
  const add = (...args) => {
    const made = frustum(...args);
    faces.push(...made);
    return made;
  };

  // Handle: fine diamond-style knurl in the middle, smooth chrome toward the ends
  const knurlHalf = 0.78;
  const segments = 40;
  const step = (knurlHalf * 2) / segments;
  for (let i = 0; i < segments; i++) {
    const x0 = -knurlHalf + i * step;
    const r = i % 2 ? 0.215 : 0.19;
    add(x0, x0 + step, r, r, 18, i % 2 ? 0.08 : 0, STEEL);
  }
  add(-0.05, 0.05, 0.235, 0.235, 24, 0, STEEL); // smooth centre band

  [-1, 1].forEach((s) => {
    add(s * 0.78, s * 1.1, 0.205, 0.205, 20, 0, STEEL); // smooth grip
    add(s * 0.78, s * 0.86, 0.27, 0.27, 24, 0, STEEL); // knurl guard ring
    add(s * 0.86, s * 0.9, 0.27, 0.22, 24, 0, STEEL); // guard ring chamfer
    add(s * 1.1, s * 1.2, 0.3, 0.3, 24, 0, STEEL); // steel collar
    add(s * 1.2, s * 1.34, 0.3, 0.66, 28, 0, STEEL); // flared neck into the head
    add(s * 1.34, s * 1.4, 0.66, 0.7, 28, 0, STEEL); // seat ring
    add(s * 1.4, s * 1.43, 0.7, 0.7, 28, 0, STEEL); // seat lip

    // Rubber hex head: chamfered in, flat body, chamfered out
    add(s * 1.43, s * 1.58, 0.96, 1.16, 6, HEX, RUBBER);
    const body = add(s * 1.58, s * 2.42, 1.16, 1.16, 6, HEX, RUBBER);
    add(s * 2.42, s * 2.56, 1.16, 0.96, 6, HEX, RUBBER);

    // Raised lettering on two of the hex flats, running along the flat
    [1, 4].forEach((i, k) => {
      const face = body[i];
      const tangent = [0, -face.n[2], face.n[1]];
      stamp(face, k === 0 ? "GYMIO" : "HEX · 20 KG", {
        u: tangent,
        v: [1, 0, 0],
        size: 0.24,
        width: 0.92,
        alpha: 0.72,
      });
    });

    // Steel end plate with a stepped boss and engraved ring
    add(s * 2.56, s * 2.62, 0.76, 0.76, 32, 0, STEEL);
    add(s * 2.62, s * 2.68, 0.76, 0.7, 32, 0, STEEL);
    add(s * 2.68, s * 2.71, 0.7, 0.56, 32, 0, STEEL); // engraved groove
    add(s * 2.71, s * 2.76, 0.56, 0.56, 32, 0, STEEL);
    const cap = add(s * 2.76, s * 2.8, 0.56, 0.48, 32, 0, STEEL);

    // Weight on the end of the boss
    const capFace = cap[cap.length - 1];
    stamp(capFace, "20", { u: [0, 1, 0], v: [0, 0, 1], size: 0.42, width: 0.7, alpha: 0.85, lift: 0.004 });
  });

  return faces;
}

const FACES = buildDumbbell();
const CAMERA = 10; // camera sits at z = -CAMERA, looking down +z
const TILT = -0.22; // the dumbbell leans a little, like a camera held at an angle

const norm3 = ([x, y, z]) => {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
};

// Key light: upper left, in front. Fill light: low right, softer.
const LIGHT = norm3([-0.45, 0.7, -0.6]);
const HALF = norm3([LIGHT[0], LIGHT[1], LIGHT[2] - 1]);
const FILL = norm3([0.7, -0.25, -0.65]);
const FILL_HALF = norm3([FILL[0], FILL[1], FILL[2] - 1]);

// Heavy feel: slower idle turn, less flick on release, and a long coast before it settles
const AUTO_SPIN = 0.004;
const DRAG_YAW = 0.009;
const DRAG_PITCH = 0.005;
const FLICK = 0.5; // how much of the drag speed becomes momentum
const SETTLE = 0.012; // how quickly the spin returns to idle (lower = heavier)

function makeRotator(yaw, pitch, roll) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cr = Math.cos(roll), sr = Math.sin(roll);

  return ([x, y, z]) => {
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    return [x1 * cr - y2 * sr, x1 * sr + y2 * cr, z2];
  };
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const toDegrees = (rad) => ((((rad * 180) / Math.PI) % 360) + 360) % 360;

/* ---------- Small helpers ---------- */

const RULER = Array.from({ length: 61 }, (_, i) => i);

const corner = "absolute size-5 border-foreground/40 sm:size-7";

/* ---------- Component ---------- */

export function Hero() {
  const navigate = useNavigate();

  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const markerRef = useRef(null);
  const readoutRef = useRef(null);

  // Shaded renderer
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const autoSpin = reduceMotion ? 0 : AUTO_SPIN;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let last = performance.now();
    let dirty = true; // something changed, so the next frame must be drawn

    // Colours are read once and again on theme change, never every frame
    let ink = "#ffffff";
    let paper = "#000000";

    // Pose
    let yaw = -0.75;
    let pitch = 0.36;
    let spin = autoSpin;

    // Drag state
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const readColors = () => {
      const styles = window.getComputedStyle(section);
      ink = styles.color;
      paper = styles.backgroundColor;
      dirty = true;
    };

    const resize = () => {
      const rect = section.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty = true;
    };

    // The shadow stretches and shrinks with how long the weight looks from above
    const drawShadow = (cx, cy, unit) => {
      const reach = 1.3 + 1.7 * Math.abs(Math.cos(yaw));
      ctx.save();
      ctx.translate(cx, cy + unit * 1.75);
      ctx.fillStyle = ink;
      for (let i = 0; i < 6; i++) {
        const k = 1 - i * 0.14;
        ctx.globalAlpha = 0.022;
        ctx.beginPath();
        ctx.ellipse(0, 0, unit * reach * k, unit * 0.3 * k, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawStamp = (label, rotate, cosView, onRubber) => {
      const project = (p) => {
        const f = CAMERA / (CAMERA + p[2]);
        return [width / 2 + p[0] * f * unitNow, cyNow - p[1] * f * unitNow];
      };

      const c = rotate(label.center);
      const u = rotate([
        label.center[0] + label.u[0],
        label.center[1] + label.u[1],
        label.center[2] + label.u[2],
      ]);
      const v = rotate([
        label.center[0] + label.v[0],
        label.center[1] + label.v[1],
        label.center[2] + label.v[2],
      ]);

      const sc = project(c);
      const su = project(u);
      const sv = project(v);

      // Screen vectors for one world unit along each text axis
      let ux = su[0] - sc[0], uy = su[1] - sc[1];
      let vx = sv[0] - sc[0], vy = sv[1] - sc[1];

      // Keep the text upright and never mirrored
      if (ux < 0) {
        ux = -ux; uy = -uy;
        vx = -vx; vy = -vy;
      }
      if (ux * vy - uy * vx < 0) {
        vx = -vx; vy = -vy;
      }

      const k = label.size / 100; // glyphs are drawn at 100px, then scaled to world size
      ctx.save();
      ctx.transform(ux * k, uy * k, vx * k, vy * k, sc[0], sc[1]);
      ctx.font = `800 100px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = Math.min(1, cosView * 1.6) * label.alpha;
      ctx.fillStyle = onRubber ? paper : ink;
      ctx.fillText(label.text, 0, 0, label.width / k);
      ctx.restore();
    };

    // Set each frame so drawStamp can project
    let unitNow = 1;
    let cyNow = 0;

    const render = (now) => {
      frame = window.requestAnimationFrame(render);

      const dt = Math.min((now - last) / 16.67, 3);
      last = now;

      // Nothing is moving and nothing changed: skip the whole draw
      const moving = dragging || autoSpin !== 0 || Math.abs(spin) > 0.0002;
      if (!width || (!moving && !dirty)) return;
      dirty = false;

      if (!dragging) {
        yaw += spin * dt;
        spin += (autoSpin - spin) * SETTLE * dt;
      }

      const unit = Math.min(width / 7.2, height / 4.8);
      const cx = width / 2;
      const cy = height * (width < 640 ? 0.48 : width < 1024 ? 0.52 : 0.56);
      unitNow = unit;
      cyNow = cy;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.lineJoin = "round";
      ctx.lineWidth = 0.8;

      drawShadow(cx, cy, unit);

      const rotate = makeRotator(yaw, pitch, TILT);

      // Collect visible faces, then paint far to near
      const visible = [];

      for (const face of FACES) {
        const first = rotate(face.pts[0]);
        const normal = rotate(face.n);

        // Skip faces pointing away from the camera
        const toCamera = [-first[0], -first[1], -CAMERA - first[2]];
        const facing = dot(normal, toCamera);
        if (facing <= 0) continue;

        const screen = [];
        let depth = 0;
        for (let i = 0; i < face.pts.length; i++) {
          const p = i === 0 ? first : rotate(face.pts[i]);
          const f = CAMERA / (CAMERA + p[2]);
          screen.push(cx + p[0] * f * unit, cy - p[1] * f * unit);
          depth += p[2];
        }

        visible.push({
          screen,
          depth: depth / face.pts.length,
          mat: face.mat,
          label: face.label,
          cosView: facing / Math.hypot(toCamera[0], toCamera[1], toCamera[2]),
          key: Math.max(0, dot(normal, LIGHT)),
          keySpec: Math.max(0, dot(normal, HALF)),
          fillSpec: Math.max(0, dot(normal, FILL_HALF)),
          down: Math.max(0, -normal[1]), // faces that look at the floor
        });
      }

      visible.sort((a, b) => b.depth - a.depth);

      for (const f of visible) {
        const { screen } = f;
        ctx.beginPath();
        ctx.moveTo(screen[0], screen[1]);
        for (let i = 2; i < screen.length; i += 2) ctx.lineTo(screen[i], screen[i + 1]);
        ctx.closePath();

        // Base: the page colour, so the face hides the headline behind it
        ctx.globalAlpha = 1;
        ctx.fillStyle = paper;
        ctx.fill();

        if (f.mat === RUBBER) {
          // Matte rubber: dark body, a little light on faces turned to the lamp,
          // a touch more darkness on faces under the weight
          ctx.globalAlpha = Math.min(0.96, 0.9 - f.key * 0.38 + f.down * 0.06);
          ctx.fillStyle = ink;
          ctx.fill();

          // Faint sheen where the key light grazes the rubber
          ctx.globalAlpha = Math.pow(f.keySpec, 14) * 0.18;
          ctx.fillStyle = paper;
          ctx.fill();

          ctx.globalAlpha = 0.45;
          ctx.strokeStyle = paper;
          ctx.stroke();
        } else {
          // Glossy steel: mid tone, a tight key streak and a softer fill streak
          ctx.globalAlpha = 0.64 - f.key * 0.3 + f.down * 0.05;
          ctx.fillStyle = ink;
          ctx.fill();

          ctx.globalAlpha = Math.min(0.95, Math.pow(f.keySpec, 28) * 1.1);
          ctx.fillStyle = paper;
          ctx.fill();

          ctx.globalAlpha = Math.min(0.5, Math.pow(f.fillSpec, 22) * 0.55);
          ctx.fillStyle = paper;
          ctx.fill();

          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = ink;
          ctx.stroke();
        }

        // Stamped lettering follows its face
        if (f.label && f.cosView > 0.12) {
          drawStamp(f.label, rotate, f.cosView, f.mat === RUBBER);
        }
      }
      ctx.globalAlpha = 1;

      // The ruler marker and the angle readout follow the rotation
      if (markerRef.current) {
        const turn = (((yaw % TAU) + TAU) % TAU) / TAU;
        markerRef.current.style.left = `${turn * 100}%`;
      }
      if (readoutRef.current) {
        const y = String(Math.round(toDegrees(yaw))).padStart(3, "0");
        const p = String(Math.round(toDegrees(pitch))).padStart(3, "0");
        readoutRef.current.textContent = `YAW ${y}°  PITCH ${p}°`;
      }
    };

    const start = () => {
      if (frame) return;
      last = performance.now();
      frame = window.requestAnimationFrame(render);
    };

    const stop = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
    };

    const onDown = (event) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };

    const onMove = (event) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      yaw += dx * DRAG_YAW;
      // Blend toward the drag speed so the weight resists sudden flicks
      spin += (dx * DRAG_YAW * FLICK - spin) * 0.5;
      pitch = Math.max(-0.7, Math.min(0.9, pitch + dy * DRAG_PITCH));
    };

    const onUp = (event) => {
      dragging = false;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    readColors();
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(section);

    // Repaint with the new colours whenever the theme class on <html> changes
    const themeObserver = new MutationObserver(readColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // The loop only runs while the hero is on screen
    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    visibility.observe(section);

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      visibility.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-background text-foreground"
    >
      {/* Layer 1: the headline, behind the dumbbell */}
      <h1 className="absolute inset-x-0 top-[15%] flex flex-col px-4 font-display text-[clamp(3rem,17vw,5.5rem)] font-extrabold uppercase leading-[0.9] tracking-tight sm:top-[19%] sm:flex-row sm:justify-between sm:px-8 sm:text-[clamp(2.5rem,10.8vw,12rem)] sm:leading-none">
        <span>Stronger</span>
        <span className="self-end sm:self-auto">Gyms</span>
      </h1>

      {/* Layer 2: the dumbbell. Drag to turn it; vertical swipes still scroll the page. */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Hex dumbbell. Drag to turn it."
        className="absolute inset-0 z-10 size-full cursor-grab"
        style={{ touchAction: "pan-y" }}
      />

      {/* Layer 3: viewfinder corners and HUD text */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 bottom-4 top-[4.5rem] z-20 sm:inset-x-6 sm:bottom-5 sm:top-20"
      >
        <span className={cn(corner, "left-0 top-0 border-l border-t")} />
        <span className={cn(corner, "right-0 top-0 border-r border-t")} />
        <span className={cn(corner, "bottom-0 left-0 border-b border-l")} />
        <span className={cn(corner, "bottom-0 right-0 border-b border-r")} />

        <span
          ref={readoutRef}
          className="absolute left-7 top-1 whitespace-pre font-mono text-[10px] tracking-widest text-muted-foreground sm:left-10 sm:top-2 sm:text-xs"
        />
        <span className="absolute right-7 top-1 flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground sm:right-10 sm:top-2 sm:text-xs">
          <span className="size-1.5 animate-pulse rounded-full bg-foreground" />
          20 KG · 44 LB
        </span>
      </div>

      {/* Layer 4: copy, actions, rotation ruler */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 grid gap-6 px-7 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-14 sm:pb-12 md:grid-cols-2 md:items-end md:gap-10">
        <div className="pointer-events-auto max-w-md md:max-w-sm">
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
            Gymio keeps members, plans and payments in one place, so renewals
            never slip and receipts file themselves.
          </p>

          <div className="mt-4 flex flex-col items-stretch gap-3 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            <InteractiveHoverButton
              onClick={() => navigate("/sign-up")}
              className="h-12 w-full px-7 text-base sm:w-auto"
            >
              Start free
            </InteractiveHoverButton>

            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="py-2 text-center text-base font-medium underline decoration-2 underline-offset-8 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              See how it works
            </button>
          </div>
        </div>

        <div aria-hidden="true" className="w-full max-w-md pt-3 md:ml-auto md:pt-4">
          <div className="relative">
            <span
              ref={markerRef}
              className="absolute -top-4 left-0 -translate-x-1/2 border-x-4 border-t-[6px] border-x-transparent border-t-foreground"
            />
            <div className="flex items-end justify-between">
              {RULER.map((i) => (
                <span
                  key={i}
                  className={cn(
                    "w-px bg-foreground/40",
                    i % 10 === 0 ? "h-4" : i % 5 === 0 ? "h-3" : "h-2"
                  )}
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Drag to turn the weight
          </p>
        </div>
      </div>
    </section>
  );
}