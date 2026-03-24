#!/usr/bin/env node

/**
 * 自主编程智能体 CLI
 * ===========================
 *
 * 展示使用 Claude 进行长时间自主编程的最小化工具。
 * 本脚本实现双智能体模式（初始化器 + 编程智能体），
 * 并整合了长时间运行智能体的所有策略。
 *
 * 支持 MiniMax 和 Anthropic API 配置。
 *
 * 使用示例:
 *   node dist/index.js --project-dir ./my_project
 *   node dist/index.js --project-dir ./my_project --max-iterations 5
 *   # 使用自定义提示词路径:
 *   node dist/index.js --project-dir ./my_project --prompts-dir ./custom_prompts
 *   node dist/index.js --project-dir ./my_project --initializer-prompt ./my_initializer.md
 */

import { Command } from 'commander';
import * as path from 'path';
import { runAutonomousAgent } from './agent.js';

// 配置
const DEFAULT_MODEL = 'MiniMax-M2.7';

interface CLIOptions {
  projectDir: string;
  maxIterations?: number;
  model: string;
  promptsDir?: string;
  initializerPrompt?: string;
  codingPrompt?: string;
  appSpec?: string;
}

async function main() {
  const program = new Command();

  program
    .name('autonomous-coding')
    .description(
      '自主编程智能体 - 用于 Claude/MiniMax 驱动开发的长时间运行智能体工具'
    )
    .version('0.1.0')
    .option(
      '-p, --project-dir <path>',
      '项目目录（默认: ./autonomous_demo_project）',
      './autonomous_demo_project'
    )
    .option(
      '-m, --max-iterations <number>',
      '最大智能体迭代次数（默认: 无限）',
      undefined
    )
    .option(
      '--model <model>',
      `使用的模型（默认: ${DEFAULT_MODEL}）`,
      DEFAULT_MODEL
    )
    .option(
      '--prompts-dir <path>',
      '提示词模板目录（默认: 内置 prompts 目录）',
      undefined
    )
    .option(
      '--initializer-prompt <path>',
      '初始化提示词文件路径',
      undefined
    )
    .option(
      '--coding-prompt <path>',
      '编程提示词文件路径',
      undefined
    )
    .option(
      '--app-spec <path>',
      '应用规范文件路径',
      undefined
    );

  program.parse();

  const opts = program.opts<CLIOptions>();

  // 检查 API 密钥（支持 ANTHROPIC_AUTH_TOKEN 和 ANTHROPIC_API_KEY）
  const hasApiKey = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;
  if (!hasApiKey) {
    console.error('错误: API 密钥未设置');
    console.error('\n请设置以下环境变量之一:');
    console.error('  export ANTHROPIC_AUTH_TOKEN="your-minimax-api-key"    # MiniMax 等第三方');
    console.error('  export ANTHROPIC_API_KEY="your-anthropic-key"       # Anthropic 官方');
    console.error('\nMiniMax 用户: https://platform.minimaxi.com/');
    console.error('Anthropic 用户: https://console.anthropic.com/');
    process.exit(1);
  }

  // 解析项目目录
  let projectDir = opts.projectDir;
  if (!path.isAbsolute(projectDir)) {
    // 相对路径前加 generations/
    projectDir = path.join('generations', projectDir);
  }

  // 构建提示词路径配置
  const promptPaths = {
    promptsDir: opts.promptsDir,
    initializerPrompt: opts.initializerPrompt,
    codingPrompt: opts.codingPrompt,
    appSpec: opts.appSpec,
  };

  // 运行智能体
  try {
    await runAutonomousAgent({
      projectDir,
      model: opts.model,
      maxIterations: opts.maxIterations ? parseInt(opts.maxIterations, 10) : undefined,
      promptPaths,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('SIGINT')) {
      console.log('\n\n被用户中断');
      console.log('如需恢复，请再次运行相同命令');
    } else {
      console.error(`\n致命错误: ${error}`);
      throw error;
    }
  }
}

main().catch((error) => {
  console.error(`致命错误: ${error}`);
  process.exit(1);
});
