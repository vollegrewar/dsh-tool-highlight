// dsh-tool-highlight — host 侧：注册用户设置 section（collapseByDefault 默认折叠开关）。
// 浏览器端通过 settingsScope 读取同名 namespace，并在 设置 → 插件配置 自绘开关卡片。
import z from "@deepseek-ai/schemastery";

export const name = "dsh-tool-highlight";

/** 用户设置 namespace（host section 与浏览器端 settingsScope 拼写一致）。 */
export const TOOL_HIGHLIGHT_NS = "tool-highlight";

/** 用户可见配置：read / bash / pwsh 卡片是否默认折叠。 */
export const Config = z.object({
  collapseByDefault: z.boolean().default(true),
});

/**
 * 注册插件设置 section（schemastery 校验 + 持久化到用户设置文档）。
 * @param ctx - Host context。
 * @param config - 组合后的 entry 配置（作为 section 的 base 层）。
 */
export function apply(ctx, config) {
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, TOOL_HIGHLIGHT_NS, Config, config, {
      setSource: () => {},
      onChange: () => {},
    });
  });
}