/**
 * TypeScript 类型定义 - 自主编程智能体
 */

export interface Feature {
  category: 'functional' | 'style';
  description: string;
  steps: string[];
  passes: boolean;
}

export interface ProgressStats {
  passing: number;
  total: number;
  percentage: number;
}

export interface SecurityValidationResult {
  isAllowed: boolean;
  reason?: string;
}

export interface SessionResult {
  status: 'continue' | 'error';
  responseText: string;
}

export interface AutonomousAgentConfig {
  projectDir: string;
  model: string;
  maxIterations?: number;
}

export interface AgentContext {
  isFirstRun: boolean;
  iteration: number;
}

// Puppeteer MCP 浏览器自动化工具
export const PUPPETEER_TOOLS = [
  'mcp__puppeteer__puppeteer_navigate',
  'mcp__puppeteer__puppeteer_screenshot',
  'mcp__puppeteer__puppeteer_click',
  'mcp__puppeteer__puppeteer_fill',
  'mcp__puppeteer__puppeteer_select',
  'mcp__puppeteer__puppeteer_hover',
  'mcp__puppeteer__puppeteer_evaluate',
] as const;

// 内置工具
export const BUILTIN_TOOLS = [
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  'Bash',
] as const;
