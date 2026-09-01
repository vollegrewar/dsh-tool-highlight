# dsh-tool-highlight

> A DeepSeek Harness (DSH) web plugin that adds **layered syntax highlighting** to **bash / pwsh command output** and **read code output** in the web GUI, using a VS Code Dark+ palette (keywords / strings / numbers / functions / comments each get their own color). **It colors only what it recognizes; tables and logs stay plain.**

Pure frontend rendering — it **never adds or rewrites any session content and never calls the model: zero token overhead.**

## What you get

- **`read` on code files** → language detected from the extension (`.py .js .ts .json .ps1 .sh ...`), PyCharm-style token coloring
- **bash / pwsh output** → content heuristic: JSON gets key/string/number coloring; code-looking output gets syntax coloring; **tables / logs stay plain** (forced coloring on a receipt looks like a mess)
- Exit-code chip (green = success / red = non-zero exit or signal)
- **Collapsible cards (toggleable)**: `read` / `bash` / `pwsh` cards collapse to a one-line header (path + status chip) by default — click the header to expand/collapse; running and failed cards auto-expand so live output and errors are never hidden. Turn the default-collapse off in Settings → Plugin settings → **工具卡片折叠** to restore the previous always-expanded rendering.

## Configuration

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `collapseByDefault` | `boolean` | `true` | render `read` / `bash` / `pwsh` cards collapsed by default; set `false` to always expand. |

UI: Settings → Plugin settings → **工具卡片折叠** (applies immediately, persisted to the user settings document). You can also write it directly in the profile's `cordis.yml` / `settings.yaml`:

```yaml
tool-highlight:
  collapseByDefault: true
```

## Install

```bash
# npm (recommended)
dsh plugin --profile web add dsh-tool-highlight

# GitHub source
dsh plugin --profile web add github:vollegrewar/dsh-tool-highlight

# local link (development)
dsh plugin --profile web add link:/path/to/dsh-tool-highlight
```

Restart `dsh web` and hard-refresh (Ctrl+Shift+R).

> Installing from the GitHub source may ask for pnpm `allowBuilds` approval — add `dsh-tool-highlight` to the profile's `pnpm-workspace.yaml` allow list. The plugin has no build scripts, so the npm install never triggers this.

## Coexist with dsh-better-tool-ui

This plugin only takes over the `read / bash / pwsh` tool cards (priority -2); `dsh-better-tool-ui` keeps handling write/edit diffs, status rails and everything else — they don't conflict. It also works standalone.

## How it works

- Mounts on the official keyed slot `tool.call.toolview`, one renderer per tool name
- Language detection: `read` by file extension; command output by content heuristics (parseable JSON → JSON; ≥2 code-looking lines → Code; otherwise plain)
- A self-contained lightweight regex tokenizer (zero runtime dependencies), VS Code Dark+ palette, follows DSH theme tokens

## Docs

- [Preview](docs/preview.png) — what the colored vs plain output looks like
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## License

[MIT](./LICENSE)