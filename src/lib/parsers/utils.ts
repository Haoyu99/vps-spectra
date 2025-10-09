/**
 * 解析器工具函数
 * 提供通用的文本解析和处理功能
 */

/**
 * 提取两个标记之间的纯净文本内容
 * @param text 完整的原始文本
 * @param startMarker 开始标记字符串
 * @param endMarker 结束标记字符串
 * @returns 提取出的文本片段，不包含标记本身，并移除了首尾的空白字符
 */
export function extractSection(text: string, startMarker: string, endMarker: string): string {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) {
    return "";
  }
  const contentStartIndex = startIndex + startMarker.length;
  const endIndex = text.indexOf(endMarker, contentStartIndex);
  let content: string;
  if (endIndex === -1) {
    content = text.substring(contentStartIndex);
  } else {
    content = text.substring(contentStartIndex, endIndex);
  }
  return content.trim();
}

/**
 * 解析元数据信息
 * @param input 完整输入文本
 * @returns 元数据对象
 */
export function parseMetadata(input: string) {
  try {
    // 解析版本信息
    const versionMatch = input.match(/VPS融合怪版本[：:]\s*(.+)/)
    
    // 解析测试耗时 - 在结尾部分查找
    const durationMatch = input.match(/总共花费\s*[:：]\s*(.+)/)
    
    // 解析测试时间 - 固定在总共花费的下一行，避免与系统在线时间混淆
    let testTime = '未知'
    if (durationMatch) {
      // 找到总共花费这一行的位置
      const durationLineIndex = input.indexOf(durationMatch[0])
      if (durationLineIndex !== -1) {
        // 从总共花费行开始，查找下一行的时间信息
        const remainingText = input.substring(durationLineIndex)
        const lines = remainingText.split('\n')
        
        // 在接下来的几行中查找时间格式
        for (let i = 1; i < Math.min(lines.length, 5); i++) {
          const line = lines[i].trim()
          // 匹配时间格式：时间 : Sun Sep 28 15:49:50 CST 2025
          const timeMatch = line.match(/时间\s*[:：]\s*(.+)/)
          if (timeMatch) {
            testTime = timeMatch[1].trim()
            break
          }
        }
      }
    }
    
    // 如果上面的方法没找到，使用备用方法（在结尾部分查找）
    if (testTime === '未知') {
      // 在文本末尾查找时间信息，避免与基础信息中的系统在线时间混淆
      const endSection = input.substring(Math.max(0, input.length - 1000)) // 只在最后1000字符中查找
      const timeMatch = endSection.match(/时间\s*[:：]\s*(.+)/)
      if (timeMatch) {
        testTime = timeMatch[1].trim()
      }
    }

    return {
      testTime,
      totalDuration: durationMatch ? durationMatch[1].trim() : '未知',
      version: versionMatch ? versionMatch[1].trim() : '未知'
    }
  } catch (error) {
    return {
      testTime: '未知',
      totalDuration: '未知',
      version: '未知'
    }
  }
}

/**
 * 定义各个模块的分隔符常量
 */
export const SECTION_MARKERS = {
  BASIC_INFO_START: '---------------------基础信息查询--感谢所有开源项目---------------------',
  CPU_TEST_START: '----------------------CPU测试--通过sysbench测试-------------------------',
  MEMORY_TEST_START: '---------------------内存测试--感谢lemonbench开源-----------------------',
  DISK_DD_TEST_START: '------------------磁盘dd读写测试--感谢lemonbench开源--------------------',
  DISK_FIO_TEST_START: '---------------------磁盘fio读写测试--感谢yabs开源----------------------',
  STREAMING_TEST_START: '------------流媒体解锁--基于oneclickvirt/CommonMediaTests开源-----------',
  IP_QUALITY_TEST_START: '-------------IP质量检测--基于oneclickvirt/securityCheck使用-------------',
  EMAIL_PORT_TEST_START: '-------------邮件端口检测--基于oneclickvirt/portchecker开源-------------',
  NETWORK_RETURN_TEST_START: '-------------上游及三网回程--基于oneclickvirt/backtrace开源-------------',
  ROUTE_TEST_START: '-----------------------回程路由--基于nexttrace开源----------------------',
  SPEED_TEST_START: '--------------------自动更新测速节点列表--本脚本原创--------------------',
  SCRIPT_END_MARKER: '------------------------------------------------------------------------'
} as const

/**
 * 提取各个测试部分
 * @param input 完整输入文本
 * @returns 各个部分的文本内容
 */
export function extractSections(input: string) {
  return {
    basicInfo: extractSection(input, SECTION_MARKERS.BASIC_INFO_START, SECTION_MARKERS.CPU_TEST_START),
    cpuTest: extractSection(input, SECTION_MARKERS.CPU_TEST_START, SECTION_MARKERS.MEMORY_TEST_START),
    memoryTest: extractSection(input, SECTION_MARKERS.MEMORY_TEST_START, SECTION_MARKERS.DISK_DD_TEST_START),
    diskDdTest: extractSection(input, SECTION_MARKERS.DISK_DD_TEST_START, SECTION_MARKERS.DISK_FIO_TEST_START),
    diskFioTest: extractSection(input, SECTION_MARKERS.DISK_FIO_TEST_START, SECTION_MARKERS.STREAMING_TEST_START),
    streamingTest: extractSection(input, SECTION_MARKERS.STREAMING_TEST_START, SECTION_MARKERS.IP_QUALITY_TEST_START),
    ipQualityTest: extractSection(input, SECTION_MARKERS.IP_QUALITY_TEST_START, SECTION_MARKERS.EMAIL_PORT_TEST_START),
    emailPortTest: extractSection(input, SECTION_MARKERS.EMAIL_PORT_TEST_START, SECTION_MARKERS.NETWORK_RETURN_TEST_START),
    networkReturnTest: extractSection(input, SECTION_MARKERS.NETWORK_RETURN_TEST_START, SECTION_MARKERS.ROUTE_TEST_START),
    routeTest: extractSection(input, SECTION_MARKERS.ROUTE_TEST_START, SECTION_MARKERS.SPEED_TEST_START),
    speedTest: extractSection(input, SECTION_MARKERS.SPEED_TEST_START, SECTION_MARKERS.SCRIPT_END_MARKER),
  }
}