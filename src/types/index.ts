// 评级等级
export type RatingLevel = 'excellent' | 'good' | 'average' | 'poor'

// 评级结果
export interface RatingResult {
  level: RatingLevel
  score?: number
  description: string
  color: string
  emoji: string
}

// 基础系统信息
export interface BasicInfo {
  cpuModel: string
  cpuCores: number
  cpuFreq: string
  cpuCache: {
    l1: string
    l2: string
    l3: string
  }
  aesNI: boolean
  vmSupport: boolean
  memory: {
    used: string
    total: string
  }
  swap: string
  disk: {
    used: string
    total: string
  }
  bootPath: string
  uptime: string
  load: string[]
  system: string
  arch: string
  kernel: string
  tcpAcceleration: string
  virtualization: string
  natType: string
  ipv4: {
    asn: string
    location: string
  }
  ipv6: {
    asn: string
    location: string
    subnet: string
  }
}

// CPU测试结果
export interface CpuTest {
  singleCore: {
    score: number
    rating: RatingResult
  }
  multiCore: {
    score: number
    threads: number
    rating: RatingResult
    efficiency?: number
    efficiencyRating?: RatingResult
  }
}

// 内存测试结果
export interface MemoryTest {
  singleThreadRead: {
    speed: number
    rating: RatingResult
  }
  singleThreadWrite: {
    speed: number
    rating: RatingResult
  }
  overallRating?: RatingResult
}

// 磁盘DD测试结果
export interface DiskDdTest {
  tests: Array<{
    operation: string
    writeSpeed?: string
    readSpeed?: string
    writeIOPS?: string
    readIOPS?: string
    writeTime?: string
    readTime?: string
  }>
}

// 磁盘FIO测试结果
export interface DiskFioTest {
  tests: Array<{
    blockSize: string
    read: {
      speed: number
      iops: number
    }
    write: {
      speed: number
      iops: number
    }
    total: {
      speed: number
      iops: number
    }
  }>
}

// 流媒体解锁测试结果
export interface StreamingTest {
  commonMediaTests: {
    ipv4: Array<{
      service: string
      status: string
    }>
    ipv6: Array<{
      service: string
      status: string
    }>
    tiktokRegion?: string
  }
  regionRestrictionCheck: {
    services: Array<{
      name: string
      ipv4Status: string
      ipv6Status: string
    }>
  }
}

// 数据库来源信息
export interface DatabaseSource {
  id: string  // 数据库编号 (0-9, A-E)
  name: string
  url: string
  description: string
}

// IP质量检测指标
export interface IpQualityMetric {
  value: number | string
  sources: string[]  // 数据库编号列表
  rating?: RatingResult
  description?: string  // 用于ASN和公司信息的额外描述
}

// 安全信息指标
export interface SecurityInfo {
  [key: string]: {
    value: string
    sources: string[]
  }
}

// 黑名单记录统计
export interface BlacklistStats {
  harmlessCount: { value: number; sources: string[] }
  maliciousCount: { value: number; sources: string[] }
  suspiciousCount: { value: number; sources: string[] }
  undetectedCount: { value: number; sources: string[] }
  totalChecked: number
  cleanCount: number
  blacklistedCount: number
  otherCount: number
}

// IP质量检测结果
export interface IpQualityTest {
  databases: DatabaseSource[]  // 数据库列表
  ipv4: {
    // 安全得分
    reputation: IpQualityMetric
    trustScore: IpQualityMetric
    vpnScore: IpQualityMetric
    proxyScore: IpQualityMetric
    communityVotesHarmless: IpQualityMetric
    communityVotesMalicious: IpQualityMetric
    threatScore: IpQualityMetric
    fraudScore: IpQualityMetric
    abuseScore: IpQualityMetric
    asnAbuseScore: IpQualityMetric
    companyAbuseScore: IpQualityMetric
    threatLevel: IpQualityMetric
    
    // 黑名单记录统计
    blacklistStats: BlacklistStats
    
    // 安全信息
    securityInfo: SecurityInfo
    
    // DNS黑名单
    dnsBlacklist?: {
      totalChecked: number
      clean: number
      blacklisted: number
      other: number
    }
  }
  ipv6: {
    // 安全得分
    fraudScore: IpQualityMetric
    abuseScore: IpQualityMetric
    asnAbuseScore: IpQualityMetric
    companyAbuseScore: IpQualityMetric
    threatLevel?: IpQualityMetric
    
    // 安全信息
    securityInfo: SecurityInfo
    
    // DNS黑名单
    dnsBlacklist?: {
      totalChecked: number
      clean: number
      blacklisted: number
      other: number
    }
  }
  googleSearchViability: boolean
}

// 邮件端口检测结果
export interface EmailPortTest {
  platforms: Array<{
    name: string
    smtp: boolean
    smtps: boolean
    pop3: boolean
    pop3s: boolean
    imap: boolean
    imaps: boolean
  }>
}

// 三网回程测试结果
export interface NetworkReturnTest {
  telecom: string[]
  unicom: string[]
  mobile: string[]
}

// 路由跳点信息
export interface RouteHop {
  hopNumber: number
  latency: string
  asn?: string
  asnName?: string
  location: string
  provider?: string
  isPrivate: boolean
  rawLine: string
}

// 回程路由测试结果
export interface RouteTest {
  routes: Array<{
    destination: string
    targetIp: string
    hops: RouteHop[]
    summary: {
      totalHops: number
      finalLatency: number  // 最终延迟（到达目标的总延迟）
      keyNodes: string[]
      routeQuality: 'excellent' | 'good' | 'average' | 'poor'
      hasChineseNodes: boolean  // 是否经过中国节点
    }
  }>
}

// 速度测试结果
export interface SpeedTest {
  nodes: Array<{
    location: string
    uploadSpeed: string
    downloadSpeed: string
    latency: string
  }>
}

// 完整的VPS测试结果
export interface VpsTestResult {
  basicInfo: BasicInfo
  cpuTest: CpuTest
  memoryTest: MemoryTest
  diskDdTest: DiskDdTest
  diskFioTest: DiskFioTest
  streamingTest: StreamingTest
  ipQualityTest: IpQualityTest
  emailPortTest: EmailPortTest
  networkReturnTest: NetworkReturnTest
  routeTest: RouteTest
  speedTest: SpeedTest
  metadata: {
    testTime: string
    totalDuration: string
    version: string
  }
}

// Markdown输出选项
export interface MarkdownOptions {
  useObsidianCallouts: boolean
  includeMetadata: boolean
  includeTableOfContents: boolean
  compactMode: boolean
  customTemplate?: string
}

// 解析错误
export interface ParseError {
  section: string
  message: string
  line?: number
  suggestion?: string
}