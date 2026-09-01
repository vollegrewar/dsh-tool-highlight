// test/host.test.mjs — host 侧逻辑测试：apply 用正确的 dsh-settings API 注册命名空间。
// 运行: node test/host.test.mjs （失败非零退出，可接 CI）
import { Config, TOOL_HIGHLIGHT_NS, apply } from "../lib/index.js";

let failed = 0;
const check = (name, ok) => { console.log((ok ? "[OK]   " : "[FAIL] ") + name); if (!ok) failed++; };

// 1. Config 是合法 schemastery schema（object 形态），并声明了 collapseByDefault（默认 true）
const json = typeof Config?.toJSON === "function" ? Config.toJSON() : null;
const refs = json && json.refs ? json.refs : {};
const objRef = Object.values(refs).find((r) => r && r.type === "object" && r.dict && r.dict.collapseByDefault);
const boolRef = objRef ? refs[objRef.dict.collapseByDefault] : null;
check("host: Config is a schemastery schema", !!objRef);
check("host: schema declares collapseByDefault default true", !!boolRef && boolRef.type === "boolean" && boolRef.meta && boolRef.meta.default === true);

// 2. apply 通过注入的 settings 服务调用 register（而非已不存在的 installSection）
let registered = null;
const fakeCtx = {
  inject(services, fn) {
    if (services.includes("settings")) {
      fn({
        settings: {
          register(ns, schema, options) {
            registered = { ns, schema, options };
          },
        },
      });
    }
  },
};
apply(fakeCtx, { collapseByDefault: false });
check("host: apply registered the namespace", registered !== null && registered.ns === TOOL_HIGHLIGHT_NS);
check("host: apply passed the Config schema", registered !== null && registered.schema === Config);
check("host: apply passed entry config as base", registered !== null && registered.options.base.collapseByDefault === false);

if (failed > 0) { console.log(`\n[FAIL] ${failed} host test(s) failed`); process.exit(1); }
console.log("\n[OK] all host tests passed");