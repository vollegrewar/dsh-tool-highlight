// dsh-tool-highlight — web client face
//
// 给 bash/pwsh 命令与 read 的代码输出做「分层语法染色」（VS Code Dark+ 风格配色）：
//   - 认得出来的才染：read 按扩展名识别语言；命令输出按内容启发式识别（JSON/代码）；
//   - 认不出来的保持原样：表格 / 日志 / 纯文本 不做任何染色（硬染反而花眼）；
//   - 与 dsh-better-tool-ui 共存：本插件以 priority -2 只接管 read / bash / pwsh 三个
//     key（数值最小者渲染，覆盖 better-tool-ui 的 -1），其余工具仍归它管。
//
// 纯显示层实现：不新增、不改写任何会话内容，不调用模型 —— 零 token 开销。
window.__ModuleLoader__.load({
  id: "dsh-tool-highlight",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");
    var inject = ["slots"];
    var e = React.createElement;

    // ------------------------------------------------------------------
    // 1. 配色样式（VS Code Dark+ / IntelliJ 系，注入一次）
    // ------------------------------------------------------------------
    var STYLE_ID = "dsh-tool-highlight-style";
    var CSS_TEXT = [
      ".th-card{background:var(--dsw-alias-surface,#161b22);border:1px solid var(--dsw-alias-border,#30363d);border-radius:8px;margin:4px 0;overflow:hidden}",
      ".th-head{display:flex;align-items:center;gap:6px;padding:6px 10px;font:12px/1.5 ui-monospace,Consolas,'Microsoft YaHei',monospace;color:var(--dsw-alias-foreground,#c9d1d9);border-bottom:1px solid var(--dsw-alias-border,#30363d);background:var(--dsw-alias-surface-2,#1c2126)}",
      ".th-ic{opacity:.75}", ".th-tool{font-weight:600;color:#9cdcfe}",
      ".th-path{color:#6e7681;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".th-exit{margin-left:auto;padding:0 6px;border-radius:4px}",
      ".th-exit-ok{color:#3fb950}.th-exit-err{color:#f85149;background:#f851491f}",
      ".th-pre{margin:0;padding:8px 10px;overflow:auto;font:12.5px/1.55 ui-monospace,Consolas,'Microsoft YaHei',monospace;color:#d4d4d4;tab-size:4}",
      ".th-line{display:flex;gap:8px;white-space:pre}",
      ".th-ln{flex:none;width:2.5em;text-align:right;color:#6e7681;user-select:none}",
      // ---- token 色（VS Code Dark+）----
      ".th-kwd{color:#569cd6}",     // 关键字 蓝
      ".th-str{color:#ce9178}",     // 字符串 橙
      ".th-num{color:#b5cea8}",     // 数字 绿
      ".th-fn{color:#dcdcaa}",      // 函数名 黄
      ".th-com{color:#6a9955}",     // 注释 草绿
      ".th-builtin{color:#4ec9b0}", // 内建/常量 青
      ".th-cmd{color:#9cdcfe}",     // 命令前缀 浅蓝
      ".th-jk{color:#9cdcfe}",      // JSON 键 浅蓝
      ".th-ready{color:#8b949e;font-style:italic}",
    ].join("\n");

    // ------------------------------------------------------------------
    // 2. 基础工具：从 block / args / resultView 取数据（对齐 DSH 槽位契约）
    // ------------------------------------------------------------------
    function argStr(args, name) {
      return typeof args[name] === "string" ? args[name] : "";
    }
    function parseArgs(raw) {
      try { var v = JSON.parse(raw || "{}"); return v && typeof v === "object" ? v : {}; }
      catch (err) { return {}; }
    }
    function resultText(block) {
      var raw = block && block.result;
      if (typeof raw === "string") return raw;
      if (raw && typeof raw === "object") {
        if (typeof raw.output === "string") return raw.output;
        if (typeof raw.text === "string") return raw.text;
        try { return JSON.stringify(raw, null, 2); } catch (err) { return String(raw); }
      }
      return "";
    }
    function tailLines(text, max) {
      var lines = String(text).split("\n");
      if (lines.length <= max) return text;
      return "… 前略 " + (lines.length - max) + " 行\n" + lines.slice(-max).join("\n");
    }

    // 输出文本的多级兜底提取：客户端投影字段 → 原始 message 形态
    function grabOutput(block, rv) {
      if (rv) {
        if (typeof rv.output === "string" && rv.output) return rv.output;
        if (typeof rv.content === "string" && rv.content) return rv.content;
        if (typeof rv.text === "string" && rv.text) return rv.text;
      }
      var res = block && block.result;
      if (typeof res === "string" && res) return res;
      if (res && typeof res === "object") {
        var keys = ["output", "content", "text"];
        for (var i = 0; i < keys.length; i++) {
          if (typeof res[keys[i]] === "string" && res[keys[i]]) return res[keys[i]];
        }
      }
      try {
        var c0 = block && block.message && block.message.content && block.message.content[0];
        var inner = c0 && c0.content;
        if (Array.isArray(inner)) {
          for (var j = 0; j < inner.length; j++) {
            var it = inner[j];
            if (it && it.type === "text" && typeof it.text === "string") return it.text;
          }
        }
      } catch (err) { /* noop */ }
      return "";
    }

    // ------------------------------------------------------------------
    // 3. 语言识别
    // ------------------------------------------------------------------
    var EXT_LANG = {
      py: { kind: "code", label: "Python" }, ps1: { kind: "code", label: "PowerShell" },
      sh: { kind: "code", label: "Shell" }, bash: { kind: "code", label: "Shell" },
      js: { kind: "code", label: "JavaScript" }, ts: { kind: "code", label: "TypeScript" },
      jsx: { kind: "code", label: "JSX" }, tsx: { kind: "code", label: "TSX" },
      cs: { kind: "code", label: "C#" }, go: { kind: "code", label: "Go" },
      rs: { kind: "code", label: "Rust" }, java: { kind: "code", label: "Java" },
      c: { kind: "code", label: "C" }, cpp: { kind: "code", label: "C++" }, h: { kind: "code", label: "C/C++" },
      json: { kind: "json", label: "JSON" }, yaml: { kind: "code", label: "YAML" }, yml: { kind: "code", label: "YAML" },
      toml: { kind: "code", label: "TOML" }, ini: { kind: "code", label: "INI" }, conf: { kind: "code", label: "INI" },
      sql: { kind: "code", label: "SQL" }, html: { kind: "code", label: "HTML" }, css: { kind: "code", label: "CSS" },
    };
    var KEYWORDS = new Set(("def class return import from for in while if elif else try except finally with as lambda " +
      "pass break continue yield global nonlocal assert del not and or is None True False self print raise " +
      "function param filter foreach switch do using process begin end null var let const new typeof instanceof " +
      "throw catch case default void this await async declare public private readonly interface extends").split(" "));
    var BUILTINS = new Set(("print len range str int float list dict set tuple bool max min sum sorted " +
      "enumerate zip map filter open input limit offset read write edit glob grep pattern include path " +
      "query result status").split(" "));

    function looksJson(text) {
      var t = String(text || "").trim();
      return (t.charAt(0) === "{" || t.charAt(0) === "[") && (function () {
        try { JSON.parse(t); return true; } catch (err) { return false; }
      })();
    }
    function detectKind(text) {
      var s = String(text || "");
      if (looksJson(s)) return { kind: "json", label: "JSON" };
      // 启发式：出现 >=2 行“像代码”的行才染，否则当作表格/日志保持原样
      var codeLike = 0;
      var lines = s.split("\n");
      for (var i = 0; i < lines.length && i < 200; i++) {
        var ln = lines[i];
        if (/(?:^|\s)(?:def |class |import |from |using |function |return |if |for |foreach |while |let |const |var )/.test(ln)) codeLike++;
        else if (/^\s*[A-Za-z_][A-Za-z0-9_]*\s*\([^)]*\)\s*[:=]/.test(ln)) codeLike++;
        else if (/^\s*\$[A-Za-z_]/.test(ln)) codeLike++;
        else if (/^\s*(?:import|from)\s/.test(ln)) codeLike++;
      }
      return codeLike >= 2 ? { kind: "code", label: s.indexOf("$") >= 0 ? "PowerShell" : "Code" } : null;
    }

    // ------------------------------------------------------------------
    // 4. 分词染色器（纯函数，返回结构；调用方渲染 React span）
    // ------------------------------------------------------------------
    function on(cls, unused, text) {
      return { cls: cls, text: String(text || "") };
    }
    function colorizeJson(text) {
      var out = [];
      var re = /("(?:[^"\\]|\\.)*"(?=\s*:))|("(?:[^"\\]|\\.)*")|(-?\b\d+(?:\.\d+)?\b)|(\b(?:true|false|null)\b)/g;
      var last = 0, m;
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) out.push(on(null, null, text.slice(last, m.index)));
        if (m[1]) out.push(on("th-jk", null, m[1]));
        else if (m[2]) out.push(on("th-str", null, m[2]));
        else if (m[3]) out.push(on("th-num", null, m[3]));
        else out.push(on("th-builtin", null, m[4]));
        last = re.lastIndex;
      }
      if (last < text.length) out.push(on(null, null, text.slice(last)));
      return out;
    }
    function colorizeCode(text) {
      var out = [];
      // 按行处理：行首注释整行吞掉；复合正则逐 token 分流
      var rows = String(text).split("\n");
      for (var r = 0; r < rows.length; r++) {
        var line = rows[r];
        if (r > 0) out.push(on(null, null, "\n"));
        if (/^\s*(#|\/\/)/.test(line)) { out.push(on("th-com", null, line)); continue; }
        // 行内注释：截到行尾的 # 或 //
        var idx = -1;
        var mi = line.indexOf(" #"); var si = line.indexOf("//");
        if (mi >= 0 && (si < 0 || mi < si)) idx = mi;
        else if (si >= 0) idx = si;
        var codePart = idx >= 0 ? line.slice(0, idx) : line;
        var re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()|([A-Za-z_][A-Za-z0-9_]*)/g;
        var last = 0, m;
        while ((m = re.exec(codePart)) !== null) {
          if (m.index > last) out.push(on(null, null, codePart.slice(last, m.index)));
          if (m[1]) out.push(on("th-str", null, m[1]));
          else if (m[2]) out.push(on("th-num", null, m[2]));
          else if (m[3]) out.push(on("th-fn", null, m[3]));
          else if (KEYWORDS.has(m[4])) out.push(on("th-kwd", null, m[4]));
          else if (BUILTINS.has(m[4])) out.push(on("th-builtin", null, m[4]));
          else out.push(on(null, null, m[4]));
          last = re.lastIndex;
        }
        if (last < codePart.length) out.push(on(null, null, codePart.slice(last)));
        if (idx >= 0) out.push(on("th-com", null, line.slice(idx)));
      }
      return out;
    }

    // ------------------------------------------------------------------
    // 5. 渲染组件
    // ------------------------------------------------------------------
    function HighlightRow(props) {
      var block = props.block || {};
      var settled = block.kind === "tool-result";
      var running = !settled;
      var wireName = props.toolName || (running ? block.name : (block.call && block.call.name) || "");
      var toolKey = String(wireName || "").toLowerCase();
      var argsRaw = running ? (block.argsRaw || "") : ((block.call && block.call.argsRaw) || "");
      var args = parseArgs(argsRaw);
      var rv = settled ? (block.resultView || null) : null;
      var failed = !!(rv && ((typeof rv.exitCode === "number" && rv.exitCode !== 0) || rv.signal)) || settled && block.isError === true;
      var out = grabOutput(block, rv);
      var filePath = argStr(args, "file_path") || argStr(args, "path");
      var command = argStr(args, "command");

      // read：客户端投影常带行号（lines: [{number,text}]），拼出含行号的文本
      var rvLines = null;
      var totalLines = 0;
      if (toolKey === "read" && rv && Array.isArray(rv.lines)) {
        rvLines = rv.lines;
        totalLines = typeof rv.totalLines === "number" ? rv.totalLines : rvLines.length;
        if (!out) out = rvLines.map(function (l) { return l.text || ""; }).join("\n");
      }

      // 语言判定：read 按扩展名；命令输出按内容启发式
      var kind = null, label = "";
      if (toolKey === "read") {
        var m = /\.([A-Za-z0-9]+)$/.exec(filePath || "");
        var ext = m ? m[1].toLowerCase() : "";
        var mapped = EXT_LANG[ext];
        if (mapped) { kind = mapped.kind; label = mapped.label; }
      } else {
        if (out && !running) {
          var det = detectKind(out);
          if (det) { kind = det.kind; label = det.label; }
        }
      }

      var tokens = null;
      var bodyText = "";
      if (!out && !running) { bodyText = "（无输出）"; }
      else if (running) { bodyText = "等待输出… ▍"; }
      else if (kind === "json") { tokens = colorizeJson(out); }
      else if (kind === "code") {
        label = label || (extLangFor(filePath) || "");
        tokens = colorizeCode(out);
      } else {
        bodyText = out; // 认不出的（表格/日志等）：原样显示，不硬染
      }

      var head = [];
      head.push(e("span", { className: "th-ic", key: "ic" }, toolKey === "read" ? "📄" : ">_"));
      head.push(e("span", { className: "th-tool", key: "tl" }, toolKey === "read" ? "Read" : toolKey === "pwsh" ? "PowerShell" : "Bash"));
      if (label) head.push(e("span", { className: "th-path", key: "lg" }, label));
      if (toolKey === "read" && filePath) head.push(e("span", { className: "th-path", key: "fp" }, filePath));
      if (toolKey !== "read" && command) head.push(e("span", { className: "th-path", key: "cmd", style: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60%" } }, "$ " + command));
      if (rv && (typeof rv.exitCode === "number" || rv.signal)) {
        head.push(e("span", { className: "th-exit " + (failed ? "th-exit-err" : "th-exit-ok"), key: "ex" },
          rv.signal ? ("signal " + rv.signal) : ("exit " + rv.exitCode)));
      }

      var preKids;
      if (rvLines && kind === "code" && rvLines.length > 0) {
        var shown = rvLines.slice(0, 60);
        preKids = shown.map(function (ln, i) {
          var toks = colorizeCode(ln.text || "");
          var spans = toks.map(function (t, j) { return t.cls ? e("span", { className: t.cls, key: j }, t.text) : t.text; });
          return e("div", { className: "th-line", key: i },
            e("span", { className: "th-ln", key: "n" }, String(ln.number)), spans);
        });
        if (totalLines > shown[shown.length - 1].number) {
          preKids.push(e("div", { className: "th-ready", key: "more" }, "… 共 " + totalLines + " 行"));
        }
      } else if (tokens) {
        preKids = tokens.map(function (t, i) { return t.cls ? e("span", { className: t.cls, key: i }, t.text) : t.text; });
      } else {
        preKids = bodyText;
      }

      return e("div", { className: "th-card", key: "hl" },
        e("div", { className: "th-head", key: "h" }, head),
        e("pre", { className: "th-pre", key: "b" }, preKids));
    }
    function extLangFor(filePath) {
      var m = /\.([A-Za-z0-9]+)$/.exec(filePath || "");
      var mapped = m ? EXT_LANG[m[1].toLowerCase()] : null;
      return mapped ? mapped.label : "";
    }

    // ------------------------------------------------------------------
    // 6. apply：注入样式 + 注册只读槽（priority -2，覆盖 better-tool-ui 的 -1）
    // ------------------------------------------------------------------
    function apply(ctx) {
      if (document.getElementById(STYLE_ID) === null) {
        var style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS_TEXT;
        document.head.appendChild(style);
      }
      ctx.slots.inject("tool.call.toolview", function () {
        var keys = ["read", "bash", "pwsh"];
        var disposers = [];
        for (var i = 0; i < keys.length; i++) {
          (function (k) {
            try {
              disposers.push(ctx.slots.register(
                { name: "tool.call.toolview", key: k, priority: -2 },
                (props) => e(HighlightRow, props)));
            } catch (err) {
              console.error("dsh-tool-highlight: register " + k + " failed", err);
            }
          })(keys[i]);
        }
        return function () {
          for (var j = 0; j < disposers.length; j++) {
            try { if (typeof disposers[j] === "function") disposers[j](); } catch (err) { /* noop */ }
          }
        };
      });
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});