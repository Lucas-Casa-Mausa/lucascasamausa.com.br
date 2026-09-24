import type { Field, Packet } from './engine';

/** scaleX encaixa a largura do canvas exatamente na do DOM (diferenças sub-pixel/inline de até 3%). */
export type NameRun = { text: string; x: number; y: number; scaleX: number; mode: 'fill' | 'stroke' };
export type NameLayout = { font: string; letterSpacing: number; strokeWidth: number; runs: NameRun[] };
export type NameLayers = { bone: HTMLCanvasElement; amber: HTMLCanvasElement; grey: HTMLCanvasElement };

/**
 * Mede cada <span> do nome no DOM e devolve onde desenhá-lo no canvas (px de dispositivo).
 * Devolve null se o canvas não medir igual ao DOM (ex.: fonte não carregada): assim o DOM continua visível.
 */
export function measureNameLayout(
  name: HTMLElement,
  box: DOMRect,
  dpr: number,
  ctx: CanvasRenderingContext2D,
): NameLayout | null {
  const spans = Array.from(name.querySelectorAll<HTMLElement>(':scope > span'));
  if (spans.length === 0) return null;
  const style = getComputedStyle(name);
  const font = `${style.fontWeight} ${parseFloat(style.fontSize) * dpr}px ${style.fontFamily}`;
  const letterSpacing = (parseFloat(style.letterSpacing) || 0) * dpr;
  ctx.font = font;
  ctx.letterSpacing = `${letterSpacing}px`;

  // O DOM aplica text-transform (o nome é "uppercase" via CSS); o canvas precisa desenhar o mesmo texto.
  const transform = (t: string) =>
    style.textTransform === 'uppercase' ? t.toLocaleUpperCase() : style.textTransform === 'lowercase' ? t.toLocaleLowerCase() : t;

  const runs: NameRun[] = [];
  for (const span of spans) {
    const text = transform(span.textContent ?? '');
    if (!text.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(span);
    const r = range.getBoundingClientRect();
    const m = ctx.measureText(text);
    const domWidth = r.width * dpr;
    if (m.width <= 0 || Math.abs(m.width - domWidth) / domWidth > 0.03) return null;
    runs.push({
      text,
      x: (r.left - box.left) * dpr,
      y: (r.top - box.top) * dpr + m.fontBoundingBoxAscent,
      scaleX: domWidth / m.width,
      mode: span.classList.contains('text-outline') ? 'stroke' : 'fill',
    });
  }
  return runs.length > 0 ? { font, letterSpacing, strokeWidth: 1.5 * dpr, runs } : null;
}

export function paintName(ctx: CanvasRenderingContext2D, layout: NameLayout, color: string): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.font = layout.font;
  ctx.letterSpacing = `${layout.letterSpacing}px`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = layout.strokeWidth;
  for (const run of layout.runs) {
    ctx.save();
    ctx.translate(run.x, run.y);
    ctx.scale(run.scaleX, 1);
    if (run.mode === 'fill') ctx.fillText(run.text, 0, 0);
    else ctx.strokeText(run.text, 0, 0);
    ctx.restore();
  }
}

/** Densidade 0..1 do nome, borrada e em baixa resolução: é o "obstáculo" que desvia os pacotes. */
export function buildDensityField(source: HTMLCanvasElement, scale = 4): Field {
  const w = Math.max(1, Math.ceil(source.width / scale));
  const h = Math.max(1, Math.ceil(source.height / scale));
  const small = document.createElement('canvas');
  small.width = w;
  small.height = h;
  const ctx = small.getContext('2d', { willReadFrequently: true });
  if (!ctx) return () => 0;
  ctx.filter = 'blur(5px)';
  ctx.drawImage(source, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  return (x, y) => {
    const fx = Math.max(0, Math.min(w - 1, (x / scale) | 0));
    const fy = Math.max(0, Math.min(h - 1, (y / scale) | 0));
    return data[(fy * w + fx) * 4 + 3] / 255;
  };
}

/** O pacote: duas linhas finas nas bordas, preenchimento sutil e a cabeça. */
export function drawPacket(ctx: CanvasRenderingContext2D, p: Packet, dpr: number): void {
  const x0 = p.x - p.w;
  const y0 = p.y - p.h;
  ctx.fillStyle = 'rgba(255,176,0,0.06)';
  ctx.fillRect(x0, y0, p.w, p.h * 2);
  ctx.fillStyle = 'rgba(255,176,0,0.85)';
  ctx.fillRect(x0, y0, p.w, dpr);
  ctx.fillRect(x0, p.y + p.h - dpr, p.w, dpr);
  ctx.fillRect(p.x - 2 * dpr, y0, 2 * dpr, p.h * 2);
}

/** Fatia do nome sob o pacote, deslocada com fantasma âmbar e cinza. */
export function drawSlice(
  ctx: CanvasRenderingContext2D,
  layers: NameLayers,
  p: Packet,
  over: number,
  width: number,
): void {
  const x0 = p.x - p.w;
  const y0 = p.y - p.h;
  const sx = Math.max(0, x0);
  const sw = Math.min(p.w, width - sx);
  const sh = p.h * 2;
  if (sw <= 0) return;
  const s = p.shift * Math.min(1, over * 2.5);
  ctx.clearRect(sx, y0, sw, sh);
  ctx.globalCompositeOperation = 'lighten';
  ctx.drawImage(layers.grey, sx, y0, sw, sh, sx - s, y0, sw, sh);
  ctx.drawImage(layers.amber, sx, y0, sw, sh, sx + s, y0, sw, sh);
  ctx.drawImage(layers.bone, sx, y0, sw, sh, sx + s * 0.3, y0, sw, sh);
  ctx.globalCompositeOperation = 'source-over';
}
