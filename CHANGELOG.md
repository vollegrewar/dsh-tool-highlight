# Changelog

All notable changes to dsh-tool-highlight.

## [0.2.0] — 2026-09-01

- Feat: `read` / `bash` / `pwsh` tool cards are now **collapsible** — click the card
  header (or the chevron) to expand/collapse; running cards and failed cards auto-expand
  so live output and errors are never hidden.
- Feat: new user setting `collapseByDefault` (default `true`) — cards render collapsed
  by default; turn it off to restore the previous always-expanded rendering.
  UI: 设置 → 插件配置 → **工具卡片折叠**（改完即时生效并持久化到用户设置文档；
  也可直接写 `tool-highlight: { collapseByDefault: true }` 到 `settings.yaml`）。
- Host: register the `tool-highlight` settings section via `installSection`
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