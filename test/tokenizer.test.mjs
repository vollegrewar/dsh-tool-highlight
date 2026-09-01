// test/tokenizer.test.mjs — 无头逻辑测试：分词染色 + 语言识别
// 运行: node test/tokenizer.test.mjs  （失败非零退出，可接 CI）
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const src = fs.readFileSync(new URL("../lib/client.js", import.meta.url), "utf8");

const m = src.match(/factory: \(require\) => \{([\s\S]*?)\n  \},\n\}\);/);
if (!m) throw new Error("cannot extract factory");

const body = m[1].replace(/\n\s*return module\.exports;\s*$/, "");
const fn = new Function(
  "exports", "module", "require", "window", "document", "React", "e",
  body + "\nexports.__test = { colorizeCode, colorizeJson, detectKind, EXT_LANG, defaultOpenFor, sanitizeLines };" +
    "\nreturn module.exports;"
);
const fakeWindow = { setInterval: () => 0, clearInterval: () => {}, setTimeout: () => 0, clearTimeout: () => {} };
const fakeDoc = { getElementById: () => null, createElement: () => ({}), head: { appendChild: () => {} } };
const api = fn({}, { exports: {} }, (id) => ({}), fakeWindow, fakeDoc, { createElement: () => null }, null);
const T = api.__test;

let failed = 0;
const check = (name, ok) => { console.log((ok ? "[OK]   " : "[FAIL] ") + name); if (!ok) failed++; };
const hasCls = (arr, cls) => arr.some((t) => t.cls === cls);

// 1. 代码分词：关键字/注释/数字/函数
const code = [
  "def line_col(text, pos):",
  "    # comment",
  "    line = text.count(chr(10), 0, pos) + 1",
  "    return line, pos - text.rfind(chr(10), 0, pos)",
].join("\n");
const ct = T.colorizeCode(code);
check("code: keyword", hasCls(ct, "th-kwd"));
check("code: comment", hasCls(ct, "th-com"));
check("code: number", hasCls(ct, "th-num"));
check("code: function", hasCls(ct, "th-fn"));

// 2. JSON：键/字符串/数字/布尔
const jt = T.colorizeJson('{"file": "a.py", "hit": 4, "ok": true}');
check("json: key", hasCls(jt, "th-jk"));
check("json: string", hasCls(jt, "th-str"));
check("json: number", hasCls(jt, "th-num"));
check("json: bool", hasCls(jt, "th-builtin"));

// 3. 识别：表格/日志 -> 不染；代码 -> 染
check("detect: plain table -> null", T.detectKind("Name    Mode\n----    ----\nREADME  d----") === null);
check("detect: code -> code", (T.detectKind("def a():\n    return 1\nimport os\n") || {}).kind === "code");

// 4. 扩展名映射
check("ext: .py -> Python", T.EXT_LANG["py"] && T.EXT_LANG["py"].label === "Python");

// 5. 边界用例
const strKwd = T.colorizeCode('x = "print"');
check("edge: keyword inside string stays string", !hasCls(strKwd, "th-kwd") && hasCls(strKwd, "th-str"));
const num = T.colorizeCode("n = 42 + 1.5");
check("edge: integer and float", hasCls(num, "th-num") && num.filter((t) => t.cls === "th-num").length >= 2);

// 6. 默认折叠决策：running/出错强制展开；其余跟随 collapseByDefault
const d = T.defaultOpenFor;
check("collapse: on + settled ok -> collapsed", d(true, false, false) === false);
check("collapse: on + running -> open", d(true, true, false) === true);
check("collapse: on + error -> open", d(true, false, true) === true);
check("collapse: off + settled ok -> open (legacy)", d(false, false, false) === true);
check("collapse: off + running -> open", d(false, true, false) === true);
check("collapse: off + error -> open", d(false, false, true) === true);

// 7. 敌意数据规整：rv.lines 的任何异常条目都不能让渲染抛错
const sl = T.sanitizeLines;
const s1 = sl([null, undefined, "plain", { number: 10, text: "ok" }]);
check("sanitize: non-array -> []", T.sanitizeLines("x").length === 0);
check("sanitize: null/undefined get empty text + index number", s1[0].text === "" && s1[0].number === 1 && s1[1].text === "" && s1[1].number === 2);
check("sanitize: string entry kept as text", s1[2].text === "plain" && s1[2].number === 3);
check("sanitize: keeps explicit number/text", s1[3].number === 10 && s1[3].text === "ok");

if (failed > 0) { console.log(`\n[FAIL] ${failed} test(s) failed`); process.exit(1); }
console.log("\n[OK] all tokenizer tests passed");