/**
 * Workspace groups for the sidebar.
 *
 * Occupies `sidebar.workspaces` (the shipped WorkspaceBrowser stays registered
 * underneath at its default priority) and renders the same region with one
 * addition: user-created groups. A group holds workspaces and free sessions
 * (sessions no Workspace accounts for); both can be dragged between groups and
 * the Ungrouped bucket, and groups themselves can be reordered by dragging their
 * headers.
 *
 * Group layout is view state, so it lives in page storage beside the shipped
 * browser's own view store, not in the session log.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-workspace-groups',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'workspaceGroups';
    const STORAGE_KEY = 'dsh.workspace.groups.v1';
    const TASK_STORAGE_KEY = 'dsh.workspace.groups.tasks.v1';
    const SETTINGS_STORAGE_KEY = 'dsh.workspace.groups.settings.v1';
    const TASK_API_URL = '/__dsh-workspace-groups/tasks';
    const SETTINGS_API_URL = '/__dsh-workspace-groups/settings';
    const STYLE_ID = '@local/dsh-workspace-groups/sidebar.css';
    const UNGROUPED = '';

    /* ------------------------------------------------------------------ */
    /* Localization                                                        */
    /* ------------------------------------------------------------------ */

    const zh = {
      'section.workspaces': '工作区',
      'newGroup': '新建分组',
      'group.namePlaceholder': '分组名称',
      'group.rename': '重命名分组',
      'group.delete': '删除分组',
      'group.deleteConfirm': '删除“{name}”？其中的工作区与自由会话会移到未分组。',
      'group.empty': '将工作区或自由会话拖到此分组',
      'ungrouped': '未分组',
      'freeSessions': '自由会话',
      'search.aria': '搜索工作区或会话',
      'search.placeholder': '搜索工作区或会话',
      'search.noMatches': '无匹配结果',
      'addWorkspace': '添加工作区',
      'showArchived': '显示已归档会话',
      'hideArchived': '隐藏已归档会话',
      'workspace.newSession': '新建会话',
      'workspace.rename': '重命名工作区',
      'workspace.delete': '删除工作区',
      'workspace.deleteConfirm': '删除“{name}”？文件夹与会话记录会保留，其会话会移到未分组。',
      'workspace.namePlaceholder': '工作区名称',
      'defaultWorkspaceName': '默认工作区',
      'newSession': '新会话',
      'untitled': '未命名',
      'session.actions': '会话操作',
      'empty.none': '暂无工作区',
      'empty.hint': '点击上方 + 选择一个文件夹',
      'archivedNotOpenable': '已归档会话无法打开，请先在会话菜单中取消归档',
      'status.running': '进行中',
      'status.completed': '已完成',
      'status.waitingApproval': '待审批',
      'status.waitingAnswer': '待回答',
      'status.planReview': '计划待审',
      'status.compact.approval': '待审批',
      'status.compact.answer': '待回答',
      'status.compact.planReview': '计划待审',
      'tasks.running': '运行中',
      'tasks.completed': '已完成',
      'tasks.free': '自由会话',
      'tasks.runningHint': '正在运行的任务，结束后会移到完成区',
      'tasks.completedHint': '已完成的任务，点开查看后从完成区移除',
      'tasks.interrupted': '已中断',
      'tasks.interruptedHint': '程序退出时这个任务还没跑完；点开查看后从运行区移除',
      'tasks.markCompleted': '标记为已完成',
      'tasks.markCompletedHint': '把这个任务移到完成区，点开查看后移除',
      'tasks.collapse': '收起',
      'tasks.expand': '展开',
      'pinned.title': '置顶快捷入口',
      'pinned.hint': '置顶会话的快捷入口，不改变它们原本的位置和排序',
      'settings.open': '插件设置',
      'settings.title': '工作区分组设置',
      'settings.pinned.title': '置顶区',
      'settings.pinned.desc': '把所有置顶会话集中显示为顶部快捷入口；不影响它们原本在工作区中的位置与排序。',
      'settings.pinned.aria': '显示置顶快捷入口',
      'settings.close': '关闭',
      'time.now': '刚刚',
      'time.minutes': '{n}分钟',
      'time.hours': '{n}小时',
      'time.days': '{n}天',
      'time.months': '{n}个月',
      'time.years': '{n}年',
      'rename': '重命名',
      'delete': '删除',
      'cancel': '取消',
      'error.action': '操作失败：{message}',
      'renderFailed': '工作区分组加载失败，请刷新页面或停用该插件。'
    };

    const en = {
      'section.workspaces': 'Workspaces',
      'newGroup': 'New group',
      'group.namePlaceholder': 'Group name',
      'group.rename': 'Rename group',
      'group.delete': 'Delete group',
      'group.deleteConfirm': 'Delete "{name}"? Its workspaces and free sessions move to Ungrouped.',
      'group.empty': 'Drag workspaces or free sessions into this group',
      'ungrouped': 'Ungrouped',
      'freeSessions': 'Free sessions',
      'search.aria': 'Search workspaces or sessions',
      'search.placeholder': 'Search workspaces or sessions',
      'search.noMatches': 'No matches',
      'addWorkspace': 'Add workspace',
      'showArchived': 'Show archived sessions',
      'hideArchived': 'Hide archived sessions',
      'workspace.newSession': 'New session',
      'workspace.rename': 'Rename workspace',
      'workspace.delete': 'Delete workspace',
      'workspace.deleteConfirm': 'Delete "{name}"? The folder and session logs are kept; its sessions move to Ungrouped.',
      'workspace.namePlaceholder': 'Workspace name',
      'defaultWorkspaceName': 'Default workspace',
      'newSession': 'New Session',
      'untitled': 'Untitled',
      'session.actions': 'Session actions',
      'empty.none': 'No workspaces yet',
      'empty.hint': 'Use + above to pick a folder',
      'archivedNotOpenable': 'Archived sessions cannot be opened. Unarchive it from the session menu first.',
      'status.running': 'Running',
      'status.completed': 'Completed',
      'status.waitingApproval': 'Waiting for approval',
      'status.waitingAnswer': 'Waiting for answer',
      'status.planReview': 'Plan awaiting review',
      'status.compact.approval': 'Approval',
      'status.compact.answer': 'Answer',
      'status.compact.planReview': 'Plan review',
      'tasks.running': 'Running',
      'tasks.completed': 'Completed',
      'tasks.free': 'Free session',
      'tasks.runningHint': 'A running task; it moves to Completed when it settles',
      'tasks.completedHint': 'A completed task; open it to clear it from Completed',
      'tasks.interrupted': 'Interrupted',
      'tasks.interruptedHint': 'This task was still running when the app quit; open it to clear this row',
      'tasks.markCompleted': 'Mark completed',
      'tasks.markCompletedHint': 'Move this task to Completed; open it to clear the row',
      'tasks.collapse': 'Collapse',
      'tasks.expand': 'Expand',
      'pinned.title': 'Pinned shortcuts',
      'pinned.hint': 'Quick links to pinned sessions; their original place and order stay unchanged',
      'settings.open': 'Plugin settings',
      'settings.title': 'Workspace groups settings',
      'settings.pinned.title': 'Pinned shortcuts',
      'settings.pinned.desc': 'Collect pinned sessions as shortcuts at the top of the sidebar without moving them out of their workspaces.',
      'settings.pinned.aria': 'Show pinned shortcuts',
      'settings.close': 'Close',
      'time.now': 'now',
      'time.minutes': '{n}min',
      'time.hours': '{n}h',
      'time.days': '{n}d',
      'time.months': '{n}mo',
      'time.years': '{n}y',
      'rename': 'Rename',
      'delete': 'Delete',
      'cancel': 'Cancel',
      'error.action': 'Action failed: {message}',
      'renderFailed': 'Workspace groups failed to load. Refresh the page or disable the plugin.'
    };

    /* ------------------------------------------------------------------ */
    /* Styles                                                              */
    /* ------------------------------------------------------------------ */

    const CSS = [
      '.wgrp-root{box-sizing:border-box;display:flex;flex-direction:column;flex:1 1 auto;min-height:0;padding-right:8px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}',
      '.wgrp-header{display:flex;align-items:center;gap:2px;height:36px;flex:none;padding-left:8px;margin:2px 0 4px;-webkit-user-select:none;user-select:none}',
      '.wgrp-label{flex:1 1 auto;min-width:0;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.wgrp-iconbtn{display:inline-flex;align-items:center;justify-content:center;flex:none;width:26px;height:26px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background .12s ease,color .12s ease}',
      '.wgrp-iconbtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.wgrp-iconbtn.is-on{color:var(--dsw-alias-brand-primary)}',
      '.wgrp-iconbtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.wgrp-search{flex:none;padding:0 2px 6px}',
      '.wgrp-search input{box-sizing:border-box;width:100%;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;outline:none}',
      '.wgrp-search input:focus{border-color:var(--dsw-alias-brand-primary)}',
      '.wgrp-notice{padding:2px 8px 6px;font-size:12px;line-height:17px;color:var(--dsw-alias-state-error-primary)}',
      '.wgrp-list{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding-bottom:20px;font-size:13px;line-height:20px;scrollbar-width:thin}',
      '.wgrp-row{box-sizing:border-box;display:flex;align-items:center;gap:6px;height:30px;padding:0 6px;border:0;border-top:2px solid transparent;border-bottom:2px solid transparent;border-radius:6px;color:inherit;background:transparent;cursor:pointer;-webkit-user-select:none;user-select:none;text-align:left;width:100%;font:inherit}',
      '.wgrp-row:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.wgrp-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.wgrp-row.is-active{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent)}',
      '.wgrp-row.is-archived{color:var(--dsw-alias-label-secondary)}',
      '.wgrp-group{display:flex;flex-direction:column}',
      '.wgrp-grouphead{height:28px;font-weight:600;color:var(--dsw-alias-label-secondary)}',
      '.wgrp-grouphead .wgrp-title{color:var(--dsw-alias-label-primary)}',
      '.wgrp-grouphead.wgrp-drop-into{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent);outline:1px dashed var(--dsw-alias-brand-primary);outline-offset:-1px}',
      '.wgrp-groupbody{display:flex;flex-direction:column}',
      '.wgrp-chev{display:inline-flex;align-items:center;justify-content:center;flex:none;width:12px;color:var(--dsw-alias-label-secondary);transition:transform .15s ease}',
      '.wgrp-chev.is-open{transform:rotate(90deg)}',
      '.wgrp-folder{display:inline-flex;color:var(--dsw-alias-label-secondary)}',
      '.wgrp-title{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.wgrp-count{flex:none;min-width:16px;padding:0 4px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;text-align:center}',
      '.wgrp-actions{display:none;align-items:center;flex:none}',
      '.wgrp-row:hover .wgrp-actions,.wgrp-row:focus-within .wgrp-actions{display:flex}',
      '.wgrp-wsbox{display:flex;flex-direction:column}',
      '.wgrp-wsrow{padding-left:16px}',
      '.wgrp-session{padding-left:38px}',
      '.wgrp-session.wgrp-free{padding-left:22px}',
      '.wgrp-dot{width:7px;height:7px;border-radius:50%;flex:none}',
      '.wgrp-meta{flex:none;max-width:84px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.wgrp-drop-before{border-top-color:var(--dsw-alias-brand-primary)}',
      '.wgrp-drop-after{border-bottom-color:var(--dsw-alias-brand-primary)}',
      '.wgrp-empty{padding:6px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.wgrp-sublabel{padding:8px 10px 2px;font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary);-webkit-user-select:none;user-select:none}',
      '.wgrp-newgroup{display:flex;align-items:center;gap:6px;width:100%;height:30px;padding:0 6px;margin:2px 0 4px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;text-align:left}',
      '.wgrp-newgroup:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.wgrp-newgroup:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.wgrp-create{background:var(--dsw-alias-bg-layer-2)}',
      '.wgrp-inline-input{box-sizing:border-box;flex:1 1 auto;min-width:0;height:22px;padding:0 6px;border:1px solid var(--dsw-alias-brand-primary);border-radius:5px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;line-height:18px;outline:none;-webkit-user-select:text;user-select:text}',
      '.wgrp-confirm{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:2px 8px 8px;font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary)}',
      '.wgrp-confirm-text{flex:1 1 100%}',
      '.wgrp-btn{flex:none;height:24px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer}',
      '.wgrp-btn:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.wgrp-btn.is-danger{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}',
      '.wgrp-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.wgrp-rail{display:flex;flex-direction:column;align-items:center;gap:6px;padding:6px 0}',
      '.wgrp-tasks{display:flex;flex-direction:column;padding:1px 0 3px}',
      '.wgrp-taskhead{height:26px;padding:0 6px;gap:5px;color:var(--dsw-alias-label-secondary);font-size:11.5px;font-weight:600}',
      '.wgrp-taskhead .wgrp-label{flex:1 1 auto;font-size:11.5px;font-weight:600}',
      '.wgrp-taskdot{width:7px;height:7px;border-radius:50%;flex:none}',
      '.wgrp-taskdot.is-running{background:var(--dsw-alias-state-success-primary);animation:wgrp-task-pulse 1.5s ease-in-out infinite}',
      '.wgrp-taskdot.is-waiting{background:var(--dsw-alias-state-warn-primary);animation:wgrp-task-pulse 1.5s ease-in-out infinite}',
      '.wgrp-taskdot.is-done{background:var(--dsw-alias-brand-primary)}',
      '.wgrp-taskdot.is-interrupted{background:var(--dsw-alias-label-tertiary)}',
      '.wgrp-task{box-sizing:border-box;display:flex;align-items:center;gap:6px;width:100%;height:26px;padding:0 6px 0 16px;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;font-size:12.5px;line-height:18px;text-align:left;cursor:pointer;-webkit-user-select:none;user-select:none}',
      '.wgrp-task:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.wgrp-task:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.wgrp-task-meta{flex:none;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.wgrp-pinhead{height:28px;font-weight:600;color:var(--dsw-alias-label-secondary)}',
      '.wgrp-pinhead .wgrp-title{color:var(--dsw-alias-label-secondary)}',
      '.wgrp-pinhead .wgrp-folder{display:inline-flex;color:var(--dsw-alias-brand-primary)}',
      '.wgrp-settings-panel{box-sizing:border-box;padding:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);box-shadow:0 16px 40px rgba(0,0,0,.42);color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px}',
      '.wgrp-settings-title{font-size:12.5px;font-weight:600;margin:0 0 10px}',
      '.wgrp-setting{display:flex;align-items:flex-start;gap:10px}',
      '.wgrp-setting-text{display:flex;flex-direction:column;gap:2px;flex:1 1 auto;min-width:0}',
      '.wgrp-setting-label{font-size:12.5px}',
      '.wgrp-setting-desc{font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-secondary)}',
      '.wgrp-switch{position:relative;flex:none;width:30px;height:18px;padding:0;border:0;border-radius:99px;background:color-mix(in srgb, var(--dsw-alias-label-primary) 24%, transparent);cursor:pointer;transition:background .15s ease}',
      '.wgrp-switch.is-on{background:var(--dsw-alias-brand-primary)}',
      '.wgrp-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.wgrp-switch-knob{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s ease}',
      '.wgrp-switch.is-on .wgrp-switch-knob{transform:translateX(12px)}',
      '@keyframes wgrp-task-pulse{0%,100%{opacity:1}50%{opacity:.35}}',
      '@media (prefers-reduced-motion: reduce){.wgrp-taskdot.is-running,.wgrp-taskdot.is-waiting{animation:none}}'
    ].join('');

    /* ------------------------------------------------------------------ */
    /* Icons                                                               */
    /* ------------------------------------------------------------------ */

    function icon(paths, size) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block', flex: 'none' }
        },
        paths.map((d, index) => h('path', { key: index, d }))
      );
    }

    const ICON = {
      chevron: icon(['M6 4l4 4-4 4'], 12),
      folder: icon(['M2.2 4.6h3.5l1.3 1.5h6.8v6.1a.9.9 0 0 1-.9.9H3.1a.9.9 0 0 1-.9-.9V4.6z'], 14),
      folderPlus: icon(['M2.2 4.6h3.5l1.3 1.5h6.8v6.1a.9.9 0 0 1-.9.9H3.1a.9.9 0 0 1-.9-.9V4.6z', 'M8 8.6v3.2', 'M6.4 10.2h3.2'], 14),
      plus: icon(['M8 3.5v9', 'M3.5 8h9'], 14),
      close: icon(['M4 4l8 8', 'M12 4l-8 8'], 12),
      search: icon(['M7.2 12a4.8 4.8 0 1 0 0-9.6 4.8 4.8 0 0 0 0 9.6z', 'M10.7 10.7l2.8 2.8'], 14),
      pencil: icon(['M10.8 2.8l2.4 2.4-7.6 7.6-3.2.8.8-3.2 7.6-7.6z'], 14),
      trash: icon(['M2.8 4.5h10.4', 'M6.3 4.5V3h3.4v1.5', 'M4.2 4.5l.5 8.3h6.6l.5-8.3'], 14),
      archive: icon(['M2.5 4.5h11v2h-11z', 'M3.5 6.5v6h9v-6', 'M6.5 8.7h3'], 14),
      chatPlus: icon(['M2.5 3.5h11v7.1h-5.9l-3 2.4v-2.4H2.5z', 'M8 5.3v3.1', 'M6.45 6.85h3.1'], 14),
      pin: icon(['M8 2.6v6', 'M5.2 8.6h5.6l-1 3H6.2l-1-3z', 'M8 11.6v1.8'], 14),
      gear: icon([
        'M6.7 2.1h2.6l.4 1.6 1.2.7 1.6-.5 1.3 2.2-1.2 1.2v1.4l1.2 1.2-1.3 2.2-1.6-.5-1.2.7-.4 1.6H6.7l-.4-1.6-1.2-.7-1.6.5L2.2 10l1.2-1.2V7.4L2.2 6.2l1.3-2.2 1.6.5 1.2-.7.4-1.6z',
        'M8 9.8a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z'
      ], 14),
      dots: h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: 14,
          height: 14,
          fill: 'currentColor',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block', flex: 'none' }
        },
        h('circle', { cx: 4, cy: 8, r: 1.2 }),
        h('circle', { cx: 8, cy: 8, r: 1.2 }),
        h('circle', { cx: 12, cy: 8, r: 1.2 })
      )
    };

    /* ------------------------------------------------------------------ */
    /* Persisted group layout                                              */
    /* ------------------------------------------------------------------ */

    function emptyState() {
      return {
        groups: [],
        wsGroup: {},
        wsOrder: {},
        fsGroup: {},
        fsOrder: {},
        collapsedGroups: {},
        collapsedWs: {},
        collapsedTasks: {},
        collapsedPinned: false
      };
    }

    function asObject(value) {
      return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function stringMap(input) {
      const out = {};
      for (const key of Object.keys(input)) {
        const value = input[key];
        if (typeof value === 'string' && value !== '') out[key] = value;
      }
      return out;
    }

    function orderMap(input) {
      const out = {};
      for (const key of Object.keys(input)) {
        const value = input[key];
        if (Array.isArray(value)) out[key] = value.filter((id) => typeof id === 'string');
      }
      return out;
    }

    function booleanMap(input) {
      const out = {};
      for (const key of Object.keys(input)) {
        if (typeof input[key] === 'boolean') out[key] = input[key];
      }
      return out;
    }

    function readState() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === null) return emptyState();
        const parsed = asObject(JSON.parse(raw));
        const groups = (Array.isArray(parsed.groups) ? parsed.groups : [])
          .filter((group) => group !== null && typeof group === 'object' && typeof group.id === 'string' && typeof group.name === 'string' && group.id !== '' && group.name !== '')
          .map((group) => ({ id: group.id, name: group.name }));
        return {
          groups,
          wsGroup: stringMap(asObject(parsed.wsGroup)),
          fsGroup: stringMap(asObject(parsed.fsGroup)),
          wsOrder: orderMap(asObject(parsed.wsOrder)),
          fsOrder: orderMap(asObject(parsed.fsOrder)),
          collapsedGroups: booleanMap(asObject(parsed.collapsedGroups)),
          collapsedWs: booleanMap(asObject(parsed.collapsedWs)),
          collapsedTasks: booleanMap(asObject(parsed.collapsedTasks)),
          collapsedPinned: parsed.collapsedPinned === true
        };
      } catch (error) {
        console.warn('workspace-groups: stored layout is unreadable', error);
        return emptyState();
      }
    }

    function saveState(state) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn('workspace-groups: layout could not be saved', error);
      }
    }

    function newGroupId() {
      return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    /* ------------------------------------------------------------------ */
    /* Data helpers                                                        */
    /* ------------------------------------------------------------------ */

    function errorText(error) {
      if (error instanceof Error && typeof error.message === 'string' && error.message !== '') return error.message;
      return String(error);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(value, max));
    }

    function basename(path) {
      if (typeof path !== 'string' || path === '') return '';
      const trimmed = path.replace(/[/\\]+$/, '');
      const at = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
      return trimmed.slice(at + 1) || trimmed;
    }

    function timeLabel(updatedAt, now, tr) {
      const minute = 60000;
      const hour = 3600000;
      const day = 86400000;
      const delta = Math.max(0, now - (typeof updatedAt === 'number' ? updatedAt : 0));
      if (delta < minute) return tr('time.now');
      if (delta < hour) return tr('time.minutes', { n: Math.floor(delta / minute) });
      if (delta < day) return tr('time.hours', { n: Math.floor(delta / hour) });
      if (delta < 30 * day) return tr('time.days', { n: Math.floor(delta / day) });
      if (delta < 365 * day) return tr('time.months', { n: Math.floor(delta / (30 * day)) });
      return tr('time.years', { n: Math.floor(delta / (365 * day)) });
    }

    function setOf(value) {
      return value instanceof Set ? value : new Set(Array.isArray(value) ? value : []);
    }

    /* ------------------------------------------------------------------ */
    /* Durable task board state                                            */
    /* ------------------------------------------------------------------ */

    // The task board survives restarts. The authoritative copy lives in a JSON
    // file under $DSH_HOME, served by the bundle's Host half: the Web GUI runs
    // on a loopback port that changes between launches, so page storage alone
    // would be a new, empty origin after every restart. localStorage remains a
    // same-origin cache so the board renders instantly before the Host answers.

    function sanitizeTaskRecordMap(raw) {
      const entries = asObject(raw);
      const out = {};
      for (const id of Object.keys(entries)) {
        const value = entries[id];
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

    function readTaskRecords() {
      try {
        const raw = window.localStorage.getItem(TASK_STORAGE_KEY);
        if (raw === null) return {};
        const parsed = asObject(JSON.parse(raw));
        return sanitizeTaskRecordMap(parsed.entries);
      } catch (error) {
        console.warn('workspace-groups: stored task board is unreadable', error);
        return {};
      }
    }

    function saveTaskRecords(records) {
      try {
        window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify({ version: 1, entries: records }));
      } catch (error) {
        console.warn('workspace-groups: task board could not be saved', error);
      }
    }

    function fetchTaskRecordsFromHost() {
      if (typeof fetch !== 'function') return Promise.resolve(null);
      try {
        return fetch(TASK_API_URL, { cache: 'no-store' })
          .then((response) => (response.ok ? response.json() : null))
          .then((data) => (data !== null && data !== undefined && data.entries !== undefined ? data.entries : null))
          .catch(() => null);
      } catch (error) {
        return Promise.resolve(null);
      }
    }

    function pushTaskRecordsToHost(records) {
      if (typeof fetch !== 'function') return;
      try {
        fetch(TASK_API_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ entries: records }),
          cache: 'no-store'
        }).catch(() => {});
      } catch (error) {
        /* The Host route is missing until the bundle's Host half is loaded. */
      }
    }

    function mergeTaskRecords(hostEntries, localEntries) {
      return { ...sanitizeTaskRecordMap(hostEntries), ...sanitizeTaskRecordMap(localEntries) };
    }

    /* ------------------------------------------------------------------ */
    /* Plugin settings                                                     */
    /* ------------------------------------------------------------------ */

    const DEFAULT_SETTINGS = { pinnedArea: true };

    function sanitizeSettings(raw) {
      const settings = { ...DEFAULT_SETTINGS };
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return settings;
      if (typeof raw.pinnedArea === 'boolean') settings.pinnedArea = raw.pinnedArea;
      return settings;
    }

    function readSettings() {
      try {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw === null) return sanitizeSettings(null);
        return sanitizeSettings(JSON.parse(raw));
      } catch (error) {
        console.warn('workspace-groups: stored settings are unreadable', error);
        return sanitizeSettings(null);
      }
    }

    function saveSettings(settings) {
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.warn('workspace-groups: settings could not be saved', error);
      }
    }

    function fetchSettingsFromHost() {
      if (typeof fetch !== 'function') return Promise.resolve(null);
      try {
        return fetch(SETTINGS_API_URL, { cache: 'no-store' })
          .then((response) => (response.ok ? response.json() : null))
          .then((data) => {
            if (data === null || data === undefined || data.settings === undefined) return null;
            return { settings: data.settings, stored: data.stored === true };
          })
          .catch(() => null);
      } catch (error) {
        return Promise.resolve(null);
      }
    }

    function pushSettingsToHost(settings) {
      if (typeof fetch !== 'function') return;
      try {
        fetch(SETTINGS_API_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ settings }),
          cache: 'no-store'
        }).catch(() => {});
      } catch (error) {
        /* The Host route is missing until the bundle's Host half is loaded. */
      }
    }

    function boardableSession(summary, archived) {
      if (summary === null || summary === undefined) return false;
      if (summary.origin === 'subagent') return false;
      if (summary.blank === true) return false;
      return !archived.has(summary.id);
    }

    function isMainSummary(summary) {
      return summary !== null
        && summary !== undefined
        && summary.retainedBy !== undefined
        && summary.retainedBy !== null
        && (summary.retainedBy.mainView || 0) > 0;
    }

    /**
     * Fold the live session/status snapshots into the durable task records.
     * Returns the previous object unchanged when nothing moved, so it is safe
     * to call from an effect with a state setter.
     */
    function reconcileTaskRecords(previous, sessionList, statusMap, archivedIds) {
      const base = previous !== null && typeof previous === 'object' ? previous : {};
      if (sessionList === undefined || sessionList === null || sessionList.phase !== 'ready') return base;
      const byId = sessionList.byId !== null && typeof sessionList.byId === 'object' ? sessionList.byId : {};
      const ids = Array.isArray(sessionList.ids) ? sessionList.ids : Object.keys(byId);
      const archived = setOf(archivedIds);
      const next = {};
      let changed = false;
      const now = Date.now();

      for (const id of Object.keys(base)) {
        if (!boardableSession(byId[id], archived)) {
          changed = true;
          continue;
        }
        next[id] = base[id];
      }

      for (const id of ids) {
        const summary = byId[id];
        if (!boardableSession(summary, archived)) continue;
        const raw = statusMap instanceof Map ? statusMap.get(id) : undefined;
        const isRunning = raw !== undefined && typeof raw.running === 'boolean' ? raw.running : summary.running === true;
        const isCompleted = raw !== undefined && raw.completionUnread === true;
        const main = isMainSummary(summary);
        const record = next[id];

        if (record !== undefined && record.dismissed === true) {
          // Acknowledged row kept out of sight: it must keep suppressing the
          // run or the unread completion until both are over.
          if (!isRunning && !isCompleted) {
            delete next[id];
            changed = true;
          }
          continue;
        }

        if (record !== undefined && record.manual === true) {
          // A manual completion outranks live status; only an explicit view or
          // an invalid session removes it.
          if (record.phase !== 'completed' || record.interrupted === true) {
            next[id] = { ...record, phase: 'completed', interrupted: false };
            changed = true;
          }
          continue;
        }

        if (isRunning) {
          if (record === undefined) {
            next[id] = { phase: 'running', interrupted: false, at: now };
            changed = true;
          } else if (record.phase !== 'running' || record.interrupted === true) {
            next[id] = { phase: 'running', interrupted: false, at: record.phase === 'running' ? record.at : now };
            changed = true;
          }
          continue;
        }

        // A completion only becomes a durable row while the user is not
        // looking at that session; a viewed session is seen, not pending.
        if (isCompleted && !main) {
          if (record === undefined) {
            next[id] = { phase: 'completed', interrupted: false, at: now };
            changed = true;
          } else if (record.phase !== 'completed' || record.interrupted === true) {
            next[id] = { phase: 'completed', interrupted: false, at: record.phase === 'completed' ? record.at : now };
            changed = true;
          }
          continue;
        }

        if (record === undefined) continue;

        if (record.phase === 'completed') {
          if (main) {
            delete next[id];
            changed = true;
          }
          continue;
        }

        // Last known as running, now neither running nor freshly completed:
        // the run ended unobserved (typically the app quit mid-turn).
        if (record.interrupted !== true) {
          next[id] = { ...record, interrupted: true, endedAt: now };
          changed = true;
        }
      }

      return changed ? next : base;
    }

    /* ------------------------------------------------------------------ */
    /* Small components                                                    */
    /* ------------------------------------------------------------------ */

    function IconButton(props) {
      return h(
        'button',
        {
          type: 'button',
          className: 'wgrp-iconbtn' + (props.active ? ' is-on' : ''),
          'aria-label': props.label,
          title: props.label,
          tabIndex: props.tabIndex === undefined ? 0 : props.tabIndex,
          onClick: (event) => {
            event.stopPropagation();
            if (typeof props.onClick === 'function') props.onClick(event);
          },
          onPointerDown: (event) => event.stopPropagation()
        },
        props.children
      );
    }

    function InlineInput(props) {
      const [value, setValue] = React.useState(props.initial || '');
      const settled = React.useRef(false);
      const settle = (commit) => {
        if (settled.current) return;
        settled.current = true;
        const trimmed = value.trim();
        if (commit && trimmed !== '' && trimmed !== (props.initial || '').trim()) props.onSubmit(trimmed);
        else props.onCancel();
      };
      return h('input', {
        className: 'wgrp-inline-input',
        type: 'text',
        value,
        placeholder: props.placeholder,
        'aria-label': props.label,
        autoFocus: true,
        onChange: (event) => setValue(event.target.value),
        onClick: (event) => event.stopPropagation(),
        onKeyDown: (event) => {
          event.stopPropagation();
          if (event.key === 'Enter') {
            event.preventDefault();
            settle(true);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            settle(false);
          }
        },
        onBlur: () => settle(true)
      });
    }

    function GroupCreateRow(props) {
      const t = props.t;
      return h(
        'div',
        { className: 'wgrp-row wgrp-create' },
        h('span', { className: 'wgrp-folder' }, ICON.folderPlus),
        h(InlineInput, {
          initial: '',
          placeholder: t('group.namePlaceholder'),
          label: t('newGroup'),
          onSubmit: props.onSubmit,
          onCancel: props.onCancel
        }),
        h(IconButton, { label: t('cancel'), onClick: props.onCancel }, ICON.close)
      );
    }

    function SessionRow(props) {
      const { node, title, status, meta, selected, onOpen, onMenu, t } = props;
      const classes = [
        'wgrp-row',
        'wgrp-session',
        props.free ? 'wgrp-free' : '',
        selected ? 'is-active' : '',
        node.archived ? 'is-archived' : ''
      ]
        .filter(Boolean)
        .join(' ');
      const props2 = {
        className: classes + (props.marker ? ' wgrp-drop-' + props.marker : ''),
        role: 'treeitem',
        tabIndex: 0,
        'aria-selected': selected ? 'true' : 'false',
        title: node.archived ? t('archivedNotOpenable') : node.cwd || title,
        onClick: onOpen,
        onKeyDown: (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          onOpen();
        },
        onDragOver: props.onDragOver,
        onDrop: props.onDrop,
        onContextMenu: props.onContextMenu,
        draggable: props.draggable === true,
        onDragStart: props.onDragStart,
        onDragEnd: props.onDragEnd
      };
      return h(
        'div',
        props2,
        h('span', {
          className: 'wgrp-dot',
          style: {
            background: status ? status.color : 'transparent',
            boxShadow: status ? 'none' : 'inset 0 0 0 1px var(--dsw-alias-border-l2)'
          }
        }),
        h('span', { className: 'wgrp-title' }, title),
        h('span', { className: 'wgrp-meta' }, meta),
        h(
          'span',
          { className: 'wgrp-actions' },
          h(IconButton, { label: t('session.actions'), tabIndex: -1, onClick: onMenu }, ICON.dots)
        )
      );
    }

    function WorkspaceSection(props) {
      const { workspace, title, path, collapsed, sessions, dragProps, dropProps, onToggle, onNewSession, onRename, onDelete, renderSession, t } = props;
      const [editing, setEditing] = React.useState(false);
      const [confirming, setConfirming] = React.useState(false);
      const marker = dropProps && dropProps.marker ? ' wgrp-drop-' + dropProps.marker : '';
      const header = h(
        'div',
        {
          className: 'wgrp-row wgrp-wsrow' + marker + (collapsed ? '' : ' is-open'),
          role: 'treeitem',
          tabIndex: 0,
          'aria-expanded': collapsed ? 'false' : 'true',
          title: path,
          onClick: onToggle,
          onKeyDown: (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onToggle();
          },
          draggable: dragProps.draggable === true,
          onDragStart: dragProps.onDragStart,
          onDragEnd: dragProps.onDragEnd,
          onDragOver: dropProps.onDragOver,
          onDrop: dropProps.onDrop
        },
        h('span', { className: 'wgrp-chev' + (collapsed ? '' : ' is-open') }, ICON.chevron),
        h('span', { className: 'wgrp-folder' }, ICON.folder),
        editing
          ? h(InlineInput, {
              initial: title,
              placeholder: t('workspace.namePlaceholder'),
              label: t('workspace.rename'),
              onSubmit: (value) => {
                setEditing(false);
                onRename(value);
              },
              onCancel: () => setEditing(false)
            })
          : h(
              'span',
              {
                className: 'wgrp-title',
                onDoubleClick: (event) => {
                  event.stopPropagation();
                  setEditing(true);
                }
              },
              title
            ),
        editing
          ? null
          : h(
              'span',
              { className: 'wgrp-actions' },
              h(
                IconButton,
                {
                  label: t('workspace.newSession'),
                  tabIndex: -1,
                  onClick: onNewSession
                },
                ICON.chatPlus
              ),
              h(
                IconButton,
                {
                  label: t('workspace.rename'),
                  tabIndex: -1,
                  onClick: () => setEditing(true)
                },
                ICON.pencil
              ),
              h(
                IconButton,
                {
                  label: t('workspace.delete'),
                  tabIndex: -1,
                  onClick: () => setConfirming(true)
                },
                ICON.trash
              )
            )
      );
      const confirm = confirming
        ? h(
            'div',
            { className: 'wgrp-confirm' },
            h('span', { className: 'wgrp-confirm-text' }, t('workspace.deleteConfirm', { name: title })),
            h(
              'button',
              {
                type: 'button',
                className: 'wgrp-btn',
                onClick: (event) => {
                  event.stopPropagation();
                  setConfirming(false);
                }
              },
              t('cancel')
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'wgrp-btn is-danger',
                onClick: (event) => {
                  event.stopPropagation();
                  setConfirming(false);
                  onDelete();
                }
              },
              t('delete')
            )
          )
        : null;
      const rows = collapsed ? null : sessions.map(renderSession);
      return h('div', { className: 'wgrp-wsbox' }, header, confirm, rows);
    }

    function GroupSection(props) {
      const { name, count, collapsed, empty, ungrouped, drop, groupDrag, groupDrop, onToggle, onRename, onDelete, t, children } = props;
      const [editing, setEditing] = React.useState(false);
      const [confirming, setConfirming] = React.useState(false);
      const marker = groupDrop && groupDrop.marker ? ' wgrp-drop-' + groupDrop.marker : '';
      const header = h(
        'div',
        {
          className: 'wgrp-row wgrp-grouphead' + marker + (drop && drop.active ? ' wgrp-drop-into' : ''),
          role: 'treeitem',
          tabIndex: 0,
          'aria-expanded': collapsed ? 'false' : 'true',
          onClick: onToggle,
          onKeyDown: (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onToggle();
          },
          draggable: ungrouped ? undefined : groupDrag.draggable === true,
          onDragStart: ungrouped ? undefined : groupDrag.onDragStart,
          onDragEnd: ungrouped ? undefined : groupDrag.onDragEnd,
          onDragOver: groupDrop ? groupDrop.onDragOver : undefined,
          onDrop: groupDrop ? groupDrop.onDrop : undefined
        },
        h('span', { className: 'wgrp-chev' + (collapsed ? '' : ' is-open') }, ICON.chevron),
        editing
          ? h(InlineInput, {
              initial: name,
              placeholder: t('group.namePlaceholder'),
              label: t('group.rename'),
              onSubmit: (value) => {
                setEditing(false);
                onRename(value);
              },
              onCancel: () => setEditing(false)
            })
          : h(
              'span',
              {
                className: 'wgrp-title',
                onDoubleClick: ungrouped
                  ? undefined
                  : (event) => {
                      event.stopPropagation();
                      setEditing(true);
                    }
              },
              name
            ),
        editing ? null : h('span', { className: 'wgrp-count' }, String(count)),
        editing || ungrouped
          ? null
          : h(
              'span',
              { className: 'wgrp-actions' },
              h(IconButton, { label: t('group.rename'), tabIndex: -1, onClick: () => setEditing(true) }, ICON.pencil),
              h(IconButton, { label: t('group.delete'), tabIndex: -1, onClick: () => setConfirming(true) }, ICON.trash)
            )
      );
      const confirm = confirming
        ? h(
            'div',
            { className: 'wgrp-confirm' },
            h('span', { className: 'wgrp-confirm-text' }, t('group.deleteConfirm', { name })),
            h(
              'button',
              {
                type: 'button',
                className: 'wgrp-btn',
                onClick: (event) => {
                  event.stopPropagation();
                  setConfirming(false);
                }
              },
              t('cancel')
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'wgrp-btn is-danger',
                onClick: (event) => {
                  event.stopPropagation();
                  setConfirming(false);
                  onDelete();
                }
              },
              t('delete')
            )
          )
        : null;
      const body = collapsed
        ? null
        : h(
            'div',
            { className: 'wgrp-groupbody' },
            children,
            empty ? h('div', { className: 'wgrp-empty' }, t('group.empty')) : null
          );
      return h(
        'div',
        {
          className: 'wgrp-group',
          onDragOver: drop ? drop.onDragOver : undefined,
          onDrop: drop ? drop.onDrop : undefined
        },
        header,
        confirm,
        body
      );
    }

    class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { failed: false };
      }

      static getDerivedStateFromError() {
        return { failed: true };
      }

      componentDidCatch(error) {
        console.error('workspace-groups: sidebar content failed', error);
      }

      render() {
        if (this.state.failed) return h('div', { className: 'wgrp-empty' }, this.props.fallback);
        return this.props.children;
      }
    }

    /* ------------------------------------------------------------------ */
    /* The sidebar region                                                  */
    /* ------------------------------------------------------------------ */

    function WorkspaceGroupsBrowser(props) {
      const {
        wide,
        expandSidebar,
        useWorkspaces,
        useSessions,
        useSessionStatus,
        openSession,
        startSession,
        pickDirectory,
        createWorkspace,
        renameWorkspace,
        deleteWorkspace,
        openSessionMenu,
        openTaskMenu,
        bindTaskActions
      } = props;
      const rawT = typeof props.t === 'function' ? props.t : null;
      const t = (key, params) => {
        if (rawT === null) return key;
        try {
          const value = rawT(key, params);
          return value === undefined || value === null ? key : value;
        } catch (error) {
          return key;
        }
      };

      const workspaceSnapshot = useWorkspaces((snapshot) => snapshot);
      const sessionList = useSessions((snapshot) => snapshot);
      const statusMap = useSessionStatus((snapshot) => snapshot);

      const [state, setState] = React.useState(readState);
      const [query, setQuery] = React.useState('');
      const [searchOpen, setSearchOpen] = React.useState(false);
      const [showArchived, setShowArchived] = React.useState(false);
      const [creating, setCreating] = React.useState(false);
      const [drag, setDrag] = React.useState(null);
      const [over, setOver] = React.useState(null);
      const [notice, setNotice] = React.useState(null);
      const [taskRecords, setTaskRecords] = React.useState(readTaskRecords);
      const [tasksLoaded, setTasksLoaded] = React.useState(false);
      const [settings, setSettings] = React.useState(readSettings);
      const [settingsLoaded, setSettingsLoaded] = React.useState(false);
      const [settingsOpen, setSettingsOpen] = React.useState(false);
      const [settingsAnchor, setSettingsAnchor] = React.useState({ top: 0, right: 0 });

      React.useEffect(() => {
        saveState(state);
      }, [state]);

      React.useEffect(() => {
        if (notice === null) return undefined;
        const timer = window.setTimeout(() => setNotice(null), 6000);
        return () => window.clearTimeout(timer);
      }, [notice]);

      const items = Array.isArray(workspaceSnapshot && workspaceSnapshot.items) ? workspaceSnapshot.items : [];
      const pinned = setOf(workspaceSnapshot && workspaceSnapshot.pinnedSessionIds);
      const archived = setOf(workspaceSnapshot && workspaceSnapshot.archivedSessionIds);
      const byId = (sessionList && sessionList.byId) || {};
      const sessionIds = Array.isArray(sessionList && sessionList.ids) ? sessionList.ids : [];
      let currentId;
      for (const id of Object.keys(byId)) {
        const summary = byId[id];
        if (summary && summary.retainedBy && (summary.retainedBy.mainView || 0) > 0) {
          currentId = summary.id;
          break;
        }
      }

      const validGroupIds = new Set(state.groups.map((group) => group.id));
      const workspaceById = new Map(items.map((workspace) => [workspace.workspaceId, workspace]));
      const workspaceOfSession = new Map();
      for (const workspace of items) {
        for (const id of workspace.sessionIds || []) workspaceOfSession.set(id, workspace);
      }
      const accounted = new Set();
      for (const workspace of items) for (const id of workspace.sessionIds || []) accounted.add(id);
      const freeIds = sessionIds.filter((id) => {
        const summary = byId[id];
        return summary !== undefined && summary.origin !== 'subagent' && !accounted.has(id);
      });
      const q = query.trim().toLowerCase();
      const now = Date.now();

      const seenRunningMain = React.useRef(new Set());
      const lastMainId = React.useRef(undefined);
      const lastInteractionAt = React.useRef(0);

      // Read the durable Host copy first. A write before that read would
      // overwrite it with whatever this origin's page storage happens to hold
      // (usually nothing, because every launch can use a new port).
      React.useEffect(() => {
        let cancelled = false;
        let timer = null;
        let attempts = 0;
        const load = () => {
          fetchTaskRecordsFromHost().then((entries) => {
            if (cancelled) return;
            if (entries === null) {
              attempts += 1;
              // The Host half may only come up after a profile recomposition or
              // a restart; keep reading its copy before trusting page storage.
              if (attempts < 6) {
                timer = window.setTimeout(load, 1000 * attempts);
                return;
              }
              setTasksLoaded(true);
              return;
            }
            setTaskRecords((previous) => mergeTaskRecords(entries, previous));
            setTasksLoaded(true);
          });
        };
        load();
        return () => {
          cancelled = true;
          if (timer !== null) window.clearTimeout(timer);
        };
      }, []);

      React.useEffect(() => {
        saveTaskRecords(taskRecords);
        if (tasksLoaded) pushTaskRecordsToHost(taskRecords);
      }, [taskRecords, tasksLoaded]);

      // The context-menu provider lives outside React; hand it the current
      // actions so a right-click can move a task to the completed board.
      React.useEffect(() => {
        if (typeof bindTaskActions !== 'function') return undefined;
        return bindTaskActions({ markCompleted: markTaskCompleted });
      }, [bindTaskActions]);

      // Settings live in the Host too: a page-storage preference would reset
      // whenever a new launch picks a different loopback port.
      React.useEffect(() => {
        let cancelled = false;
        let timer = null;
        let attempts = 0;
        const load = () => {
          fetchSettingsFromHost().then((raw) => {
            if (cancelled) return;
            if (raw === null) {
              attempts += 1;
              if (attempts < 6) {
                timer = window.setTimeout(load, 1000 * attempts);
                return;
              }
              setSettingsLoaded(true);
              return;
            }
            setSettings((previous) => {
              // When the Host has no saved settings yet, keep this origin's
              // preference; the save effect then writes it to the Host.
              if (raw.stored !== true) return previous;
              const next = sanitizeSettings(raw.settings);
              return next.pinnedArea === previous.pinnedArea ? previous : next;
            });
            setSettingsLoaded(true);
          });
        };
        load();
        return () => {
          cancelled = true;
          if (timer !== null) window.clearTimeout(timer);
        };
      }, []);

      React.useEffect(() => {
        saveSettings(settings);
        if (settingsLoaded) pushSettingsToHost(settings);
      }, [settings, settingsLoaded]);

      React.useEffect(() => {
        if (!settingsOpen) return undefined;
        const onPointer = (event) => {
          const target = event.target;
          if (target instanceof Element && target.closest('.wgrp-settings-panel, .wgrp-header') !== null) return;
          setSettingsOpen(false);
        };
        const onKey = (event) => {
          if (event.key === 'Escape') setSettingsOpen(false);
        };
        window.addEventListener('pointerdown', onPointer, true);
        window.addEventListener('keydown', onKey, true);
        return () => {
          window.removeEventListener('pointerdown', onPointer, true);
          window.removeEventListener('keydown', onKey, true);
        };
      }, [settingsOpen]);

      // Fold live status into the durable rows; the reconciler returns the same
      // object when nothing moved, so an unchanged board never re-renders.
      React.useEffect(() => {
        setTaskRecords((previous) => reconcileTaskRecords(previous, sessionList, statusMap, archived));
      }, [sessionList, statusMap, archived]);

      // A session that ran while the user was watching it did not complete
      // unseen: drop its row as soon as that run ends.
      React.useEffect(() => {
        if (sessionList === undefined || sessionList === null || sessionList.phase !== 'ready') return;
        const listById = (sessionList && sessionList.byId) || {};
        const ids = Array.isArray(sessionList.ids) ? sessionList.ids : Object.keys(listById);
        for (const id of ids) {
          const summary = listById[id];
          if (summary === undefined) continue;
          if (!isMainSummary(summary)) {
            seenRunningMain.current.delete(id);
            continue;
          }
          const raw = statusMap && typeof statusMap.get === 'function' ? statusMap.get(id) : undefined;
          const isRunning = raw !== undefined && typeof raw.running === 'boolean' ? raw.running : summary.running === true;
          if (isRunning) {
            seenRunningMain.current.add(id);
          } else if (seenRunningMain.current.has(id)) {
            seenRunningMain.current.delete(id);
            markTaskViewed(id);
          }
        }
      }, [sessionList, statusMap]);

      // Pointer/keyboard activity is what makes a main-view change a user
      // navigation. The startup restore happens without it, so a task kept
      // across a restart is not mistaken for one the user already opened.
      React.useEffect(() => {
        const touch = () => {
          lastInteractionAt.current = Date.now();
        };
        window.addEventListener('pointerdown', touch, true);
        window.addEventListener('keydown', touch, true);
        return () => {
          window.removeEventListener('pointerdown', touch, true);
          window.removeEventListener('keydown', touch, true);
        };
      }, []);

      React.useEffect(() => {
        if (sessionList === undefined || sessionList === null || sessionList.phase !== 'ready') return;
        const nextMain = currentId === undefined ? null : currentId;
        if (lastMainId.current === undefined) {
          lastMainId.current = nextMain;
          return;
        }
        if (nextMain !== null && nextMain !== lastMainId.current && Date.now() - lastInteractionAt.current < 5000) {
          markTaskViewed(nextMain);
        }
        lastMainId.current = nextMain;
      }, [currentId, sessionList]);

      React.useEffect(() => {
        if (currentId === undefined) return;
        const owner = items.find((workspace) => (workspace.sessionIds || []).includes(currentId));
        if (owner === undefined) return;
        setState((previous) =>
          previous.collapsedWs[owner.workspaceId] === true
            ? { ...previous, collapsedWs: { ...previous.collapsedWs, [owner.workspaceId]: false } }
            : previous
        );
      }, [currentId, items]);

      function report(message) {
        setNotice(message);
      }

      function failed(error) {
        console.warn('workspace-groups: action failed', error);
        report(t('error.action', { message: errorText(error) }));
      }

      function displayTitleOf(workspace) {
        const stored = typeof workspace.title === 'string' ? workspace.title : '';
        if (stored === 'default-workspace') return t('defaultWorkspaceName');
        return stored !== '' ? stored : basename(workspace.path);
      }

      function groupIdOf(previous, valid, workspaceId) {
        const raw = previous.wsGroup[workspaceId];
        return raw !== undefined && valid.has(raw) ? raw : UNGROUPED;
      }

      function freeGroupIdOf(previous, valid, sessionId) {
        const raw = previous.fsGroup[sessionId];
        return raw !== undefined && valid.has(raw) ? raw : UNGROUPED;
      }

      function displayedWorkspaceIds(previous, container, valid) {
        const assigned = items
          .filter((workspace) => groupIdOf(previous, valid, workspace.workspaceId) === container)
          .map((workspace) => workspace.workspaceId);
        const allowed = new Set(assigned);
        const out = [];
        for (const id of previous.wsOrder[container] || []) {
          if (allowed.has(id) && out.indexOf(id) === -1) out.push(id);
        }
        for (const id of assigned) if (out.indexOf(id) === -1) out.push(id);
        return out;
      }

      function displayedFreeIds(previous, container, valid) {
        const assigned = freeIds.filter((id) => freeGroupIdOf(previous, valid, id) === container);
        const allowed = new Set(assigned);
        const stored = previous.fsOrder[container] || [];
        const out = [];
        for (const id of stored) {
          if (allowed.has(id) && out.indexOf(id) === -1) out.push(id);
        }
        for (const id of assigned) if (out.indexOf(id) === -1) out.push(id);
        if (stored.length === 0) {
          out.sort((left, right) => {
            const a = byId[left];
            const b = byId[right];
            return (b && b.updatedAt ? b.updatedAt : 0) - (a && a.updatedAt ? a.updatedAt : 0);
          });
        }
        return out;
      }

      function makeNode(summary) {
        const status = statusMap && typeof statusMap.get === 'function' ? statusMap.get(summary.id) : undefined;
        const pendingKind = status && status.pendingInteraction ? status.pendingInteraction.kind : undefined;
        const pending =
          pendingKind === 'approval' || pendingKind === 'plan-review' || pendingKind === 'question' ? pendingKind : undefined;
        return {
          id: summary.id,
          title: summary.blank ? '' : typeof summary.title === 'string' ? summary.title.trim() : '',
          blank: summary.blank === true,
          running: status && typeof status.running === 'boolean' ? status.running : summary.running === true,
          pending,
          completed: status !== undefined && status.completionUnread === true,
          pinned: !archived.has(summary.id) && pinned.has(summary.id),
          archived: archived.has(summary.id),
          updatedAt: typeof summary.updatedAt === 'number' ? summary.updatedAt : 0,
          cwd: typeof summary.cwd === 'string' ? summary.cwd : ''
        };
      }

      function visibleSummary(summary) {
        if (summary.origin === 'subagent') return false;
        if (summary.blank && summary.id !== currentId) return false;
        if (archived.has(summary.id) && !showArchived) return false;
        return true;
      }

      function sessionsOf(workspace) {
        const nodes = [];
        for (const id of workspace.sessionIds || []) {
          const summary = byId[id];
          if (summary === undefined || !visibleSummary(summary)) continue;
          nodes.push(makeNode(summary));
        }
        const placeholders = nodes.filter((node) => node.blank);
        const leading = nodes.filter((node) => !node.blank && node.pinned);
        const rest = nodes.filter((node) => !node.blank && !node.pinned);
        return placeholders.concat(leading, rest);
      }

      function freeSessionsIn(container) {
        const nodes = [];
        for (const id of displayedFreeIds(state, container, validGroupIds)) {
          const summary = byId[id];
          if (summary === undefined || !visibleSummary(summary)) continue;
          nodes.push(makeNode(summary));
        }
        return nodes;
      }

      function nodeTitle(node) {
        return node.blank ? t('newSession') : node.title || t('untitled');
      }

      function titleMatches(text) {
        return q !== '' && String(text || '').toLowerCase().includes(q);
      }

      function workspaceMatches(workspace) {
        if (q === '') return true;
        if (titleMatches(displayTitleOf(workspace)) || titleMatches(workspace.path)) return true;
        return sessionsOf(workspace).some((node) => titleMatches(nodeTitle(node)));
      }

      function sessionsForDisplay(workspace) {
        const all = sessionsOf(workspace);
        if (q === '') return all;
        if (titleMatches(displayTitleOf(workspace)) || titleMatches(workspace.path)) return all;
        return all.filter((node) => titleMatches(nodeTitle(node)));
      }

      function statusOf(node) {
        if (node.pending === 'approval') {
          return { color: 'var(--dsw-alias-state-warn-primary)', label: t('status.waitingApproval'), compact: t('status.compact.approval') };
        }
        if (node.pending === 'plan-review') {
          return { color: 'var(--dsw-alias-state-warn-primary)', label: t('status.planReview'), compact: t('status.compact.planReview') };
        }
        if (node.pending === 'question') {
          return { color: 'var(--dsw-alias-state-warn-primary)', label: t('status.waitingAnswer'), compact: t('status.compact.answer') };
        }
        if (node.running) return { color: 'var(--dsw-alias-state-success-primary)', label: t('status.running') };
        if (node.completed) return { color: 'var(--dsw-alias-brand-primary)', label: t('status.completed') };
        return null;
      }

      /* ----------------------- temporary task board ------------------- */

      function workspaceLabelOf(sessionId) {
        const workspace = workspaceOfSession.get(sessionId);
        if (workspace !== undefined) return displayTitleOf(workspace);
        const summary = byId[sessionId];
        const cwd = summary && typeof summary.cwd === 'string' ? summary.cwd : '';
        return cwd !== '' ? basename(cwd) : t('tasks.free');
      }

      // Running and completed rows, newest first. Live status wins; the durable
      // record keeps a row alive across a restart, and a running record whose
      // run is no longer live is shown as interrupted in the running section.
      function tasksNow() {
        const running = [];
        const completed = [];
        for (const id of sessionIds) {
          const summary = byId[id];
          if (summary === undefined) continue;
          if (summary.origin === 'subagent') continue;
          if (summary.blank === true) continue;
          if (archived.has(id)) continue;
          const raw = statusMap && typeof statusMap.get === 'function' ? statusMap.get(id) : undefined;
          const isRunning = raw !== undefined && typeof raw.running === 'boolean' ? raw.running : summary.running === true;
          const isCompleted = raw !== undefined && raw.completionUnread === true;
          const record = taskRecords !== undefined ? taskRecords[id] : undefined;
          if (!isRunning && !isCompleted && record === undefined) continue;
          // Acknowledged rows stay hidden while they still suppress a run or an
          // unread completion.
          if (record !== undefined && record.dismissed === true) continue;
          const node = makeNode(summary);
          node.workspaceLabel = workspaceLabelOf(id);
          node.interrupted = false;
          // A manual completion survives live status until the user views it.
          if (record !== undefined && record.manual === true && record.phase === 'completed') {
            node.running = false;
            node.completed = true;
            completed.push(node);
            continue;
          }
          if (isRunning) {
            node.running = true;
            node.completed = false;
            running.push(node);
            continue;
          }
          if (isCompleted) {
            node.completed = true;
            completed.push(node);
            continue;
          }
          if (record === undefined) continue;
          // A durable row for the session currently on screen is not pending:
          // skip it (viewing ends its temporary stay).
          if (isMainSummary(summary)) continue;
          if (record.phase === 'running') {
            node.running = false;
            node.interrupted = true;
            running.push(node);
          } else {
            node.running = false;
            node.completed = true;
            completed.push(node);
          }
        }
        const newestFirst = (left, right) => right.updatedAt - left.updatedAt;
        running.sort(newestFirst);
        completed.sort(newestFirst);
        return { running, completed };
      }

      function taskMatches(node) {
        if (q === '') return true;
        return titleMatches(nodeTitle(node)) || titleMatches(node.workspaceLabel) || titleMatches(node.cwd);
      }

      function renderTaskRow(node, kind) {
        const interrupted = node.interrupted === true;
        const waiting = node.pending !== undefined;
        const dotState = interrupted
          ? 'is-interrupted'
          : kind === 'completed'
            ? 'is-done'
            : waiting
              ? 'is-waiting'
              : 'is-running';
        const status = statusOf(node);
        const meta = interrupted
          ? t('tasks.interrupted')
          : kind === 'running' && waiting && status !== null && status.compact !== undefined
            ? status.compact
            : node.workspaceLabel;
        const hint = interrupted
          ? t('tasks.interruptedHint')
          : kind === 'running'
            ? t('tasks.runningHint')
            : t('tasks.completedHint');
        const tooltip = [nodeTitle(node), node.workspaceLabel, node.cwd, hint]
          .filter((part) => typeof part === 'string' && part !== '')
          .join('\n');
        return h(
          'div',
          {
            key: 'task-' + kind + '-' + node.id,
            className: 'wgrp-task',
            role: 'button',
            tabIndex: 0,
            title: tooltip,
            onClick: () => openSessionGuarded(node),
            onKeyDown: (event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              openSessionGuarded(node);
            },
            onContextMenu: kind === 'running' ? (event) => openTaskMenuAt(event, node) : undefined
          },
          h('span', { className: 'wgrp-taskdot ' + dotState }),
          h('span', { className: 'wgrp-title' }, nodeTitle(node)),
          h('span', { className: 'wgrp-task-meta' }, meta)
        );
      }

      function renderTaskSection(kind, nodes) {
        const shown = nodes.filter(taskMatches);
        if (shown.length === 0) return null;
        const collapsed = q === '' && state.collapsedTasks[kind] === true;
        const label = kind === 'running' ? t('tasks.running') : t('tasks.completed');
        const live = kind === 'running' && shown.some((node) => node.interrupted !== true);
        const headDot = kind === 'running' ? (live ? 'is-running' : 'is-interrupted') : 'is-done';
        return h(
          'div',
          { key: 'tasks-' + kind, className: 'wgrp-tasks' },
          h(
            'div',
            {
              className: 'wgrp-row wgrp-taskhead',
              role: 'button',
              tabIndex: 0,
              'aria-expanded': collapsed ? 'false' : 'true',
              'aria-label': label + ' · ' + shown.length + ' · ' + t(collapsed ? 'tasks.expand' : 'tasks.collapse'),
              onClick: () => toggleTasks(kind),
              onKeyDown: (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                toggleTasks(kind);
              }
            },
            h('span', { className: 'wgrp-chev' + (collapsed ? '' : ' is-open') }, ICON.chevron),
            h('span', { className: 'wgrp-taskdot ' + headDot }),
            h('span', { className: 'wgrp-label' }, label),
            h('span', { className: 'wgrp-count' }, String(shown.length))
          ),
          collapsed ? null : h('div', { className: 'wgrp-taskbody' }, shown.map((node) => renderTaskRow(node, kind)))
        );
      }

      function toggleTasks(kind) {
        setState((previous) => ({
          ...previous,
          collapsedTasks: { ...previous.collapsedTasks, [kind]: previous.collapsedTasks[kind] !== true }
        }));
      }

      /* --------------------------- pinned area -------------------------- */

      function setPinnedArea(enabled) {
        setSettings((previous) => (previous.pinnedArea === enabled ? previous : { ...previous, pinnedArea: enabled }));
      }

      function togglePinned() {
        setState((previous) => ({ ...previous, collapsedPinned: previous.collapsedPinned !== true }));
      }

      function pinnedSessions() {
        const nodes = [];
        for (const id of sessionIds) {
          const summary = byId[id];
          if (summary === undefined) continue;
          if (summary.origin === 'subagent' || summary.blank === true) continue;
          if (archived.has(id)) continue;
          if (!pinned.has(id)) continue;
          const node = makeNode(summary);
          node.workspaceLabel = workspaceLabelOf(id);
          nodes.push(node);
        }
        nodes.sort((left, right) => right.updatedAt - left.updatedAt);
        return nodes;
      }

      function renderPinnedRow(node) {
        const status = statusOf(node);
        return h(SessionRow, {
          key: 'pin-' + node.id,
          node,
          title: nodeTitle(node),
          status,
          free: true,
          meta: node.workspaceLabel,
          selected: node.id === currentId,
          onOpen: () => openSessionGuarded(node),
          onMenu: (event) => openSessionMenuAt(event, node),
          onContextMenu: (event) => openSessionMenuAtPointer(event, node),
          t
        });
      }

      function renderPinnedSection() {
        if (settings.pinnedArea !== true) return null;
        const nodes = pinnedSessions().filter((node) => {
          if (q === '') return true;
          return titleMatches(nodeTitle(node)) || titleMatches(node.workspaceLabel) || titleMatches(node.cwd);
        });
        if (nodes.length === 0) return null;
        const collapsed = q === '' && state.collapsedPinned === true;
        const label = t('pinned.title');
        return h(
          'div',
          { key: 'pinned', className: 'wgrp-pinsection' },
          h(
            'div',
            {
              className: 'wgrp-row wgrp-pinhead',
              role: 'button',
              tabIndex: 0,
              title: t('pinned.hint'),
              'aria-expanded': collapsed ? 'false' : 'true',
              'aria-label': label + ' · ' + nodes.length + ' · ' + t(collapsed ? 'tasks.expand' : 'tasks.collapse'),
              onClick: togglePinned,
              onKeyDown: (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                togglePinned();
              }
            },
            h('span', { className: 'wgrp-chev' + (collapsed ? '' : ' is-open') }, ICON.chevron),
            h('span', { className: 'wgrp-folder' }, ICON.pin),
            h('span', { className: 'wgrp-title' }, label),
            h('span', { className: 'wgrp-count' }, String(nodes.length))
          ),
          collapsed ? null : h('div', null, nodes.map(renderPinnedRow))
        );
      }

      function renderSettingsPanel() {
        const width = 268;
        const viewport = typeof window !== 'undefined' && typeof window.innerWidth === 'number' ? window.innerWidth : 1280;
        const left = Math.max(8, Math.min(settingsAnchor.right - width + 4, viewport - width - 8));
        return h(
          'div',
          {
            className: 'wgrp-settings-panel',
            role: 'dialog',
            'aria-label': t('settings.title'),
            style: { position: 'fixed', top: (settingsAnchor.top || 0) + 6, left, width, zIndex: 9999 }
          },
          h('div', { className: 'wgrp-settings-title' }, t('settings.title')),
          h(
            'div',
            { className: 'wgrp-setting' },
            h(
              'div',
              { className: 'wgrp-setting-text' },
              h('span', { className: 'wgrp-setting-label' }, t('settings.pinned.title')),
              h('span', { className: 'wgrp-setting-desc' }, t('settings.pinned.desc'))
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'wgrp-switch' + (settings.pinnedArea === true ? ' is-on' : ''),
                role: 'switch',
                'aria-checked': settings.pinnedArea === true ? 'true' : 'false',
                'aria-label': t('settings.pinned.aria'),
                onClick: () => setPinnedArea(settings.pinnedArea !== true)
              },
              h('span', { className: 'wgrp-switch-knob' })
            )
          )
        );
      }

      /* -------------------------- mutations --------------------------- */

      function moveWorkspace(workspaceId, container, index) {
        setState((previous) => {
          const next = { ...previous, wsGroup: { ...previous.wsGroup }, wsOrder: { ...previous.wsOrder } };
          if (container === UNGROUPED) delete next.wsGroup[workspaceId];
          else next.wsGroup[workspaceId] = container;
          const order = displayedWorkspaceIds(previous, container, validGroupIds).filter((id) => id !== workspaceId);
          order.splice(clamp(index, 0, order.length), 0, workspaceId);
          next.wsOrder[container] = order;
          if (container !== UNGROUPED && next.collapsedGroups[container] === true) {
            next.collapsedGroups = { ...next.collapsedGroups, [container]: false };
          }
          return next;
        });
        setDrag(null);
        setOver(null);
      }

      function moveFreeSession(sessionId, container, index) {
        setState((previous) => {
          const next = { ...previous, fsGroup: { ...previous.fsGroup }, fsOrder: { ...previous.fsOrder } };
          if (container === UNGROUPED) delete next.fsGroup[sessionId];
          else next.fsGroup[sessionId] = container;
          const order = displayedFreeIds(previous, container, validGroupIds).filter((id) => id !== sessionId);
          order.splice(clamp(index, 0, order.length), 0, sessionId);
          next.fsOrder[container] = order;
          if (container !== UNGROUPED && next.collapsedGroups[container] === true) {
            next.collapsedGroups = { ...next.collapsedGroups, [container]: false };
          }
          return next;
        });
        setDrag(null);
        setOver(null);
      }

      function moveGroup(groupId, targetGroupId, half) {
        setState((previous) => {
          const ids = previous.groups.map((group) => group.id).filter((id) => id !== groupId);
          let at = ids.indexOf(targetGroupId);
          if (at < 0) at = ids.length;
          else if (half === 'after') at += 1;
          ids.splice(at, 0, groupId);
          const byIdMap = new Map(previous.groups.map((group) => [group.id, group]));
          return { ...previous, groups: ids.map((id) => byIdMap.get(id)).filter(Boolean) };
        });
        setDrag(null);
        setOver(null);
      }

      function createGroup(name) {
        setCreating(false);
        const trimmed = name.trim();
        if (trimmed === '') return;
        setState((previous) => ({ ...previous, groups: previous.groups.concat([{ id: newGroupId(), name: trimmed }]) }));
      }

      function renameGroup(groupId, name) {
        const trimmed = name.trim();
        if (trimmed === '') return;
        setState((previous) => ({
          ...previous,
          groups: previous.groups.map((group) => (group.id === groupId ? { ...group, name: trimmed } : group))
        }));
      }

      function deleteGroup(groupId) {
        setState((previous) => {
          const wsGroup = {};
          for (const key of Object.keys(previous.wsGroup)) {
            if (previous.wsGroup[key] !== groupId) wsGroup[key] = previous.wsGroup[key];
          }
          const fsGroup = {};
          for (const key of Object.keys(previous.fsGroup)) {
            if (previous.fsGroup[key] !== groupId) fsGroup[key] = previous.fsGroup[key];
          }
          const wsOrder = { ...previous.wsOrder };
          const fsOrder = { ...previous.fsOrder };
          delete wsOrder[groupId];
          delete fsOrder[groupId];
          const collapsedGroups = { ...previous.collapsedGroups };
          delete collapsedGroups[groupId];
          return {
            ...previous,
            groups: previous.groups.filter((group) => group.id !== groupId),
            wsGroup,
            fsGroup,
            wsOrder,
            fsOrder,
            collapsedGroups
          };
        });
      }

      function requestRenameWorkspace(workspaceId, title) {
        const trimmed = String(title || '').trim();
        if (trimmed === '') return;
        try {
          const result = renameWorkspace(workspaceId, trimmed);
          if (result !== null && typeof result === 'object' && typeof result.catch === 'function') result.catch(failed);
        } catch (error) {
          failed(error);
        }
      }

      function requestDeleteWorkspace(workspaceId) {
        try {
          const result = deleteWorkspace(workspaceId);
          if (result !== null && typeof result === 'object' && typeof result.catch === 'function') result.catch(failed);
        } catch (error) {
          failed(error);
        }
      }

      function addWorkspace() {
        Promise.resolve()
          .then(() => pickDirectory())
          .then((path) => (typeof path === 'string' && path !== '' ? createWorkspace(path) : null))
          .then((workspace) => {
            if (workspace !== null && workspace !== undefined && typeof startSession === 'function') startSession(workspace.workspaceId);
          })
          .catch(failed);
      }

      function newSessionIn(workspaceId) {
        try {
          startSession(workspaceId);
        } catch (error) {
          failed(error);
        }
      }

      function isRunningNow(sessionId) {
        const summary = byId[sessionId];
        const raw = statusMap && typeof statusMap.get === 'function' ? statusMap.get(sessionId) : undefined;
        if (raw !== undefined && typeof raw.running === 'boolean') return raw.running;
        return summary !== undefined && summary.running === true;
      }

      // Moves a running task to the completed board. The mark outranks live
      // status; viewing it later dismisses it for the rest of that run.
      function markTaskCompleted(sessionId) {
        setTaskRecords((previous) => {
          const existing = previous[sessionId];
          if (
            existing !== undefined
            && existing.manual === true
            && existing.phase === 'completed'
            && existing.dismissed !== true
          ) {
            return previous;
          }
          return {
            ...previous,
            [sessionId]: {
              phase: 'completed',
              interrupted: false,
              manual: true,
              at: existing !== undefined && existing.phase === 'completed' ? existing.at : Date.now()
            }
          };
        });
      }

      function markTaskViewed(sessionId) {
        setTaskRecords((previous) => {
          const record = previous[sessionId];
          if (record === undefined) return previous;
          const next = { ...previous };
          // A manual completion on a task that is still running becomes a
          // hidden acknowledgment, so the running row does not bounce back.
          if (record.manual === true && record.phase === 'completed' && isRunningNow(sessionId)) {
            next[sessionId] = { ...record, dismissed: true };
          } else {
            delete next[sessionId];
          }
          return next;
        });
      }

      function openSessionGuarded(node) {
        if (node.archived) {
          report(t('archivedNotOpenable'));
          return;
        }
        markTaskViewed(node.id);
        try {
          openSession(node.id);
        } catch (error) {
          failed(error);
        }
      }

      function openSessionMenuAt(event, node) {
        if (typeof openSessionMenu !== 'function') return;
        const rect = event.currentTarget.getBoundingClientRect();
        try {
          openSessionMenu(node.id, node.title, { x: rect.left, y: rect.bottom });
        } catch (error) {
          console.warn('workspace-groups: session menu failed', error);
        }
      }

      function openSessionMenuAtPointer(event, node) {
        if (typeof openSessionMenu !== 'function') return;
        event.preventDefault();
        event.stopPropagation();
        try {
          openSessionMenu(node.id, node.title, { x: event.clientX, y: event.clientY });
        } catch (error) {
          console.warn('workspace-groups: session menu failed', error);
        }
      }

      function openTaskMenuAt(event, node) {
        if (typeof openTaskMenu !== 'function') return;
        event.preventDefault();
        event.stopPropagation();
        try {
          openTaskMenu(node.id, { x: event.clientX, y: event.clientY });
        } catch (error) {
          console.warn('workspace-groups: task menu failed', error);
        }
      }

      function toggleWorkspace(workspaceId) {
        setState((previous) => ({
          ...previous,
          collapsedWs: { ...previous.collapsedWs, [workspaceId]: previous.collapsedWs[workspaceId] !== true }
        }));
      }

      function toggleContainer(container) {
        setState((previous) => ({
          ...previous,
          collapsedGroups: { ...previous.collapsedGroups, [container]: previous.collapsedGroups[container] !== true }
        }));
      }

      /* --------------------------- drag/drop -------------------------- */

      function beginDrag(event, kind, id) {
        try {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', id);
        } catch (error) {
          /* DataTransfer is absent in synthetic events; the pointer state still drives the drop. */
        }
        setDrag({ kind, id });
        setOver(null);
      }

      function endDrag() {
        setDrag(null);
        setOver(null);
      }

      function halfOf(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
      }

      function handleWorkspaceDragOver(event, container, workspace) {
        if (drag === null || drag.kind !== 'workspace' || drag.id === workspace.workspaceId) return;
        event.preventDefault();
        event.stopPropagation();
        try {
          event.dataTransfer.dropEffect = 'move';
        } catch (error) {
          /* ignore */
        }
        setOver({ target: 'workspace', id: workspace.workspaceId, container, half: halfOf(event) });
      }

      function handleWorkspaceDrop(event, container, workspace) {
        if (drag === null || drag.kind !== 'workspace') return;
        event.preventDefault();
        event.stopPropagation();
        const half = halfOf(event);
        const list = displayedWorkspaceIds(state, container, validGroupIds);
        let index = list.indexOf(workspace.workspaceId);
        if (index < 0) index = list.length;
        else if (half === 'after') index += 1;
        moveWorkspace(drag.id, container, index);
      }

      function handleFreeDragOver(event, container, node) {
        if (drag === null || drag.kind !== 'session' || drag.id === node.id) return;
        event.preventDefault();
        event.stopPropagation();
        try {
          event.dataTransfer.dropEffect = 'move';
        } catch (error) {
          /* ignore */
        }
        setOver({ target: 'session', id: node.id, container, half: halfOf(event) });
      }

      function handleFreeDrop(event, container, node) {
        if (drag === null || drag.kind !== 'session') return;
        event.preventDefault();
        event.stopPropagation();
        const half = halfOf(event);
        const list = displayedFreeIds(state, container, validGroupIds);
        let index = list.indexOf(node.id);
        if (index < 0) index = list.length;
        else if (half === 'after') index += 1;
        moveFreeSession(drag.id, container, index);
      }

      function handleGroupDragOver(event, group) {
        if (drag === null || drag.kind !== 'group' || drag.id === group.id) return;
        event.preventDefault();
        event.stopPropagation();
        try {
          event.dataTransfer.dropEffect = 'move';
        } catch (error) {
          /* ignore */
        }
        setOver({ target: 'group', id: group.id, half: halfOf(event) });
      }

      function handleGroupDrop(event, group) {
        if (drag === null || drag.kind !== 'group') return;
        event.preventDefault();
        event.stopPropagation();
        moveGroup(drag.id, group.id, halfOf(event));
      }

      function containerDropProps(container) {
        return {
          active: over !== null && over.target === 'container' && over.container === container,
          onDragOver: (event) => {
            if (drag === null || drag.kind === 'group') return;
            event.preventDefault();
            event.stopPropagation();
            try {
              event.dataTransfer.dropEffect = 'move';
            } catch (error) {
              /* ignore */
            }
            if (over === null || over.target !== 'container' || over.container !== container) {
              setOver({ target: 'container', container });
            }
          },
          onDrop: (event) => {
            if (drag === null || drag.kind === 'group') return;
            event.preventDefault();
            event.stopPropagation();
            if (drag.kind === 'workspace') {
              moveWorkspace(drag.id, container, displayedWorkspaceIds(state, container, validGroupIds).length);
            } else if (drag.kind === 'session') {
              moveFreeSession(drag.id, container, displayedFreeIds(state, container, validGroupIds).length);
            }
          }
        };
      }

      /* --------------------------- rendering -------------------------- */

      function renderSessionRow(node) {
        const status = statusOf(node);
        return h(SessionRow, {
          key: 's-' + node.id,
          node,
          title: nodeTitle(node),
          status,
          meta: status !== null && status.compact !== undefined ? status.compact : timeLabel(node.updatedAt, now, t),
          selected: node.id === currentId,
          onOpen: () => openSessionGuarded(node),
          onMenu: (event) => openSessionMenuAt(event, node),
          onContextMenu: (event) => openSessionMenuAtPointer(event, node),
          t
        });
      }

      function renderWorkspace(workspace, container) {
        const collapsed = state.collapsedWs[workspace.workspaceId] === true && q === '';
        const sessions = collapsed ? [] : sessionsForDisplay(workspace);
        return h(WorkspaceSection, {
          key: 'w-' + workspace.workspaceId,
          workspace,
          title: displayTitleOf(workspace),
          path: typeof workspace.path === 'string' ? workspace.path : '',
          collapsed,
          sessions,
          dragProps: {
            draggable: true,
            onDragStart: (event) => beginDrag(event, 'workspace', workspace.workspaceId),
            onDragEnd: endDrag
          },
          dropProps: {
            marker: over !== null && over.target === 'workspace' && over.id === workspace.workspaceId ? over.half : null,
            onDragOver: (event) => handleWorkspaceDragOver(event, container, workspace),
            onDrop: (event) => handleWorkspaceDrop(event, container, workspace)
          },
          onToggle: () => toggleWorkspace(workspace.workspaceId),
          onNewSession: () => newSessionIn(workspace.workspaceId),
          onRename: (title) => requestRenameWorkspace(workspace.workspaceId, title),
          onDelete: () => requestDeleteWorkspace(workspace.workspaceId),
          renderSession: renderSessionRow,
          t
        });
      }

      function renderFreeSession(summary, container) {
        const node = makeNode(summary);
        if (q !== '' && !titleMatches(nodeTitle(node)) && !titleMatches(node.cwd)) return null;
        const status = statusOf(node);
        return h(SessionRow, {
          key: 'f-' + node.id,
          node,
          title: nodeTitle(node),
          status,
          free: true,
          meta: status !== null && status.compact !== undefined ? status.compact : basename(node.cwd) || timeLabel(node.updatedAt, now, t),
          selected: node.id === currentId,
          onOpen: () => openSessionGuarded(node),
          onMenu: (event) => openSessionMenuAt(event, node),
          onContextMenu: (event) => openSessionMenuAtPointer(event, node),
          marker: over !== null && over.target === 'session' && over.id === node.id ? over.half : null,
          draggable: true,
          onDragStart: (event) => beginDrag(event, 'session', node.id),
          onDragEnd: endDrag,
          onDragOver: (event) => handleFreeDragOver(event, container, node),
          onDrop: (event) => handleFreeDrop(event, container, node),
          t
        });
      }

      function workspaceRows(container) {
        const children = [];
        for (const id of displayedWorkspaceIds(state, container, validGroupIds)) {
          const workspace = workspaceById.get(id);
          if (workspace === undefined || !workspaceMatches(workspace)) continue;
          children.push(renderWorkspace(workspace, container));
        }
        return children;
      }

      function freeSessionRows(container) {
        const children = [];
        for (const id of displayedFreeIds(state, container, validGroupIds)) {
          const summary = byId[id];
          if (summary === undefined || !visibleSummary(summary)) continue;
          const row = renderFreeSession(summary, container);
          if (row !== null) children.push(row);
        }
        return children;
      }

      function containerContent(container) {
        const workspacesPart = workspaceRows(container);
        const freePart = freeSessionRows(container);
        return { children: workspacesPart.concat(freePart), count: workspacesPart.length + freePart.length };
      }

      function renderGroup(group) {
        const content = containerContent(group.id);
        const collapsed = state.collapsedGroups[group.id] === true && q === '';
        if (q !== '' && content.count === 0) return null;
        return h(GroupSection, {
          key: 'g-' + group.id,
          name: group.name,
          count: content.count,
          collapsed,
          empty: content.count === 0,
          ungrouped: false,
          drop: containerDropProps(group.id),
          groupDrag: {
            draggable: true,
            onDragStart: (event) => beginDrag(event, 'group', group.id),
            onDragEnd: endDrag
          },
          groupDrop: {
            marker: over !== null && over.target === 'group' && over.id === group.id ? over.half : null,
            onDragOver: (event) => handleGroupDragOver(event, group),
            onDrop: (event) => handleGroupDrop(event, group)
          },
          onToggle: () => toggleContainer(group.id),
          onRename: (name) => renameGroup(group.id, name),
          onDelete: () => deleteGroup(group.id),
          t
        }, collapsed ? null : content.children);
      }

      function renderUngrouped() {
        const content = containerContent(UNGROUPED);
        const collapsed = state.collapsedGroups[UNGROUPED] === true && q === '';
        if (q !== '' && content.count === 0) return null;
        return h(GroupSection, {
          key: 'g-ungrouped',
          name: t('ungrouped'),
          count: content.count,
          collapsed,
          empty: content.count === 0,
          ungrouped: true,
          drop: containerDropProps(UNGROUPED),
          onToggle: () => toggleContainer(UNGROUPED),
          t
        }, collapsed ? null : content.children);
      }

      function renderList() {
        const rows = [];
        const pinnedSection = renderPinnedSection();
        if (pinnedSection !== null) rows.push(pinnedSection);
        const tasks = tasksNow();
        const runningTasks = renderTaskSection('running', tasks.running);
        if (runningTasks !== null) rows.push(runningTasks);
        const completedTasks = renderTaskSection('completed', tasks.completed);
        if (completedTasks !== null) rows.push(completedTasks);
        const sectionRowCount = rows.length;

        if (creating) {
          rows.push(
            h(GroupCreateRow, {
              key: 'create',
              t,
              onSubmit: createGroup,
              onCancel: () => setCreating(false)
            })
          );
        } else {
          rows.push(
            h(
              'button',
              {
                key: 'new-group',
                type: 'button',
                className: 'wgrp-newgroup',
                onClick: () => setCreating(true)
              },
              h('span', { className: 'wgrp-folder' }, ICON.folderPlus),
              h('span', null, t('newGroup'))
            )
          );
        }

        if (state.groups.length === 0) {
          const workspacesPart = workspaceRows(UNGROUPED);
          const freePart = freeSessionRows(UNGROUPED);
          if (workspacesPart.length === 0 && freePart.length === 0) {
            if (q !== '' && sectionRowCount === 0) {
              rows.push(h('div', { key: 'no-match', className: 'wgrp-empty' }, t('search.noMatches')));
            } else if (q === '') {
              rows.push(
                h('div', { key: 'empty', className: 'wgrp-empty' }, t('empty.none')),
                h('div', { key: 'empty-hint', className: 'wgrp-empty' }, t('empty.hint'))
              );
            }
          } else {
            for (const row of workspacesPart) rows.push(row);
            if (freePart.length > 0) {
              rows.push(h('div', { key: 'free-label', className: 'wgrp-sublabel' }, t('freeSessions')));
              for (const row of freePart) rows.push(row);
            }
          }
        } else {
          for (const group of state.groups) {
            const node = renderGroup(group);
            if (node !== null) rows.push(node);
          }
          const ungrouped = renderUngrouped();
          if (ungrouped !== null) rows.push(ungrouped);
          if (q !== '' && rows.length === sectionRowCount + 1) {
            rows.push(h('div', { key: 'no-match', className: 'wgrp-empty' }, t('search.noMatches')));
          }
        }
        return rows;
      }

      const header = h(
        'div',
        { className: 'wgrp-header' },
        h('span', { className: 'wgrp-label' }, t('section.workspaces')),
        h(
          IconButton,
          {
            label: t('search.aria'),
            active: searchOpen,
            onClick: () => {
              setSearchOpen((open) => {
                if (open) setQuery('');
                return !open;
              });
            }
          },
          ICON.search
        ),
        h(
          IconButton,
          {
            label: showArchived ? t('hideArchived') : t('showArchived'),
            active: showArchived,
            onClick: () => setShowArchived((value) => !value)
          },
          ICON.archive
        ),
        h(
          IconButton,
          {
            label: t('settings.open'),
            active: settingsOpen,
            onClick: (event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setSettingsAnchor({ top: rect.bottom, right: rect.right });
              setSettingsOpen((open) => !open);
            }
          },
          ICON.gear
        ),
        h(IconButton, { label: t('addWorkspace'), onClick: addWorkspace }, ICON.plus)
      );

      const searchRow = searchOpen
        ? h(
            'div',
            { className: 'wgrp-search' },
            h('input', {
              type: 'text',
              value: query,
              placeholder: t('search.placeholder'),
              'aria-label': t('search.aria'),
              autoFocus: true,
              onChange: (event) => setQuery(event.target.value),
              onKeyDown: (event) => {
                event.stopPropagation();
                if (event.key !== 'Escape') return;
                setQuery('');
                setSearchOpen(false);
              }
            })
          )
        : null;

      if (!wide) {
        return h(
          'div',
          { className: 'wgrp-rail' },
          h(
            IconButton,
            {
              label: t('search.aria'),
              onClick: () => {
                if (typeof expandSidebar === 'function') expandSidebar();
                setSearchOpen(true);
              }
            },
            ICON.search
          ),
          h(
            IconButton,
            {
              label: t('addWorkspace'),
              onClick: () => {
                if (typeof expandSidebar === 'function') expandSidebar();
                addWorkspace();
              }
            },
            ICON.plus
          )
        );
      }

      try {
        return h(
          'div',
          { className: 'wgrp-root' },
          header,
          searchRow,
          settingsOpen ? renderSettingsPanel() : null,
          notice !== null ? h('div', { className: 'wgrp-notice', role: 'alert' }, notice) : null,
          h(Boundary, { fallback: t('renderFailed') }, h('div', { className: 'wgrp-list' }, renderList()))
        );
      } catch (error) {
        console.error('workspace-groups: render failed', error);
        return h(
          'div',
          { className: 'wgrp-root' },
          h('div', { className: 'wgrp-empty' }, t('renderFailed'))
        );
      }
    }

    /* ------------------------------------------------------------------ */
    /* Plugin                                                              */
    /* ------------------------------------------------------------------ */

    const inject = ['slots', 'locale', 'workspaces', 'sessions', 'uiWorkspace', 'contextMenus'];

    function apply(ctx) {
      ctx.effect(() => {
        if (document.querySelector('style[data-plugin-css=' + JSON.stringify(STYLE_ID) + ']') !== null) return () => {};
        const tag = document.createElement('style');
        tag.dataset.plugin = '@local/dsh-workspace-groups';
        tag.dataset.pluginCss = STYLE_ID;
        tag.textContent = CSS;
        document.head.appendChild(tag);
        return () => {
          tag.remove();
        };
      }, 'workspace-groups: styles');

      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'workspace-groups: dictionaries');

      const workspaces = ctx.get('workspaces');
      const sessions = ctx.get('sessions');
      const uiWorkspace = ctx.get('uiWorkspace');
      const contextMenus = ctx.get('contextMenus');
      if (workspaces === undefined || sessions === undefined || uiWorkspace === undefined) {
        console.warn('workspace-groups: workspace services are unavailable');
        return;
      }

      let taskActions = null;
      const taskLabel = (key) => {
        try {
          const translate = ctx.locale.bind(NS);
          const value = translate(key);
          return typeof value === 'string' && value !== '' ? value : key;
        } catch (error) {
          return key;
        }
      };

      // Right-click action contributed to the shell's context menu for one
      // task row. The provider runs outside React; the component binds the
      // current action set through `bindTaskActions`.
      if (contextMenus !== undefined) {
        ctx.effect(
          () =>
            contextMenus.register({
              id: 'workspace-groups.task',
              target: 'workspaceGroupTask',
              order: 100,
              resolve: (value) => {
                const sessionId = value !== null && typeof value === 'object' ? value.sessionId : undefined;
                if (typeof sessionId !== 'string' || sessionId === '') return [];
                return [
                  {
                    id: 'mark-completed',
                    label: taskLabel('tasks.markCompleted'),
                    run: () => {
                      if (taskActions !== null) taskActions.markCompleted(sessionId);
                    }
                  }
                ];
              }
            }),
          'workspace-groups: task menu'
        );
      }

      // The same action on a Session row's menu: any task can be queued for
      // review again after it was already viewed once.
      if (contextMenus !== undefined) {
        ctx.effect(
          () =>
            contextMenus.register({
              id: 'workspace-groups.mark-session',
              target: 'session',
              order: 300,
              resolve: (value) => {
                const sessionId = value !== null && typeof value === 'object' ? value.sessionId : undefined;
                if (typeof sessionId !== 'string' || sessionId === '') return [];
                return [
                  {
                    id: 'mark-completed',
                    label: taskLabel('tasks.markCompleted'),
                    run: () => {
                      if (taskActions !== null) taskActions.markCompleted(sessionId);
                    }
                  }
                ];
              }
            }),
          'workspace-groups: session menu mark'
        );
      }

      const browserInjected = () => ({
        openSession: (sessionId) => uiWorkspace.openSession(sessionId),
        startSession: (workspaceId) => uiWorkspace.startSession(workspaceId),
        pickDirectory: () => uiWorkspace.pickDirectory(),
        createWorkspace: (path) => workspaces.create({ path }),
        renameWorkspace: (workspaceId, title) => workspaces.rename(workspaceId, title),
        deleteWorkspace: (workspaceId) => workspaces.delete(workspaceId),
        openSessionMenu: (sessionId, displayTitle, point) => {
          if (contextMenus === undefined) return;
          contextMenus.open({ kind: 'session', value: { sessionId, displayTitle } }, point);
        },
        openTaskMenu: (sessionId, point) => {
          if (contextMenus === undefined) return;
          contextMenus.open({ kind: 'workspaceGroupTask', value: { sessionId } }, point);
        },
        bindTaskActions: (actions) => {
          taskActions = actions;
          return () => {
            if (taskActions === actions) taskActions = null;
          };
        }
      });

      ctx.slots.inject('sidebar.workspaces', () =>
        ctx.slots.register(
          {
            name: 'sidebar.workspaces',
            // A single slot renders its lowest-priority live registration; the
            // shipped WorkspaceBrowser claims priority 0, so this entry wins at
            // -1 without colliding with it.
            priority: -1,
            inject: browserInjected,
            locale: NS
          },
          WorkspaceGroupsBrowser
        )
      );
    }

    return {
      inject,
      apply,
      // Pure halves of the durable task board, exposed for the headless test.
      __testing: { readTaskRecords, saveTaskRecords, reconcileTaskRecords, TASK_STORAGE_KEY }
    };
  }
});
