/**
 * 提示词加载工具
 * =======================
 *
 * 用于从指定目录加载提示词模板的函数。
 * 支持通过环境变量或参数配置提示词路径。
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 默认提示词目录（相对于当前文件）
const DEFAULT_PROMPTS_DIR = path.join(__dirname, 'prompts');

export interface PromptPaths {
  promptsDir?: string;
  initializerPrompt?: string;
  codingPrompt?: string;
  appSpec?: string;
}

export interface PromptConfig {
  initializerPromptPath: string;
  codingPromptPath: string;
  appSpecPath: string;
}

/**
 * 获取提示词配置
 * 优先级：显式参数 > 环境变量 > 默认值
 */
export function getPromptConfig(overrides?: PromptPaths): PromptConfig {
  const promptsDir = overrides?.promptsDir ||
    process.env.AUTONOMOUS_CODING_PROMPTS_DIR ||
    DEFAULT_PROMPTS_DIR;

  const initializerPromptPath = overrides?.initializerPrompt ||
    process.env.AUTONOMOUS_CODING_INITIALIZER_PROMPT ||
    path.join(promptsDir, 'initializer_prompt.md');

  const codingPromptPath = overrides?.codingPrompt ||
    process.env.AUTONOMOUS_CODING_CODING_PROMPT ||
    path.join(promptsDir, 'coding_prompt.md');

  const appSpecPath = overrides?.appSpec ||
    process.env.AUTONOMOUS_CODING_APP_SPEC ||
    path.join(promptsDir, 'app_spec.txt');

  console.log('[getPromptConfig] computed paths:');
  console.log('  promptsDir:', promptsDir);
  console.log('  initializerPromptPath:', initializerPromptPath);
  console.log('  codingPromptPath:', codingPromptPath);
  console.log('  appSpecPath:', appSpecPath);

  return {
    initializerPromptPath,
    codingPromptPath,
    appSpecPath,
  };
}

export function loadPromptFromPath(promptPath: string): string {
  if (!fs.existsSync(promptPath)) {
    throw new Error(`提示词文件不存在: ${promptPath}`);
  }
  return fs.readFileSync(promptPath, 'utf-8');
}

export function getInitializerPrompt(config: PromptConfig): string {
  return loadPromptFromPath(config.initializerPromptPath);
}

export function getCodingPrompt(config: PromptConfig): string {
  return loadPromptFromPath(config.codingPromptPath);
}

export function copySpecToProject(projectDir: string, config: PromptConfig): void {
  const specSource = config.appSpecPath;
  const specDest = path.join(projectDir, 'docs/app_spec.md');

  if (!fs.existsSync(specSource)) {
    throw new Error(`应用规范文件不存在: ${specSource}`);
  }

  if (!fs.existsSync(specDest)) {
    fs.copyFileSync(specSource, specDest);
    console.log(`已复制 ${path.basename(specSource)} 到项目目录`);
  }
}

export { DEFAULT_PROMPTS_DIR };
