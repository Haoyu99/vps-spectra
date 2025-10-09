import type { BasicInfo, ParseError } from '@/types'

/**
 * 基础信息解析器
 * 负责解析服务器的基础硬件和系统信息
 */

/**
 * 解析基础信息
 * @param section 基础信息文本段落
 * @param errors 错误收集数组
 * @returns 解析后的基础信息对象
 */
export function parseBasicInfo(section: string, errors: ParseError[]): BasicInfo {
  const lines = section.split('\n').filter(line => line.trim() !== '')
  
  const extractValue = (pattern: RegExp, defaultValue: string = '未知') => {
    for (const line of lines) {
      const match = line.match(pattern)
      if (match) return match[1].trim()
    }
    return defaultValue
  }

  const extractBoolean = (pattern: RegExp) => {
    for (const line of lines) {
      const match = line.match(pattern)
      if (match) return match[1].includes('✔') || match[1].toLowerCase().includes('enabled')
    }
    return false
  }

  try {
    return {
      cpuModel: extractValue(/CPU 型号\s*[:：]\s*(.+)/),
      cpuCores: parseInt(extractValue(/CPU 核心数\s*[:：]\s*(\d+)/, '1')),
      cpuFreq: extractValue(/CPU 频率\s*[:：]\s*(.+)/),
      cpuCache: {
        l1: extractValue(/CPU 缓存\s*[:：].*L1:\s*([^/]+)/, '未知'),
        l2: extractValue(/CPU 缓存\s*[:：].*L2:\s*([^/]+)/, '未知'),
        l3: extractValue(/CPU 缓存\s*[:：].*L3:\s*(.+)/, '未知')
      },
      aesNI: extractBoolean(/AES-NI指令集\s*[:：]\s*(.+)/),
      vmSupport: extractBoolean(/VM-x\/AMD-V支持\s*[:：]\s*(.+)/),
      memory: {
        used: extractValue(/内存\s*[:：]\s*([^/]+)/, '未知'),
        total: extractValue(/内存\s*[:：]\s*[^/]+\/\s*(.+)/, '未知')
      },
      swap: extractValue(/Swap\s*[:：]\s*(.+)/),
      disk: {
        used: extractValue(/硬盘空间\s*[:：]\s*([^/]+)/, '未知'),
        total: extractValue(/硬盘空间\s*[:：]\s*[^/]+\/\s*(.+)/, '未知')
      },
      bootPath: extractValue(/启动盘路径\s*[:：]\s*(.+)/),
      uptime: extractValue(/系统在线时间\s*[:：]\s*(.+)/),
      load: extractValue(/负载\s*[:：]\s*(.+)/, '0, 0, 0').split(',').map(s => s.trim()),
      system: extractValue(/系统\s*[:：]\s*(.+)/),
      arch: extractValue(/架构\s*[:：]\s*(.+)/),
      kernel: extractValue(/内核\s*[:：]\s*(.+)/),
      tcpAcceleration: extractValue(/TCP加速方式\s*[:：]\s*(.+)/),
      virtualization: extractValue(/虚拟化架构\s*[:：]\s*(.+)/),
      natType: extractValue(/NAT类型\s*[:：]\s*(.+)/),
      ipv4: {
        asn: extractValue(/IPV4 ASN\s*[:：]\s*(.+)/),
        location: extractValue(/IPV4 位置\s*[:：]\s*(.+)/)
      },
      ipv6: {
        asn: extractValue(/IPV6 ASN\s*[:：]\s*(.+)/),
        location: extractValue(/IPV6 位置\s*[:：]\s*(.+)/),
        subnet: extractValue(/IPV6 子网掩码\s*[:：]\s*(.+)/)
      }
    }
  } catch (error) {
    errors.push({
      section: 'basicInfo',
      message: '基础信息解析失败',
      suggestion: '请检查基础信息格式是否正确'
    })
    throw error
  }
}