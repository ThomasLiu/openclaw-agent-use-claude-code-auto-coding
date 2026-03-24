/**
 * 自主编程智能体的安全钩子
 * ==========================
 *
 * 预工具钩子，用于验证 Bash 命令的安全性。
 * 使用白名单方式 - 只允许明确列出的命令运行。
 */

// 开发任务允许的命令
// 自主编程演示所需的最少命令集
const ALLOWED_COMMANDS = new Set<string>([
  // 文件查看
  'ls',
  'cat',
  'head',
  'tail',
  'wc',
  'grep',
  // 文件操作（智能体使用 SDK 工具处理大多数文件操作，但偶尔需要 cp/mkdir）
  'cp',
  'mkdir',
  'chmod', // 用于设置脚本可执行权限；需单独验证
  // 目录
  'pwd',
  // Node.js 开发
  'npm',
  'node',
  // 版本控制
  'git',
  // 进程管理
  'ps',
  'lsof',
  'sleep',
  'pkill', // 用于终止开发服务器；需单独验证
  // 脚本执行
  'init.sh', // 初始化脚本；需单独验证
]);

// 即使在白名单中也需要额外验证的命令
const COMMANDS_NEEDING_EXTRA_VALIDATION = new Set(['pkill', 'chmod', 'init.sh']);

// pkill 允许的进程名
const ALLOWED_PROCESS_NAMES = new Set(['node', 'npm', 'npx', 'vite', 'next']);

function splitCommandSegments(commandString: string): string[] {
  // 按 && 和 || 分割，同时保留处理每个片段的能力
  const segments = commandString.split(/\s*(?:&&|\|\|)\s*/);

  // 进一步按分号分割
  const result: string[] = [];
  for (const segment of segments) {
    const subSegments = segment.split(/(?<!["'])s*;s*(?!["'])/);
    for (const sub of subSegments) {
      const trimmed = sub.trim();
      if (trimmed) {
        result.push(trimmed);
      }
    }
  }
  return result;
}

function extractCommands(commandString: string): string[] {
  const commands: string[] = [];

  // 按分号分割
  const segments = commandString.split(/(?<!["'])\s*;\s*(?!["'])/);

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    // 简单的类 shlex 解析
    const tokens = tokenize(trimmed);

    let expectCommand = true;

    for (const token of tokens) {
      // Shell 操作符表示后面跟着新命令
      if (token === '|' || token === '||' || token === '&&' || token === '&') {
        expectCommand = true;
        continue;
      }

      // 跳过 Shell 关键字
      const shellKeywords = [
        'if', 'then', 'else', 'elif', 'fi',
        'for', 'while', 'until', 'do', 'done',
        'case', 'esac', 'in', '!', '{', '}',
      ];
      if (shellKeywords.includes(token)) {
        continue;
      }

      // 跳过标志/选项
      if (token.startsWith('-')) {
        continue;
      }

      // 跳过变量赋值 (VAR=value)
      if (token.includes('=') && !token.startsWith('=')) {
        continue;
      }

      if (expectCommand) {
        // 提取基础命令名（处理路径如 /usr/bin/python）
        const cmd = token.split('/').pop() || token;
        commands.push(cmd);
        expectCommand = false;
      }
    }
  }

  return commands;
}

function tokenize(commandString: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote: '"' | "'" | null = null;

  for (let i = 0; i < commandString.length; i++) {
    const char = commandString[i];

    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = char;
    } else if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function validatePkillCommand(commandString: string): { isAllowed: boolean; reason?: string } {
  const tokens = tokenize(commandString);

  if (!tokens.length) {
    return { isAllowed: false, reason: '空 pkill 命令' };
  }

  // 分离标志和参数
  const args: string[] = [];
  for (const token of tokens.slice(1)) {
    if (!token.startsWith('-')) {
      args.push(token);
    }
  }

  if (!args.length) {
    return { isAllowed: false, reason: 'pkill 需要进程名' };
  }

  // 目标通常是最后一个非标志参数
  let target = args[args.length - 1];

  // 对于 -f 标志（完整命令行匹配），提取第一个词作为进程名
  if (target.includes(' ')) {
    target = target.split(' ')[0];
  }

  if (ALLOWED_PROCESS_NAMES.has(target)) {
    return { isAllowed: true };
  }

  return {
    isAllowed: false,
    reason: `pkill 仅允许用于开发进程: ${[...ALLOWED_PROCESS_NAMES].join(', ')}`,
  };
}

function validateChmodCommand(commandString: string): { isAllowed: boolean; reason?: string } {
  const tokens = tokenize(commandString);

  if (!tokens.length || tokens[0] !== 'chmod') {
    return { isAllowed: false, reason: '不是 chmod 命令' };
  }

  // 查找模式参数
  let mode: string | null = null;
  const files: string[] = [];

  for (const token of tokens.slice(1)) {
    if (token.startsWith('-')) {
      return { isAllowed: false, reason: '不允许 chmod 标志' };
    } else if (mode === null) {
      mode = token;
    } else {
      files.push(token);
    }
  }

  if (!mode) {
    return { isAllowed: false, reason: 'chmod 需要模式' };
  }

  if (!files.length) {
    return { isAllowed: false, reason: 'chmod 需要至少一个文件' };
  }

  // 仅允许 +x 变体（设置文件可执行权限）
  if (!/^[ugoa]*\+x$/.test(mode)) {
    return { isAllowed: false, reason: `chmod 仅允许 +x 模式，得到: ${mode}` };
  }

  return { isAllowed: true };
}

function validateInitScript(commandString: string): { isAllowed: boolean; reason?: string } {
  const tokens = tokenize(commandString);

  if (!tokens.length) {
    return { isAllowed: false, reason: '空命令' };
  }

  const script = tokens[0];

  // 允许 ./init.sh 或以 /init.sh 结尾的路径
  if (script === './init.sh' || script.endsWith('/init.sh')) {
    return { isAllowed: true };
  }

  return { isAllowed: false, reason: `仅允许 ./init.sh，得到: ${script}` };
}

function getCommandForValidation(cmd: string, segments: string[]): string {
  for (const segment of segments) {
    const segmentCommands = extractCommands(segment);
    if (segmentCommands.includes(cmd)) {
      return segment;
    }
  }
  return '';
}

export interface HookInput {
  tool_name?: string;
  tool_input?: {
    command?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function bashSecurityHook(
  inputData: HookInput,
  toolUseId?: string,
  context?: unknown
): Promise<Record<string, unknown>> {
  if (inputData.tool_name !== 'Bash') {
    return {};
  }

  const command = inputData.tool_input?.command;
  if (!command) {
    return {};
  }

  // 从命令字符串中提取所有命令
  const commands = extractCommands(command);

  if (!commands.length) {
    // 无法解析 - 安全起见阻止
    return {
      decision: 'block',
      reason: `无法解析命令进行安全验证: ${command}`,
    };
  }

  // 分割成片段以进行逐命令验证
  const segments = splitCommandSegments(command);

  // 检查每个命令是否在白名单中
  for (const cmd of commands) {
    if (!ALLOWED_COMMANDS.has(cmd)) {
      return {
        decision: 'block',
        reason: `命令 '${cmd}' 不在允许的命令列表中`,
      };
    }

    // 对敏感命令进行额外验证
    if (COMMANDS_NEEDING_EXTRA_VALIDATION.has(cmd)) {
      // 找到包含此命令的特定片段
      const cmdSegment = getCommandForValidation(cmd, segments) || command;

      if (cmd === 'pkill') {
        const { isAllowed, reason } = validatePkillCommand(cmdSegment);
        if (!isAllowed) {
          return { decision: 'block', reason };
        }
      } else if (cmd === 'chmod') {
        const { isAllowed, reason } = validateChmodCommand(cmdSegment);
        if (!isAllowed) {
          return { decision: 'block', reason };
        }
      } else if (cmd === 'init.sh') {
        const { isAllowed, reason } = validateInitScript(cmdSegment);
        if (!isAllowed) {
          return { decision: 'block', reason };
        }
      }
    }
  }

  return {};
}

export { ALLOWED_COMMANDS };
