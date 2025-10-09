import type { VpsTestResult, ParseError } from '@/types'

// 导入各模块解析器
import { parseBasicInfo } from './basicInfoParser'
import { parseCpuTest, parseMemoryTest, parseDiskDdTest, parseDiskFioTest } from './hardwareParser'
import { parseStreamingTest } from './streamingParser'
import { 
  parseIpQualityTest, 
  parseEmailPortTest, 
  parseNetworkReturnTest, 
  parseRouteTest, 
  parseSpeedTest 
} from './networkParser'
import { extractSections, parseMetadata } from './utils'

/**
 * 主解析函数
 * 协调各个模块解析器，完成完整的VPS测试结果解析
 * 
 * 解析流程：
 * 1. 原始文本解析 - 将输入文本按模块分割
 * 2. 各模块解析 - 使用专门的解析器处理各部分
 * 3. 评估整合 - 对解析结果进行评估和整合
 * 4. 返回结果 - 生成最终的结构化数据
 * 
 * @param input 原始测试结果文本
 * @returns 解析结果和错误信息
 */
export function parseVpsTestResult(input: string): { result: VpsTestResult | null; errors: ParseError[] } {
  const errors: ParseError[] = []
  
  try {
    // 第一步：原始文本解析 - 分割输入为各个部分
    const sections = extractSections(input)
    
    // 第二步：各模块解析 - 使用专门的解析器处理各部分
    
    // 基础信息解析
    const basicInfo = parseBasicInfo(sections.basicInfo, errors)
    
    // 硬件性能测试解析
    const cpuTest = parseCpuTest(sections.cpuTest, errors)
    const memoryTest = parseMemoryTest(sections.memoryTest, errors)
    const diskDdTest = parseDiskDdTest(sections.diskDdTest, errors)
    const diskFioTest = parseDiskFioTest(sections.diskFioTest, errors)
    
    // 流媒体解锁测试解析
    const streamingTest = parseStreamingTest(sections.streamingTest, errors)
    
    // 网络测试解析
    const ipQualityTest = parseIpQualityTest(sections.ipQualityTest, errors)
    const emailPortTest = parseEmailPortTest(sections.emailPortTest, errors)
    const networkReturnTest = parseNetworkReturnTest(sections.networkReturnTest, errors)
    const routeTest = parseRouteTest(sections.routeTest, errors)
    const speedTest = parseSpeedTest(sections.speedTest, errors)
    
    // 元数据解析
    const metadata = parseMetadata(input)

    // 第三步：评估整合 - 构建最终结果对象
    const result: VpsTestResult = {
      basicInfo,
      cpuTest,
      memoryTest,
      diskDdTest,
      diskFioTest,
      streamingTest,
      ipQualityTest,
      emailPortTest,
      networkReturnTest,
      routeTest,
      speedTest,
      metadata
    }

    return { result, errors }
  } catch (error) {
    errors.push({
      section: 'general',
      message: `解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
      suggestion: '请检查输入格式是否正确'
    })
    return { result: null, errors }
  }
}

// 重新导出各模块解析器，以便外部直接使用
export { parseBasicInfo } from './basicInfoParser'
export { parseCpuTest, parseMemoryTest, parseDiskDdTest, parseDiskFioTest } from './hardwareParser'
export { parseStreamingTest } from './streamingParser'
export { 
  parseIpQualityTest, 
  parseEmailPortTest, 
  parseNetworkReturnTest, 
  parseRouteTest, 
  parseSpeedTest 
} from './networkParser'
export { extractSections, parseMetadata } from './utils'