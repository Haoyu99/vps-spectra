import type { RatingLevel, RatingResult } from '@/types'

// 评级配置
const RATING_CONFIG = {
  excellent: { color: '#22c55e', emoji: '🟢' },
  good: { color: '#eab308', emoji: '🟡' },
  average: { color: '#f97316', emoji: '🟠' },
  poor: { color: '#ef4444', emoji: '🔴' },
} as const

/**
 * 硬件性能评估器
 * 负责评估CPU、内存、磁盘等硬件性能
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
 * 参考基准：DDR3双通道 20-34 GB/s, DDR4双通道 34-50 GB/s, DDR5双通道 76-114 GB/s
 * 注：此评级仅用于内部计算，不在表格中显示
 */
export function evaluateMemoryRead(speed: number): RatingResult {
  if (speed >= 38912) {
    return createRating('excellent', 'DDR5级别', speed)
  } else if (speed >= 20480) {
    return createRating('good', 'DDR4级别', speed)
  } else if (speed >= 10240) {
    return createRating('average', 'DDR3级别', speed)
  } else {
    return createRating('poor', '存在超售', speed)
  }
}

/**
 * 内存写入性能评级
 * 写入速度通常为读取的60-80%，阈值相应调整
 * 注：此评级仅用于内部计算，不在表格中显示
 */
export function evaluateMemoryWrite(speed: number): RatingResult {
  if (speed >= 30000) { // DDR5写入水平 (约38912 * 0.77)
    return createRating('excellent', 'DDR5级别', speed)
  } else if (speed >= 15000) { // DDR4写入水平 (约20480 * 0.73)
  return createRating('good', 'DDR4级别', speed)
  } else {
    return createRating('poor', `较弱 (${speed.toFixed(0)} < 5000 MB/s)`, speed)
  }
}

/**
 * 磁盘4K性能评级
 * 参考文档：NVMe ≥200 MB/s, 标准SSD 50-100 MB/s, HDD 10-40 MB/s, 性能不佳 <10 MB/s
 * @param read4k 4K读取速度
 * @param write4k 4K写入速度
 * @returns 磁盘类型和综合评级
 */
export function evaluateDisk4kPerformance(read4k: number, write4k: number): { 
  type: string
  rating: RatingResult 
} {
  const avg4k = (read4k + write4k) / 2
  
  let type: string
  let level: 'excellent' | 'good' | 'average' | 'poor'
  let description: string
  
  if (avg4k >= 200) {
    type = 'NVMe SSD'
    level = 'excellent'
    description = `优秀 - 4K读取 ${read4k.toFixed(2)} MB/s，4K写入 ${write4k.toFixed(2)} MB/s，平均 ${avg4k.toFixed(2)} MB/s ≥ 200 MB/s，达到 NVMe SSD 性能水平`
  } else if (avg4k >= 50) {
    type = '标准SSD'
    level = 'good'
    description = `良好 - 4K读取 ${read4k.toFixed(2)} MB/s，4K写入 ${write4k.toFixed(2)} MB/s，平均 ${avg4k.toFixed(2)} MB/s 在 50-200 MB/s 范围，为标准 SSD 性能`
  } else if (avg4k >= 10) {
    type = 'HDD (机械硬盘)'
    level = 'average'
    description = `一般 - 4K读取 ${read4k.toFixed(2)} MB/s，4K写入 ${write4k.toFixed(2)} MB/s，平均 ${avg4k.toFixed(2)} MB/s 在 10-50 MB/s 范围，为机械硬盘性能`
  } else {
    type = '性能不佳'
    level = 'poor'
    description = `较差 - 4K读取 ${read4k.toFixed(2)} MB/s，4K写入 ${write4k.toFixed(2)} MB/s，平均 ${avg4k.toFixed(2)} MB/s < 10 MB/s，性能严重受限或存在超售`
  }
  
  return {
    type,
    rating: createRating(level, description)
  }
}

/**
 * 磁盘1M性能评估（超售检测）
 * 参考文档：NVMe 4-6 GB/s, 标准SSD 1-2 GB/s, NVMe < 1GB/s 表明严重超售
 * @param speed1m 1M总速度
 * @param diskType 磁盘类型
 * @returns 超售检测结果
 */
export function evaluateDiskOverselling(speed1m: number, diskType: string): RatingResult {
  const speed1mGB = (speed1m / 1024).toFixed(2)
  
  if (diskType === 'NVMe SSD') {
    if (speed1m >= 4000) { // ≥ 4 GB/s
      return createRating('excellent', `优秀 - 1M性能 ${speed1mGB} GB/s ≥ 4 GB/s，达到 NVMe SSD 正常水平（4-6 GB/s），未发现资源超售`)
    } else if (speed1m >= 1000) { // 1-4 GB/s
      return createRating('average', `一般 - 1M性能 ${speed1mGB} GB/s 在 1-4 GB/s 范围，低于 NVMe SSD 应有水平，可能存在 IO 限制`)
    } else { // < 1 GB/s
      return createRating('poor', `较差 - 1M性能 ${speed1mGB} GB/s < 1 GB/s，严重低于 NVMe SSD 应有水平（4-6 GB/s），存在严重的资源超开超售`)
    }
  } else if (diskType === '标准SSD') {
    if (speed1m >= 1000) { // ≥ 1 GB/s
      return createRating('good', `良好 - 1M性能 ${speed1mGB} GB/s ≥ 1 GB/s，达到标准 SSD 正常水平（1-2 GB/s），未发现明显超售`)
    } else if (speed1m >= 500) { // 0.5-1 GB/s
      return createRating('average', `一般 - 1M性能 ${speed1mGB} GB/s 在 0.5-1 GB/s 范围，略低于标准 SSD 应有水平，可能存在资源限制`)
    } else { // < 0.5 GB/s
      return createRating('poor', `较差 - 1M性能 ${speed1mGB} GB/s < 0.5 GB/s，低于标准 SSD 正常水平（1-2 GB/s），可能存在 IO 限制或超售`)
    }
  } else if (diskType === 'HDD (机械硬盘)') {
    if (speed1m >= 500) { // ≥ 500 MB/s
      return createRating('good', `良好 - 1M性能 ${speed1mGB} GB/s ≥ 500 MB/s，达到机械硬盘正常水平（500-600 MB/s）`)
    } else if (speed1m >= 200) { // 200-500 MB/s
      return createRating('average', `一般 - 1M性能 ${speed1mGB} GB/s 在 200-500 MB/s 范围，略低于机械硬盘应有水平`)
    } else { // < 200 MB/s
      return createRating('poor', `较差 - 1M性能 ${speed1mGB} GB/s < 200 MB/s，低于机械硬盘正常水平，可能存在 IO 限制`)
    }
  } else {
    // 性能不佳的情况
    if (speed1m >= 200) {
      return createRating('average', `一般 - 1M性能 ${speed1mGB} GB/s ≥ 200 MB/s，性能受限但尚可使用`)
    } else {
      return createRating('poor', `较差 - 1M性能 ${speed1mGB} GB/s < 200 MB/s，性能严重受限`)
    }
  }
}

/**
 * 内存综合性能评级
 * 基于读写速度的综合评估，参考文档：< 10 GB/s 证明内存性能不佳，极大概率存在超售
 * 此评级会在 callout 中显示，需要详细说明评级原因
 */
export function evaluateMemoryOverall(readSpeed: number, writeSpeed: number): RatingResult {
  const readGB = (readSpeed / 1024).toFixed(2)
  const writeGB = (writeSpeed / 1024).toFixed(2)
  
  // 优先检查是否存在超售（任一指标 < 10 GB/s）
  if (readSpeed < 10240 || writeSpeed < 10240) {
    return createRating(
      'poor', 
      `较差 - 读取 ${readGB} GB/s，写入 ${writeGB} GB/s，低于 10 GB/s 阈值，极大概率存在超售（可能原因：虚拟内存、ZRAM、气球驱动、KSM内存融合）`
    )
  }
  
  // DDR5 级别：读取 ≥ 38 GB/s 且 写入 ≥ 30 GB/s
  if (readSpeed >= 38912 && writeSpeed >= 30000) {
    return createRating(
      'excellent',
      `优秀 - 读取 ${readGB} GB/s，写入 ${writeGB} GB/s，达到 DDR5 级别性能（单通道 38-57 GB/s）`
    )
  }
  
  // DDR4 级别：读取 ≥ 20 GB/s 且 写入 ≥ 15 GB/s
  if (readSpeed >= 20480 && writeSpeed >= 15000) {
    return createRating(
      'good',
      `良好 - 读取 ${readGB} GB/s，写入 ${writeGB} GB/s，达到 DDR4 级别性能（双通道 34-50 GB/s）`
    )
  }
  
  // DDR3 级别：读取 ≥ 10 GB/s 且 写入 ≥ 8 GB/s
  return createRating(
    'average',
    `一般 - 读取 ${readGB} GB/s，写入 ${writeGB} GB/s，达到 DDR3 级别性能（双通道 20-34 GB/s）`
  )
}