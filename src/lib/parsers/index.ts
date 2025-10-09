import type {
  VpsTestResult,
  ParseError,
  BasicInfo,
  CpuTest,
  MemoryTest,
  DiskDdTest,
  DiskFioTest,
  StreamingTest,
  IpQualityTest,
  EmailPortTest,
  NetworkReturnTest,
  RouteTest,
  RouteHop,
  SpeedTest,
  DatabaseSource,
  IpQualityMetric,
  BlacklistStats,
  SecurityInfo
} from '@/types'
import {
  evaluateCpuSingleCore,
  evaluateCpuMultiCore,
  evaluateCpuEfficiency,
  evaluateMemoryRead,
  evaluateMemoryWrite,
  evaluateIpReputation,
  evaluateIpTrust,
  evaluateIpRiskScore,
  evaluateIpThreatLevel,
  evaluateIpAbuseDescription
} from '@/lib/evaluators'
import { parseNetworkReturnTestOptimized } from './networkReturnParser'

// 定义各个模块的分隔符
const BASIC_INFO_START_STR = '---------------------基础信息查询--感谢所有开源项目---------------------';
const CPU_TEST_START_STR = '----------------------CPU测试--通过sysbench测试-------------------------';
const MEMORY_TEST_START_STR = '---------------------内存测试--感谢lemonbench开源-----------------------';
const DISK_DD_TEST_START_STR = '------------------磁盘dd读写测试--感谢lemonbench开源--------------------';
const DISK_FIO_TEST_START_STR = '---------------------磁盘fio读写测试--感谢yabs开源----------------------';
const STREAMING_TEST_START_STR1 = '------------流媒体解锁--基于oneclickvirt/CommonMediaTests开源-----------';
// const STREAMING_TEST_START_STR2 = '----------------流媒体解锁--感谢RegionRestrictionCheck开源--------------';
// const TIKTOK_UNLOCK_TEST_STR = '--------------------TikTok解锁--感谢lmc999的源脚本----------------------'
const IP_QUALITY_TEST_START_STR = '-------------IP质量检测--基于oneclickvirt/securityCheck使用-------------';
const EMAIL_PORT_TEST_START_STR = '-------------邮件端口检测--基于oneclickvirt/portchecker开源-------------';
const NETWORK_RETURN_TEST_START_STR = '-------------上游及三网回程--基于oneclickvirt/backtrace开源-------------';
const ROUTE_TEST_START_STR = '-----------------------回程路由--基于nexttrace开源----------------------';
const SPEED_TEST_START_STR = '--------------------自动更新测速节点列表--本脚本原创--------------------';
const SCRIPT_END_MARKER = '------------------------------------------------------------------------';


/**
 * 主解析函数
 */
export function parseVpsTestResult(input: string): { result: VpsTestResult | null; errors: ParseError[] } {
  const errors: ParseError[] = []
  
  try {
    // 分割输入为各个部分
    const sections = extractSections(input)
    
    // 解析各个部分
    const basicInfo = parseBasicInfo(sections.basicInfo, errors)
    const cpuTest = parseCpuTest(sections.cpuTest, errors)
    const memoryTest = parseMemoryTest(sections.memoryTest, errors)
    const diskDdTest = parseDiskDdTest(sections.diskDdTest, errors)
    const diskFioTest = parseDiskFioTest(sections.diskFioTest, errors)
    const streamingTest = parseStreamingTest(sections.streamingTest, errors)
    const ipQualityTest = parseIpQualityTest(sections.ipQualityTest, errors)
    const emailPortTest = parseEmailPortTest(sections.emailPortTest, errors)
    const networkReturnTest = parseNetworkReturnTest(sections.networkReturnTest, errors)
    const routeTest = parseRouteTest(sections.routeTest, errors)
    const speedTest = parseSpeedTest(sections.speedTest, errors)
    const metadata = parseMetadata(input, errors)

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

/**
 * 提取各个测试部分
 */
function extractSections(input: string) {
  return {
    basicInfo: extractSection(input, BASIC_INFO_START_STR, CPU_TEST_START_STR),
    cpuTest: extractSection(input, CPU_TEST_START_STR, MEMORY_TEST_START_STR),
    memoryTest: extractSection(input, MEMORY_TEST_START_STR, DISK_DD_TEST_START_STR),
    diskDdTest: extractSection(input, DISK_DD_TEST_START_STR, DISK_FIO_TEST_START_STR),
    diskFioTest: extractSection(input, DISK_FIO_TEST_START_STR, STREAMING_TEST_START_STR1),
    streamingTest: extractSection(input, STREAMING_TEST_START_STR1, IP_QUALITY_TEST_START_STR),
    ipQualityTest: extractSection(input, IP_QUALITY_TEST_START_STR, EMAIL_PORT_TEST_START_STR),
    emailPortTest: extractSection(input, EMAIL_PORT_TEST_START_STR, NETWORK_RETURN_TEST_START_STR),
    networkReturnTest: extractSection(input, NETWORK_RETURN_TEST_START_STR, ROUTE_TEST_START_STR), // 使用专门的提取函数
    routeTest: extractSection(input, ROUTE_TEST_START_STR, SPEED_TEST_START_STR),
    speedTest: extractSection(input, SPEED_TEST_START_STR, SCRIPT_END_MARKER),
  }
}


/*
 * 提取两个标记之间的纯净文本内容。
 * @param {string} text 完整的原始文本。
 * @param {string} startMarker 开始标记字符串。
 * @param {string} endMarker 结束标记字符串。
 * @returns {string} 提取出的文本片段，不包含标记本身，并移除了首尾的空白字符。
 */
function extractSection(text: string, startMarker: string, endMarker: string): string {
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
 * 解析基础信息
 */
function parseBasicInfo(section: string, errors: ParseError[]): BasicInfo {
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

/**
 * 解析CPU测试结果
 */
function parseCpuTest(section: string, errors: ParseError[]): CpuTest {
  const lines = section.split('\n').filter(line => line.trim() !== '')
  
  let singleScore = 0
  let multiScore = 0
  let threadCount = 1

  try {
    for (const line of lines) {
      const singleMatch = line.match(/1\s*线程测试.*?(\d+)\s+Scores/)
      if (singleMatch) {
        singleScore = parseInt(singleMatch[1])
        continue
      }

      const multiMatch = line.match(/(\d+)\s*线程测试.*?(\d+)\s+Scores/)
      if (multiMatch && parseInt(multiMatch[1]) > 1) {
        threadCount = parseInt(multiMatch[1])
        multiScore = parseInt(multiMatch[2])
      }
    }

    const efficiency = singleScore > 0 ? multiScore / (singleScore * threadCount) : 0

    return {
      singleCore: {
        score: singleScore,
        rating: evaluateCpuSingleCore(singleScore)
      },
      multiCore: {
        score: multiScore,
        threads: threadCount,
        rating: evaluateCpuMultiCore(multiScore, singleScore, threadCount),
        efficiency: efficiency,
        efficiencyRating: evaluateCpuEfficiency(efficiency)
      }
    }
  } catch (error) {
    errors.push({
      section: 'cpuTest',
      message: 'CPU测试结果解析失败',
      suggestion: '请检查CPU测试数据格式'
    })
    throw error
  }
}

/**
 * 解析内存测试结果
 */
function parseMemoryTest(section: string, errors: ParseError[]): MemoryTest {
  const lines = section.split('\n').filter(line => line.trim() !== '')
  
  let readSpeed = 0
  let writeSpeed = 0

  try {
    for (const line of lines) {
      const readMatch = line.match(/单线程读测试.*?([0-9.]+)\s*MB\/s/)
      if (readMatch) {
        readSpeed = parseFloat(readMatch[1])
        continue
      }

      const writeMatch = line.match(/单线程写测试.*?([0-9.]+)\s*MB\/s/)
      if (writeMatch) {
        writeSpeed = parseFloat(writeMatch[1])
      }
    }

    return {
      singleThreadRead: {
        speed: readSpeed,
        rating: evaluateMemoryRead(readSpeed)
      },
      singleThreadWrite: {
        speed: writeSpeed,
        rating: evaluateMemoryWrite(writeSpeed)
      }
    }
  } catch (error) {
    errors.push({
      section: 'memoryTest',
      message: '内存测试结果解析失败',
      suggestion: '请检查内存测试数据格式'
    })
    throw error
  }
}

/**
 * 解析磁盘DD测试结果
 */
function parseDiskDdTest(section: string, errors: ParseError[]): DiskDdTest {
  const lines = section.split('\n').filter(line => line.trim() !== '')
  const tests: DiskDdTest['tests'] = []

  try {
    for (const line of lines) {
      // 匹配包含Block的测试行，支持多种分隔符
      if (line.includes('Block') && (line.includes('MB/s') || line.includes('GB/s'))) {
        // 提取操作名称
        const operationMatch = line.match(/(.+?Block)/)
        if (!operationMatch) continue
        
        const operation = operationMatch[1].trim()
        
        // 使用更灵活的正则表达式匹配速度、IOPS和时间
        const speedMatches = line.match(/([0-9.]+\s*[GM]?B\/s\s*\([^)]+\))/g)
        
        if (speedMatches && speedMatches.length >= 2) {
          // 第一个是写入速度，第二个是读取速度
          const writeInfo = speedMatches[0]
          const readInfo = speedMatches[1]
          
          const writeSpeedMatch = writeInfo.match(/([0-9.]+\s*[GM]?B\/s)/)
          const writeIOPSMatch = writeInfo.match(/\(([0-9]+)\s*IOPS/)
          const writeTimeMatch = writeInfo.match(/([0-9.]+s)\)/)
          
          const readSpeedMatch = readInfo.match(/([0-9.]+\s*[GM]?B\/s)/)
          const readIOPSMatch = readInfo.match(/\(([0-9]+)\s*IOPS/)
          const readTimeMatch = readInfo.match(/([0-9.]+s)\)/)

          tests.push({
            operation,
            writeSpeed: writeSpeedMatch ? writeSpeedMatch[1] : undefined,
            writeIOPS: writeIOPSMatch ? writeIOPSMatch[1] + ' IOPS' : undefined,
            writeTime: writeTimeMatch ? writeTimeMatch[1] : undefined,
            readSpeed: readSpeedMatch ? readSpeedMatch[1] : undefined,
            readIOPS: readIOPSMatch ? readIOPSMatch[1] + ' IOPS' : undefined,
            readTime: readTimeMatch ? readTimeMatch[1] : undefined
          })
        }
      }
    }

    return { tests }
  } catch (error) {
    errors.push({
      section: 'diskDdTest',
      message: '磁盘DD测试结果解析失败',
      suggestion: '请检查磁盘DD测试数据格式'
    })
    return { tests: [] }
  }
}

/**
 * 解析IP质量检测数据库列表
 */
function parseIpQualityDatabases(section: string): DatabaseSource[] {
  const databases: DatabaseSource[] = []
  
  // 解析数据库编号说明部分
  const dbSection = section.match(/以下为各数据库编号[\s\S]*?IPV4:/)?.[0] || ''
  
  // 数据库URL映射
  const dbUrlMap: { [key: string]: string } = {
    'ipinfo': 'https://ipinfo.io/',
    'scamalytics': 'https://scamalytics.com/',
    'virustotal': 'https://www.virustotal.com/',
    'abuseipdb': 'https://www.abuseipdb.com/',
    'ip2location': 'https://www.ip2location.com/',
    'ip-api': 'http://ip-api.com/',
    'ipwhois': 'https://ipwhois.app/',
    'ipregistry': 'https://ipregistry.co/',
    'ipdata': 'https://ipdata.co/',
    'db-ip': 'https://db-ip.com/',
    'ipapiis': 'https://ipapi.is/',
    'ipapicom': 'https://ipapi.com/',
    'bigdatacloud': 'https://www.bigdatacloud.com/',
    'dkly': 'https://dkly.com/',
    'ipqualityscore': 'https://www.ipqualityscore.com/'
  }
  
  // 解析数据库行，格式如：ipinfo数据库  [0] | scamalytics数据库 [1] | ...
  const dbLines = dbSection.split('\n').filter(line => line.includes('[') && line.includes(']'))
  
  for (const line of dbLines) {
    // 匹配格式：数据库名 [编号]，支持更灵活的匹配
    const matches = line.match(/([^|\[\]]+)数据库\s*\[([0-9A-E])\]/g)
    if (matches) {
      for (const match of matches) {
        const dbMatch = match.match(/([^|\[\]]+)数据库\s*\[([0-9A-E])\]/)
        if (dbMatch) {
          const dbKey = dbMatch[1].trim()
          const dbId = dbMatch[2]
          const dbName = `${dbKey}数据库`
          
          // 处理特殊的数据库名称映射
          let mappedKey = dbKey
          if (dbKey === 'ip-api') mappedKey = 'ip-api'
          else if (dbKey === 'db-ip') mappedKey = 'db-ip'
          else if (dbKey.includes('-')) mappedKey = dbKey
          
          const dbUrl = dbUrlMap[mappedKey] || dbUrlMap[dbKey] || '#'
          const description = getDatabaseDescription(mappedKey) || getDatabaseDescription(dbKey)
          
          databases.push({
            id: dbId,
            name: dbName,
            url: dbUrl,
            description
          })
        }
      }
    }
  }
  
  // 如果解析失败，使用默认列表
  if (databases.length === 0) {
    return [
      { id: '0', name: 'ipinfo数据库', url: 'https://ipinfo.io/', description: 'IP地理位置和ASN信息' },
      { id: '1', name: 'scamalytics数据库', url: 'https://scamalytics.com/', description: '欺诈检测和风险评估' },
      { id: '2', name: 'virustotal数据库', url: 'https://www.virustotal.com/', description: '恶意软件和威胁检测' },
      { id: '3', name: 'abuseipdb数据库', url: 'https://www.abuseipdb.com/', description: 'IP滥用报告数据库' },
      { id: '4', name: 'ip2location数据库', url: 'https://www.ip2location.com/', description: 'IP地理定位服务' },
      { id: '5', name: 'ip-api数据库', url: 'http://ip-api.com/', description: 'IP地理位置API' },
      { id: '6', name: 'ipwhois数据库', url: 'https://ipwhois.app/', description: 'IP WHOIS信息查询' },
      { id: '7', name: 'ipregistry数据库', url: 'https://ipregistry.co/', description: 'IP地理位置和威胁情报' },
      { id: '8', name: 'ipdata数据库', url: 'https://ipdata.co/', description: 'IP地理位置和安全数据' },
      { id: '9', name: 'db-ip数据库', url: 'https://db-ip.com/', description: 'IP地理位置数据库' },
      { id: 'A', name: 'ipapiis数据库', url: 'https://ipapi.is/', description: 'IP地理位置和安全检测' },
      { id: 'B', name: 'ipapicom数据库', url: 'https://ipapi.com/', description: 'IP地理位置API服务' },
      { id: 'C', name: 'bigdatacloud数据库', url: 'https://www.bigdatacloud.com/', description: 'IP地理位置和网络数据' },
      { id: 'D', name: 'dkly数据库', url: 'https://dkly.com/', description: 'IP威胁情报' },
      { id: 'E', name: 'ipqualityscore数据库', url: 'https://www.ipqualityscore.com/', description: '综合IP质量评分' }
    ]
  }
  
  return databases
}

/**
 * 获取数据库描述
 */
function getDatabaseDescription(dbKey: string): string {
  const descriptions: { [key: string]: string } = {
    'ipinfo': 'IP地理位置和ASN信息',
    'scamalytics': '欺诈检测和风险评估',
    'virustotal': '恶意软件和威胁检测',
    'abuseipdb': 'IP滥用报告数据库',
    'ip2location': 'IP地理定位服务',
    'ip-api': 'IP地理位置API',
    'ipwhois': 'IP WHOIS信息查询',
    'ipregistry': 'IP地理位置和威胁情报',
    'ipdata': 'IP地理位置和安全数据',
    'db-ip': 'IP地理位置数据库',
    'ipapiis': 'IP地理位置和安全检测',
    'ipapicom': 'IP地理位置API服务',
    'bigdatacloud': 'IP地理位置和网络数据',
    'dkly': 'IP威胁情报',
    'ipqualityscore': '综合IP质量评分'
  }
  return descriptions[dbKey] || '未知数据库'
}

/**
 * 解析数据库来源编号
 */
function parseDatabaseSources(sourcesStr: string): string[] {
  if (!sourcesStr) return []
  
  // 移除方括号并分割
  const cleaned = sourcesStr.replace(/[\[\]]/g, '').trim()
  if (!cleaned) return []
  
  // 分割多个来源（可能用空格或其他分隔符）
  return cleaned.split(/\s+/).filter(s => s.length > 0)
}

/**
 * 解析黑名单记录统计
 */
function parseBlacklistStats(section: string): BlacklistStats {
  const defaultStats = {
    harmlessCount: { value: 0, sources: [] },
    maliciousCount: { value: 0, sources: [] },
    suspiciousCount: { value: 0, sources: [] },
    undetectedCount: { value: 0, sources: [] },
    totalChecked: 0,
    cleanCount: 0,
    blacklistedCount: 0,
    otherCount: 0
  }

  try {
    // 解析黑名单记录统计行
    const harmlessMatch = section.match(/无害记录数:\s*([0-9.]+)\s*\[([^\]]+)\]/)
    const maliciousMatch = section.match(/恶意记录数:\s*([0-9.]+)\s*\[([^\]]+)\]/)
    const suspiciousMatch = section.match(/可疑记录数:\s*([0-9.]+)\s*\[([^\]]+)\]/)
    const undetectedMatch = section.match(/无记录数:\s*([0-9.]+)\s*\[([^\]]+)\]/)
    
    // 解析DNS黑名单统计
    const dnsMatch = section.match(/DNS-黑名单:\s*(\d+)\(Total_Check\)\s*(\d+)\(Clean\)\s*(\d+)\(Blacklisted\)\s*(\d+)\(Other\)/)

    return {
      harmlessCount: harmlessMatch ? { 
        value: parseInt(harmlessMatch[1]), 
        sources: parseDatabaseSources(harmlessMatch[2]) 
      } : defaultStats.harmlessCount,
      maliciousCount: maliciousMatch ? { 
        value: parseInt(maliciousMatch[1]), 
        sources: parseDatabaseSources(maliciousMatch[2]) 
      } : defaultStats.maliciousCount,
      suspiciousCount: suspiciousMatch ? { 
        value: parseInt(suspiciousMatch[1]), 
        sources: parseDatabaseSources(suspiciousMatch[2]) 
      } : defaultStats.suspiciousCount,
      undetectedCount: undetectedMatch ? { 
        value: parseInt(undetectedMatch[1]), 
        sources: parseDatabaseSources(undetectedMatch[2]) 
      } : defaultStats.undetectedCount,
      totalChecked: dnsMatch ? parseInt(dnsMatch[1]) : 0,
      cleanCount: dnsMatch ? parseInt(dnsMatch[2]) : 0,
      blacklistedCount: dnsMatch ? parseInt(dnsMatch[3]) : 0,
      otherCount: dnsMatch ? parseInt(dnsMatch[4]) : 0
    }
  } catch (error) {
    return defaultStats
  }
}

/**
 * 解析安全信息
 */
function parseSecurityInfo(section: string): SecurityInfo {
  const securityInfo: SecurityInfo = {}
  
  try {
    // 查找安全信息部分
    const securitySection = section.match(/安全信息:([\s\S]*?)(?:DNS-黑名单|Google搜索可行性|$)/)?.[1] || ''
    
    // 解析各种安全信息项
    const securityLines = securitySection.split('\n').filter(line => line.trim() !== '')
    
    for (const line of securityLines) {
      // 匹配格式：项目名: 值1 [来源1] 值2 [来源2] ...
      const matches = line.match(/^([^:]+):\s*(.+)$/)
      if (matches) {
        const key = matches[1].trim()
        const valuesStr = matches[2].trim()
        
        // 保持原始格式，包含值和来源的对应关系
        securityInfo[key] = {
          value: valuesStr, // 保持原始格式，在显示时再解析
          sources: [] // 在显示时从value中提取
        }
      }
    }
    
    return securityInfo
  } catch (error) {
    return {}
  }
}

/**
 * 解析磁盘FIO测试结果
 */
function parseDiskFioTest(section: string, errors: ParseError[]): DiskFioTest {
  const lines = section.split('\n').filter(line => line.trim() !== '')
  const tests: DiskFioTest['tests'] = []
  
  try {
    let currentBlockSizes: string[] = []
    let currentReadData: Array<{speed: number, iops: number}> = []
    let currentWriteData: Array<{speed: number, iops: number}> = []
    let currentTotalData: Array<{speed: number, iops: number}> = []
    
    for (const line of lines) {
      // 解析块大小表头行
      const blockSizeMatch = line.match(/Block Size\s*\|\s*([^|]+)\s*\|\s*([^|]+)/)
      if (blockSizeMatch) {
        // 如果之前有数据，先保存
        if (currentBlockSizes.length > 0 && currentReadData.length > 0) {
          for (let i = 0; i < Math.min(currentBlockSizes.length, 2); i++) {
            tests.push({
              blockSize: currentBlockSizes[i],
              read: currentReadData[i] || {speed: 0, iops: 0},
              write: currentWriteData[i] || {speed: 0, iops: 0},
              total: currentTotalData[i] || {speed: 0, iops: 0}
            })
          }
        }
        
        // 重置并提取新的块大小信息
        const size1 = blockSizeMatch[1].trim().replace(/\s*\(IOPS\)/, '')
        const size2 = blockSizeMatch[2].trim().replace(/\s*\(IOPS\)/, '')
        currentBlockSizes = [size1, size2]
        currentReadData = []
        currentWriteData = []
        currentTotalData = []
        continue
      }

      // 跳过分隔线和空行
      if (line.includes('------') || line.trim() === '' || line.includes('|') && !line.match(/\d/)) {
        continue
      }

      // 解析数据行
      const dataMatch = line.match(/(Read|Write|Total)\s*\|\s*([0-9.]+\s*[GM]?B\/s)\s*\(([0-9.]+k?)\)\s*\|\s*([0-9.]+\s*[GM]?B\/s)\s*\(([0-9.]+k?)\)/)
      if (dataMatch) {
        const operation = dataMatch[1]
        
        // 解析第一列数据
        const speed1Str = dataMatch[2]
        const speed1 = parseFloat(speed1Str) * (speed1Str.includes('GB') ? 1000 : 1)
        const iops1 = parseFloat(dataMatch[3].replace('k', '')) * (dataMatch[3].includes('k') ? 1000 : 1)
        
        // 解析第二列数据
        const speed2Str = dataMatch[4]
        const speed2 = parseFloat(speed2Str) * (speed2Str.includes('GB') ? 1000 : 1)
        const iops2 = parseFloat(dataMatch[5].replace('k', '')) * (dataMatch[5].includes('k') ? 1000 : 1)

        // 根据操作类型存储数据
        if (operation === 'Read') {
          currentReadData = [{speed: speed1, iops: iops1}, {speed: speed2, iops: iops2}]
        } else if (operation === 'Write') {
          currentWriteData = [{speed: speed1, iops: iops1}, {speed: speed2, iops: iops2}]
        } else if (operation === 'Total') {
          currentTotalData = [{speed: speed1, iops: iops1}, {speed: speed2, iops: iops2}]
        }
      }
    }

    // 处理最后一组数据
    if (currentBlockSizes.length > 0 && currentReadData.length > 0) {
      for (let i = 0; i < Math.min(currentBlockSizes.length, 2); i++) {
        tests.push({
          blockSize: currentBlockSizes[i],
          read: currentReadData[i] || {speed: 0, iops: 0},
          write: currentWriteData[i] || {speed: 0, iops: 0},
          total: currentTotalData[i] || {speed: 0, iops: 0}
        })
      }
    }

    return {
      tests
    }
  } catch (error) {
    errors.push({
      section: 'diskFioTest',
      message: '磁盘FIO测试结果解析失败',
      suggestion: '请检查磁盘FIO测试数据格式'
    })
    return {
      tests: []
    }
  }
}

/**
 * 解析流媒体解锁测试结果
 */
function parseStreamingTest(section: string, errors: ParseError[]): StreamingTest {
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

/**
 * 解析IP质量检测结果
 */
function parseIpQualityTest(section: string, errors: ParseError[]): IpQualityTest {
  try {
    // 解析数据库列表
    const databases = parseIpQualityDatabases(section)
    
    // 分离IPv4和IPv6部分
    const ipv4Section = section.substring(section.indexOf("IPV4:"), section.indexOf("IPV6:"))
    const ipv6Section = section.substring(section.indexOf("IPV6:"))

    // 解析带数据库来源的指标
    const parseMetricWithSources = (text: string, pattern: RegExp, isString = false): IpQualityMetric | null => {
      const match = text.match(pattern)
      if (!match) return null
      
      const value = isString ? match[1] : (match[1].includes('.') ? parseFloat(match[1]) : parseInt(match[1]))
      const sourcesStr = match[2] || ''
      const sources = parseDatabaseSources(sourcesStr)
      
      return {
        value,
        sources,
        rating: isString ? evaluateIpThreatLevel(match[1]) : evaluateIpRiskScore(typeof value === 'number' ? value : 0)
      }
    }

    const parseMetricWithDescription = (text: string, pattern: RegExp): IpQualityMetric | null => {
      const match = text.match(pattern)
      if (!match) return null
      
      const value = parseFloat(match[1])
      const description = match[2] || ''
      const sourcesStr = match[3] || ''
      const sources = parseDatabaseSources(sourcesStr)
      
      return {
        value,
        sources,
        description,
        rating: evaluateIpAbuseDescription(description)
      }
    }

    // 解析黑名单记录统计
    const blacklistStats = parseBlacklistStats(ipv4Section)
    
    // 解析安全信息
    const ipv4SecurityInfo = parseSecurityInfo(ipv4Section)
    const ipv6SecurityInfo = parseSecurityInfo(ipv6Section)

    // Google搜索可行性
    const googleSearchMatch = section.match(/Google搜索可行性：(\w+)/)
    const googleSearchViability = googleSearchMatch ? googleSearchMatch[1] === 'YES' : false

    return {
      databases,
      ipv4: {
        reputation: parseMetricWithSources(ipv4Section, /声誉\(越高越好\):\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        trustScore: parseMetricWithSources(ipv4Section, /信任得分\(越高越好\):\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        vpnScore: parseMetricWithSources(ipv4Section, /VPN得分\(越低越好\):\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        proxyScore: parseMetricWithSources(ipv4Section, /代理得分\(越低越好\):\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        communityVotesHarmless: parseMetricWithSources(ipv4Section, /社区投票-无害:\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        communityVotesMalicious: parseMetricWithSources(ipv4Section, /社区投票-恶意:\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        threatScore: parseMetricWithSources(ipv4Section, /威胁得分\(越低越好\):\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        fraudScore: parseMetricWithSources(ipv4Section, /欺诈得分\(越低越好\):\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        abuseScore: parseMetricWithSources(ipv4Section, /滥用得分\(越低越好\):\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        asnAbuseScore: parseMetricWithDescription(ipv4Section, /ASN滥用得分\(越低越好\):\s*([0-9.]+)\s*\(([^)]+)\)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        companyAbuseScore: parseMetricWithDescription(ipv4Section, /公司滥用得分\(越低越好\):\s*([0-9.]+)\s*\(([^)]+)\)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        threatLevel: parseMetricWithSources(ipv4Section, /威胁级别:\s*([a-z]+)\s*\[([^\]]+)\]/, true) || { value: 'unknown', sources: [] },
        
        blacklistStats,
        securityInfo: ipv4SecurityInfo
      },
      ipv6: {
        fraudScore: parseMetricWithSources(ipv6Section, /欺诈得分\(越低越好\):\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        abuseScore: parseMetricWithSources(ipv6Section, /滥用得分\(越低越好\):\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        asnAbuseScore: parseMetricWithDescription(ipv6Section, /ASN滥用得分\(越低越好\):\s*([0-9.]+)\s*\(([^)]+)\)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        companyAbuseScore: parseMetricWithDescription(ipv6Section, /公司滥用得分\(越低越好\):\s*([0-9.]+)\s*\(([^)]+)\)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        threatLevel: parseMetricWithSources(ipv6Section, /威胁级别:\s*([a-z]+)\s*\[([^\]]+)\]/, true) || undefined,
        securityInfo: ipv6SecurityInfo
      },
      googleSearchViability
    }
  } catch (error) {
    errors.push({
      section: 'ipQualityTest',
      message: 'IP质量检测结果解析失败',
      suggestion: '请检查IP质量检测数据格式'
    })
    throw error
  }
}

/**
 * 解析邮件端口检测结果
 */
function parseEmailPortTest(section: string, errors: ParseError[]): EmailPortTest {
  const lines = section.split('\n').filter(line => line.trim() !== '')
  const platforms: EmailPortTest['platforms'] = []

  try {
    // 找到表头行
    const headerIndex = lines.findIndex(line => 
      line.includes("Platform") && line.includes("SMTP")
    )

    if (headerIndex !== -1) {
      // 处理每个平台行
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line.includes("✔") && !line.includes("✘")) break

        const parts = line.split(/\s+/).filter(part => part.trim() !== "")
        if (parts.length >= 7) {
          platforms.push({
            name: parts[0],
            smtp: parts[1] === "✔",
            smtps: parts[2] === "✔",
            pop3: parts[3] === "✔",
            pop3s: parts[4] === "✔",
            imap: parts[5] === "✔",
            imaps: parts[6] === "✔"
          })
        }
      }
    }

    return { platforms }
  } catch (error) {
    errors.push({
      section: 'emailPortTest',
      message: '邮件端口检测结果解析失败',
      suggestion: '请检查邮件端口检测数据格式'
    })
    return { platforms: [] }
  }
}

/**
 * 解析三网回程测试结果
 */
function parseNetworkReturnTest(section: string, errors: ParseError[]): NetworkReturnTest {
  // 使用优化的解析函数
  return parseNetworkReturnTestOptimized(section, errors)
}

/**
 * 解析回程路由测试结果
 */
function parseRouteTest(section: string, errors: ParseError[]): RouteTest {
  const lines = section.split('\n').filter(line => line.trim() !== '')
  const routes: RouteTest['routes'] = []

  try {
    // 找到nexttrace回程路由部分的开始
    const routeStartIndex = lines.findIndex(line => 
      line.includes('回程路由--基于nexttrace开源') || 
      line.includes('依次测试电信/联通/移动经过的地区及线路')
    )
    
    // 只处理nexttrace回程路由部分的数据
    const routeLines = routeStartIndex !== -1 ? lines.slice(routeStartIndex) : []

    let currentDestination = ''
    let currentTargetIp = ''
    let currentHops: RouteHop[] = []
    let hopNumber = 0

    for (const line of routeLines) {
      // 跳过标题行和说明行
      if (line.includes('回程路由--基于nexttrace开源') || 
          line.includes('依次测试电信/联通/移动经过的地区及线路') ||
          line.includes('核心程序来自nexttrace')) {
        continue
      }

      // 检测目标地址行 - 格式：广州电信 58.60.188.222
      const targetMatch = line.match(/^(.*?[电信联通移动].*?)\s+(\d+\.\d+\.\d+\.\d+)$/)
      if (targetMatch) {
        // 保存前一个路由
        if (currentDestination && currentHops.length > 0) {
          const summary = generateRouteSummary(currentHops)
          routes.push({
            destination: currentDestination,
            targetIp: currentTargetIp,
            hops: currentHops,
            summary
          })
        }

        // 开始新的路由
        currentDestination = targetMatch[1].trim()
        currentTargetIp = targetMatch[2].trim()
        currentHops = []
        hopNumber = 0
        continue
      }

      // 解析路由跳点行 - 格式：0.27 ms AS215304 日本 东京都 东京 lain.sh
      const hopMatch = line.match(/^(\d+\.\d+)\s*ms\s+(.*)$/)
      if (hopMatch) {
        hopNumber++
        const latency = hopMatch[1] + ' ms'
        const hopInfo = hopMatch[2].trim()
        
        const hop = parseRouteHop(hopNumber, latency, hopInfo, line)
        currentHops.push(hop)
      }
    }

    // 处理最后一个路由
    if (currentDestination && currentHops.length > 0) {
      const summary = generateRouteSummary(currentHops)
      routes.push({
        destination: currentDestination,
        targetIp: currentTargetIp,
        hops: currentHops,
        summary
      })
    }

    return { routes }
  } catch (error) {
    errors.push({
      section: 'routeTest',
      message: '回程路由测试结果解析失败',
      suggestion: '请检查回程路由测试数据格式'
    })
    return { routes: [] }
  }
}

/**
 * 解析单个路由跳点
 */
function parseRouteHop(hopNumber: number, latency: string, hopInfo: string, rawLine: string): RouteHop {
  // 检查是否为私有地址
  const isPrivate = hopInfo.includes('RFC1918') || hopInfo.includes('RFC6598') || hopInfo.startsWith('*')
  
  // 解析ASN信息
  const asnMatch = hopInfo.match(/AS(\d+)/)
  const asn = asnMatch ? `AS${asnMatch[1]}` : undefined
  
  // 解析ASN名称（方括号中的内容）
  const asnNameMatch = hopInfo.match(/\[([^\]]+)\]/)
  const asnName = asnNameMatch ? asnNameMatch[1] : undefined
  
  // 解析地理位置
  let location = ''
  if (isPrivate) {
    location = '私有地址'
  } else {
    // 提取地理位置信息
    const locationParts: string[] = []
    const parts = hopInfo.split(/\s+/)
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      // 跳过ASN、方括号内容和域名
      if (part.startsWith('AS') || part.includes('[') || part.includes('.')) {
        continue
      }
      // 收集地理位置信息
      if (part.match(/^[^\d\[\]]+$/)) {
        locationParts.push(part)
      }
    }
    location = locationParts.join(' ')
  }
  
  // 解析服务提供商
  const providerMatch = hopInfo.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  const provider = providerMatch ? providerMatch[1] : undefined
  
  return {
    hopNumber,
    latency,
    asn,
    asnName,
    location: location || '未知',
    provider,
    isPrivate,
    rawLine
  }
}

/**
 * 生成路由摘要信息
 */
function generateRouteSummary(hops: RouteHop[]): {
  totalHops: number
  finalLatency: number
  keyNodes: string[]
  routeQuality: 'excellent' | 'good' | 'average' | 'poor'
  hasChineseNodes: boolean
} {
  const totalHops = hops.length
  
  // 获取最终延迟（最后一跳的延迟，即到达目标的总延迟）
  const finalLatency = hops.length > 0 ? 
    parseFloat(hops[hops.length - 1].latency.replace(' ms', '')) || 0 : 0
  
  // 提取关键节点（重要的ASN节点）
  const keyNodes: string[] = []
  let hasChineseNodes = false
  
  for (const hop of hops) {
    if (hop.asnName && !hop.isPrivate) {
      // 检查是否有中国节点
      if (hop.location.includes('中国')) {
        hasChineseNodes = true
      }
      
      // 只收集重要的网络节点
      if (hop.asnName.includes('CHINANET') || 
          hop.asnName.includes('UNICOM') || 
          hop.asnName.includes('CMNET') ||
          hop.asnName.includes('CMI') ||
          hop.asnName.includes('CN2') ||
          hop.asnName.includes('CMIN2')) {
        keyNodes.push(`${hop.asnName} (${hop.location})`)
      }
    }
  }
  
  // 评估路由质量（基于最终延迟和跳数）
  let routeQuality: 'excellent' | 'good' | 'average' | 'poor' = 'average'
  
  if (finalLatency < 100 && totalHops < 10) {
    routeQuality = 'excellent'
  } else if (finalLatency < 200 && totalHops < 15) {
    routeQuality = 'good'
  } else if (finalLatency < 300 && totalHops < 20) {
    routeQuality = 'average'
  } else {
    routeQuality = 'poor'
  }
  
  return {
    totalHops,
    finalLatency,
    keyNodes: keyNodes.slice(0, 3), // 只显示前3个关键节点
    routeQuality,
    hasChineseNodes
  }
}

/**
 * 解析速度测试结果
 */
function parseSpeedTest(section: string, errors: ParseError[]): SpeedTest {
  const lines = section.split('\n').filter(line => line.trim() !== '')
  const nodes: SpeedTest['nodes'] = []

  try {
    // 找到表头行
    const headerIndex = lines.findIndex(line => 
      line.includes("位置") && line.includes("上传速度")
    )

    if (headerIndex !== -1) {
      // 处理每个测速节点行
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (line.startsWith("-----") || line === "") continue
        
        // 使用正则表达式匹配测速数据
        const speedMatch = line.match(/^(.+?)\s+([0-9.]+Mbps)\s+([0-9.]+Mbps)\s+([0-9.]+ms)/)
        if (speedMatch) {
          nodes.push({
            location: speedMatch[1].trim(),
            uploadSpeed: speedMatch[2],
            downloadSpeed: speedMatch[3],
            latency: speedMatch[4]
          })
        }
      }
    }

    return { nodes }
  } catch (error) {
    errors.push({
      section: 'speedTest',
      message: '速度测试结果解析失败',
      suggestion: '请检查速度测试数据格式'
    })
    return { nodes: [] }
  }
}

/**
 * 解析元数据信息
 */
function parseMetadata(input: string, errors: ParseError[]) {
  try {
    const timeMatch = input.match(/时间\s*[:：]\s*(.+)/)
    const durationMatch = input.match(/总共花费\s*[:：]\s*(.+)/)
    const versionMatch = input.match(/VPS融合怪版本[：:]\s*(.+)/)

    return {
      testTime: timeMatch ? timeMatch[1].trim() : '未知',
      totalDuration: durationMatch ? durationMatch[1].trim() : '未知',
      version: versionMatch ? versionMatch[1].trim() : '未知'
    }
  } catch (error) {
    errors.push({
      section: 'metadata',
      message: '元数据解析失败',
      suggestion: '请检查测试时间和版本信息'
    })
    return {
      testTime: '未知',
      totalDuration: '未知',
      version: '未知'
    }
  }
}