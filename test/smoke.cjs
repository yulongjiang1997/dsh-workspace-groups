/*
 * Headless smoke test for the workspace-groups Client module.
 *
 * Runs the bundle factory and the sidebar component with stubbed React hooks,
 * then exercises the handlers the rendered elements expose. This catches render
 * and state-mutation errors without a browser.
 */
const fs = require('fs');
const path = require('path');

const clientPath = path.join(__dirname, '..', 'client.js');
const code = fs.readFileSync(clientPath, 'utf8');

let definition = null;
const storage = new Map();
const fakeWindow = {
  __ModuleLoader__: {
    load(value) {
      definition = value;
    },
  },
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, value);
    },
  },
  setTimeout: () => 0,
  clearTimeout: () => {},
};

const fakeDocument = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, textContent: '', remove() {} }),
  head: { appendChild() {} },
};

// eslint-disable-next-line no-new-func
new Function('window', 'console', 'document', code)(fakeWindow, console, fakeDocument);

if (definition === null) throw new Error('module did not register through __ModuleLoader__');
if (definition.id !== '@local/dsh-workspace-groups') throw new Error('unexpected module id: ' + definition.id);

/* ------------------------------------------------------------------ */
/* React stub                                                          */
/* ------------------------------------------------------------------ */

function createElement(type, props, ...children) {
  return { type, props: props || {}, children };
}

let hookCursor = 0;
let hookValues = [];

const React = {
  Fragment: Symbol('Fragment'),
  createElement,
  useState(initial) {
    const index = hookCursor++;
    if (!(index in hookValues)) hookValues[index] = typeof initial === 'function' ? initial() : initial;
    const set = (next) => {
      hookValues[index] = typeof next === 'function' ? next(hookValues[index]) : next;
    };
    return [hookValues[index], set];
  },
  useEffect() {
    hookCursor++;
  },
  useRef(value) {
    hookCursor++;
    return { current: value };
  },
  Component: class Component {
    constructor(props) {
      this.props = props || {};
      this.state = {};
    }
  },
};

const moduleExports = definition.factory((name) => {
  if (name === 'react') return React;
  throw new Error('unexpected module request: ' + name);
});

if (typeof moduleExports.apply !== 'function') throw new Error('factory returned no apply');
if (!Array.isArray(moduleExports.inject)) throw new Error('factory returned no inject list');

/* ------------------------------------------------------------------ */
/* Fake application data                                               */
/* ------------------------------------------------------------------ */

const now = Date.now();
const sessionsById = {
  s1: { id: 's1', title: 'Alpha', blank: false, origin: 'main', updatedAt: now - 1000, cwd: 'C:\\work\\alpha', retainedBy: { mainView: 1 } },
  s2: { id: 's2', title: 'Beta', blank: false, origin: 'main', updatedAt: now - 7200000, cwd: 'C:\\work\\alpha', retainedBy: {} },
  s3: { id: 's3', title: 'Gamma', blank: false, origin: 'main', updatedAt: now - 100000, cwd: 'C:\\work\\beta', retainedBy: {} },
  s4: { id: 's4', title: 'Loose thread', blank: false, origin: 'main', updatedAt: now - 5000, cwd: 'C:\\loose', retainedBy: {} },
  s5: { id: 's5', title: 'Child', blank: false, origin: 'subagent', updatedAt: now - 100, cwd: 'C:\\work\\alpha', retainedBy: {} },
};

const workspaceItems = [
  { workspaceId: 'w1', title: 'alpha', path: 'C:\\work\\alpha', sessionIds: ['s1', 's2'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
  { workspaceId: 'w2', title: 'default-workspace', path: 'C:\\work\\beta', sessionIds: ['s3'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
];

const calls = [];

const props = {
  wide: true,
  expandSidebar: () => calls.push(['expandSidebar']),
  t: (key, params) => (params === undefined ? key : key + JSON.stringify(params)),
  useWorkspaces: (select) =>
    select({
      items: workspaceItems,
      pinnedSessionIds: ['s2'],
      archivedSessionIds: [],
      phase: 'ready',
      state: 'ready',
    }),
  useSessions: (select) => select({ ids: Object.keys(sessionsById), byId: sessionsById, phase: 'ready' }),
  useSessionStatus: (select) => select(new Map()),
  openSession: (id) => calls.push(['openSession', id]),
  startSession: (id) => calls.push(['startSession', id]),
  pickDirectory: () => Promise.resolve('C:\\work\\new'),
  createWorkspace: (p) => Promise.resolve({ workspaceId: 'w3', path: p, title: 'new', sessionIds: [] }),
  renameWorkspace: (id, title) => {
    calls.push(['renameWorkspace', id, title]);
    return Promise.resolve({});
  },
  deleteWorkspace: (id) => {
    calls.push(['deleteWorkspace', id]);
    return Promise.resolve();
  },
  openSessionMenu: (id, title, point) => calls.push(['openSessionMenu', id, title, point]),
};

/* ------------------------------------------------------------------ */
/* Capture the private component through the fake slot layer           */
/* ------------------------------------------------------------------ */

let Browser = null;
let registered = null;
let menuProviders = [];
{
  const fakeCtx = {
    effect(callback) {
      const stop = callback();
      return typeof stop === 'function' ? stop : () => {};
    },
    locale: { register: () => () => {}, bind: () => (key) => key },
    get(name) {
      if (name === 'workspaces') {
        return { create: () => Promise.resolve({}), rename: () => Promise.resolve({}), delete: () => Promise.resolve() };
      }
      if (name === 'sessions') return {};
      if (name === 'uiWorkspace') return { openSession() {}, startSession() {}, pickDirectory: () => Promise.resolve(null) };
      if (name === 'contextMenus') {
        return {
          open(target, point) {
            calls.push(['contextMenuOpen', target.kind, target.value, point]);
          },
          register(input) {
            menuProviders.push(input);
            return () => {};
          },
        };
      }
      return undefined;
    },
    slots: {
      inject(key, callback) {
        callback();
      },
      register(options, component) {
        if (options.name === 'sidebar.workspaces') {
          Browser = component;
          registered = options;
        }
        return () => {};
      },
    },
  };
  moduleExports.apply(fakeCtx);
}
if (Browser === null) throw new Error('sidebar.workspaces registration missing');
if (registered === null || typeof registered.inject !== 'function') throw new Error('browser props injection missing');

/* ------------------------------------------------------------------ */
/* Context-menu contributions                                          */
/* ------------------------------------------------------------------ */

const taskMenu = menuProviders.find((provider) => provider.target === 'workspaceGroupTask');
const sessionMenu = menuProviders.find((provider) => provider.target === 'session');
assert(taskMenu !== undefined, 'task context-menu provider should register');
assert(taskMenu.id === 'workspace-groups.task', 'unexpected task-menu provider id');
assert(sessionMenu !== undefined, 'session context-menu provider should register');

const injected = registered.inject();
injected.bindTaskActions({ markCompleted: (id) => calls.push(['markCompleted', id]) });
const menuItems = taskMenu.resolve({ sessionId: 's2' });
assert(menuItems.length === 1, 'task menu should contribute one action, got ' + menuItems.length);
assert(menuItems[0].label === 'tasks.markCompleted', 'task menu label should be localized');
menuItems[0].run();
assert(calls.some((entry) => entry[0] === 'markCompleted' && entry[1] === 's2'), 'menu action should mark the task completed');

const sessionItems = sessionMenu.resolve({ sessionId: 's3' });
assert(sessionItems.length === 1, 'session menu should contribute one action');
sessionItems[0].run();
assert(calls.some((entry) => entry[0] === 'markCompleted' && entry[1] === 's3'), 'session menu action should mark the task completed');

injected.openTaskMenu('s3', { x: 5, y: 6 });
assert(
  calls.some(
    (entry) => entry[0] === 'contextMenuOpen' && entry[1] === 'workspaceGroupTask' && entry[2].sessionId === 's3'
  ),
  'openTaskMenu should open the workspace-group task menu'
);
assert(taskMenu.resolve({ sessionId: '' }).length === 0, 'an empty session id should produce no menu action');
assert(sessionMenu.resolve({}).length === 0, 'a missing session id should produce no session menu action');

/* ------------------------------------------------------------------ */
/* Tree helpers                                                        */
/* ------------------------------------------------------------------ */

function walk(node, visit) {
  if (node === null || node === undefined || node === false) return;
  if (Array.isArray(node)) {
    for (const entry of node) walk(entry, visit);
    return;
  }
  if (typeof node !== 'object') return;
  visit(node);
  for (const child of node.children || []) walk(child, visit);
}

function collect(tree, predicate) {
  const out = [];
  walk(tree, (element) => {
    if (predicate(element)) out.push(element);
  });
  return out;
}

function render(overrides) {
  hookCursor = 0;
  return Browser(Object.assign({}, props, overrides));
}

function byType(tree, name) {
  return collect(tree, (element) => typeof element.type === 'function' && element.type.name === name);
}

function byClass(tree, className) {
  return collect(tree, (element) => element.props && element.props.className === className);
}

function assert(condition, message) {
  if (!condition) throw new Error('ASSERT: ' + message);
}

const fakeEvent = {
  clientY: 100,
  currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 30 }) },
  preventDefault() {},
  stopPropagation() {},
  dataTransfer: { effectAllowed: '', dropEffect: '', setData() {} },
};

/* ------------------------------------------------------------------ */
/* Scenarios                                                           */
/* ------------------------------------------------------------------ */

// 0. A layout saved by a previous page load is restored.
storage.set(
  'dsh.workspace.groups.v1',
  JSON.stringify({
    groups: [{ id: 'saved', name: 'Saved group' }],
    wsGroup: { w1: 'saved' },
    wsOrder: { saved: ['w1'] },
    fsGroup: {},
    fsOrder: {},
    collapsedGroups: {},
    collapsedWs: {}
  })
);
hookValues = [];
hookCursor = 0;
let seeded = render();
let seededGroups = byType(seeded, 'GroupSection');
assert(seededGroups.length === 2, 'saved layout should produce two sections');
assert(seededGroups[0].props.name === 'Saved group', 'saved group name not restored');
assert(seededGroups[0].props.count === 1, 'saved group membership not restored');
storage.clear();
hookValues = [];
hookCursor = 0;

// 1. Flat mode: no groups yet.
let tree = render();
assert(tree !== null && tree.props && tree.props.className === 'wgrp-root', 'root element missing');
assert(byClass(tree, 'wgrp-newgroup').length === 1, 'new-group row missing');

let workspaceSections = byType(tree, 'WorkspaceSection');
assert(workspaceSections.length === 2, 'expected 2 workspace sections, got ' + workspaceSections.length);
assert(workspaceSections[0].props.title === 'alpha', 'first workspace title');
assert(workspaceSections[1].props.title === 'defaultWorkspaceName', 'default workspace title is not localized');

let alphaSessions = workspaceSections[0].props.sessions;
assert(alphaSessions.length === 2, 'pinned sessions stay in their workspace, got ' + alphaSessions.length);
assert(alphaSessions[0].title === 'Beta', 'pinned session should still lead its workspace');
assert(workspaceSections[0].props.sessions.length === 2, 'workspace session projection');

const pinnedSections = byClass(tree, 'wgrp-pinsection');
assert(pinnedSections.length === 1, 'pinned area missing');
const pinnedRows = collect(pinnedSections[0], (element) => element.type && element.type.name === 'SessionRow');
assert(pinnedRows.length === 1, 'pinned area should list the pinned session, got ' + pinnedRows.length);
assert(pinnedRows[0].props.title === 'Beta', 'pinned area should list Beta');

let freeLabel = byClass(tree, 'wgrp-sublabel');
assert(freeLabel.length === 1, 'free-session label missing in flat mode');
assert(freeLabel[0].children[0] === 'freeSessions', 'free label text');

let freeRows = byType(tree, 'SessionRow');
assert(freeRows.length === 2, 'expected pinned and free session rows, got ' + freeRows.length);
assert(freeRows.some((row) => row.props.title === 'Loose thread'), 'free session title');

// A workspace session row comes from the parent's renderer.
const sessionElement = workspaceSections[0].props.renderSession(alphaSessions[0]);
assert(sessionElement !== null && sessionElement.type.name === 'SessionRow', 'renderSession did not produce a row');

// 1b. Child components render standalone without throwing.
function renderIsolated(component, childProps) {
  const savedCursor = hookCursor;
  const savedValues = hookValues;
  hookCursor = 0;
  hookValues = [];
  try {
    return component(childProps);
  } finally {
    hookCursor = savedCursor;
    hookValues = savedValues;
  }
}

const ICON_BUTTON = byType(tree, 'IconButton')[0];
assert(renderIsolated(ICON_BUTTON.type, ICON_BUTTON.props).props.className.includes('wgrp-iconbtn'), 'IconButton render');

const SESSION_ROW = sessionElement;
const sessionMarkup = renderIsolated(SESSION_ROW.type, SESSION_ROW.props);
assert(sessionMarkup.props.className.includes('wgrp-session'), 'SessionRow render');
assert(typeof SESSION_ROW.props.onContextMenu === 'function', 'session row should expose a context-menu handler');
SESSION_ROW.props.onContextMenu({
  preventDefault() {},
  stopPropagation() {},
  clientX: 12,
  clientY: 34,
});
assert(
  calls.some(
    (entry) => entry[0] === 'openSessionMenu' && entry[1] === 's2' && entry[3] && entry[3].x === 12 && entry[3].y === 34
  ),
  'right-clicking a session row should open its menu at the pointer'
);

const WORKSPACE_SECTION = workspaceSections[0];
const workspaceMarkup = renderIsolated(WORKSPACE_SECTION.type, WORKSPACE_SECTION.props);
assert(workspaceMarkup.props.className === 'wgrp-wsbox', 'WorkspaceSection render');
const workspaceRows = collect(workspaceMarkup, (element) => element.type && element.type.name === 'SessionRow');
assert(workspaceRows.length === 2, 'WorkspaceSection should render its session rows, got ' + workspaceRows.length);

const INLINE = collect(workspaceMarkup, (element) => element.type && element.type.name === 'InlineInput')[0];
assert(INLINE === undefined, 'collapsed editor should not render before interaction');

const GROUP_ROW = byType(tree, 'GroupSection')[0];
assert(GROUP_ROW === undefined, 'no group before creation');

const CREATE = byType(tree, 'GroupCreateRow')[0];
assert(CREATE === undefined, 'no create row before interaction');

// 1c. The pinned area can be turned off from the plugin settings panel.
let headerActionButtons = byType(tree, 'IconButton');
assert(headerActionButtons.length === 4, 'header should carry four buttons, got ' + headerActionButtons.length);
headerActionButtons[2].props.onClick({ currentTarget: { getBoundingClientRect: () => ({ right: 260, bottom: 40 }) } });
tree = render();
let settingsPanel = byClass(tree, 'wgrp-settings-panel');
assert(settingsPanel.length === 1, 'settings panel should open from the header');
let pinnedSwitch = collect(settingsPanel[0], (element) => element.type === 'button' && element.props.role === 'switch')[0];
assert(pinnedSwitch !== undefined, 'settings panel should carry the pinned-area switch');
assert(pinnedSwitch.props['aria-checked'] === 'true', 'the pinned area should default to on');
pinnedSwitch.props.onClick();
tree = render();
assert(byClass(tree, 'wgrp-pinsection').length === 0, 'turning the setting off should hide the pinned shortcuts');
let alphaWithoutShortcuts = byType(tree, 'WorkspaceSection')[0].props.sessions;
assert(alphaWithoutShortcuts.length === 2, 'pinned sessions stay in their workspace even without shortcuts');
assert(alphaWithoutShortcuts[0].title === 'Beta', 'the original pinned ordering is unchanged');

settingsPanel = byClass(tree, 'wgrp-settings-panel');
pinnedSwitch = collect(settingsPanel[0], (element) => element.type === 'button' && element.props.role === 'switch')[0];
pinnedSwitch.props.onClick();
tree = render();
assert(byClass(tree, 'wgrp-pinsection').length === 1, 'turning the setting back on should restore the pinned area');
headerActionButtons = byType(tree, 'IconButton');
headerActionButtons[2].props.onClick({ currentTarget: { getBoundingClientRect: () => ({ right: 260, bottom: 40 }) } });
tree = render();
assert(byClass(tree, 'wgrp-settings-panel').length === 0, 'the settings panel should close on a second click');

// 2. Create a group.
byClass(tree, 'wgrp-newgroup')[0].props.onClick();
tree = render();
let createRow = byType(tree, 'GroupCreateRow')[0];
assert(createRow !== undefined, 'create row missing after starting a group');
const createMarkup = renderIsolated(createRow.type, createRow.props);
assert(createMarkup.props.className.includes('wgrp-create'), 'GroupCreateRow render');
assert(collect(createMarkup, (element) => typeof element.type === 'function' && element.type.name === 'InlineInput').length === 1, 'GroupCreateRow editor missing');
createRow.props.onSubmit('Group one');
tree = render();

let groupSections = byType(tree, 'GroupSection');
assert(groupSections.length === 2, 'expected group + ungrouped sections, got ' + groupSections.length);
assert(groupSections[0].props.name === 'Group one', 'group name not applied');
assert(groupSections[0].props.count === 0, 'new group should be empty');
assert(groupSections[1].props.name === 'ungrouped', 'second section should be Ungrouped');

const groupMarkup = renderIsolated(groupSections[0].type, groupSections[0].props);
assert(groupMarkup.props.className === 'wgrp-group', 'GroupSection render');
assert(collect(groupMarkup, (element) => element.type === 'div' && element.props.className === 'wgrp-empty').length === 1, 'empty group hint missing');
assert(collect(groupMarkup, (element) => element.type === 'span' && element.props.className === 'wgrp-count').length === 1, 'group count badge missing');

// 3. Drag a workspace into the group.
workspaceSections = byType(tree, 'WorkspaceSection');
const alpha = workspaceSections.find((section) => section.props.title === 'alpha');
assert(alpha !== undefined, 'alpha workspace missing before drag');
alpha.props.dragProps.onDragStart(fakeEvent);
tree = render();
groupSections = byType(tree, 'GroupSection');
groupSections[0].props.drop.onDrop(fakeEvent);
tree = render();

groupSections = byType(tree, 'GroupSection');
assert(groupSections[0].props.count === 1, 'workspace did not move into the group');
assert(groupSections[1].props.count === 2, 'ungrouped should keep one workspace and one free session');

// 4. Session rows open sessions and menus.
workspaceSections = byType(tree, 'WorkspaceSection');
const alphaAfterDrag = workspaceSections.find((section) => section.props.title === 'alpha');
assert(alphaAfterDrag !== undefined, 'alpha workspace missing after drag');
const alphaRow = alphaAfterDrag.props.renderSession(alphaAfterDrag.props.sessions[0]);
alphaRow.props.onOpen();
assert(calls.some((entry) => entry[0] === 'openSession'), 'clicking a session row did not open it');
alphaRow.props.onMenu(fakeEvent);
assert(calls.some((entry) => entry[0] === 'openSessionMenu'), 'session menu did not open');

// 5. Rename the group.
groupSections[0].props.onRename('Renamed group');
tree = render();
groupSections = byType(tree, 'GroupSection');
assert(groupSections[0].props.name === 'Renamed group', 'group rename failed');

// 6. Workspace actions.
workspaceSections = byType(tree, 'WorkspaceSection');
const beta = workspaceSections.find((section) => section.props.title === 'defaultWorkspaceName');
assert(beta !== undefined, 'beta workspace missing');
workspaceSections[0].props.onNewSession();
assert(calls.some((entry) => entry[0] === 'startSession'), 'new session did not start');
beta.props.onRename('beta renamed');
assert(calls.some((entry) => entry[0] === 'renameWorkspace'), 'workspace rename not requested');
beta.props.onDelete();
assert(calls.some((entry) => entry[0] === 'deleteWorkspace'), 'workspace delete not requested');

// 7. Search filters the tree.
const headerButtons = byType(tree, 'IconButton');
assert(headerButtons.length === 4, 'header action buttons missing, got ' + headerButtons.length);
headerButtons[0].props.onClick();
tree = render();
let input = collect(tree, (element) => element.type === 'input')[0];
assert(input !== undefined, 'search input missing');
input.props.onChange({ target: { value: 'gamma' } });
tree = render();
workspaceSections = byType(tree, 'WorkspaceSection');
assert(workspaceSections.length === 1, 'search should leave one workspace, got ' + workspaceSections.length);
assert(workspaceSections[0].props.sessions.length === 1, 'search should leave one session row');

// 8. Clear the search, then delete the group; the list falls back to flat mode.
input = collect(tree, (element) => element.type === 'input')[0];
input.props.onChange({ target: { value: '' } });
tree = render();
groupSections = byType(tree, 'GroupSection');
assert(groupSections[0].props.name === 'Renamed group', 'group should be back after clearing search');
groupSections[0].props.onDelete();
tree = render();
assert(byType(tree, 'GroupSection').length === 0, 'last group should leave flat mode');
workspaceSections = byType(tree, 'WorkspaceSection');
assert(workspaceSections.length === 2, 'both workspaces should be listed after deleting the last group');
assert(byType(tree, 'SessionRow').length === 2, 'pinned and free sessions should still be listed after deleting the last group');

// 9. Rail mode renders its two controls.
const rail = render({ wide: false });
assert(rail.props.className === 'wgrp-rail', 'rail root missing');
assert(byType(rail, 'IconButton').length === 2, 'rail should render two controls');

// 10. The rail buttons expand the sidebar.
const railButtons = byType(rail, 'IconButton');
railButtons[0].props.onClick();
assert(calls.some((entry) => entry[0] === 'expandSidebar'), 'rail search did not expand the sidebar');

// 11. Temporary task board: running and completed-unread sessions.
const taskStatuses = new Map([
  ['s1', { running: true, pendingInteraction: undefined, completionUnread: false }],
  ['s2', { running: false, pendingInteraction: undefined, completionUnread: false }],
  ['s3', { running: false, pendingInteraction: undefined, completionUnread: true }],
  ['s5', { running: true, pendingInteraction: undefined, completionUnread: false }],
]);
calls.length = 0;
hookValues = [];
hookCursor = 0;
tree = render({ useSessionStatus: (select) => select(taskStatuses) });

const headsFor = (root) =>
  collect(root, (element) => element.type === 'div' && element.props && element.props.className === 'wgrp-row wgrp-taskhead');
let taskRows = byClass(tree, 'wgrp-task');
assert(taskRows.length === 2, 'task board should list one running and one completed session, got ' + taskRows.length);
let taskHeads = headsFor(tree);
assert(taskHeads.length === 2, 'both task sections should be headed, got ' + taskHeads.length);
assert(taskRows[0].props.title.includes('Alpha'), 'running session should lead the task board');
assert(taskRows[1].props.title.includes('Gamma'), 'completed session should be listed second');
assert(
  taskRows.every((row) => !row.props.title.includes('Child')),
  'subagent sessions must stay out of the task board'
);

taskRows[0].props.onClick();
assert(
  calls.some((entry) => entry[0] === 'openSession' && entry[1] === 's1'),
  'clicking a task row should open its session'
);

// Collapsing the running section leaves only the completed row.
taskHeads[0].props.onClick();
tree = render({ useSessionStatus: (select) => select(taskStatuses) });
taskRows = byClass(tree, 'wgrp-task');
assert(taskRows.length === 1, 'collapsed running section should hide its rows, got ' + taskRows.length);
assert(taskRows[0].props.title.includes('Gamma'), 'completed row should remain after collapsing running');

// Opening the completed session clears completionUnread, so its row leaves.
const viewedStatuses = new Map(taskStatuses);
viewedStatuses.set('s3', { running: false, pendingInteraction: undefined, completionUnread: false });
tree = render({ useSessionStatus: (select) => select(viewedStatuses) });
taskHeads = headsFor(tree);
assert(taskHeads.length === 1, 'only the running section should remain on the board, got ' + taskHeads.length);
assert(taskHeads[0].props['aria-label'].startsWith('tasks.running'), 'the remaining section should be Running');
assert(byClass(tree, 'wgrp-task').length === 0, 'no completed task rows should remain after viewing');

// 12. Durable task board: reconcile folds live facts into persisted rows.
const testing = moduleExports.__testing;
assert(testing && typeof testing.reconcileTaskRecords === 'function', 'durable task helpers not exported');
const readyList = { phase: 'ready', ids: ['s1', 's2', 's3'], byId: sessionsById };
const statusOf = (overrides) => new Map(Object.entries(overrides));

let records = testing.reconcileTaskRecords(
  {},
  readyList,
  statusOf({ s2: { running: true, completionUnread: false } }),
  new Set()
);
assert(records.s2 !== undefined && records.s2.phase === 'running', 'live running should be recorded');
assert(records.s2.interrupted !== true, 'live running must not be marked interrupted');

records = testing.reconcileTaskRecords(records, readyList, statusOf({}), new Set());
assert(
  records.s2 !== undefined && records.s2.phase === 'running' && records.s2.interrupted === true,
  'a run that ends unobserved should become an interrupted row'
);

records = testing.reconcileTaskRecords(
  records,
  readyList,
  statusOf({ s3: { running: false, completionUnread: true } }),
  new Set()
);
assert(records.s3 !== undefined && records.s3.phase === 'completed', 'unread completion should be recorded');

// A completed row clears once that session is on screen (viewed).
const viewedList = {
  phase: 'ready',
  ids: ['s1', 's2', 's3'],
  byId: Object.assign({}, sessionsById, {
    s3: Object.assign({}, sessionsById.s3, { retainedBy: { mainView: 1 } }),
  }),
};
records = testing.reconcileTaskRecords(
  records,
  viewedList,
  statusOf({ s3: { running: false, completionUnread: true } }),
  new Set()
);
assert(records.s3 === undefined, 'completed row should clear once its session is viewed');

// A not-yet-ready list must not drop persisted rows.
assert(
  testing.reconcileTaskRecords(records, { phase: 'pending', byId: {}, ids: [] }, statusOf({}), new Set()) === records,
  'pending session list must leave records untouched'
);

// Archived sessions leave the board.
records = testing.reconcileTaskRecords(records, readyList, statusOf({}), new Set(['s2']));
assert(records.s2 === undefined, 'archived session should leave the board');

// Storage round-trip.
storage.clear();
testing.saveTaskRecords({ s3: { phase: 'completed', interrupted: false, at: now } });
const restored = testing.readTaskRecords();
assert(restored.s3 !== undefined && restored.s3.phase === 'completed', 'task records should survive a storage round-trip');

// 13. Persisted rows render after a restart; opening one clears it.
storage.clear();
testing.saveTaskRecords({
  s2: { phase: 'running', interrupted: true, at: now - 3000 },
  s3: { phase: 'completed', interrupted: false, at: now - 2000 },
});
calls.length = 0;
hookValues = [];
hookCursor = 0;
tree = render();
let boardRows = byClass(tree, 'wgrp-task');
assert(boardRows.length === 2, 'restored board should show two rows, got ' + boardRows.length);

const interruptedRow = boardRows.find((row) => row.props.title.includes('Beta'));
assert(interruptedRow !== undefined, 'interrupted row missing after restart');
assert(
  interruptedRow.children.some((child) => child.props && child.props.className === 'wgrp-taskdot is-interrupted'),
  'interrupted row should render the interrupted dot'
);
assert(
  interruptedRow.children.some(
    (child) => child.props && child.props.className === 'wgrp-task-meta' && child.children[0] === 'tasks.interrupted'
  ),
  'interrupted row should be labeled as interrupted'
);

const restoredCompleted = boardRows.find((row) => row.props.title.includes('Gamma'));
assert(restoredCompleted !== undefined, 'completed row missing after restart');

interruptedRow.props.onClick();
assert(
  calls.some((entry) => entry[0] === 'openSession' && entry[1] === 's2'),
  'interrupted row should open its session'
);
tree = render();
assert(byClass(tree, 'wgrp-task').length === 1, 'viewing should drop the interrupted row from the board');
storage.clear();

// 14. Manual completion outranks live status until it is viewed.
let manual = testing.reconcileTaskRecords(
  {},
  readyList,
  statusOf({ s2: { running: true, completionUnread: false } }),
  new Set()
);
manual = { ...manual, s2: { phase: 'completed', interrupted: false, manual: true, at: now } };
let manualKept = testing.reconcileTaskRecords(
  manual,
  readyList,
  statusOf({ s2: { running: true, completionUnread: false } }),
  new Set()
);
assert(manualKept.s2 !== undefined, 'manual completion should not be dropped by live status');
assert(manualKept.s2.phase === 'completed' && manualKept.s2.manual === true, 'manual completion should stay completed');

const dismissed = {
  s2: { phase: 'completed', interrupted: true, manual: true, dismissed: true, at: now }
};
let dismissedRunning = testing.reconcileTaskRecords(
  dismissed,
  readyList,
  statusOf({ s2: { running: true, completionUnread: false } }),
  new Set()
);
assert(
  dismissedRunning.s2 !== undefined && dismissedRunning.s2.dismissed === true,
  'a dismissed row should survive while its run is still live'
);
const dismissedIdle = testing.reconcileTaskRecords(dismissedRunning, readyList, statusOf({}), new Set());
assert(dismissedIdle.s2 === undefined, 'a dismissed row should disappear once the run is over');

// 15. The task row exposes a right-click menu; manual rows render as completed.
storage.clear();
calls.length = 0;
hookValues = [];
hookCursor = 0;
const runningBeta = new Map([['s2', { running: true, pendingInteraction: undefined, completionUnread: false }]]);
tree = render({
  useSessionStatus: (select) => select(runningBeta),
  openTaskMenu: (id, point) => calls.push(['openTaskMenu', id, point]),
});
let rightClickRow = byClass(tree, 'wgrp-task')[0];
assert(rightClickRow !== undefined && rightClickRow.props.title.includes('Beta'), 'running row should render for the right-click test');
assert(typeof rightClickRow.props.onContextMenu === 'function', 'running task row should expose a context-menu handler');
rightClickRow.props.onContextMenu({
  preventDefault() {},
  stopPropagation() {},
  clientX: 40,
  clientY: 60,
});
assert(
  calls.some((entry) => entry[0] === 'openTaskMenu' && entry[1] === 's2' && entry[2].x === 40 && entry[2].y === 60),
  'right-click should open the task menu at the pointer'
);

storage.set(
  'dsh.workspace.groups.tasks.v1',
  JSON.stringify({ version: 1, entries: { s2: { phase: 'completed', interrupted: false, manual: true, at: now } } })
);
hookValues = [];
hookCursor = 0;
tree = render({ useSessionStatus: (select) => select(runningBeta), openTaskMenu: () => {} });
let manualRows = byClass(tree, 'wgrp-task');
assert(manualRows.length === 1, 'manual completion should render one completed row, got ' + manualRows.length);
assert(
  manualRows[0].children.some((child) => child.props && child.props.className === 'wgrp-taskdot is-done'),
  'the manual row should render in the completed group, not the running group'
);

manualRows[0].props.onClick();
tree = render({ useSessionStatus: (select) => select(runningBeta), openTaskMenu: () => {} });
assert(byClass(tree, 'wgrp-task').length === 0, 'viewing a manual completion while running should hide it');
storage.clear();

console.log('smoke ok');
