# Changelog

All notable changes to dsh-tool-highlight.

## [0.1.0] — 2026-08-31

- First release: layered syntax highlighting for `bash` / `pwsh` output and `read` code files on the `tool.call.toolview` slot (priority -2, coexists with dsh-better-tool-ui).
- Language detection: `read` by extension (`py/js/ts/json/ps1/sh/...`), command output by heuristic (JSON → key/string/number; code-looking → tokens; else plain).
- VS Code Dark+ token palette; DSH theme tokens for surface/foreground.
- Zero token overhead: pure frontend, no session rewrite, no model calls.