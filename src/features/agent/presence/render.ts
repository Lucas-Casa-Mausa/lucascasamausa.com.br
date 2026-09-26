import type { Geometry } from './armillary';
import { BUCKETS, bucketAlpha, createProjected, OUT_STRIDE, project, PT_OUT_STRIDE, type View } from './project';

const AMBER = '255,176,0';
const BONE_RGB = '239,233,220';
const STYLES = Array.from({ length: BUCKETS * 2 }, (_, b) => `rgba(${b >= BUCKETS ? BONE_RGB : AMBER},${bucketAlpha(b)})`);
const TAU = Math.PI * 2;

/** Desenha a geometria em lotes (um stroke por cor × opacidade), com blend aditivo. */
export function createRenderer(ctx: CanvasRenderingContext2D) {
  const out = createProjected();
  return (g: Geometry, view: View, dpr: number, lineWidth: number) => {
    project(g, view, out);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, view.width, view.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = lineWidth * dpr;
    ctx.lineCap = 'round';
    const s = out.seg;
    for (let b = 0; b < BUCKETS * 2; b++) {
      let open = false;
      for (let i = 0; i < out.segCount; i++) {
        const o = i * OUT_STRIDE;
        if (s[o + 4] !== b) continue;
        if (!open) {
          ctx.beginPath();
          open = true;
        }
        ctx.moveTo(s[o], s[o + 1]);
        ctx.lineTo(s[o + 2], s[o + 3]);
      }
      if (open) {
        ctx.strokeStyle = STYLES[b];
        ctx.stroke();
      }
    }
    const p = out.pts;
    for (let i = 0; i < out.ptCount; i++) {
      const o = i * PT_OUT_STRIDE;
      ctx.fillStyle = `rgba(${p[o + 3] ? BONE_RGB : AMBER},${Math.min(1, p[o + 2])})`;
      ctx.beginPath();
      ctx.arc(p[o], p[o + 1], p[o + 4] * dpr, 0, TAU);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  };
}
