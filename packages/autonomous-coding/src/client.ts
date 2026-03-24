/**
 * Claude SDK 客户端配置
 * ================================
 *
 * 用于创建和配置 Claude Agent SDK 客户端的函数。
 * 支持 MiniMax 和 Anthropic API 配置。
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Options } from '@anthropic-ai/claude-agent-sdk';
import { PUPPETEER_TOOLS, BUILTIN_TOOLS } from './types.js';
import { bashSecurityHook } from './security.js';

// MiniMax API 配置
export const MINIMAX_CONFIG = {
  baseUrl: 'https://api.minimaxi.com/anthropic',
  defaultModel: 'MiniMax-M2.1',
};

export interface ClientConfig {
  projectDir: string;
  model: string;
  options: Options;
}

function getApiCredentials(): { baseUrl?: string } {
  // SDK 会自动从环境变量读取 API 密钥:
  // - ANTHROPIC_AUTH_TOKEN: MiniMax 等第三方 API
  // - ANTHROPIC_API_KEY: Anthropic 官方
  const hasApiKey = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;

  if (!hasApiKey) {
    throw new Error(
      'API 密钥未设置。请设置 ANTHROPIC_AUTH_TOKEN 或 ANTHROPIC_API_KEY 环境变量。\n' +
        'MiniMax 用户: https://platform.minimaxi.com/\n' +
        'Anthropic 用户: https://console.anthropic.com/'
    );
  }

  // MiniMax 等第三方 API 需要自定义 baseUrl
  const baseUrl = process.env.ANTHROPIC_BASE_URL;

  return { baseUrl };
}

export function createClient(projectDir: string, model: string): ClientConfig {
  const { baseUrl } = getApiCredentials();

  // 确保项目目录存在
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  console.log(`项目目录: ${path.resolve(projectDir)}`);
  console.log(`模型: ${model}`);
  if (baseUrl) {
    console.log(`API 端点: ${baseUrl}`);
  }
  console.log();

  // 构建 SDK 选项
  const options: Options = {
    cwd: path.resolve(projectDir),
    // 使用所有默认 Claude Code 工具加上 Puppeteer
    tools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', ...PUPPETEER_TOOLS],
    // Bash 安全性的自定义权限处理程序
    canUseTool: async (tool) => {
      if (tool.name === 'Bash') {
        const result = await bashSecurityHook({
          tool_name: 'Bash',
          tool_input: { command: tool.input.command },
        });
        if (result.decision === 'block') {
          return {
            cancel: result.reason || '被安全钩子阻止',
          };
        }
      }
      return { ok: true };
    },
  };

  return {
    projectDir,
    model,
    options,
  };
}

export { PUPPETEER_TOOLS, BUILTIN_TOOLS };
