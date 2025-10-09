import type { StreamingTest, ParseError } from '@/types'

/**
 * 流媒体解锁测试解析器
 * 负责解析各大流媒体平台的解锁状态
 */

/**
 * 解析流媒体解锁测试结果
 * @param section 流媒体测试文本段落
 * @param errors 错误收集数组
 * @returns 解析后的流媒体测试结果
 */
export function parseStreamingTest(section: string, errors: ParseError[]): StreamingTest {
  try {
    const ipv4Results: Array<{service: string, status: string}> = []
    const ipv6Results: Array<{service: string, status: string}> = []
    const services: Array<{name: string, ipv4Status: string, ipv6Status: string}> = []
    
    // 提取TikTok信息
    const tiktokMatch = section.match(/Tiktok Region:\s*【(.+?)】/)
    const tiktokRegion = tiktokMatch ? tiktokMatch[1] : undefined

    // 解析RegionRestrictionCheck部分
    const ipv4Section = section.substring(
      section.indexOf("以下为IPV4网络测试"),
      section.indexOf("以下为IPV6网络测试")
    )
    const ipv6Section = section.substring(section.indexOf("以下为IPV6网络测试"))

    // 提取服务名称和状态
    const serviceRegex = /([^:\n]+):\s*([^\n]+)/g
    let match

    const serviceMap = new Map<string, {ipv4: string, ipv6: string}>()

    // 解析IPv4部分
    while ((match = serviceRegex.exec(ipv4Section)) !== null) {
      const serviceName = match[1].trim()
      const status = match[2].trim()
      if (!serviceName.includes("Region") && !serviceName.includes("Forum")) {
        serviceMap.set(serviceName, { ipv4: status, ipv6: "未测试" })
      }
    }

    // 解析IPv6部分
    serviceRegex.lastIndex = 0
    while ((match = serviceRegex.exec(ipv6Section)) !== null) {
      const serviceName = match[1].trim()
      const status = match[2].trim()
      if (!serviceName.includes("Region") && !serviceName.includes("Forum")) {
        const existing = serviceMap.get(serviceName)
        if (existing) {
          existing.ipv6 = status
        } else {
          serviceMap.set(serviceName, { ipv4: "未测试", ipv6: status })
        }
      }
    }

    // 转换为数组格式
    for (const [name, statuses] of serviceMap) {
      services.push({
        name,
        ipv4Status: statuses.ipv4,
        ipv6Status: statuses.ipv6
      })
    }

    return {
      commonMediaTests: {
        ipv4: ipv4Results,
        ipv6: ipv6Results,
        tiktokRegion
      },
      regionRestrictionCheck: {
        services
      }
    }
  } catch (error) {
    errors.push({
      section: 'streamingTest',
      message: '流媒体解锁测试结果解析失败',
      suggestion: '请检查流媒体测试数据格式'
    })
    return {
      commonMediaTests: { ipv4: [], ipv6: [] },
      regionRestrictionCheck: { services: [] }
    }
  }
}