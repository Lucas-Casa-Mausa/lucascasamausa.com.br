import { buildArmillary, createGeometry, PITCH, SCALE, type Detail } from './armillary';
import { BUCKETS, bucketAlpha, createProjected, OUT_STRIDE, project, PT_OUT_STRIDE } from './project';
import { createPresenceState, step } from './state';

export const VIEWBOX = 100;

export type StaticFrame = {
  paths: { d: string; opacity: number; bone: boolean }[];
  dots: { cx: number; cy: number; r: number; opacity: number; bone: boolean }[];
};

const cache = new Map<Detail, StaticFrame>();
const n1 = (n: number) => Math.round(n * 10) / 10;

/** Um quadro fixo do repouso (3 s depois de nascer), para o SVG do servidor e para o nível static. */
export function staticFrame(detail: Detail): StaticFrame {
  const hit = cache.get(detail);
  if (hit) return hit;
  const s = createPresenceState(0.6);
  for (let i = 0; i < 90; i++) step(s, 1 / 30);
  const g = createGeometry();
  buildArmillary(s, detail, g);
  const out = createProjected();
  project(g, { yaw: s.yaw, pitch: PITCH, width: VIEWBOX, height: VIEWBOX, scale: SCALE[detail] }, out);

  const groups: string[][] = Array.from({ length: BUCKETS * 2 }, () => []);
  for (let i = 0; i < out.segCount; i++) {
    const o = i * OUT_STRIDE;
    groups[out.seg[o + 4]].push(`M${n1(out.seg[o])} ${n1(out.seg[o + 1])}L${n1(out.seg[o + 2])} ${n1(out.seg[o + 3])}`);
  }
  const paths = groups.flatMap((group, b) => (group.length ? [{ d: group.join(''), opacity: bucketAlpha(b), bone: b >= BUCKETS }] : []));
  const dots = Array.from({ length: out.ptCount }, (_, i) => {
    const o = i * PT_OUT_STRIDE;
    return { cx: n1(out.pts[o]), cy: n1(out.pts[o + 1]), r: n1(out.pts[o + 4]), opacity: Math.min(1, out.pts[o + 2]), bone: out.pts[o + 3] === 1 };
  });
  const frame = { paths, dots };
  cache.set(detail, frame);
  return frame;
}
