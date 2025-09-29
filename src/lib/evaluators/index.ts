import type { RatingLevel, RatingResult } from '@/types'

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

/**
 * CPU单核性能评级
 * 基于Sysbench得分
 */
export function evaluateCpuSingleCore(score: number): RatingResult {
  if (score > 2000) {
    return createRating('excellent', `极佳 (${score} > 2000)`, score)
  } else if (score > 1500) {
    return createRating('excellent', `优秀 (1500 < ${score} < 2000)`, score)
  } else if (score > 1000) {
    return createRating('good', `良好 (1000 < ${score} < 1500)`, score)
  } else if (score > 500) {
    return createRating('average', `一般 (500 < ${score} < 1000)`, score)
  } else {
    return createRating('poor', `较差 (${score} < 500)`, score)
  }
}

/**
 * CPU多核性能评级
 * 基于单核分数和线程数的期望值
 */
export function evaluateCpuMultiCore(
  multiScore: number,
  singleScore: number,
  threadCount: number
): RatingResult {
  const expectedScore = singleScore * threadCount * 0.8 // 80%的理想扩展
  const excellentThreshold = expectedScore * 1.0
  const goodThreshold = expectedScore * 0.8
  const averageThreshold = expectedScore * 0.6
  const poorThreshold = expectedScore * 0.4

  if (multiScore > excellentThreshold) {
    return createRating('excellent', `极佳 (${multiScore} > ${excellentThreshold.toFixed(0)})`, multiScore)
  } else if (multiScore > goodThreshold) {
    return createRating('excellent', `优秀 (${goodThreshold.toFixed(0)} < ${multiScore} < ${excellentThreshold.toFixed(0)})`, multiScore)
  } else if (multiScore > averageThreshold) {
    return createRating('good', `良好 (${averageThreshold.toFixed(0)} < ${multiScore} < ${goodThreshold.toFixed(0)})`, multiScore)
  } else if (multiScore > poorThreshold) {
    return createRating('average', `一般 (${poorThreshold.toFixed(0)} < ${multiScore} < ${averageThreshold.toFixed(0)})`, multiScore)
  } else {
    return createRating('poor', `较差 (${multiScore} < ${poorThreshold.toFixed(0)})`, multiScore)
  }
}

/**
 * CPU多核效率评级
 */
export function evaluateCpuEfficiency(efficiency: number): RatingResult {
  if (efficiency > 1.0) {
    return createRating('excellent', `优秀 (效率 > 1.0，超线性扩展)`, efficiency)
  } else if (efficiency > 0.8) {
    return createRating('good', `良好 (0.8 < 效率 < 1.0)`, efficiency)
  } else if (efficiency > 0.6) {
    return createRating('average', `一般 (0.6 < 效率 < 0.8)`, efficiency)
  } else {
    return createRating('poor', `较差 (效率 < 0.6)`, efficiency)
  }
}

/**
 * 内存读取性能评级
 */
export function evaluateMemoryRead(speed: number): RatingResult {
  if (speed > 30000) {
    return createRating('excellent', '优秀', speed)
  } else if (speed > 20000) {
    return createRating('good', '良好', speed)
  } else if (speed > 10000) {
    return createRating('average', '一般', speed)
  } else {
    return createRating('poor', '较弱', speed)
  }
}

/**
 * 内存写入性能评级
 */
export function evaluateMemoryWrite(speed: number): RatingResult {
  if (speed > 15000) {
    return createRating('excellent', '优秀', speed)
  } else if (speed > 10000) {
    return createRating('good', '良好', speed)
  } else if (speed > 5000) {
    return createRating('average', '一般', speed)
  } else {
    return createRating('poor', '较弱', speed)
  }
}

/**
 * 磁盘FIO读取性能评级
 */
export function evaluateDiskRead(speed: number): RatingResult {
  if (speed > 100) {
    return createRating('excellent', '优秀', speed)
  } else if (speed > 80) {
    return createRating('good', '良好', speed)
  } else if (speed > 50) {
    return createRating('average', '一般', speed)
  } else {
    return createRating('poor', '较弱', speed)
  }
}

/**
 * 磁盘FIO写入性能评级
 */
export function evaluateDiskWrite(speed: number): RatingResult {
  if (speed > 100) {
    return createRating('excellent', '优秀', speed)
  } else if (speed > 80) {
    return createRating('good', '良好', speed)
  } else if (speed > 50) {
    return createRating('average', '一般', speed)
  } else {
    return createRating('poor', '较弱', speed)
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