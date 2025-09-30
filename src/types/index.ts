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

// IP质量检测结果
export interface IpQualityTest {
  ipv4: {
    reputation: { value: number; rating: RatingResult }
    trustScore: { value: number; rating: RatingResult }
    vpnScore: { value: number; rating: RatingResult }
    proxyScore: { value: number; rating: RatingResult }
    threatScore: { value: number; rating: RatingResult }
    fraudScore: { value: number; rating: RatingResult }
    abuseScore: { value: number; rating: RatingResult }
    threatLevel: { value: string; rating: RatingResult }
  }
  ipv6: {
    fraudScore: { value: number; rating: RatingResult }
    abuseScore: { value: number; rating: RatingResult }
    asnAbuseScore: { value: number; description: string; rating: RatingResult }
    companyAbuseScore: { value: number; description: string; rating: RatingResult }
    threatLevel: { value: string; rating: RatingResult }
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

// 回程路由测试结果
export interface RouteTest {
  routes: Array<{
    destination: string
    hops: string[]
  }>
}

// 速度测试结果
export interface SpeedTest {
  nodes: Array<{
    location: string
    uploadSpeed: string
    downloadSpeed: string
    latency: string
    packetLoss: string
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