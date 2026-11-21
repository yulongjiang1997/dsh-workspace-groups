/*
 * Headless test for the workspace-groups Host half.
 *
 * Mounts the plugin against a fake web server, then drives the task-board and
 * settings routes the Client module uses: empty first reads, persisted writes,
 * malformed input rejection, and the same state after a fresh Host mount.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { pathToFileURL } = require('node:url');

function fakeResponse() {
  return {
    statusCode: 0,
    headers: undefined,
    body: '',
    writeHead(status, headers) {
      this.statusCode = status;
      this.headers = headers;
    },
    end(body) {
      this.body = body;
    },
  };
}

async function call(handler, method, body) {
  const request = new EventEmitter();
  request.method = method;
  request.destroy = () => {};
  const response = fakeResponse();
  const settled = Promise.resolve(handler(request, response));
  if (body !== undefined) {
    setImmediate(() => {
      request.emit('data', Buffer.from(body, 'utf8'));
      request.emit('end');
    });
  }
  await settled;
  return response;
}

function parse(response) {
  return JSON.parse(response.body || '{}');
}

async function main() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'wgrp-host-test-'));
  process.env.DSH_HOME = home;

  const indexPath = path.join(__dirname, '..', 'index.js');
  const host = await import(pathToFileURL(indexPath).href);

  const routes = new Map();
  const ctx = {
    get(name) {
      if (name !== 'webServer') return undefined;
      return {
        register(definition) {
          routes.set(definition.path, definition);
          return () => {};
        },
      };
    },
    effect(callback) {
      return callback();
    },
    inject() {
      throw new Error('webServer should be available in this test');
    },
    logger: { info() {} },
  };

  host.apply(ctx);
  const tasks = routes.get('/__dsh-workspace-groups/tasks');
  const settings = routes.get('/__dsh-workspace-groups/settings');
  assert.ok(tasks, 'the task route should be registered');
  assert.ok(settings, 'the settings route should be registered');
  assert.equal(tasks.kind, 'exact');
  assert.equal(settings.kind, 'exact');

  // Empty stores answer, not error.
  let response = await call(tasks.handler, 'GET');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(parse(response).entries, {});

  response = await call(settings.handler, 'GET');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(parse(response).settings, { pinnedArea: true });
  assert.equal(parse(response).stored, false, 'an absent settings file should report stored:false');

  // Persist a valid record plus junk that must be dropped.
  response = await call(
    tasks.handler,
    'POST',
    JSON.stringify({
      entries: {
        'session-a': { phase: 'running', interrupted: false, at: 111 },
        'session-b': { phase: 'completed', interrupted: true, at: 'nope', endedAt: 222, manual: true },
        'session-c': { phase: 'bogus', at: 333 },
        broken: 'nope',
      },
    })
  );
  assert.equal(response.statusCode, 200);
  assert.deepEqual(parse(response).ok, true);

  response = await call(tasks.handler, 'GET');
  const entries = parse(response).entries;
  assert.deepEqual(Object.keys(entries).sort(), ['session-a', 'session-b']);
  assert.equal(entries['session-a'].phase, 'running');
  assert.equal(entries['session-b'].phase, 'completed');
  assert.equal(entries['session-b'].interrupted, true);
  assert.equal(entries['session-b'].manual, true);
  assert.equal(entries['session-b'].at, 0, 'non-numeric at should fall back to 0');

  const storeFile = path.join(home, 'dsh-workspace-groups-tasks.json');
  assert.ok(fs.existsSync(storeFile), 'the task store file should be written under $DSH_HOME');
  assert.equal(fs.existsSync(storeFile + '.tmp'), false, 'the temporary file should be renamed away');

  // Settings: write a value, reject junk, read it back.
  response = await call(settings.handler, 'POST', JSON.stringify({ settings: { pinnedArea: false } }));
  assert.equal(response.statusCode, 200);
  response = await call(settings.handler, 'GET');
  assert.deepEqual(parse(response).settings, { pinnedArea: false });
  assert.equal(parse(response).stored, true);

  response = await call(settings.handler, 'POST', JSON.stringify({ settings: { pinnedArea: 'no' } }));
  assert.equal(response.statusCode, 200, 'unknown values fall back to defaults instead of failing');
  response = await call(settings.handler, 'GET');
  assert.deepEqual(parse(response).settings, { pinnedArea: true });

  response = await call(settings.handler, 'POST', JSON.stringify({ settings: { pinnedArea: false } }));
  assert.equal(response.statusCode, 200);
  const settingsFile = path.join(home, 'dsh-workspace-groups-settings.json');
  assert.ok(fs.existsSync(settingsFile), 'the settings file should be written under $DSH_HOME');
  assert.equal(fs.existsSync(settingsFile + '.tmp'), false, 'the temporary settings file should be renamed away');

  // Method and body errors are answered, never thrown.
  response = await call(tasks.handler, 'DELETE');
  assert.equal(response.statusCode, 405);
  response = await call(tasks.handler, 'POST', '{not json');
  assert.equal(response.statusCode, 400);
  response = await call(settings.handler, 'DELETE');
  assert.equal(response.statusCode, 405);
  response = await call(settings.handler, 'POST', '{not json');
  assert.equal(response.statusCode, 400);

  // A fresh Host mount reads the same files (what a restart does).
  routes.clear();
  host.apply(ctx);
  const tasksAfterRestart = routes.get('/__dsh-workspace-groups/tasks');
  const settingsAfterRestart = routes.get('/__dsh-workspace-groups/settings');
  response = await call(tasksAfterRestart.handler, 'GET');
  assert.equal(parse(response).entries['session-a'].phase, 'running');
  response = await call(settingsAfterRestart.handler, 'GET');
  assert.deepEqual(parse(response).settings, { pinnedArea: false });

  fs.rmSync(home, { recursive: true, force: true });
  console.log('host ok');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
