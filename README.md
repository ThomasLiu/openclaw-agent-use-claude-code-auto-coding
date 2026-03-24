# auto-ai-coding-claw

本仓库承载为 OpenClaw **main agent** 设计的「**全自动开发编排**」场景：通过专用 Skill 问答收集配置，让编排 agent 调度 **Claude Code（Agent SDK / TypeScript）**、对齐 **gstack** 工作流，并以 **GitHub / GitLab Issue** 驱动 **SDD + DDD + TDD**，在多项目下以 **仓库 + Issue** 为记忆真相源。

## 文档

| 文档                                                                 | 说明                                                                                    |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [**docs/app_spec.md**](docs/app_spec.md)                         | **Skill 与 SDK 调度层的完整实现规格**（边界、工作流、问卷大纲、已定决策、交付检查清单） |
| [**docs/DELIVERABLES-CHECKLIST.md**](docs/DELIVERABLES-CHECKLIST.md) | **§10 交付物检查清单**的可勾选追踪（含 SKILL/AGENTS/TOOLS 分项与 TS 单测、CI 分层标记） |
| [**docs/SECTION9-TRACEABILITY.md**](docs/SECTION9-TRACEABILITY.md)   | **§9 已定决策**与模板/SDK/CI 的逐条对照（维护时与 §12、本 README 快速索引同步）         |

实现 OpenClaw Skill 或配套 TypeScript 代码时，请以 `docs/app_spec.md` 为准。

## 快速索引

- **触发**：用户要搭建「可全自动开发」的编排 agent。
- **编排者**：不写业务实现，只管理 Issue、起停任务、汇总状态；**Coding 会话**可改代码。
- **真相源（v1）**：各项目 **仓库内记忆 + Issue/评论**，不依赖 OpenClaw 内置上下文魔法。
- **集成**：`gh` / `glab` CLI；**gstack** 全局安装；**Claude Agent SDK（TS）** 外层一步（未达标则继续）、**每工作单元连续 5 次**失败后通知人类、**新 SDK 会话**计数清零（不用 Ralph Stop Hook；见 SPEC §2.4–§2.5）。
- **关单顺序**：**PR 合并成功后再关闭 Issue**；须完成 **/review + /ship + /qa** 约定流程。
- **测试**：PR 上 mock + 单测；nightly / 手动跑真实 `claude` 集成测试。

更细的 worktree 约定、安全与 CI/CD 向导条款见 [**docs/app_spec.md**](docs/app_spec.md)。**§9 速查表与仓库实现对照**见 [**docs/SECTION9-TRACEABILITY.md**](docs/SECTION9-TRACEABILITY.md)。

## 本地开发

**包管理**：仅使用 **pnpm**（勿以 npm / yarn 作为默认安装方式）。

**Node 与 lockfile**：

- `package.json` 中 `engines.node` 为 `>=20`；请用本地 `node -v` 对照主版本 ≥ 20。
- 变更依赖后须将 **`pnpm-lock.yaml` 一并提交**。CI 使用 `pnpm install --frozen-lockfile`（见下文），锁文件与 manifest 不一致会导致流水线失败。

首次克隆后建议执行（若尚未可执行，请先：`chmod +x init.sh`）：

```bash
./init.sh
```

或手动：

```bash
pnpm install
pnpm test
pnpm lint
pnpm format:check
pnpm typecheck
```

| 脚本                                | 说明                          |
| ----------------------------------- | ----------------------------- |
| `pnpm test`                         | Vitest                        |
| `pnpm lint`                         | ESLint                        |
| `pnpm format` / `pnpm format:check` | Prettier 写入 / 检查          |
| `pnpm typecheck`                    | `tsc --noEmit`                |
| `pnpm build:sdk`                    | 构建 `packages/sdk` → `dist/` |

验收条目与多会话进度见根目录 **`feature_list.json`**、**`progress.txt`**。

## CI（GitHub Actions）

- 工作流：[`.github/workflows/ci.yml`](.github/workflows/ci.yml)；在 **`push`** 与 **`pull_request`** 指向 `main` / `master` 时触发。
- 使用 **pnpm**（`pnpm/action-setup`）、**Node 20**（LTS），`actions/setup-node` 启用 **pnpm 依赖缓存**；依次执行 `pnpm install --frozen-lockfile`、`pnpm lint`、`pnpm format:check`、`pnpm typecheck`、`pnpm test`（**Vitest**，覆盖调度与 mock 单测，**不要求**真实 `claude` 或 API 密钥，与 `docs/app_spec.md` §4.4 PR CI 分层一致）。
- 各步骤名称即日志分段，便于排错。若需在本地近似验证，可选用 [nektos/act](https://github.com/nektos/act)；与 GitHub 托管 runner 行为可能略有差异，以云端结果为准。

### Nightly / 手动：真实 API smoke（与 PR 分层）

- 工作流：[`.github/workflows/claude-integration.yml`](.github/workflows/claude-integration.yml) — **`schedule`**（每日 UTC 02:00，仅默认分支）与 **`workflow_dispatch`**（手动）。
- **密钥**：通过 Actions **Secrets** 注入 `ANTHROPIC_API_KEY`，**不得**写入仓库；可选 Repository variable `CLAUDE_SMOKE_MODEL` 覆盖默认模型。
- **与 PR job 的差异、重跑策略、成本/配额说明、最小 smoke 行为** 见 [**docs/CI-INTEGRATION.md**](docs/CI-INTEGRATION.md)（对齐 `docs/app_spec.md` §4.4）。
- 本地手动跑 smoke（需自行导出密钥）：`pnpm integration:smoke`。

## 目录结构（与规格对齐的最小骨架）

| 路径            | 说明                                                             |
| --------------- | ---------------------------------------------------------------- |
| `docs/`         | 规格与提示词                                                     |
| `skill/`        | OpenClaw Skill 入口（`SKILL.md`）                                |
| `src/`          | TypeScript 调度层实现（增量扩展）                                |
| `packages/sdk/` | `@auto-ai-coding-claw/sdk` 调度门面（build 见 `pnpm build:sdk`） |
| `templates/`    | 向导生成物模板预留                                               |
| `workspace/`    | 记忆与流水线路径约定（见内文）                                   |



