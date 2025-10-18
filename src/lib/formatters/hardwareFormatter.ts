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
  section += generateCpuRatingCallout(cpuTest.singleCore.rating, '单核性能评级', options)

  // 多核性能 - 只有当多核测试有效时才显示
  // 判断是否为有效的多核测试：线程数大于1且得分大于0
  if (cpuTest.multiCore && cpuTest.multiCore.threads > 1 && cpuTest.multiCore.score > 0) {
    section += `**${cpuTest.multiCore.threads}线程性能得分：** ${cpuTest.multiCore.score} Scores\n\n`
    section += generateCpuRatingCallout(cpuTest.multiCore.rating, '多核性能评级', options)

    // 多核效率
    if (cpuTest.multiCore.efficiency && cpuTest.multiCore.efficiencyRating) {
      section += `**多核心效率：** ${cpuTest.multiCore.efficiency.toFixed(2)}\n\n`
      section += generateCpuRatingCallout(cpuTest.multiCore.efficiencyRating, '效率评级', options)
    }
  }

  return section
}

/**
 * 生成内存测试部分
 */
function generateMemoryTestSection(memoryTest: MemoryTest, options: MarkdownOptions): string {
  let section = ''

  section += '| 测试类型 | 性能 |\n'
  section += '| --- | --- |\n'
  section += `| 单线程读测试 | ${memoryTest.singleThreadRead.speed.toFixed(2)} MB/s |\n`
  section += `| 单线程写测试 | ${memoryTest.singleThreadWrite.speed.toFixed(2)} MB/s |\n\n`

  // 内存性能总体评价
  if (options.useObsidianCallouts && memoryTest.overallRating) {
    section += generateMemoryRatingCallout(memoryTest.overallRating, options)
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
      section += '#### 磁盘性能分析 \n\n'
      
      // 4K性能评级（使用 evaluators 中的函数）
      const { evaluateDisk4kPerformance, evaluateDiskOverselling } = require('@/lib/evaluators')
      const disk4kEval = evaluateDisk4kPerformance(test4k.read.speed, test4k.write.speed)
      
      section += `**磁盘类型判断：** ${disk4kEval.type}\n\n`
      
      if (options.useObsidianCallouts) {
        const calloutType = getCalloutType(disk4kEval.rating.level)
        section += `> [!${calloutType}] 4K性能评级\n`
        section += `> ${disk4kEval.rating.emoji} **${disk4kEval.rating.description}**\n\n`
      } else {
        section += `**4K性能评级：** ${disk4kEval.rating.emoji} ${disk4kEval.rating.description}\n\n`
      }
      
      // 1M性能超售检测
      if (test1m) {
        const oversellingEval = evaluateDiskOverselling(test1m.total.speed, disk4kEval.type)
        
        if (options.useObsidianCallouts) {
          const calloutType = getCalloutType(oversellingEval.level)
          section += `> [!${calloutType}] 资源超售检测\n`
          section += `> ${oversellingEval.emoji} **${oversellingEval.description}**\n\n`
        } else {
          section += `**资源超售检测：** ${oversellingEval.emoji} ${oversellingEval.description}\n\n`
        }
      }
    }
  }

  return section
}

/**
 * 生成CPU性能评级callout
 */
function generateCpuRatingCallout(rating: RatingResult, title: string, options: MarkdownOptions): string {
  if (!options.useObsidianCallouts) {
    return `**${title}：** ${rating.emoji} ${rating.description}\n\n`
  }

  const calloutType = getCalloutType(rating.level)
  return `> [!${calloutType}] ${title}\n> ${rating.emoji} **${rating.description}**\n\n`
}

/**
 * 生成内存性能评级callout
 */
function generateMemoryRatingCallout(overallRating: RatingResult, options: MarkdownOptions): string {
  if (!options.useObsidianCallouts) return ''

  const calloutType = getCalloutType(overallRating.level)
  return `> [!${calloutType}] 内存性能分析\n> ${overallRating.emoji} **${overallRating.description}**\n\n`
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

