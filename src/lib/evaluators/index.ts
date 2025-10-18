import type { RatingLevel, RatingResult } from '@/types'

/**
 * 评估器主入口
 * 统一导出各模块的评估函数
 */

// 评级配置
const RATING_CONFIG = {
  excellent: { color: '#22c55e', emoji: '🟢' },
  good: { color: '#eab308', emoji: '🟡' },
  average: { color: '#f97316', emoji: '🟠' },
  poor: { color: '#ef4444', emoji: '🔴' },
} as const

/**
 * 创建评级结果
 */
export function createRating(
  level: RatingLevel,
  description: string,
  score?: number
): RatingResult {
  const config = RATING_CONFIG[level]
  return {
    level,
    score,
    description,
    color: config.color,
    emoji: config.emoji,
  }
}

// 导入并重新导出各模块评估器
export {
  evaluateCpuSingleCore,
  evaluateCpuMultiCore,
  evaluateCpuEfficiency,
  evaluateMemoryRead,
  evaluateMemoryWrite,
  evaluateMemoryOverall,
  evaluateDisk4kPerformance,
  evaluateDiskOverselling
} from './hardwareEvaluators'

export {
  evaluateIpReputation,
  evaluateIpTrust,
  evaluateIpRiskScore,
  evaluateIpThreatLevel,
  evaluateIpAbuseDescription
} from './networkEvaluators'