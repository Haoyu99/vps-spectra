import type { 
  IpQualityTest, 
  EmailPortTest, 
  NetworkReturnTest, 
  RouteTest, 
  SpeedTest,
  ParseError,
  DatabaseSource,
  IpQualityMetric,
  BlacklistStats,
  SecurityInfo,
  RouteHop
} from '@/types'
import {
  evaluateIpReputation,
  evaluateIpTrust,
  evaluateIpRiskScore,
  evaluateIpThreatLevel,
  evaluateIpAbuseDescription
} from '@/lib/evaluators'


/**
 * 网络测试解析器
 * 负责解析IP质量检测、邮件端口检测、三网回程、回程路由等网络相关测试
 */

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
    'dkly': 'https://data.dkly.net/',
    'ipqualityscore': 'https://www.ipqualityscore.com/',
    'ipintel': 'https://check.getipintel.net/',
    'ipfighter': 'https://ipfighter.com/',
    'fraudlogix': 'https://fraudlogix.com/'
  }
  
  // 解析数据库行，格式如：ipinfo数据库  [0] | scamalytics数据库 [1] | ...
  const dbLines = dbSection.split('\n').filter(line => line.includes('[') && line.includes(']'))
  
  for (const line of dbLines) {
    // 匹配格式：数据库名 [编号]，支持更灵活的匹配
    const matches = line.match(/([^|\[\]]+)数据库\s*\[([0-9A-Z])\]/g)
    if (matches) {
      for (const match of matches) {
        const dbMatch = match.match(/([^|\[\]]+)数据库\s*\[([0-9A-Z])\]/)
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
    return getDefaultDatabases()
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
    'ipqualityscore': '综合IP质量评分',
    'ipintel': 'IP代理和VPN检测',
    'ipfighter': 'IP欺诈和风险评估',
    'fraudlogix': 'IP欺诈检测服务'
  }
  return descriptions[dbKey] || '未知数据库'
}

/**
 * 获取默认数据库列表
 */
function getDefaultDatabases(): DatabaseSource[] {
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
    { id: 'D', name: 'dkly数据库', url: 'https://data.dkly.net/', description: 'IP威胁情报' },
    { id: 'E', name: 'ipqualityscore数据库', url: 'https://www.ipqualityscore.com/', description: '综合IP质量评分' },
    { id: 'F', name: 'ipintel数据库', url: 'https://check.getipintel.net/', description: 'IP代理和VPN检测' },
    { id: 'G', name: 'ipfighter数据库', url: 'https://ipfighter.com/', description: 'IP欺诈和风险评估' },
    { id: 'H', name: 'fraudlogix数据库', url: 'https://fraudlogix.com/', description: 'IP欺诈检测服务' }
  ]
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
 * 解析威胁级别（支持多个值和来源）
 * 例如：威胁级别: Low [H] low [9]
 */
function parseThreatLevel(text: string): IpQualityMetric | null {
  const match = text.match(/威胁级别:\s*(.+)/)
  if (!match) return null
  
  const content = match[1].trim()
  
  // 匹配所有的 "值 [来源]" 对，支持忽略大小写
  const valueSourcePairs = content.matchAll(/([a-zA-Z]+)\s*\[([^\]]+)\]/gi)
  
  const allSources: string[] = []
  const allValues: string[] = []
  
  for (const pair of valueSourcePairs) {
    const value = pair[1].toLowerCase() // 统一转为小写进行比较
    const sources = parseDatabaseSources(pair[2])
    
    allValues.push(value)
    allSources.push(...sources)
  }
  
  if (allValues.length === 0) {
    return { value: 'unknown', sources: [] }
  }
  
  // 使用第一个值作为主要值（或者可以选择最严重的）
  const primaryValue = allValues[0]
  
  return {
    value: primaryValue,
    sources: allSources,
    rating: evaluateIpThreatLevel(primaryValue)
  }
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
 * 解析IP质量检测结果
 * @param section IP质量检测文本段落
 * @param errors 错误收集数组
 * @returns 解析后的IP质量检测结果
 */
export function parseIpQualityTest(section: string, errors: ParseError[]): IpQualityTest {
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

    // 解析IPv6的DNS黑名单
    const ipv6DnsMatch = ipv6Section.match(/DNS-黑名单:\s*(\d+)\(Total_Check\)\s*(\d+)\(Clean\)\s*(\d+)\(Blacklisted\)\s*(\d+)\(Other\)/)
    const ipv6DnsBlacklist = ipv6DnsMatch ? {
      totalChecked: parseInt(ipv6DnsMatch[1]),
      clean: parseInt(ipv6DnsMatch[2]),
      blacklisted: parseInt(ipv6DnsMatch[3]),
      other: parseInt(ipv6DnsMatch[4])
    } : undefined

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
        threatLevel: parseThreatLevel(ipv4Section) || { value: 'unknown', sources: [] },
        
        blacklistStats,
        securityInfo: ipv4SecurityInfo
      },
      ipv6: {
        fraudScore: parseMetricWithSources(ipv6Section, /欺诈得分\(越低越好\):\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        abuseScore: parseMetricWithSources(ipv6Section, /滥用得分\(越低越好\):\s*([0-9.]+)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        asnAbuseScore: parseMetricWithDescription(ipv6Section, /ASN滥用得分\(越低越好\):\s*([0-9.]+)\s*\(([^)]+)\)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        companyAbuseScore: parseMetricWithDescription(ipv6Section, /公司滥用得分\(越低越好\):\s*([0-9.]+)\s*\(([^)]+)\)\s*\[([^\]]+)\]/) || { value: 0, sources: [] },
        threatLevel: parseThreatLevel(ipv6Section) || undefined,
        securityInfo: ipv6SecurityInfo,
        dnsBlacklist: ipv6DnsBlacklist
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
 * @param section 邮件端口检测文本段落
 * @param errors 错误收集数组
 * @returns 解析后的邮件端口检测结果
 */
export function parseEmailPortTest(section: string, errors: ParseError[]): EmailPortTest {
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
 * @param section 三网回程测试文本段落
 * @param errors 错误收集数组
 * @returns 解析后的三网回程测试结果
 */
export function parseNetworkReturnTest(section: string, errors: ParseError[]): NetworkReturnTest {
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
 * 解析回程路由测试结果
 * @param section 回程路由测试文本段落
 * @param errors 错误收集数组
 * @returns 解析后的回程路由测试结果
 */
export function parseRouteTest(section: string, errors: ParseError[]): RouteTest {
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
 * 解析速度测试结果
 * @param section 速度测试文本段落
 * @param errors 错误收集数组
 * @returns 解析后的速度测试结果
 */
export function parseSpeedTest(section: string, errors: ParseError[]): SpeedTest {
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