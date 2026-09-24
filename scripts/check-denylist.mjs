#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findHits, parseDenylist } from './denylist.mjs';

const terms = parseDenylist(process.env.CONTENT_DENYLIST);
if (terms.length === 0) {
  if (process.env.CI) {
    console.error('CONTENT_DENYLIST está vazio no CI. Configure o secret no GitHub.');
    process.exit(1);
  }
  console.warn('CONTENT_DENYLIST não definido: checagem pulada (local).');
  process.exit(0);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// -z: nomes crus, sem aspas/escape de core.quotePath (senão nomes acentuados somem da varredura).
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const built = ['.next/server', '.next/static'].filter((d) => existsSync(d)).flatMap(walk);

// O log do CI é público: nunca imprime o termo nem um caminho que o contenha.
const label = (path) =>
  findHits(path, terms).length > 0 ? `arquivo#${createHash('sha256').update(path).digest('hex').slice(0, 8)}` : path;

const problems = [];
const report = (where, term) => problems.push(`termo proibido #${terms.indexOf(term) + 1} em ${where}`);

for (const path of tracked) {
  for (const term of findHits(path, terms)) report(`nome de ${label(path)}`, term);
}

let scanned = 0;
for (const file of [...tracked, ...built]) {
  if (!existsSync(file)) {
    problems.push(`arquivo rastreado ausente do disco: ${label(file)}`);
    continue;
  }
  const buf = readFileSync(file);
  if (buf.includes(0)) continue; // binário
  scanned++;
  for (const term of findHits(buf.toString('utf8'), terms)) report(label(file), term);
}

const messages = execFileSync('git', ['log', '--format=%H%x00%B%x00'], { encoding: 'utf8' }).split('\0');
for (let i = 0; i + 1 < messages.length; i += 2) {
  const sha = messages[i].trim().slice(0, 8);
  for (const term of findHits(messages[i + 1], terms)) report(`mensagem do commit ${sha}`, term);
}

if (problems.length > 0) {
  for (const p of problems) console.error(p);
  process.exit(1);
}
console.log(`ok: ${scanned} arquivos, ${terms.length} termos, nomes e mensagens de commit, nenhuma ocorrência`);
