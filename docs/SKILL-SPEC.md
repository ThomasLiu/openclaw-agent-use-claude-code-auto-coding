# 全自动开发编排 Skill — 实现规格

本文档供 **实现 OpenClaw Skill（Markdown + 可选脚本）** 及 **TypeScript SDK 调度层** 时使用，与仓库根目录 `README.md` 中的简介互补；**行为约束与决策以本文为准**。

---

## 1. Skill 定位与触发（实现 `SKILL.md` 时）

### 1.1 目标

- 当用户希望构建 **可全自动开发的编排型 agent** 时触发本 Skill。
- 通过 **结构化一问一答** 收集 OpenClaw 创建/配置 agent 所需参数，产出 **workspace 根目录** 下可执行文档（`AGENTS.md`、`TOOLS.md` 等）与 **安装/校验脚本指引**。
- 参考 **`openclaw-agent-config-wizard`** 的问答节奏与分阶段流程，但 **领域专精** 为：Claude Code 调度、gstack 工作流、Issue 驱动、多项目隔离、SDK 外层循环与安全策略。

### 1.2 前提（勿在 Skill 中承诺代为安装）

| 组件        | 说明                                                  |
| ----------- | ----------------------------------------------------- |
| OpenClaw    | 用户已安装；Skill 只配置与文档化。                    |
| Claude Code | 用户已安装；Skill 记录路径与鉴权 **方式**，不写密钥。 |

### 1.3 生态 Skill 引用规则

- 推荐可安装包前必须 **可验证**：`npx skills find` 或 **`find-skills`** Skill 流程；**禁止编造** `owner/repo@skill`。
- 文档中示例包名（如 `anthropics/skills`、`vercel-labs/agent-skills`）仅表达意图；**落地命令必须以检索结果为准**。

---

## 2. 角色与边界（须写入 `AGENTS.md` 的核心条款）

### 2.1 编排者（Orchestrator）

- **只做项目经理**：拆 Issue、起停子任务、汇总状态；**不直接修改业务仓库实现代码**。

### 2.2 Coding 子会话

- 通过 **Claude Agent SDK（TypeScript）** 的会话 **允许** 改业务代码、测试、开 PR。

### 2.3 人类在环

- 不删 Git 历史、全流程 Git 可追溯时，目标为 **人类只提需求**；**合并 PR 成功后再关闭 Issue**。

### 2.4 失败、诚信与计数

- 失败时 **自动重试、换 prompt**；**同一工作单元** 内累计 **5 次** 失败后 **通知人类**。
- **禁止**假代码、假测试过关。
- **工作单元**：同一 **Issue + 同一 PR + 同一条 SDK 调度链** → **一套** 计数。
- **重置**：**每新开一次 SDK 会话，计数清零**。

### 2.5 循环实现

- **不使用** Claude Code **ralph-wiggum**（Ralph）Stop Hook；在 **Agent SDK 外层** 实现「未达标则继续」的循环。

### 2.6 Prompt

- 有上下文：由 OpenClaw 编排侧动态调整。
- 固定场景：模板化；可参考 gstack 技能文风。

---

## 3. 多项目、记忆与并发

### 3.1 单 OpenClaw agent

- 默认 **一个 agent 管多项目**，降低多 agent 配置与经验割裂成本。

### 3.2 v1 真相源（硬约束）

- **不依赖** OpenClaw 内置上下文魔法。
- **仓库内记忆 + Issue（含评论）** 为权威；**处理项目前读、处理后写总结**。

### 3.3 Worktree / 分支 / PR

- 同项目可多会话并行；**每个 worktree ↔ 一条分支 ↔ 一个 PR**。
- 向导须产出并写入 `AGENTS.md` 的 **固定分支命名规范**（例如 `issue-<id>-<slug>`），避免多会话抢同一分支。

---

## 4. 与 gstack、Claude Code 的集成要求

### 4.1 gstack

- **全局安装、统一更新**；向导须包含 **检测已安装 / 否则安装或生成安装脚本** 的步骤说明。

### 4.2 项目 setup 与 Skill 列表

- OpenClaw 调用 Claude Code **初始化项目** 时，setup 中的 skill 列表 **按技术栈上下文** 生成。
- 可选：按栈执行 **`find-skills` / `npx skills find`**，展示清单 **由用户确认**，再合并 **必选底座**（仍以检索为准）。

### 4.3 工程流程（Coding 会话必须覆盖）

- **`/review` + `/ship` + `/qa`**（以 gstack slash 为约定；实际由项目内 Claude 与 SDK 协同触发）。
- 优先使用项目已有高级能力。

### 4.4 TypeScript 与测试

- 调度层：**TypeScript + Claude Agent SDK**。
- **PR CI**：mock + 调度逻辑单测。
- **Nightly / 手动 workflow**：真实 `claude` 集成测试。

---

## 5. Issue / SDD + DDD + TDD

- 相关 Issue **必须**含 **Spec 链接**、**测试计划链接**。
- 阶段结果 **Issue 评论** 追加；**`/review` 输出** 进 **comment 或 wiki** 后 Review 才算完成。
- 范围重大变更：**关闭旧 Issue** → 新开 Issue，**说明变更 + 链接旧 Issue**。
- **关单**：**Review 完成 + PR 已合并** 后才允许关闭 Issue。

---

## 6. GitHub / GitLab

- 平台由用户对话选择。
- OpenClaw **仅通过 `gh` / `glab`**（`exec`）操作；高级能力 **能则启用**，与 CLI 能力对齐。
- **兜底**：Issue + 标签 + 正文清单（全平台必须一致可用）。
- **层级**：Epic → Story → Task；**一条 Task Issue = 一个可合并 PR**；有子任务时在正文 **维护清单与状态**。
- **标签**：如 `spec-needed`、`in-progress`、`needs-review`、`blocked`；向导生成说明写入 **`AGENTS.md`**。

---

## 7. 向导问卷大纲（实现时逐条覆盖或标注跳过）

| 类别        | 收集内容                                                                       |
| ----------- | ------------------------------------------------------------------------------ |
| 每项目      | Workspace、分支策略、remote、Issue 仓库（可与代码仓不同）；**推断 + 二次确认** |
| 通道绑定    | 各通道用途；**允许跳过**                                                       |
| Claude Code | 可执行路径、headless、鉴权方式（无密钥）                                       |
| 环境        | `.env`（gitignore）、按栈 **pre-commit/扫描**、用户 **黑/白名单**              |
| 定时        | Cron 拉 Issue；每晚类 **`/retro`**，**仅当日有操作的项目**                     |
| 安全        | exec 白名单目录、禁止命令、**每 Issue 沙箱目录**                               |
| Worktree    | 分支命名规范（写入 `AGENTS.md`）                                               |

---

## 8. 部署与 CI/CD（向导阶段）

- 与用户确认 **部署目标与 CI/CD 范围**（模板化）。
- 交付 **可访问测试/预览 URL**；选项式探测 **Auth**（如优先 **Vercel** 等可试用路径）；未配置则指引登录/令牌（**不入仓**）。

---

## 9. 已定决策速查表

| 主题            | 决策                                                        |
| --------------- | ----------------------------------------------------------- |
| 上下文与记忆    | v1 **仓库 + Issue 为权威**                                  |
| 谁写业务代码    | Orchestrator 不写；SDK Coding 可写                          |
| 失败次数        | 每工作单元 5 次；新 SDK 会话清零                            |
| 循环            | SDK 外层；不用 Ralph 插件                                   |
| 并发            | worktree + 分支/PR 一一对应                                 |
| 密钥            | `.env` + gitignore + 按栈扫描 + 黑白名单                    |
| gstack / skills | 全局 gstack；setup 按栈 + 可选 find-skills + 底座以检索为准 |
| 平台            | 兜底模型 + 高级结构能则启用                                 |
| 关 Issue        | **先合并 PR**                                               |
| 测试            | PR 单测 + nightly/手动真 claude                             |

---

## 10. 实现交付物检查清单（建议）

- [ ] `SKILL.md`：`name`、`description` 覆盖触发词（全自动开发、编排、Claude Code、gstack、Issue 等）。
- [ ] 分阶段问答流程（对齐 wizard：需求 → 架构/单 agent 确认 → 草案 → 确认 → 落地命令）。
- [ ] 生成的 `AGENTS.md` 含：编排边界、真相源路径、分支/worktree 规则、Issue 关单顺序、标签语义、失败 5 次与清零规则。
- [ ] `TOOLS.md`：`gh`/`glab`、Claude 路径、**不写密钥**。
- [ ] 引用 OpenClaw 官方文档链接（agent-workspace、multi-agent）便于用户自查。
- [ ] TS 调度包：单测 + CI 分层文档（README 或 `docs/`）。

---

## 11. 参考链接

- [OpenClaw Agent workspace](https://docs.openclaw.ai/concepts/agent-workspace)
- [OpenClaw Multi-agent](https://docs.openclaw.ai/concepts/multi-agent)
- 上游参考：`openclaw-agent-config-wizard`、gstack `ETHOS.md` / `ARCHITECTURE.md`、autonomous-coding 持久化与安全思路

---

## 12. 维护

- 需求变更时同步更新 **§9** 及受影响章节；若变更用户可见行为，同步根目录 `README.md` 的快速索引。

