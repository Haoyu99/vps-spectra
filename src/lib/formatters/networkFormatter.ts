import type { 
  IpQualityTest, 
  EmailPortTest, 
  NetworkReturnTest, 
  RouteTest, 
  SpeedTest,
  MarkdownOptions,
  DatabaseSource 
} from '@/types'

/**
 * 网络测试格式化器
 * 负责将网络测试结果格式化为Markdown
 */

/**
 * 生成网络测试部分
 */
export function generateNetworkTests(
  ipQualityTest: IpQualityTest,
  emailPortTest: EmailPortTest,
  networkReturnTest: NetworkReturnTest,
  routeTest: RouteTest,
  speedTest: SpeedTest,
  options: MarkdownOptions
): string {
  let section = '## 🌐 网络测试\n\n'

  // IP质量检测
  section += '### 🔍 IP 质量检测\n\n'
  section += generateIpQualitySection(ipQualityTest, options)

  // 邮件端口检测
  section += '### 📧 邮件端口检测\n\n'
  section += generateEmailPortSection(emailPortTest, options)

  // 三网回程
  section += '### 🔄 三网回程\n\n'
  section += generateNetworkReturnSection(networkReturnTest, options)

  // 回程路由
  section += '### 🛣️ 回程路由\n\n'
  section += generateRouteSection(routeTest, options)

  // 速度测试
  section += '### ⚡ 速度测试\n\n'
  section += generateSpeedTests(speedTest, options)

  return section
}

/**
 * 获取IP质量检测数据库列表（根据测试用例的编号系统）
 */
function getIpQualityDatabases(): DatabaseSource[] {
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
    { id: 'E', name: 'ipqualityscore数据库', url: 'https://www.ipqualityscore.com/', description: '综合IP质量评分' },
    { id: 'F', name: 'ipintel数据库', url: 'https://check.getipintel.net/', description: 'IP代理和VPN检测' },
    { id: 'G', name: 'ipfighter数据库', url: 'https://ipfighter.com/', description: 'IP欺诈和风险评估' },
    { id: 'H', name: 'fraudlogix数据库', url: 'https://fraudlogix.com/', description: 'IP欺诈检测服务' }
  ]
}

/**
 * 生成安全信息的带角标显示
 */
function generateSecurityInfoWithSuperscripts(info: {value: string, sources: string[]}, databases: DatabaseSource[]): string {
  // 如果value已经包含多个结果和来源，需要重新解析
  if (info.value.includes('[') && info.value.includes(']')) {
    // 解析格式：值1 [来源1] 值2 [来源2] ...
    const results: string[] = []
    const matches = info.value.match(/([^[\]]+)\s*\[([^\]]+)\]/g)
    
    if (matches) {
      for (const match of matches) {
        const valueSourceMatch = match.match(/([^[\]]+)\s*\[([^\]]+)\]/)
        if (valueSourceMatch) {
          const value = valueSourceMatch[1].trim()
          const sources = parseDatabaseSources(valueSourceMatch[2])
          const superscripts = sources.map(s => `<sup>[${s}]</sup>`).join('')
          results.push(`${value}${superscripts}`)
        }
      }
      return results.join(', ')
    }
  }
  
  // 如果是简单的值，直接添加角标
  const superscripts = info.sources.map(s => `<sup>[${s}]</sup>`).join('')
  return `${info.value}${superscripts}`
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
 * 生成IP质量检测部分
 */
function generateIpQualitySection(ipQualityTest: IpQualityTest, options: MarkdownOptions): string {
  let section = ''
  const databases = ipQualityTest.databases || getIpQualityDatabases()

  // 添加注意事项和说明
  if (options.useObsidianCallouts) {
    section += '> [!warning] 重要提醒\n'
    section += '> **数据仅作参考，不代表100%准确！** 基于15个数据库检测，不同数据库算法和更新频率不同，建议综合多个来源判断。表格编号对应下方数据库列表。\n\n'
  } else {
    section += '**⚠️ 重要提醒：** 数据仅作参考，不代表100%准确！基于15个数据库检测，建议综合多个来源判断。\n\n'
  }

  // 数据库列表
  section += '#### 📊 数据库来源列表\n\n'
  section += '| 编号 | 数据库名称 | 描述 |\n'
  section += '| --- | --- | --- |\n'
  for (const db of databases) {
    section += `| ${db.id} | [${db.name}](${db.url}) | ${db.description} |\n`
  }
  section += '\n'

  // IPv4部分
  section += '#### 🌐 IPv4 质量检测\n\n'
  
  // 安全得分
  section += '##### 安全得分\n\n'
  section += '| 检测指标 | 检测结果 | 评级 |\n'
  section += '| --- | --- | --- |\n'
  
  if (ipQualityTest.ipv4.reputation) {
    const superscripts = ipQualityTest.ipv4.reputation.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 声誉 (越高越好) | ${ipQualityTest.ipv4.reputation.value}${superscripts} | ${ipQualityTest.ipv4.reputation.rating?.emoji || ''} ${ipQualityTest.ipv4.reputation.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv4.trustScore) {
    const superscripts = ipQualityTest.ipv4.trustScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 信任得分 (越高越好) | ${ipQualityTest.ipv4.trustScore.value}${superscripts} | ${ipQualityTest.ipv4.trustScore.rating?.emoji || ''} ${ipQualityTest.ipv4.trustScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv4.vpnScore) {
    const superscripts = ipQualityTest.ipv4.vpnScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| VPN得分 (越低越好) | ${ipQualityTest.ipv4.vpnScore.value}${superscripts} | ${ipQualityTest.ipv4.vpnScore.rating?.emoji || ''} ${ipQualityTest.ipv4.vpnScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv4.proxyScore) {
    const superscripts = ipQualityTest.ipv4.proxyScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 代理得分 (越低越好) | ${ipQualityTest.ipv4.proxyScore.value}${superscripts} | ${ipQualityTest.ipv4.proxyScore.rating?.emoji || ''} ${ipQualityTest.ipv4.proxyScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv4.communityVotesHarmless) {
    const superscripts = ipQualityTest.ipv4.communityVotesHarmless.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 社区投票-无害 | ${ipQualityTest.ipv4.communityVotesHarmless.value}${superscripts} | - |\n`
  }
  if (ipQualityTest.ipv4.communityVotesMalicious) {
    const superscripts = ipQualityTest.ipv4.communityVotesMalicious.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 社区投票-恶意 | ${ipQualityTest.ipv4.communityVotesMalicious.value}${superscripts} | - |\n`
  }
  if (ipQualityTest.ipv4.threatScore) {
    const superscripts = ipQualityTest.ipv4.threatScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 威胁得分 (越低越好) | ${ipQualityTest.ipv4.threatScore.value}${superscripts} | ${ipQualityTest.ipv4.threatScore.rating?.emoji || ''} ${ipQualityTest.ipv4.threatScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv4.fraudScore) {
    const superscripts = ipQualityTest.ipv4.fraudScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 欺诈得分 (越低越好) | ${ipQualityTest.ipv4.fraudScore.value}${superscripts} | ${ipQualityTest.ipv4.fraudScore.rating?.emoji || ''} ${ipQualityTest.ipv4.fraudScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv4.abuseScore) {
    const superscripts = ipQualityTest.ipv4.abuseScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 滥用得分 (越低越好) | ${ipQualityTest.ipv4.abuseScore.value}${superscripts} | ${ipQualityTest.ipv4.abuseScore.rating?.emoji || ''} ${ipQualityTest.ipv4.abuseScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv4.asnAbuseScore) {
    const asnDesc = ipQualityTest.ipv4.asnAbuseScore.description ? ` (${ipQualityTest.ipv4.asnAbuseScore.description})` : ''
    const superscripts = ipQualityTest.ipv4.asnAbuseScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| ASN滥用得分 (越低越好) | ${ipQualityTest.ipv4.asnAbuseScore.value}${asnDesc}${superscripts} | ${ipQualityTest.ipv4.asnAbuseScore.rating?.emoji || ''} ${ipQualityTest.ipv4.asnAbuseScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv4.companyAbuseScore) {
    const companyDesc = ipQualityTest.ipv4.companyAbuseScore.description ? ` (${ipQualityTest.ipv4.companyAbuseScore.description})` : ''
    const superscripts = ipQualityTest.ipv4.companyAbuseScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 公司滥用得分 (越低越好) | ${ipQualityTest.ipv4.companyAbuseScore.value}${companyDesc}${superscripts} | ${ipQualityTest.ipv4.companyAbuseScore.rating?.emoji || ''} ${ipQualityTest.ipv4.companyAbuseScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv4.threatLevel) {
    const superscripts = ipQualityTest.ipv4.threatLevel.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 威胁级别 | ${ipQualityTest.ipv4.threatLevel.value}${superscripts} | ${ipQualityTest.ipv4.threatLevel.rating?.emoji || ''} ${ipQualityTest.ipv4.threatLevel.rating?.description || ''} |\n`
  }
  section += '\n'

  // IPv4 黑名单记录统计
  if (ipQualityTest.ipv4.blacklistStats) {
    section += '##### 黑名单记录统计\n\n'
    section += '| 记录类型 | 检测结果 |\n'
    section += '| --- | --- |\n'
    
    const harmlessSuperscripts = ipQualityTest.ipv4.blacklistStats.harmlessCount.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 无害记录数 | ${ipQualityTest.ipv4.blacklistStats.harmlessCount.value}${harmlessSuperscripts} |\n`
    
    const maliciousSuperscripts = ipQualityTest.ipv4.blacklistStats.maliciousCount.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 恶意记录数 | ${ipQualityTest.ipv4.blacklistStats.maliciousCount.value}${maliciousSuperscripts} |\n`
    
    const suspiciousSuperscripts = ipQualityTest.ipv4.blacklistStats.suspiciousCount.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 可疑记录数 | ${ipQualityTest.ipv4.blacklistStats.suspiciousCount.value}${suspiciousSuperscripts} |\n`
    
    const undetectedSuperscripts = ipQualityTest.ipv4.blacklistStats.undetectedCount.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 无记录数 | ${ipQualityTest.ipv4.blacklistStats.undetectedCount.value}${undetectedSuperscripts} |\n`
    
    if (ipQualityTest.ipv4.blacklistStats.totalChecked > 0) {
      section += `| DNS黑名单统计 | 总检查:${ipQualityTest.ipv4.blacklistStats.totalChecked} Clean:${ipQualityTest.ipv4.blacklistStats.cleanCount} Blacklisted:${ipQualityTest.ipv4.blacklistStats.blacklistedCount} Other:${ipQualityTest.ipv4.blacklistStats.otherCount} |\n`
    }
    section += '\n'
  }

  // IPv4 安全信息
  if (Object.keys(ipQualityTest.ipv4.securityInfo).length > 0) {
    section += '##### 安全信息\n\n'
    section += '| 检测项目 | 检测结果 |\n'
    section += '| --- | --- |\n'
    
    for (const [key, info] of Object.entries(ipQualityTest.ipv4.securityInfo)) {
      const resultWithSuperscripts = generateSecurityInfoWithSuperscripts(info, databases)
      section += `| ${key} | ${resultWithSuperscripts} |\n`
    }
    section += '\n'
  }

  // IPv6部分
  // Check if there are meaningful IPv6 results to display
  const hasIpv6Results = ipQualityTest.ipv6 && ipQualityTest.ipv6.abuseScore && ipQualityTest.ipv6.abuseScore.sources.length > 0;

  if (hasIpv6Results) {
    section += '#### 🌍 IPv6 质量检测\n\n';
    section += '##### 安全得分\n\n';
    section += '| 检测指标 | 检测结果 | 评级 |\n';
    section += '| --- | --- | --- |\n';

    // ... (rest of the IPv6 formatting logic)
  }

  
  if (ipQualityTest.ipv6.fraudScore) {
    const superscripts = ipQualityTest.ipv6.fraudScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 欺诈得分 (越低越好) | ${ipQualityTest.ipv6.fraudScore.value}${superscripts} | ${ipQualityTest.ipv6.fraudScore.rating?.emoji || ''} ${ipQualityTest.ipv6.fraudScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv6.abuseScore) {
    const superscripts = ipQualityTest.ipv6.abuseScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 滥用得分 (越低越好) | ${ipQualityTest.ipv6.abuseScore.value}${superscripts} | ${ipQualityTest.ipv6.abuseScore.rating?.emoji || ''} ${ipQualityTest.ipv6.abuseScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv6.asnAbuseScore) {
    const asnDesc = ipQualityTest.ipv6.asnAbuseScore.description ? ` (${ipQualityTest.ipv6.asnAbuseScore.description})` : ''
    const superscripts = ipQualityTest.ipv6.asnAbuseScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| ASN滥用得分 (越低越好) | ${ipQualityTest.ipv6.asnAbuseScore.value}${asnDesc}${superscripts} | ${ipQualityTest.ipv6.asnAbuseScore.rating?.emoji || ''} ${ipQualityTest.ipv6.asnAbuseScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv6.companyAbuseScore) {
    const companyDesc = ipQualityTest.ipv6.companyAbuseScore.description ? ` (${ipQualityTest.ipv6.companyAbuseScore.description})` : ''
    const superscripts = ipQualityTest.ipv6.companyAbuseScore.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 公司滥用得分 (越低越好) | ${ipQualityTest.ipv6.companyAbuseScore.value}${companyDesc}${superscripts} | ${ipQualityTest.ipv6.companyAbuseScore.rating?.emoji || ''} ${ipQualityTest.ipv6.companyAbuseScore.rating?.description || ''} |\n`
  }
  if (ipQualityTest.ipv6.threatLevel) {
    const superscripts = ipQualityTest.ipv6.threatLevel.sources.map(s => `<sup>[${s}]</sup>`).join('')
    section += `| 威胁级别 | ${ipQualityTest.ipv6.threatLevel.value}${superscripts} | ${ipQualityTest.ipv6.threatLevel.rating?.emoji || ''} ${ipQualityTest.ipv6.threatLevel.rating?.description || ''} |\n`
  }
  
  // 将Google搜索可行性并入IPv6检测
  section += `| Google搜索可行性 | ${ipQualityTest.googleSearchViability ? '✅ 可用' : '❌ 不可用'} | - |\n`
  section += '\n'

  // IPv6 DNS黑名单统计
  if (ipQualityTest.ipv6.dnsBlacklist && ipQualityTest.ipv6.dnsBlacklist.totalChecked > 0) {
    section += '##### DNS黑名单统计\n\n'
    section += '| 统计项 | 数值 |\n'
    section += '| --- | --- |\n'
    section += `| 总检查数 | ${ipQualityTest.ipv6.dnsBlacklist.totalChecked} |\n`
    section += `| Clean | ${ipQualityTest.ipv6.dnsBlacklist.clean} |\n`
    section += `| Blacklisted | ${ipQualityTest.ipv6.dnsBlacklist.blacklisted} |\n`
    section += `| Other | ${ipQualityTest.ipv6.dnsBlacklist.other} |\n`
    section += '\n'
  }

  // IPv6 安全信息
  if (Object.keys(ipQualityTest.ipv6.securityInfo).length > 0) {
    section += '##### 安全信息\n\n'
    section += '| 检测项目 | 检测结果 |\n'
    section += '| --- | --- |\n'
    
    for (const [key, info] of Object.entries(ipQualityTest.ipv6.securityInfo)) {
      const resultWithSuperscripts = generateSecurityInfoWithSuperscripts(info, databases)
      section += `| ${key} | ${resultWithSuperscripts} |\n`
    }
    section += '\n'
  }

  return section
}

/**
 * 生成邮件端口检测部分
 */
function generateEmailPortSection(emailPortTest: EmailPortTest, options: MarkdownOptions): string {
  let section = ''

  if (emailPortTest.platforms.length > 0) {
    section += '| 平台 | SMTP | SMTPS | POP3 | POP3S | IMAP | IMAPS |\n'
    section += '| --- | --- | --- | --- | --- | --- | --- |\n'

    for (const platform of emailPortTest.platforms) {
      section += `| ${platform.name} | ${platform.smtp ? '✅' : '❌'} | ${platform.smtps ? '✅' : '❌'} | `
      section += `${platform.pop3 ? '✅' : '❌'} | ${platform.pop3s ? '✅' : '❌'} | `
      section += `${platform.imap ? '✅' : '❌'} | ${platform.imaps ? '✅' : '❌'} |\n`
    }
    section += '\n'
  }

  return section
}

/**
 * 生成三网回程部分
 */
function generateNetworkReturnSection(networkReturnTest: NetworkReturnTest, options: MarkdownOptions): string {
  let section = ''

  // 添加说明信息
  if (options.useObsidianCallouts) {
    section += '> [!info] 三网回程说明\n'
    section += '> 检测当前服务器到国内三大运营商的网络回程路由情况\n'
    section += '> **线路质量：** CN2GIA > CN2GT > 163骨干网 > 普通线路\n'
    section += '> **检测目标：** 默认检测到广州的回程路由\n\n'
  } else {
    section += '**三网回程说明：**\n'
    section += '- 检测当前服务器到国内三大运营商的网络回程路由情况\n'
    section += '- **线路质量：** CN2GIA > CN2GT > 163骨干网 > 普通线路\n'
    section += '- **检测目标：** 默认检测到广州的回程路由\n\n'
  }

  // 电信回程
  if (networkReturnTest.telecom.length > 0) {
    section += '#### 📡 电信回程\n\n'
    section += '| 目标地址 | IP地址 | 线路类型 | 线路质量 |\n'
    section += '| --- | --- | --- | --- |\n'
    for (const entry of networkReturnTest.telecom) {
      const parsed = parseNetworkReturnLine(entry)
      const quality = evaluateLineQuality(parsed.info)
      section += `| ${parsed.target} | ${parsed.ip} | ${parsed.info} | ${quality} |\n`
    }
    section += '\n'
  }

  // 联通回程
  if (networkReturnTest.unicom.length > 0) {
    section += '#### 📶 联通回程\n\n'
    section += '| 目标地址 | IP地址 | 线路类型 | 线路质量 |\n'
    section += '| --- | --- | --- | --- |\n'
    for (const entry of networkReturnTest.unicom) {
      const parsed = parseNetworkReturnLine(entry)
      const quality = evaluateLineQuality(parsed.info)
      section += `| ${parsed.target} | ${parsed.ip} | ${parsed.info} | ${quality} |\n`
    }
    section += '\n'
  }

  // 移动回程
  if (networkReturnTest.mobile.length > 0) {
    section += '#### 📱 移动回程\n\n'
    section += '| 目标地址 | IP地址 | 线路类型 | 线路质量 |\n'
    section += '| --- | --- | --- | --- |\n'
    for (const entry of networkReturnTest.mobile) {
      const parsed = parseNetworkReturnLine(entry)
      const quality = evaluateLineQuality(parsed.info)
      section += `| ${parsed.target} | ${parsed.ip} | ${parsed.info} | ${quality} |\n`
    }
    section += '\n'
  }

  return section
}

/**
 * 解析单条回程线路信息
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

/**
 * 评估线路质量
 */
function evaluateLineQuality(lineInfo: string): string {
  const lowerInfo = lineInfo.toLowerCase()
  
  if (lowerInfo.includes('cn2gia') || lowerInfo.includes('cn2 gia')) {
    return '🚀 优质 (CN2GIA)'
  } else if (lowerInfo.includes('cn2gt') || lowerInfo.includes('cn2 gt')) {
    return '✅ 良好 (CN2GT)'
  } else if (lowerInfo.includes('cmin2')) {
    return '✅ 良好 (CMIN2)'
  } else if (lowerInfo.includes('9929')) {
    return '✅ 良好 (联通9929)'
  } else if (lowerInfo.includes('163')) {
    return '⚠️ 一般 (163骨干网)'
  } else if (lowerInfo.includes('4837')) {
    return '⚠️ 一般 (联通4837)'
  } else if (lowerInfo.includes('cmi')) {
    return '⚠️ 一般 (移动CMI)'
  } else if (lowerInfo.includes('普通') || lowerInfo.includes('一般')) {
    return '📋 普通线路'
  } else if (lowerInfo.includes('优质') || lowerInfo.includes('premium')) {
    return '🚀 优质线路'
  } else {
    return '📋 未知线路'
  }
}

/**
 * 生成回程路由部分
 */
function generateRouteSection(routeTest: RouteTest, options: MarkdownOptions): string {
  let section = ''

  // 添加说明信息
  if (options.useObsidianCallouts) {
    section += '> [!info] 回程路由说明\n'
    section += '> 基于 nexttrace 工具检测到国内三大运营商的详细路由路径\n'
    section += '> **延迟含义：** 每行显示的是从源点到该跳点的累计延迟时间\n'
    section += '> **关键指标：** 最终延迟（到达目标总时间）、跳数、关键网络节点\n\n'
  } else {
    section += '**回程路由说明：**\n'
    section += '- 基于 nexttrace 工具检测到国内三大运营商的详细路由路径\n'
    section += '- **延迟含义：** 每行显示的是从源点到该跳点的累计延迟时间\n'
    section += '- **关键指标：** 最终延迟（到达目标总时间）、跳数、关键网络节点\n\n'
  }

  // 路由摘要表格
  if (routeTest.routes.length > 0) {
    section += '#### 📊 路由摘要\n\n'
    section += '| 目标 | 目标IP | 总跳数 | 最终延迟 | 路由质量 | 关键节点 |\n'
    section += '| --- | --- | --- | --- | --- | --- |\n'
    
    for (const route of routeTest.routes) {
      const qualityIcon = getRouteQualityIcon(route.summary.routeQuality)
      const keyNodes = route.summary.keyNodes.join(', ') || '无关键节点'
      const chinaFlag = route.summary.hasChineseNodes ? ' 🇨🇳' : ''
      section += `| ${route.destination} | ${route.targetIp} | ${route.summary.totalHops} | ${route.summary.finalLatency.toFixed(2)}ms${chinaFlag} | ${qualityIcon} | ${keyNodes} |\n`
    }
    section += '\n'
  }

  // 详细路由信息
  for (const route of routeTest.routes) {
    section += `#### 🛣️ ${route.destination} 详细路由\n\n`
    section += `**目标IP：** ${route.targetIp}\n\n`
    
    section += '| 跳数 | 延迟 | ASN | 位置 | 服务商 | 备注 |\n'
    section += '| --- | --- | --- | --- | --- | --- |\n'
    
    for (const hop of route.hops) {
      const asnInfo = hop.asn ? `${hop.asn}${hop.asnName ? ` [${hop.asnName}]` : ''}` : '-'
      const provider = hop.provider || '-'
      const note = hop.isPrivate ? '🔒 私有地址' : (hop.asnName?.includes('电信') ? '📡' : hop.asnName?.includes('联通') ? '📶' : hop.asnName?.includes('移动') ? '📱' : '')
      
      section += `| ${hop.hopNumber} | ${hop.latency} | ${asnInfo} | ${hop.location} | ${provider} | ${note} |\n`
    }
    section += '\n'
  }

  return section
}

/**
 * 获取路由质量图标
 */
function getRouteQualityIcon(quality: 'excellent' | 'good' | 'average' | 'poor'): string {
  switch (quality) {
    case 'excellent':
      return '🚀 优秀'
    case 'good':
      return '✅ 良好'
    case 'average':
      return '⚠️ 一般'
    case 'poor':
      return '❌ 较差'
    default:
      return '📋 未知'
  }
}

/**
 * 生成速度测试部分
 */
function generateSpeedTests(speedTest: SpeedTest, options: MarkdownOptions): string {
  let section = ''

  if (speedTest.nodes.length > 0) {
    section += '| 位置 | 上传速度 | 下载速度 | 延迟 |\n'
    section += '| --- | --- | --- | --- |\n'

    for (const node of speedTest.nodes) {
      section += `| ${node.location} | ${node.uploadSpeed} | ${node.downloadSpeed} | ${node.latency} |\n`
    }
    section += '\n'
  }

  return section
}