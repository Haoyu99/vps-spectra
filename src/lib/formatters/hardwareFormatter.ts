import type { CpuTest, MemoryTest, DiskDdTest, DiskFioTest, MarkdownOptions, RatingResult } from '@/types'

/**
 * 硬件性能格式化器
 * 负责将硬件性能测试结果格式化为Markdown
 */

/**
 * 生成硬件性能测试部分
 */
export function generateHardwareTests(
  cpuTest: CpuTest,
  memoryTest: MemoryTest,
  diskDdTest: DiskDdTest,
  diskFioTest: DiskFioTest,
  options: MarkdownOptions
): string {
  let section = '## 💻 硬件性能测试\n\n'

  // CPU测试
  section += '### 🔥 CPU 测试\n\n'
  section += generateCpuTestSection(cpuTest, options)

  // 内存测试
  section += '### 🧠 内存测试\n\n'
  section += generateMemoryTestSection(memoryTest, options)

  // 磁盘测试
  section += '### 💾 磁盘性能测试\n\n'
  
  // 添加磁盘测试指标说明
  if (options.useObsidianCallouts) {
    section += '> [!info] 磁盘性能指标说明\n'
    section += '> **DD测试**：基础顺序读写测试，快速评估磁盘基本性能\n'
    section += '> **FIO测试**：专业IO测试工具，更准确反映实际使用性能\n\n'
  } else {
    section += '**磁盘性能指标说明：**\n'
    section += '- **DD测试**：基础顺序读写测试，快速评估磁盘基本性能\n'
    section += '- **FIO测试**：专业IO测试工具，更准确反映实际使用性能\n\n'
  }
  
  section += generateDiskTestSection(diskDdTest, diskFioTest, options)

  return section
}

/**
 * 生成CPU测试部分
 */
function generateCpuTestSection(cpuTest: CpuTest, options: MarkdownOptions): string {
  let section = ''

  // 单核性能
  section += `**单核性能得分：** ${cpuTest.singleCore.score} Scores\n\n`
  section += generateRatingCallout(cpuTest.singleCore.rating, '单核性能评级', options)

  // 多核性能 - 只有当多核测试有效时才显示
  // 判断是否为有效的多核测试：线程数大于1且得分大于0
  if (cpuTest.multiCore && cpuTest.multiCore.threads > 1 && cpuTest.multiCore.score > 0) {
    section += `**${cpuTest.multiCore.threads}线程性能得分：** ${cpuTest.multiCore.score} Scores\n\n`
    section += generateRatingCallout(cpuTest.multiCore.rating, '多核性能评级', options)

    // 多核效率
    if (cpuTest.multiCore.efficiency && cpuTest.multiCore.efficiencyRating) {
      section += `**多核心效率：** ${cpuTest.multiCore.efficiency.toFixed(2)}\n\n`
      section += generateRatingCallout(cpuTest.multiCore.efficiencyRating, '效率评级', options)
    }
  }

  return section
}

/**
 * 生成内存测试部分
 */
function generateMemoryTestSection(memoryTest: MemoryTest, options: MarkdownOptions): string {
  let section = ''

  section += '| 测试类型 | 性能 | 评级 |\n'
  section += '| --- | --- | --- |\n'
  section += `| 单线程读测试 | ${memoryTest.singleThreadRead.speed.toFixed(2)} MB/s | ${memoryTest.singleThreadRead.rating.emoji} ${memoryTest.singleThreadRead.rating.description} |\n`
  section += `| 单线程写测试 | ${memoryTest.singleThreadWrite.speed.toFixed(2)} MB/s | ${memoryTest.singleThreadWrite.rating.emoji} ${memoryTest.singleThreadWrite.rating.description} |\n\n`

  // 内存性能总体评价
  const avgRating = getAverageRating([memoryTest.singleThreadRead.rating, memoryTest.singleThreadWrite.rating])
  if (options.useObsidianCallouts) {
    section += generateMemoryPerformanceCallout(memoryTest, avgRating, options)
  }

  return section
}

/**
 * 生成磁盘测试部分
 */
function generateDiskTestSection(diskDdTest: DiskDdTest, diskFioTest: DiskFioTest, options: MarkdownOptions): string {
  let section = ''

  // DD测试
  section += '#### DD 读写测试\n\n'
  
  if (diskDdTest.tests.length > 0) {
    section += '| 测试项目 | 操作 | 速度 | IOPS | 耗时 |\n'
    section += '| --- | --- | --- | --- | --- |\n'
    
    for (const test of diskDdTest.tests) {
      if (test.writeSpeed && test.readSpeed) {
        // 写入行
        section += `| ${test.operation} | 写入 | ${test.writeSpeed} | ${test.writeIOPS || 'N/A'} | ${test.writeTime || 'N/A'} |\n`
        // 读取行
        section += `| ${test.operation} | 读取 | ${test.readSpeed} | ${test.readIOPS || 'N/A'} | ${test.readTime || 'N/A'} |\n`
      }
    }
    section += '\n'
  }

  // FIO测试
  section += '#### FIO 读写测试\n\n'
  if (diskFioTest.tests.length > 0) {
    // 改为表格格式显示
    section += '| 块大小 | 读取速度 | 读取IOPS | 写入速度 | 写入IOPS | 总速度 | 总IOPS |\n'
    section += '| --- | --- | --- | --- | --- | --- | --- |\n'
    
    for (const test of diskFioTest.tests) {
      section += `| ${test.blockSize} | ${test.read.speed.toFixed(2)} MB/s | ${test.read.iops.toFixed(0)} | `
      section += `${test.write.speed.toFixed(2)} MB/s | ${test.write.iops.toFixed(0)} | `
      section += `${test.total.speed.toFixed(2)} MB/s | ${test.total.iops.toFixed(0)} |\n`
    }
    section += '\n'

    // 性能分析和评级
    const test4k = diskFioTest.tests.find((t: any) => t.blockSize === '4k')
    const test1m = diskFioTest.tests.find((t: any) => t.blockSize === '1m')
    
    if (test4k) {
      const avg4kSpeed = (test4k.read.speed + test4k.write.speed) / 2
      const diskEvaluation = evaluateDiskPerformance(avg4kSpeed)
      
      section += '#### 磁盘性能分析 \n\n'
      section += `**磁盘类型判断：** ${diskEvaluation.type}\n\n`
      section += generateRatingCallout(diskEvaluation.rating, '4K性能评级', options)
      
      // 超售检测
      if (test1m) {
        const overselling = evaluateOverselling(test1m.total.speed, diskEvaluation.type)
        const calloutType = overselling.hasOverselling ? 'warning' : 'success'
        
        if (options.useObsidianCallouts) {
          section += `> [!${calloutType}] 资源超售检测\n`
          section += `> ${overselling.message}\n\n`
        } else {
          section += `**资源超售检测：** ${overselling.message}\n\n`
        }
      }
      
      if (options.useObsidianCallouts) {
        section += '> [!note] 注意\n'
        section += '> 以上分析基于测试数据的统计规律，仅供参考。实际磁盘性能受多种因素影响（文件系统、IO引擎、系统负载等），请结合实际使用场景进行综合评估。\n\n'
      } else {
        section += '**注意：** 以上分析基于测试数据的统计规律，仅供参考。实际磁盘性能受多种因素影响（文件系统、IO引擎、系统负载等），请结合实际使用场景进行综合评估。\n\n'
      }
    }
  }

  return section
}

/**
 * 生成评级callout
 */
function generateRatingCallout(rating: RatingResult, title: string, options: MarkdownOptions): string {
  if (!options.useObsidianCallouts) {
    return `**${title}：** ${rating.emoji} ${rating.description}\n\n`
  }

  const calloutType = getCalloutType(rating.level)
  return `> [!${calloutType}] ${title}\n> ${rating.emoji} **${rating.description}**\n\n`
}

/**
 * 生成内存性能callout
 */
function generateMemoryPerformanceCallout(memoryTest: MemoryTest, avgRating: any, options: MarkdownOptions): string {
  if (!options.useObsidianCallouts) return ''

  const readSpeed = memoryTest.singleThreadRead.speed
  const writeSpeed = memoryTest.singleThreadWrite.speed

  let message = ''
  if (readSpeed < 10240 || writeSpeed < 10240) {
    message = '检测到内存性能较低，可能存在超售或资源限制情况'
  } else if (readSpeed > 50000 && writeSpeed > 20000) {
    message = '内存性能优异，读写速度表现出色'
  } else {
    message = '内存性能表现正常'
  }

  const calloutType = getCalloutType(avgRating.level)
  return `> [!${calloutType}] 内存性能分析\n> ${message}\n\n`
}

/**
 * 获取callout类型
 */
function getCalloutType(level: string): string {
  switch (level) {
    case 'excellent':
      return 'success'
    case 'good':
      return 'info'
    case 'average':
      return 'warning'
    case 'poor':
      return 'danger'
    default:
      return 'note'
  }
}

/**
 * 计算平均评级
 */
function getAverageRating(ratings: RatingResult[]): RatingResult {
  const levels = ['poor', 'average', 'good', 'excellent']
  const avgIndex = Math.round(
    ratings.reduce((sum, rating) => sum + levels.indexOf(rating.level), 0) / ratings.length
  )

  return {
    level: levels[avgIndex] as any,
    description: '平均',
    color: '#666',
    emoji: '📊'
  }
}

/**
 * 根据4K性能评估磁盘类型和评级
 */
function evaluateDiskPerformance(speed4k: number): { type: string, rating: RatingResult } {
  let type: string
  let level: 'excellent' | 'good' | 'average' | 'poor'
  let description: string
  let emoji: string

  if (speed4k >= 200) {
    type = 'NVMe SSD'
    level = 'excellent'
    description = '优秀 (NVMe SSD)'
    emoji = '🚀'
  } else if (speed4k >= 50) {
    type = '标准SSD'
    level = 'good'
    description = '良好 (标准SSD)'
    emoji = '✅'
  } else if (speed4k >= 10) {
    type = 'HDD (机械硬盘)'
    level = 'average'
    description = '一般 (机械硬盘)'
    emoji = '⚠️'
  } else {
    type = '性能不佳'
    level = 'poor'
    description = '较差 (性能受限)'
    emoji = '❌'
  }

  return {
    type,
    rating: {
      level,
      description,
      color: level === 'excellent' ? '#22c55e' : level === 'good' ? '#3b82f6' : level === 'average' ? '#f59e0b' : '#ef4444',
      emoji
    }
  }
}

/**
 * 根据1M性能评估是否存在超售
 */
function evaluateOverselling(speed1m: number, diskType: string): { hasOverselling: boolean, message: string } {
  let threshold: number
  
  if (diskType === 'NVMe SSD') {
    threshold = 1000 // 1GB/s
  } else if (diskType === '标准SSD') {
    threshold = 500 // 500MB/s
  } else {
    threshold = 200 // 200MB/s for HDD
  }

  const hasOverselling = speed1m < threshold
  let message: string

  if (hasOverselling) {
    if (diskType === 'NVMe SSD') {
      message = '检测到严重的资源超开超售，1M性能远低于NVMe SSD应有水平'
    } else if (diskType === '标准SSD') {
      message = '可能存在资源限制，1M性能低于标准SSD正常水平'
    } else {
      message = '磁盘性能受限，可能存在IO限制或超售情况'
    }
  } else {
    message = '磁盘性能表现正常，未发现明显的资源超售问题'
  }

  return { hasOverselling, message }
}