# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库工作时提供指导。

## 项目概述

这是 **OpenClaw 主智能体** 编排项目 —— 一个"全自动开发编排"场景。它使用 **Claude Agent SDK (TypeScript)** 编排 Claude Code，整合 **gstack** 工作流，并通过 **GitHub/GitLab Issues** 驱动开发，遵循 SDD + DDD + TDD 模式。

**关键参考**：`docs/SKILL-SPEC.md` 是 OpenClaw Skill 和 TypeScript SDK 调度层的权威实现规范。`docs/prompt/` 目录包含提示词模板（coding_prompt.md、initializer_prompt.md）。

## 包管理器

**仅限 pnpm** — 不要使用 npm 或 yarn 作为默认安装方式。`pnpm-lock.yaml` 必须与依赖变更一起提交。CI 使用 `pnpm install --frozen-lockfile`。

Node 版本要求：`>=20`（用 `node -v` 检查）。

## 开发命令

```bash
pnpm install          # 安装所有工作区依赖
pnpm test             # Vitest 单元测试
pnpm lint             # ESLint 检查
pnpm format           # Prettier 格式化写入
pnpm format:check     # Prettier 格式检查
pnpm typecheck        # tsc --noEmit 类型检查
```

运行单个测试文件：直接使用 Vitest：`pnpm vitest run src/path/to/test.test.ts`

## CI

- **PR CI**（`.github/workflows/ci.yml` push/PR 到 main/master 时触发）：安装依赖、lint、format:check、typecheck、test — 无需真实 API 密钥。
- **夜间/手动**（`.github/workflows/claude-integration.yml`）：通过 `ANTHROPIC_API_KEY` secret 运行真实的 `claude` 冒烟测试。本地运行：`pnpm integration:smoke`。

## 目录结构

| 路径 | 用途 |
|------|------|
| `packages/autonomous-coding/` | 自主编程智能体 CLI 工具 |
| `docs/` | 规范和提示词 — SKILL-SPEC.md 是真相源 |
| `skill/` | OpenClaw Skill 入口（`SKILL.md`） |
| `plugins/` | 插件目录 |
| `plugins/gstack/` | Vendored gstack — **bun** 基础，独立的 package.json |
| `plugins/openclaw/` | Vendored OpenClaw 扩展 |

## 架构笔记

- **编排者角色**：不写业务代码 — 只管理 Issues、启动/停止任务、汇总状态。
- **编程会话**：允许业务代码变更、测试、PR 创建。
- **记忆真相源 (v1)**：仓库内记忆 + Issue/评论，不是 OpenClaw 内置上下文魔法。
- **失败处理**：同一工作单元内自动重试；连续 5 次失败通知人类。每次新 SDK 会话重置计数器。循环在 SDK 外层实现，不是 Ralph Stop Hook。
- **PR 工作流**：`/review` → `/ship` → `/qa`（gstack slash 约定）。**PR 合并成功后关闭 Issue**。
- **分支**：每个 worktree = 一条分支 = 一个 PR。固定命名规范（如 `issue-<id>-<slug>`）避免多会话分支冲突。
- **gstack 集成**：全局安装；项目设置中的 skill 列表按技术栈上下文生成。

## packages/autonomous-coding

自主编程智能体子项目，独立的工作区包。

```bash
cd packages/autonomous-coding
pnpm install
pnpm build
```
