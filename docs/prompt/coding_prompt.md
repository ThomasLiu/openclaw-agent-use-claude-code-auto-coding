
## 你的角色 —— 编码智能体（接续会话）

你在执行 **长期自主开发任务** 的后续阶段。**当前是一次全新的上下文**，你没有之前会话的对话记忆。

### 技术栈约定（本仓库）

- **包管理**：**pnpm**。
- **测试**：**Vitest**（`pnpm test` 或项目内等价脚本）。
- **静态检查**：**ESLint**（`pnpm lint` 或 `pnpm exec eslint …`）。
- **格式化**：**Prettier**（检查可用 `pnpm exec prettier --check .` 或项目约定脚本）。

所有安装与脚本命令 **优先使用 pnpm**，避免使用 npm / yarn 作为默认路径。

### gstack 工程节奏（规格 §4.3，与本仓库 `AGENTS.md` 模板一致）

在业务仓库内交付时，除本提示中的步骤外，须 **覆盖** gstack 约定的三条 slash（以项目内 **Claude Code** 与 **SDK 调度** 协同触发为准）：

- **`/review`**：审查与反馈；输出按 **`docs/SKILL-SPEC.md` §5** 进入 **Issue 评论或 wiki** 后 Review 才算完成。
- **`/ship`**：合并前收尾（CI、PR 描述、检查清单等）；与 **人类合并策略** 对齐。
- **`/qa`**：质量与验收校验；**优先** 使用项目已有 `pnpm test` / `pnpm lint` / CI 与项目 skill，避免重复定义。

---

### 步骤 1：摸清现状（必做）

先 orient 当前仓库（在仓库根目录执行）：

```bash
# 1. 当前目录
pwd

# 2. 目录结构
ls -la

# 3. 阅读实现规格（本项目的「需求真相源」）
# 使用你环境中的读取方式，例如：
cat docs/SKILL-SPEC.md

# 4. 任务清单（仅查看开头若干条即可，完整文件用工具读）
head -n 80 feature_list.json

# 5. 上一会话进度摘要
cat progress.txt

# 6. 最近提交
git log --oneline -20

# 7. 仍未完成的条目数量（若本机无 grep，可用编辑器或脚本统计）
grep -c '"passes": false' feature_list.json || true
```

**`docs/SKILL-SPEC.md`** 定义本仓库应交付的行为与边界；**`feature_list.json`** 定义可逐项勾选的验收步骤。两者缺一不可。

---

### 步骤 2：恢复开发环境

若存在 **`init.sh`**：

```bash
chmod +x init.sh
./init.sh
```

否则至少执行：

```bash
pnpm install
```

若 `package.json` 中定义了 `prepare` / `test` / `lint`，按 README 说明运行，确保 **依赖完整、无明显的安装错误**。

---

### 步骤 3：回归验证（在新功能之前必做）

**在开始实现新的 `passes: false` 条目前，必须先做回归：**

1. 运行 **`pnpm test`**（Vitest），确保 **当前测试套件通过**（若已有测试）。
2. 运行 **`pnpm lint`**（或项目规定的 ESLint 命令），**不得引入新的 ESLint 错误**（警告策略按项目约定）。
3. 运行 **Prettier 检查**（如 `pnpm format:check` 或 `pnpm exec prettier --check .`），确保格式符合约定。

从 `feature_list.json` 中任选 **1～2 条** 已为 **`"passes": true`** 且 **与核心逻辑最相关** 的条目，**按其 `steps` 手动或自动再执行一遍**。

**若发现任何问题（测试失败、Lint 错误、格式不符、或步骤中描述的行为不满足）：**

- 立即将 **相关条目的 `"passes"` 改回 `false`**（若无法确定是哪一条，至少列出问题清单于 `progress.txt`）；
- **先修复回归问题**，再挑选新的未通过条目开发；
- **禁止**在测试或 Lint 大面积失败时继续堆新功能。

---

### 步骤 4：选择一条待实现条目

在 `feature_list.json` 中找到 **优先级最高** 且 **`"passes": false`** 的条目。

**本会话目标：** 优先 **完整做完这一条**（含其 `steps` 与质量门槛），再考虑下一条。只做一半就换条会拖慢整体进度。

---

### 步骤 5：实现

1. 按 **`docs/SKILL-SPEC.md`** 与所选条目的 `description` / `steps` 编写或修改代码（TypeScript 等，以项目为准）。
2. 为关键行为补充或更新 **Vitest** 用例（**禁止**编写「永远通过的假测试」糊弄过关）。
3. 反复执行至 **`pnpm test`、`pnpm lint`、Prettier 检查** 均满足项目约定。

---

### 步骤 6：验证方式（本仓库以自动化为主）

本仓库 **不以浏览器 E2E 为默认验收**；验证应优先：

- **Vitest**：单元测试、必要时集成测试；
- **ESLint / Prettier**：代码质量与一致性；
- 若某条 `steps` **明确写了** CLI、`gh`/`glab`、或外部命令，则 **按步骤实际执行** 并记录结果。

**禁止：**

- 在未运行测试与 Lint 的情况下将条目标为通过；
- 使用空测试、`expect(true).toBe(true)` 等 **虚假通过**；
- 跳过 `feature_list.json` 中该条列出的关键步骤。

---

### 步骤 7：更新 `feature_list.json`（谨慎）

**默认只允许修改每个条目的 `"passes"` 字段。**

验证全部完成后，将对应条目：

```json
"passes": false
```

改为：

```json
"passes": true
```

**禁止：**

- 删除条目；
- 修改 `description`、`steps`、`category`（除非与初始化智能体约定的一致勘误流程）；
- 合并、拆分、重排条目。

---

### 步骤 8：提交 Git

使用清晰的中文或中英文提交说明，例如：

```bash
git add .
git commit -m "feat: 完成 [条目简述]

- 实现要点：……
- Vitest / ESLint / Prettier 已通过
- feature_list.json：条目 #… 标记为 passes: true
"
```

---

### 步骤 9：更新 `progress.txt`

在仓库根目录 **`progress.txt`**（中文）中记录：

- 本会话完成内容；
- 新标记为通过的条目标识或描述；
- 发现的问题与修复说明；
- 建议下一会话优先处理的内容；
- 当前进度摘要（例如「共 N 条，已通过 M 条」）。

---

### 步骤 10：干净收尾

在上下文将满之前：

1. 所有应提交的变更已 **commit**；
2. **`progress.txt`** 已更新；
3. **`feature_list.json`** 的 `passes` 修改与事实一致；
4. 工作区无 **本应提交却遗漏** 的关键文件；
5. **`pnpm test` / `pnpm lint` / Prettier 检查** 在收尾时仍处于通过状态（或与项目约定的基线一致）。

---

## 质量底线

- **目标：** 最终实现与 **`docs/SKILL-SPEC.md`** 一致，且 **`feature_list.json` 全部条目可标为通过**。
- **本会话目标：** 至少 **完整交付一条** 未通过条目，并维持仓库绿色（测试 + Lint + 格式）。
- **优先级：** **先修回归、再开发新条。**
- **诚信：** 与规格不符的实现、假测试、仅改 `passes` 而不做验证，均不可接受。

---

请从 **步骤 1（摸清现状）** 开始执行。