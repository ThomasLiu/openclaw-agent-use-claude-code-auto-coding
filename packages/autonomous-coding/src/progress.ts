/**
 * 进度跟踪工具
 * ===========================
 *
 * 用于跟踪和显示自主编程智能体的进度。
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Feature, ProgressStats } from './types.js';

const FEATURES_FILE = 'feature_list.json';

export function countPassingTests(projectDir: string): ProgressStats {
  const testsFile = path.join(projectDir, FEATURES_FILE);

  if (!fs.existsSync(testsFile)) {
    return { passing: 0, total: 0, percentage: 0 };
  }

  try {
    const content = fs.readFileSync(testsFile, 'utf-8');
    const tests: Feature[] = JSON.parse(content);

    const total = tests.length;
    const passing = tests.filter((test) => test.passes).length;
    const percentage = total > 0 ? (passing / total) * 100 : 0;

    return { passing, total, percentage };
  } catch {
    return { passing: 0, total: 0, percentage: 0 };
  }
}

export function printSessionHeader(sessionNum: number, isInitializer: boolean): void {
  const sessionType = isInitializer ? '初始化智能体' : '编程智能体';

  console.log('\n' + '='.repeat(70));
  console.log(`  会话 ${sessionNum}: ${sessionType}`);
  console.log('='.repeat(70));
  console.log();
}

export function printProgressSummary(projectDir: string): void {
  const stats = countPassingTests(projectDir);

  if (stats.total > 0) {
    console.log(
      `\n进度: ${stats.passing}/${stats.total} 测试通过 (${stats.percentage.toFixed(1)}%)`
    );
  } else {
    console.log('\n进度: feature_list.json 尚未创建');
  }
}

export function isFirstRun(projectDir: string): boolean {
  const testsFile = path.join(projectDir, FEATURES_FILE);
  return !fs.existsSync(testsFile);
}
