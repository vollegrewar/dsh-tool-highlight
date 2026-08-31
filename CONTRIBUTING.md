# Contributing

Thanks for helping improve dsh-tool-highlight.

## Design goals (keep them)

1. **Zero token overhead** — the plugin may never add/rewrite session content or call a model. All rendering is client-side.
2. **Only color what it recognizes** — forced coloring of tables/logs is a bug. Add heuristics carefully.
3. **Coexist, don't fight** — register on `tool.call.toolview` at priority -2 and only the keys you own (`read`, `bash`, `pwsh`).

## Dev

```bash
# syntax check
node --check lib/client.js

# headless logic test (tokenizers + detection)
node test/tokenizer.test.mjs
```

## Install your changes locally

```bash
dsh plugin --profile web add link:/path/to/dsh-tool-highlight
# restart dsh web + hard refresh
```

## Before releasing

- Bump `version` in `package.json` and `dsh.plugin.json`
- Add a line to `CHANGELOG.md`
- `node test/tokenizer.test.mjs` passes