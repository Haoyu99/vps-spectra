import type { RatingLevel, RatingResult } from '@/types'

// 评级配置
const RATING_CONFIG = {
  excellent: { color: '#22c55e', emoji: '🟢' },
  good: { color: '#eab308', emoji: '🟡' },
  average: { color: '#f97316', emoji: '🟠' },
  poor: { color: '#ef4444', emoji: '🔴' },
} as const

/**
 * 网络性能评估器
 * 负责评估IP质量、网络连接等网络相关指标
 */

/**
 * 创建评级结果
 */
function createRating(
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

/**
 * IP质量评级 - 声誉分数 (越高越好)
 */
export function evaluateIpReputation(score: number): RatingResult {
  if (score > 80) {
    return createRating('excellent', '优秀', score)
  } else if (score > 50) {
    return createRating('good', '良好', score)
  } else if (score > 20) {
    return createRating('average', '一般', score)
  } else {
    return createRating('poor', '较弱', score)
  }
}

/**
 * IP质量评级 - 信任分数 (越高越好)
 */
export function evaluateIpTrust(score: number): RatingResult {
  if (score > 0.8) {
    return createRating('excellent', '优秀', score)
  } else if (score > 0.5) {
    return createRating('good', '良好', score)
  } else if (score > 0.3) {
    return createRating('average', '一般', score)
  } else {
    return createRating('poor', '较弱', score)
  }
}

/**
 * IP质量评级 - VPN/代理/威胁/欺诈/滥用分数 (越低越好)
 */
export function evaluateIpRiskScore(score: number): RatingResult {
  if (score < 20) {
    return createRating('excellent', '优秀', score)
  } else if (score < 50) {
    return createRating('good', '良好', score)
  } else if (score < 80) {
    return createRating('average', '一般', score)
  } else {
    return createRating('poor', '较弱', score)
  }
}

/**
 * IP质量评级 - 威胁级别
 */
export function evaluateIpThreatLevel(level: string): RatingResult {
  const lowerLevel = level.toLowerCase()
  if (lowerLevel === 'low') {
    return createRating('excellent', '优秀')
  } else if (lowerLevel === 'medium') {
    return createRating('average', '一般')
  } else {
    return createRating('poor', '较高')
  }
}

/**
 * IP质量评级 - ASN/公司滥用分数描述
 */
export function evaluateIpAbuseDescription(description: string): RatingResult {
  const lowerDesc = description.toLowerCase()
  if (lowerDesc.includes('low') || lowerDesc.includes('very low')) {
    return createRating('excellent', '优秀')
  } else if (lowerDesc.includes('medium')) {
    return createRating('average', '一般')
  } else {
    return createRating('poor', '较高')
  }
}