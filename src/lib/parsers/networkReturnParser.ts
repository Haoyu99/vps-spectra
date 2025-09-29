import type { NetworkReturnTest, ParseError } from '@/types'

/**
 * 专门解析三网回程测试结果的优化函数
 * 针对固定格式的输入数据进行优化
 */
export function parseNetworkReturnTestOptimized(section: string, errors: ParseError[]): NetworkReturnTest {
  const lines = section.split('\n').filter(line => line.trim() !== '')
  
  // 初始化结果
  const result: NetworkReturnTest = {
    telecom: [],
    unicom: [],
    mobile: []
  }

  try {
    // 分别收集各运营商的线路信息
    for (const line of lines) {
      // 跳过标题行、说明行和位置信息行
      if (
        line.includes('三网回程--基于') || 
        line.includes('准确线路') || 
        line.includes('同一目标地址') ||
        line.includes('检测可能已越过') ||
        (line.includes('国家:') && line.includes('城市:') && line.includes('服务商:'))
      ) {
        continue
      }

      // 根据关键词分类到不同的运营商
      if (line.includes("电信")) {
        result.telecom.push(line.trim())
      } else if (line.includes("联通")) {
        result.unicom.push(line.trim())
      } else if (line.includes("移动")) {
        result.mobile.push(line.trim())
      }
    }

    return result
  } catch (error) {
    errors.push({
      section: 'networkReturnTest',
      message: '三网回程测试结果解析失败',
      suggestion: '请检查三网回程测试数据格式'
    })
    return { telecom: [], unicom: [], mobile: [] }
  }
}


/**
 * 将三网回程测试结果转换为Markdown表格格式
 * @param section 三网回程部分的原始文本
 * @param networkReturnTest 解析后的三网回程数据
 * @returns Markdown表格字符串
 */
export function formatNetworkReturnAsMarkdownTable(section: string, networkReturnTest: NetworkReturnTest): string {
  // 提取位置信息
  const lines = section.split('\n').filter(line => line.trim() !== '')
  const locationInfoLine = lines.find(line => 
    line.includes('国家:') && line.includes('城市:') && line.includes('服务商:')
  )
  
  let locationInfo = ''
  if (locationInfoLine) {
    // 提取国家、城市、服务商信息
    const countryMatch = locationInfoLine.match(/国家:\s*([^\s]+)/)
    const cityMatch = locationInfoLine.match(/城市:\s*(.+?)\s+服务商:/)
    const providerMatch = locationInfoLine.match(/服务商:\s*(.+)/)
    
    const country = countryMatch ? countryMatch[1].trim() : ''
    const city = cityMatch ? cityMatch[1].trim() : ''
    const provider = providerMatch ? providerMatch[1].trim() : ''
    
    locationInfo = `> 国家: ${country} \n> 城市: ${city} \n> 服务商: ${provider}`
  }

  // 构建Markdown内容
  let markdown = ''
  
  // 添加位置信息的Obsidian callout格式
  if (locationInfo) {
    markdown += `> [!info] 服务器位置信息\n`
    markdown += `${locationInfo}\n\n`
  }
  
  // 为每个运营商创建独立的表格
  // 电信
  if (networkReturnTest.telecom.length > 0) {
    markdown += `#### 电信\n\n`
    markdown += '| 目标地址 | IP地址 | 线路信息 |\n'
    markdown += '|---------|--------|---------|\n'
    
    for (const line of networkReturnTest.telecom) {
      const parsed = parseNetworkReturnLine(line)
      markdown += `| ${parsed.target} | ${parsed.ip} | ${parsed.info} |\n`
    }
    markdown += '\n'
  }
  
  // 联通
  if (networkReturnTest.unicom.length > 0) {
    markdown += `#### 联通\n\n`
    markdown += '| 目标地址 | IP地址 | 线路信息 |\n'
    markdown += '|---------|--------|---------|\n'
    
    for (const line of networkReturnTest.unicom) {
      const parsed = parseNetworkReturnLine(line)
      markdown += `| ${parsed.target} | ${parsed.ip} | ${parsed.info} |\n`
    }
    markdown += '\n'
  }
  
  // 移动
  if (networkReturnTest.mobile.length > 0) {
    markdown += `#### 移动\n\n`
    markdown += '| 目标地址 | IP地址 | 线路信息 |\n'
    markdown += '|---------|--------|---------|\n'
    
    for (const line of networkReturnTest.mobile) {
      const parsed = parseNetworkReturnLine(line)
      markdown += `| ${parsed.target} | ${parsed.ip} | ${parsed.info} |\n`
    }
    markdown += '\n'
  }
  
  return markdown
}

/**
 * 解析单条回程线路信息
 * @param line 原始线路信息行
 * @returns 解析后的对象
 */
function parseNetworkReturnLine(line: string): { target: string; ip: string; info: string } {
  // 匹配线路信息的正则表达式
  // 格式示例: 北京电信v4 219.141.140.10           电信163    [普通线路]
  const regex = /^(\S+?)\s+((?:\d{1,3}\.){3}\d{1,3}(?:\s*\S*:\S*)?)\s*(.*)$/
  const match = line.match(regex)
  
  if (match) {
    return {
      target: match[1],
      ip: match[2].trim(),
      info: match[3].trim()
    }
  }
  
  // 处理IPv6地址的情况
  // 格式示例: 北京电信v6 2400:89c0:1053:3::69     电信163    [普通线路]
  const ipv6Regex = /^(\S+?)\s+([0-9a-fA-F:]+(?:\s*\S*:\S*)?)\s*(.*)$/
  const ipv6Match = line.match(ipv6Regex)
  
  if (ipv6Match) {
    return {
      target: ipv6Match[1],
      ip: ipv6Match[2].trim(),
      info: ipv6Match[3].trim()
    }
  }
  
  // 如果无法解析，返回原始信息
  return {
    target: line,
    ip: '',
    info: ''
  }
}