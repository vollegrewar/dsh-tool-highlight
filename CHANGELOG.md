# Changelog

All notable changes to dsh-tool-highlight.

## [0.2.6] — 2026-09-01

- Style: theme adaptation — card text raised to near-pure-white (`#e6edf3`/
  `#f0f6fc`) for contrast; in DSH dark mode (`body[data-ds-dark-theme]`) the
  card surface brightens one step (`#161b22` → `#1c2126`, page is `#0f1115`)
  so the card no longer blends into the chat background.
- Bump `package.json` / `dsh.plugin.json` to 0.2.6.

## [0.2.5] — 2026-09-01

- Style: code font size bumped to 14px (GitHub mono stack kept).
- Bump `package.json` / `dsh.plugin.json` to 0.2.5.

## [0.2.4] — 2026-09-01

- Style: code inside cards now uses the GitHub mono stack
  (`ui-monospace → SF Mono → Menlo → Consolas → Liberation Mono`, CJK-safe
  `Microsoft YaHei` fallback) at 12px/1.5, matching GitHub code blocks.
- Bump `package.json` / `dsh.plugin.json` to 0.2.4.

## [0.2.3] — 2026-09-01

- Fix: card-render crash hardening. `read` line projections (`rv.lines`) are
  now sanitized — null/odd entries previously could throw `TypeError` on
  `ln.text` / `ln.number` and take the whole tool card down with an error
  boundary.
- Fix: `apply()` registers the tool-view slots first; the settings
  scope/card are now optional with graceful degradation (defaults apply) —
  a missing/broken `settingsScope` can no longer kill tool rendering.
- Fix: the detail body build is wrapped — any unexpected data shape renders a
  `（渲染失败：<原因>）` fallback instead of crashing the card, and the
  settings row guards a missing snapshot/action with defaults.
- Tests: add `sanitizeLines` cases (null/string/missing-number entries).
- Bump `package.json` / `dsh.plugin.json` to 0.2.3.

## [0.2.2] — 2026-09-01

- Fix: the settings card title (and label/hint/status text) was light gray —
  it referenced `--dsw-alias-foreground`, which is NOT a DSH theme token, so
  every color fell back to the dark-theme gray. Switch to the real aliases
  `--dsw-alias-label-primary` (title/label, near-black in light themes) and
  `--dsw-alias-label-secondary` (hint/status); the switch track uses
  `--dsw-alias-border-l2`.
- Bump `package.json` / `dsh.plugin.json` to 0.2.2.

## [0.2.1] — 2026-09-01

- Fix: host settings registration now uses the current dsh-settings API
  (`settings.register(ns, schema, { base })`). The previous `installSection`
  call does not exist on this dsh-settings version, so the host apply threw
  and the `tool-highlight` namespace was never served — the
  「工具卡片折叠」card was missing from 设置 → 插件配置 (the collapse default
  still worked client-side). Now the settings card renders and persists.
- Tests: add `test/host.test.mjs` (schema defaults + apply registers the
  namespace with the entry config as base); `npm test` runs both suites.
- Bump `package.json` / `dsh.plugin.json` to 0.2.1.

## [0.2.0] — 2026-09-01

- Feat: `read` / `bash` / `pwsh` tool cards are now **collapsible** — click the card
  header (or the chevron) to expand/collapse; running cards and failed cards auto-expand
  so live output and errors are never hidden.
- Feat: new user setting `collapseByDefault` (default `true`) — cards render collapsed
  by default; turn it off to restore the previous always-expanded rendering.
  UI: 设置 → 插件配置 → **工具卡片折叠**（改完即时生效并持久化到用户设置文档；
  也可直接写 `tool-highlight: { collapseByDefault: true }` 到 `settings.yaml`）。
- Host: register the `tool-highlight` settings section
  (schemastery schema, `@deepseek-ai/schemastery` dependency); browser half reads it
  through `settingsScope` and repaints rows live on change.
- Bump `package.json` / `dsh.plugin.json` to 0.2.0; add `prepublishOnly` test gate.

## [0.1.1] — 2026-08-31

- Fix: unrecognized output (tables/logs) now renders plain text instead of an empty body.
- Fix: `read` content extraction — fallback chain across resultView/result/message shapes, plus line-number gutter when the client projection provides `lines`.
- Bump `package.json` / `dsh.plugin.json` to 0.1.1.

## [0.1.0] — 2026-08-31

- First release: layered syntax highlighting for `bash` / `pwsh` output and `read` code files on the `tool.call.toolview` slot (priority -2, coexists with dsh-better-tool-ui).
- Language detection: `read` by extension (`py/js/ts/json/ps1/sh/...`), command output by heuristic (JSON → key/string/number; code-looking → tokens; else plain).
- VS Code Dark+ token palette; DSH theme tokens for surface/foreground.
- Zero token overhead: pure frontend, no session rewrite, no model calls.