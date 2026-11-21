/**
 * Host half of the workspace-groups bundle.
 *
 * The grouping UI lives in the browser, but the task board and plugin settings
 * must survive an app restart. Page storage cannot do that reliably: the Web
 * GUI is served over a loopback port that changes between launches, so every
 * restart is a new origin with empty localStorage. This half therefore
 * persists both as small JSON files under `$DSH_HOME` and serves them over
 * same-origin routes the Client module calls:
 *
 *   GET  /__dsh-workspace-groups/tasks     → { ok, entries }
 *   POST /__dsh-workspace-groups/tasks     → persist { entries: { [sessionId]: record } }
 *   GET  /__dsh-workspace-groups/settings  → { ok, settings }
 *   POST /__dsh-workspace-groups/settings  → persist { settings: { pinnedArea } }
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const name = 'dsh-workspace-groups';
const TASKS_ROUTE = '/__dsh-workspace-groups/tasks';
const SETTINGS_ROUTE = '/__dsh-workspace-groups/settings';
const STORE_FILE = 'dsh-workspace-groups-tasks.json';
const SETTINGS_FILE = 'dsh-workspace-groups-settings.json';
const MAX_BODY_BYTES = 256 * 1024;

function dshHome() {
  const fromEnv = process.env.DSH_HOME;
  return typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : join(homedir(), '.dsh');
}

function storeFile() {
  return join(dshHome(), STORE_FILE);
}

function settingsFile() {
  return join(dshHome(), SETTINGS_FILE);
}

/** Keep only well-formed records; anything else is dropped, not trusted. */
function sanitizeEntries(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const id of Object.keys(raw)) {
    if (typeof id !== 'string' || id === '') continue;
    const value = raw[id];
    if (value === null || typeof value !== 'object') continue;
    if (value.phase !== 'running' && value.phase !== 'completed') continue;
    const record = {
      phase: value.phase,
      interrupted: value.interrupted === true,
      at: typeof value.at === 'number' && Number.isFinite(value.at) ? value.at : 0
    };
    if (value.manual === true) record.manual = true;
    if (value.dismissed === true) record.dismissed = true;
    if (typeof value.endedAt === 'number' && Number.isFinite(value.endedAt)) record.endedAt = value.endedAt;
    out[id] = record;
  }
  return out;
}

function readEntries() {
  try {
    const parsed = JSON.parse(readFileSync(storeFile(), 'utf8'));
    return sanitizeEntries(parsed !== null && typeof parsed === 'object' ? parsed.entries : undefined);
  } catch {
    return {};
  }
}

function writeEntries(entries) {
  const file = storeFile();
  mkdirSync(dirname(file), { recursive: true });
  const temporary = file + '.tmp';
  writeFileSync(temporary, JSON.stringify({ version: 1, entries }, null, 2) + '\n', 'utf8');
  renameSync(temporary, file);
}

/** Keep only the known settings; anything else falls back to the defaults. */
function sanitizeSettings(raw) {
  const settings = { pinnedArea: true };
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return settings;
  if (typeof raw.pinnedArea === 'boolean') settings.pinnedArea = raw.pinnedArea;
  return settings;
}

function readSettingsState() {
  try {
    const parsed = JSON.parse(readFileSync(settingsFile(), 'utf8'));
    return {
      settings: sanitizeSettings(parsed !== null && typeof parsed === 'object' ? parsed.settings : undefined),
      stored: true
    };
  } catch {
    return { settings: sanitizeSettings(null), stored: false };
  }
}

function writeSettings(settings) {
  const file = settingsFile();
  mkdirSync(dirname(file), { recursive: true });
  const temporary = file + '.tmp';
  writeFileSync(temporary, JSON.stringify({ version: 1, settings }, null, 2) + '\n', 'utf8');
  renameSync(temporary, file);
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store'
  });
  response.end(body);
}

function readBody(request, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(new Error('request body too large'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function registerRoutes(webServer, ctx) {
  ctx.effect(() => {
    const disposeTasks = webServer.register({
      kind: 'exact',
      path: TASKS_ROUTE,
      handler: async (request, response) => {
        if (request.method === 'GET') {
          sendJson(response, 200, { ok: true, entries: readEntries() });
          return;
        }
        if (request.method === 'POST') {
          try {
            const parsed = JSON.parse((await readBody(request)) || '{}');
            writeEntries(sanitizeEntries(parsed !== null && typeof parsed === 'object' ? parsed.entries : undefined));
            sendJson(response, 200, { ok: true });
          } catch (error) {
            sendJson(response, 400, { ok: false, error: String(error instanceof Error ? error.message : error) });
          }
          return;
        }
        sendJson(response, 405, { ok: false, error: 'method not allowed' });
      }
    });

    const disposeSettings = webServer.register({
      kind: 'exact',
      path: SETTINGS_ROUTE,
      handler: async (request, response) => {
        if (request.method === 'GET') {
          const state = readSettingsState();
          sendJson(response, 200, { ok: true, settings: state.settings, stored: state.stored });
          return;
        }
        if (request.method === 'POST') {
          try {
            const parsed = JSON.parse((await readBody(request)) || '{}');
            writeSettings(sanitizeSettings(parsed !== null && typeof parsed === 'object' ? parsed.settings : undefined));
            sendJson(response, 200, { ok: true });
          } catch (error) {
            sendJson(response, 400, { ok: false, error: String(error instanceof Error ? error.message : error) });
          }
          return;
        }
        sendJson(response, 405, { ok: false, error: 'method not allowed' });
      }
    });

    return () => {
      disposeTasks();
      disposeSettings();
    };
  });
}

export function apply(ctx) {
  const webServer = ctx.get('webServer');
  if (webServer !== undefined) {
    registerRoutes(webServer, ctx);
    return;
  }
  ctx.inject(['webServer'], (scoped) => {
    registerRoutes(scoped.webServer, scoped);
  });
}

export { name };
export default { name, apply };
