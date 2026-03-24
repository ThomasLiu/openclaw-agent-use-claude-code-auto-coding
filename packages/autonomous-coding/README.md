# 自主编程智能体

基于 Claude Agent SDK 的长时间运行自主编程工具。

## 功能特性

- **双智能体模式**：初始化智能体（创建项目结构和测试用例）+ 编程智能体（实现功能）
- **安全防护**：Bash 命令白名单验证，防止恶意操作
- **进度跟踪**：自动统计测试通过率
- **多 API 支持**：MiniMax、Anthropic 官方及其他兼容 API
- **灵活配置**：提示词路径可通过参数或环境变量自定义

## 快速开始

### 安装依赖

```bash
cd autonomous-coding
pnpm install
```

### 配置 API 密钥

```bash
# MiniMax 用户
export ANTHROPIC_AUTH_TOKEN="your-minimax-api-key"
export ANTHROPIC_BASE_URL="https://api.minimaxi.com/anthropic"
export ANTHROPIC_MODEL="MiniMax-M2.7"

# Anthropic 官方用户
export ANTHROPIC_API_KEY="your-anthropic-key"
```

### 运行

```bash
# 构建
pnpm build

# 运行（全新项目）
node dist/index.js --project-dir ./my_project

# 运行（限制迭代次数）
node dist/index.js --project-dir ./my_project --max-iterations 5

# 开发模式（直接运行源码）
pnpm dev
```

## CLI 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-p, --project-dir` | 项目目录 | `./autonomous_demo_project` |
| `-m, --max-iterations` | 最大迭代次数 | 无限 |
| `--model` | 使用的模型 | `MiniMax-M2.7` |
| `--prompts-dir` | 提示词模板目录 | 内置 `src/prompts/` |
| `--initializer-prompt` | 初始化提示词文件路径 | - |
| `--coding-prompt` | 编程提示词文件路径 | - |
| `--app-spec` | 应用规范文件路径 | - |

## 环境变量配置

环境变量可以定义在 `.env` 文件中（复制自 `.env.example`）：

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置
nano .env
```

| 变量 | 说明 |
|------|------|
| `ANTHROPIC_AUTH_TOKEN` | MiniMax 等第三方 API 密钥 |
| `ANTHROPIC_API_KEY` | Anthropic 官方 API 密钥 |
| `ANTHROPIC_BASE_URL` | API 端点（第三方 API 需要） |
| `ANTHROPIC_MODEL` | 默认模型 |
| `AUTONOMOUS_CODING_PROMPTS_DIR` | 提示词模板目录 |
| `AUTONOMOUS_CODING_INITIALIZER_PROMPT` | 初始化提示词文件 |
| `AUTONOMOUS_CODING_CODING_PROMPT` | 编程提示词文件 |
| `AUTONOMOUS_CODING_APP_SPEC` | 应用规范文件 |

## 工作流程

1. **初始化会话**：首次运行时，使用 `initializer_prompt` 创建 `feature_list.json`（200+ 测试用例）和项目基础结构
2. **编程会话**：后续运行使用 `coding_prompt`，实现 `feature_list.json` 中的功能
3. **自动继续**：每次会话结束后自动开始下一次，直到所有测试通过或达到最大迭代次数
4. **进度查看**：通过 `feature_list.json` 中的 `passes` 字段跟踪进度

## 自定义提示词

### 方式一：CLI 参数

```bash
node dist/index.js \
  --project-dir ./my_project \
  --prompts-dir ./custom_prompts \
  --initializer-prompt ./custom/init.md \
  --coding-prompt ./custom/coding.md \
  --app-spec ./custom/spec.txt
```

### 方式二：环境变量

```bash
export AUTONOMOUS_CODING_PROMPTS_DIR=./custom_prompts
export AUTONOMOUS_CODING_INITIALIZER_PROMPT=./custom/init.md
export AUTONOMOUS_CODING_CODING_PROMPT=./custom/coding.md
export AUTONOMOUS_CODING_APP_SPEC=./custom/spec.txt
```

### 提示词模板格式

参考 `src/prompts/` 目录下的内置模板：

- `initializer_prompt.md`：初始化智能体提示词，负责创建项目基础结构和测试用例
- `coding_prompt.md`：编程智能体提示词，负责实现功能并验证测试
- `app_spec.txt`：应用规范，描述要构建的应用

## 安全机制

Bash 命令白名单（`security.ts`）：

- 允许：`ls`, `cat`, `grep`, `npm`, `node`, `git` 等开发命令
- 限制：`pkill` 仅允许终止 `node`, `npm`, `npx`, `vite`, `next` 进程
- `chmod` 仅允许 `+x` 模式
- `init.sh` 仅允许 `./init.sh` 形式执行

## 项目结构

```
autonomous-coding/
├── README.md
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts          # CLI 入口
    ├── agent.ts          # 智能体会话逻辑
    ├── client.ts         # SDK 客户端配置
    ├── security.ts       # Bash 安全钩子
    ├── progress.ts       # 进度跟踪
    ├── prompts.ts        # 提示词加载
    ├── types.ts          # TypeScript 类型定义
    └── prompts/          # 提示词模板
        ├── initializer_prompt.md
        ├── coding_prompt.md
        └── app_spec.txt
```

## License

MIT
