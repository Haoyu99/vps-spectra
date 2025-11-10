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
    const services: Array<{
      name: string,
      ipv4Status: string,
      ipv4Region?: string,
      ipv6Status: string,
      ipv6Region?: string
    }> = [];

    // 定位IPV4和IPV6的测试结果部分
    const ipv4Match = section.match(/IPV4:\s*([\s\S]*?)(?=IPV6:|$)/);
    const ipv6Match = section.match(/IPV6:\s*([\s\S]*)/);

    const serviceMap = new Map<string, {
      ipv4: string,
      ipv4Region?: string,
      ipv6: string,
      ipv6Region?: string
    }>();

    // 解析IPV4部分
    if (ipv4Match && ipv4Match[1]) {
      const ipv4Section = ipv4Match[1];
      const serviceRegex = /^\s*([^\s].*?)\s{2,}(YES|NO|Banned|Unknown|Failed)(?:\s*\(Region: ([^\)]+)\))?[\s\S]*?$/gm;
      let match;
      while ((match = serviceRegex.exec(ipv4Section)) !== null) {
        const serviceName = match[1].trim();
        const status = match[2].trim();
        const region = match[3] ? match[3].trim() : undefined;
        serviceMap.set(serviceName, { ipv4: status, ipv4Region: region, ipv6: "未测试" });
      }
    }

    // 解析IPV6部分
    if (ipv6Match && ipv6Match[1]) {
      const ipv6Section = ipv6Match[1];
      const serviceRegex = /^\s*([^\s].*?)\s{2,}(YES|NO|Banned|Unknown|Failed)(?:\s*\(Region: ([^\)]+)\))?[\s\S]*?$/gm;
      let match;
      while ((match = serviceRegex.exec(ipv6Section)) !== null) {
        const serviceName = match[1].trim();
        const status = match[2].trim();
        const region = match[3] ? match[3].trim() : undefined;
        const existing = serviceMap.get(serviceName);
        if (existing) {
          existing.ipv6 = status;
          existing.ipv6Region = region;
        } else {
          serviceMap.set(serviceName, { ipv4: "未测试", ipv6: status, ipv6Region: region });
        }
      }
    }
    
    // 提取TikTok信息
    let tiktokRegion: string | undefined
    const tiktokMatch = section.match(/Tiktok Region:\s*【(.+?)】/)
    if (tiktokMatch) {
      tiktokRegion = tiktokMatch[1]
    }

    // 转换为数组格式
    for (const [name, statuses] of serviceMap) {
      services.push({
        name,
        ipv4Status: statuses.ipv4,
        ipv4Region: statuses.ipv4Region,
        ipv6Status: statuses.ipv6,
        ipv6Region: statuses.ipv6Region
      });
    }

    return {
      unlockTests: {
        services,
        tiktokRegion
      }
    }
  } catch (error) {
    errors.push({
      section: 'streamingTest',
      message: '流媒体解锁测试结果解析失败',
      suggestion: '请检查流媒体测试数据格式'
    })
    return {
      unlockTests: { services: [], tiktokRegion: undefined }
    }
  }
}