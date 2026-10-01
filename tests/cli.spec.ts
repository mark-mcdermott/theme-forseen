import { test, expect } from '@playwright/test';
import { spawn, ChildProcess, execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('..', import.meta.url));
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const cli = join(root, 'dist', 'cli', 'index.js');
const server = 'http://localhost:3847';

test('reports the package version', () => {
  expect(execFileSync('node', [cli, '--version'], { encoding: 'utf8' }).trim()).toBe(version);
});

// One server at a time: the port is fixed
test.describe.serial('Apply Server', () => {
  let project: string;
  let child: ChildProcess;

  test.beforeAll(async () => {
    project = mkdtempSync(join(tmpdir(), 'theme-forseen-'));
    mkdirSync(join(project, 'css'));
    writeFileSync(join(project, 'index.html'), '<link rel="stylesheet" href="css/styles.css">');
    writeFileSync(join(project, 'css', 'styles.css'), 'body { margin: 0; }\n');

    child = spawn('node', [cli], { cwd: project, stdio: 'ignore' });
    await expect.poll(() => fetch(`${server}/api/health`).then((r) => r.ok).catch(() => false), { timeout: 10_000 }).toBe(true);
  });

  test.afterAll(() => {
    child.kill();
    rmSync(project, { recursive: true, force: true });
  });

  async function apply(data: Record<string, string>) {
    const response = await fetch(`${server}/api/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'font', data }),
    });
    return response.json();
  }

  const stylesheet = () => readFileSync(join(project, 'css', 'styles.css'), 'utf8');

  test('reports the package version', async () => {
    const health = await fetch(`${server}/api/health`).then((r) => r.json());
    expect(health).toMatchObject({ status: 'ok', version, projectType: 'plain', cssFile: 'css/styles.css' });
  });

  test('writes both faces, with the stacks the preview uses', async () => {
    expect(await apply({ heading: 'Playfair Display', body: 'Inter' })).toMatchObject({ success: true, file: 'css/styles.css' });

    const css = stylesheet();
    expect(css).toContain('body { margin: 0; }');
    expect(css).toContain('--font-heading: "Playfair Display", Georgia, "Times New Roman", serif;');
    expect(css).toContain('--font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;');
    expect(css).not.toContain('--font-family');
  });

  test('a later write replaces the block', async () => {
    await apply({ heading: 'Lora', body: 'Space Mono' });

    const css = stylesheet();
    expect(css.match(/ThemeForseen Font/g)).toHaveLength(1);
    expect(css).toContain('--font-heading: "Lora", Georgia');
    expect(css).toContain('--font-body: "Space Mono", "Courier New", Courier, monospace;');
    expect(css).not.toContain('Playfair');
  });

  test('a single face, as older widgets send it, is used for both', async () => {
    await apply({ font: 'Merriweather' });

    const css = stylesheet();
    expect(css).toContain('--font-heading: "Merriweather", Georgia');
    expect(css).toContain('--font-body: "Merriweather", Georgia');
  });
});
