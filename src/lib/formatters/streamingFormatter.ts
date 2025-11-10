import type { StreamingTest, MarkdownOptions } from '@/types'

/**
 * 流媒体解锁格式化器
 * 负责将流媒体解锁测试结果格式化为Markdown
 */

/**
 * 生成流媒体测试部分
 */
export function generateStreamingTests(streamingTest: StreamingTest, options: MarkdownOptions): string {
  let section = '## 🎬 流媒体解锁测试\n\n';

  if (options.useObsidianCallouts) {
    section += '> [!info] 流媒体解锁说明\n';
    section += '> 测试各大流媒体平台在当前IP下的访问状态，包括地区限制检测\n';
    section += '> **✅ 解锁** = 可正常访问，**❌ 失败** = 无法访问，**🔄 仅自制剧** = 部分内容可用\n\n';
  } else {
    section += '**流媒体解锁说明：** 测试各大流媒体平台在当前IP下的访问状态\n';
    section += '- ✅ 解锁 = 可正常访问\n';
    section += '- ❌ 失败 = 无法访问\n';
    section += '- 🔄 仅自制剧 = 部分内容可用\n\n';
  }

  if (streamingTest.unlockTests.services.length > 0) {
    section += '### 📺 IPv4 解锁结果\n\n';
    section += '| 流媒体平台 | 解锁状态 |\n';
    section += '| --- | --- |\n';

    for (const service of streamingTest.unlockTests.services) {
      const ipv4Status = formatStreamingStatus(service.ipv4Status);
      section += `| ${service.name} | ${ipv4Status} |\n`;
    }
    section += '\n';

    const hasIpv6Results = streamingTest.unlockTests.services.some(s => s.ipv6Status !== '未测试');

    if (hasIpv6Results) {
      section += '### 📱 IPv6 解锁结果\n\n';
      section += '| 流媒体平台 | 解锁状态 |\n';
      section += '| --- | --- |\n';

      for (const service of streamingTest.unlockTests.services) {
        const ipv6Status = formatStreamingStatus(service.ipv6Status);
        section += `| ${service.name} | ${ipv6Status} |\n`;
      }
      section += '\n';
    }
  }

  if (streamingTest.unlockTests.tiktokRegion) {
    section += '### 🎵 TikTok 解锁信息\n\n';
    
    const tiktokRegion = streamingTest.unlockTests.tiktokRegion;
    const isFailed = tiktokRegion.toLowerCase().includes('failed') || tiktokRegion === 'Failed';
    
    if (isFailed) {
      section += `**检测地区：** ${tiktokRegion}\n`;
      section += '**状态：** ❌ 解锁失败\n\n';
    } else {
      section += `**检测地区：** ${tiktokRegion}\n`;
      section += '**状态：** ✅ 可正常访问\n\n';
    }
  }

  return section;
}

/**
 * 格式化流媒体解锁状态
 */
function formatStreamingStatus(status: string): string {
  if (!status || status.trim() === '') {
    return '❓ 未检测'
  }
  
  const lowerStatus = status.toLowerCase()
  
  if (lowerStatus.includes('解锁') || lowerStatus.includes('yes') || lowerStatus.includes('支持')) {
    return `✅ ${status}`
  } else if (lowerStatus.includes('失败') || lowerStatus.includes('no') || lowerStatus.includes('不支持')) {
    return `❌ ${status}`
  } else if (lowerStatus.includes('仅自制剧') || lowerStatus.includes('部分') || lowerStatus.includes('limited')) {
    return `🔄 ${status}`
  } else if (lowerStatus.includes('超时') || lowerStatus.includes('timeout')) {
    return `⏱️ ${status}`
  } else {
    return `📋 ${status}`
  }
}