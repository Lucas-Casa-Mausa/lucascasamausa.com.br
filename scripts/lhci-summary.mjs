#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';

const dir = '.lighthouseci';
const rows = readdirSync(dir)
  .filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
  .map((f) => {
    const r = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    const a = r.audits;
    const el = a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? '?';
    const script = a['resource-summary'].details.items.find((i) => i.resourceType === 'script')?.transferSize ?? 0;
    return {
      url: new URL(r.finalUrl).pathname,
      lcp: Math.round(a['largest-contentful-paint'].numericValue),
      tbt: Math.round(a['total-blocking-time'].numericValue),
      script,
      el: el.slice(0, 48),
    };
  })
  .sort((x, y) => x.url.localeCompare(y.url) || x.lcp - y.lcp);
console.table(rows);
