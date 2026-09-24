import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = resolve('scripts/check-denylist.mjs');
const TERM = 'acaizeiro'; // fictício

let dir: string;

function repo(files: Record<string, string | Buffer>, message = 'init') {
  dir = mkdtempSync(join(tmpdir(), 'denylist-'));
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 't@example.com');
  git('config', 'user.name', 't');
  git('config', 'core.quotePath', 'true');
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  git('add', '-A');
  git('commit', '-q', '-m', message);
}

function run(env: Record<string, string> = {}) {
  return spawnSync('node', [SCRIPT], {
    cwd: dir,
    encoding: 'utf8',
    env: { NODE_ENV: 'test', PATH: process.env.PATH ?? '', CONTENT_DENYLIST: TERM, ...env },
  });
}

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('check-denylist (CLI)', () => {
  it('passa num repo limpo', () => {
    repo({ 'README.md': 'nada aqui' });
    expect(run().status).toBe(0);
  });

  it('pega o termo em arquivo com nome acentuado', () => {
    repo({ 'notas-ação.md': 'fala do Açaízeiro' });
    expect(run().status).toBe(1);
  });

  it('pega o termo em arquivo sem extensão', () => {
    repo({ LICENSE: 'Copyright Acaizeiro' });
    expect(run().status).toBe(1);
  });

  it('ignora binários (byte NUL) sem quebrar', () => {
    repo({ 'img.bin': Buffer.from([0, 1, 2, 0, 3]), 'a.txt': 'limpo' });
    expect(run().status).toBe(0);
  });

  it('pega o termo no nome do arquivo e não o imprime', () => {
    repo({ 'acaizeiro-notas.md': 'conteúdo limpo' });
    const result = run();
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).not.toMatch(/acaizeiro/i);
  });

  it('pega o termo em mensagem de commit', () => {
    repo({ 'a.txt': 'limpo' }, 'feat: integra com Açaízeiro');
    expect(run().status).toBe(1);
  });

  it('secret com um termo por linha funciona', () => {
    repo({ 'a.txt': 'fala da acme' });
    expect(run({ CONTENT_DENYLIST: 'zeta\nacme' }).status).toBe(1);
  });

  it('falha fechado no CI com lista vazia', () => {
    repo({ 'a.txt': 'limpo' });
    expect(run({ CONTENT_DENYLIST: '', CI: '1' }).status).toBe(1);
  });
});
