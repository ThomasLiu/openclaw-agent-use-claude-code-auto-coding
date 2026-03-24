/**
 * 智能体会话逻辑
 * ===================
 *
 * 用于运行自主编程会话的核心智能体交互函数。
 */

import * as fs from 'fs';
import * as path from 'path';
import { setTimeout as sleep } from 'timers/promises';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createClient } from './client.js';
import {
  printSessionHeader,
  printProgressSummary,
  isFirstRun,
} from './progress.js';
import {
  getPromptConfig,
  getInitializerPrompt,
  getCodingPrompt,
  copySpecToProject,
  type PromptPaths,
} from './prompts.js';
import type { SessionResult } from './types.js';

// 配置
const AUTO_CONTINUE_DELAY_SECONDS = 3;

export interface AgentConfig {
  projectDir: string;
  model: string;
  maxIterations?: number;
  promptPaths?: PromptPaths;
}

async function runAgentSession(
  client: ReturnType<typeof createClient>,
  message: string
): Promise<SessionResult> {
  console.log('正在发送提示词到 Claude Agent SDK...\n');

  try {
    // 运行查询
    const queryStream = query({
      prompt: message,
      options: {
        ...client.options,
      },
    });

    // 收集响应文本并显示工具使用情况
    let responseText = '';

    for await (const msg of queryStream) {
      const msgType = (msg as any).type;

      if (msgType === 'assistant') {
        // 处理来自助手消息的文本内容
        const assistantMsg = msg as any;
        if (assistantMsg.message?.content) {
          for (const block of assistantMsg.message.content) {
            if (block.type === 'text') {
              responseText += block.text;
              process.stdout.write(block.text);
            }
          }
        }
      } else if (msgType === 'tool_progress') {
        // 来自助手的工具使用
        const toolMsg = msg as any;
        console.log(`\n[工具: ${toolMsg.tool_name}]`);
        console.log('   [运行中...]');
      } else if (msgType === 'result') {
        // 最终结果
        const resultMsg = msg as any;
        if (resultMsg.is_error) {
          console.log(`\n[错误] ${resultMsg.result || '未知错误'}`);
        } else {
          console.log('\n   [完成]');
        }
      }
    }

    console.log('\n' + '-'.repeat(70) + '\n');
    return { status: 'continue', responseText };
  } catch (error) {
    console.error(`智能体会话出错: ${error}`);
    return { status: 'error', responseText: String(error) };
  }
}

export async function runAutonomousAgent(config: AgentConfig): Promise<void> {
  const { projectDir, model, maxIterations, promptPaths } = config;

  // 获取提示词配置
  const promptConfig = getPromptConfig(promptPaths);

  console.log('\n' + '='.repeat(70));
  console.log('  自主编程智能体演示');
  console.log('='.repeat(70));
  console.log(`\n项目目录: ${projectDir}`);
  console.log(`模型: ${model}`);
  if (maxIterations) {
    console.log(`最大迭代次数: ${maxIterations}`);
  } else {
    console.log('最大迭代次数: 无限（将持续运行直到完成）');
  }
  console.log();
  console.log(`提示词目录: ${path.dirname(promptConfig.initializerPromptPath)}`);
  console.log(`初始化提示词: ${path.basename(promptConfig.initializerPromptPath)}`);
  console.log(`编程提示词: ${path.basename(promptConfig.codingPromptPath)}`);
  console.log(`应用规范: ${path.basename(promptConfig.appSpecPath)}`);
  console.log();

  // 创建项目目录
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // 检查是全新开始还是继续
  const firstRun = isFirstRun(projectDir);

  if (firstRun) {
    console.log('全新开始 - 将使用初始化智能体');
    console.log();
    console.log('='.repeat(70));
    console.log('  注意: 第一次会话需要 10-20+ 分钟！');
    console.log('  智能体正在生成详细的测试用例。');
    console.log('  这可能会看起来像挂起了 - 它其实在工作。注意观察 [工具: ...] 输出。');
    console.log('='.repeat(70));
    console.log();
    // 将应用规范复制到项目目录供智能体读取
    copySpecToProject(projectDir, promptConfig);
  } else {
    console.log('继续现有项目');
    printProgressSummary(projectDir);
  }

  // 主循环
  let iteration = 0;
  let shouldUseInitializer = firstRun;

  while (true) {
    iteration++;

    // 检查最大迭代次数
    if (maxIterations && iteration > maxIterations) {
      console.log(`\n已达到最大迭代次数 (${maxIterations})`);
      console.log('如需继续，请再次运行脚本，不带 --max-iterations');
      break;
    }

    // 打印会话头
    printSessionHeader(iteration, shouldUseInitializer);

    // 创建客户端（全新上下文）
    const client = createClient(projectDir, model);

    // 根据会话类型选择提示词
    const prompt = shouldUseInitializer
      ? getInitializerPrompt(promptConfig)
      : getCodingPrompt(promptConfig);
    shouldUseInitializer = false; // 只使用一次初始化器

    // 运行会话
    const { status } = await runAgentSession(client, prompt);

    // 处理状态
    if (status === 'continue') {
      console.log(
        `\n智能体将在 ${AUTO_CONTINUE_DELAY_SECONDS} 秒后自动继续...`
      );
      printProgressSummary(projectDir);
      await sleep(AUTO_CONTINUE_DELAY_SECONDS * 1000);
    } else if (status === 'error') {
      console.log('\n会话遇到错误');
      console.log('将使用新的会话重试...');
      await sleep(AUTO_CONTINUE_DELAY_SECONDS * 1000);
    }

    // 会话之间的小延迟
    if (!maxIterations || iteration < maxIterations) {
      console.log('\n正在准备下一个会话...\n');
      await sleep(1000);
    }
  }

  // 最终总结
  console.log('\n' + '='.repeat(70));
  console.log('  会话完成');
  console.log('='.repeat(70));
  console.log(`\n项目目录: ${projectDir}`);
  printProgressSummary(projectDir);

  // 打印运行生成应用程序的说明
  console.log('\n' + '-'.repeat(70));
  console.log('  运行生成的应用程序:');
  console.log('-'.repeat(70));
  console.log(`\n  cd ${path.resolve(projectDir)}`);
  console.log('  ./init.sh           # 运行安装脚本');
  console.log('  # 或手动运行:');
  console.log('  npm install && npm run dev');
  console.log('\n  然后打开 http://localhost:3000（或查看 init.sh 获取 URL）');
  console.log('-'.repeat(70));

  console.log('\n完成！');
}
