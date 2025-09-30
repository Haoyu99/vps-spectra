import {formatNetworkReturnAsMarkdownTable} from '@/lib/parsers/networkReturnParser'
import type {VpsTestResult, MarkdownOptions, RatingResult} from '@/types'

/**
 * 将VPS测试结果格式化为Markdown
 */
export function formatToMarkdown(result: VpsTestResult, options: MarkdownOptions = {
    useObsidianCallouts: true,
    includeMetadata: true,
    includeTableOfContents: true,
    compactMode: false
}, inputText: string = ''): string {
    let markdown = ''

    // 标题和元数据
    markdown += generateHeader(result, options)

    // 目录 暂时不加入
    // if (options.includeTableOfContents) {
    //     markdown += generateTableOfContents()
    // }

    // 基础信息
    markdown += generateBasicInfo(result.basicInfo, options)

    // 硬件性能测试
    markdown += generateHardwareTests(result, options)

    // 流媒体解锁测试
    markdown += generateStreamingTests(result.streamingTest, options)

    // 网络测试
    markdown += generateNetworkTests(result, options)

    // 速度测试
    markdown += generateSpeedTests(result.speedTest, options)

    // 页脚
    markdown += generateFooter(result, options)

    return markdown
}

/**
 * 生成文档头部
 */
function generateHeader(result: VpsTestResult, options: MarkdownOptions): string {
    let header = '# 🚀 VPS 性能测试报告\n\n'

    if (options.includeMetadata) {
        if (options.useObsidianCallouts) {
            header += `> [!info] 测试信息\n`
            header += `> **测试时间：** ${result.metadata.version}\n`
            header += `> **测试耗时：** ${result.metadata.totalDuration}\n`
            header += `> **服务器运行时间：** ${result.metadata.testTime}\n\n`
        } else {
            header += `**测试时间：** ${result.metadata.version} \n`
            header += `**测试耗时：** ${result.metadata.totalDuration} \n`
            header += `**服务器运行时间：** ${result.metadata.testTime} \n\n`
        }
    }

    return header
}

/**
 * 生成目录
 */
function generateTableOfContents(): string {
    return `## 📋 目录

- [📊 基础信息](#-基础信息)
- [💻 硬件性能测试](#-硬件性能测试)
  - [CPU 测试](#cpu-测试)
  - [内存测试](#内存测试)
  - [磁盘性能测试](#磁盘性能测试)
- [🎬 流媒体解锁测试](#-流媒体解锁测试)
- [🌐 网络测试](#-网络测试)
  - [IP 质量检测](#ip-质量检测)
  - [邮件端口检测](#邮件端口检测)
  - [三网回程](#三网回程)
  - [回程路由](#回程路由)
- [⚡ 速度测试](#-速度测试)

---

`
}


/**
 * 生成基础信息部分
 */
function generateBasicInfo(basicInfo: any, options: MarkdownOptions): string {
    // 1. 添加引导性 Callout
    let section = '## 📊 基础信息\n\n'

    section += '> [!NOTE] 硬件配置 & 网络信息\n';
    section += '> 这是关于服务器核心硬件、操作系统以及网络环境的基础信息概览。\n\n';

    // 2. 分组一：硬件规格
    section += '### 💻 硬件规格\n';
    section += '| 项目 | 详情 |\n';
    section += '| :--- | :--- |\n';
    section += `| **CPU 型号** | ${basicInfo.cpuModel} |\n`;
    section += `| **CPU 核心** | ${basicInfo.cpuCores} Cores @ ${basicInfo.cpuFreq} |\n`;
    section += `| **CPU 缓存** | L1: ${basicInfo.cpuCache.l1} / L2: ${basicInfo.cpuCache.l2} / L3: ${basicInfo.cpuCache.l3} |\n`;
    section += `| **虚拟化** | ${basicInfo.vmSupport ? '✅ KVM/VM-x' : '❌ 不支持'} |\n`;
    section += `| **AES-NI** | ${basicInfo.aesNI ? '✅ 已启用' : '❌ 未启用'} |\n`;
    section += `| **内存** | ${basicInfo.memory.used} / ${basicInfo.memory.total} |\n`;
    // 优化 Swap 显示
    const swapDisplay = basicInfo.swap.includes('no swap') ? '未配置' : basicInfo.swap;
    section += `| **Swap** | ${swapDisplay} |\n`;
    section += `| **硬盘** | ${basicInfo.disk.used} / ${basicInfo.disk.total} |\n\n`;

    // 3. 分组二：系统信息
    section += '### ⚙️ 系统信息\n';
    section += '| 项目 | 详情 |\n';
    section += '| :--- | :--- |\n';
    section += `| **操作系统** | ${basicInfo.system} |\n`;
    section += `| **架构** | ${basicInfo.arch} |\n`;
    section += `| **内核版本** | ${basicInfo.kernel} |\n`;
    section += `| **TCP 加速** | ${basicInfo.tcpAcceleration} |\n`;
    section += `| **在线时间** | ${basicInfo.uptime} |\n`;
    section += `| **系统负载** | ${basicInfo.load.join(', ')} |\n\n`;

    // 4. 分组三：网络配置
    section += '### 🌐 网络配置\n';
    section += '| 项目 | 详情 |\n';
    section += '| :--- | :--- |\n';
    section += `| **虚拟化架构** | ${basicInfo.virtualization} |\n`;
    section += `| **NAT 类型** | ${basicInfo.natType} |\n`;
    section += `| **IPv4 信息** | ${basicInfo.ipv4.location} (${basicInfo.ipv4.asn}) |\n`;
    section += `| **IPv6 信息** | ${basicInfo.ipv6.location} (${basicInfo.ipv6.asn}) |\n`;
    section += `| **IPv6 子网** | ${basicInfo.ipv6.subnet} |\n\n`;

    return section
}

/**
 * 生成硬件性能测试部分
 */
function generateHardwareTests(result: VpsTestResult, options: MarkdownOptions): string {
    let section = '## 💻 硬件性能测试\n\n'

    // CPU测试
    section += '### CPU 测试\n\n'
    section += generateCpuTestSection(result.cpuTest, options)

    // 内存测试
    section += '### 内存测试\n\n'
    section += generateMemoryTestSection(result.memoryTest, options)

    // 磁盘测试
    section += '### 磁盘性能测试\n\n'
    
    // 添加磁盘测试指标说明
    if (options.useObsidianCallouts) {
        section += '> [!info] 磁盘性能指标说明\n'
        section += '> **DD测试**：基础顺序读写测试，快速评估磁盘基本性能\n'
        section += '> **FIO测试**：专业IO测试工具，更准确反映实际使用性能\n\n'
    } else {
        section += '**磁盘性能指标说明：**\n'
        section += '- **DD测试**：基础顺序读写测试，快速评估磁盘基本性能\n'
        section += '- **FIO测试**：专业IO测试工具，更准确反映实际使用性能\n\n'
    }
    
    section += generateDiskTestSection(result.diskDdTest, result.diskFioTest, options)

    return section
}

/**
 * 生成CPU测试部分
 */
function generateCpuTestSection(cpuTest: any, options: MarkdownOptions): string {
    let section = ''

    // 单核性能
    section += `**单核性能得分：** ${cpuTest.singleCore.score} Scores\n\n`
    section += generateRatingCallout(cpuTest.singleCore.rating, '单核性能评级', options)

    // 多核性能 - 只有当多核测试有效时才显示
    // 判断是否为有效的多核测试：线程数大于1且得分大于0
    if (cpuTest.multiCore && cpuTest.multiCore.threads > 1 && cpuTest.multiCore.score > 0) {
        section += `**${cpuTest.multiCore.threads}线程性能得分：** ${cpuTest.multiCore.score} Scores\n\n`
        section += generateRatingCallout(cpuTest.multiCore.rating, '多核性能评级', options)

        // 多核效率
        if (cpuTest.multiCore.efficiency && cpuTest.multiCore.efficiencyRating) {
            section += `**多核心效率：** ${cpuTest.multiCore.efficiency.toFixed(2)}\n\n`
            section += generateRatingCallout(cpuTest.multiCore.efficiencyRating, '效率评级', options)
        }
    }

    return section
}

/**
 * 生成内存测试部分
 */
function generateMemoryTestSection(memoryTest: any, options: MarkdownOptions): string {
    let section = ''

    section += '| 测试类型 | 性能 | 评级 |\n'
    section += '| --- | --- | --- |\n'
    section += `| 单线程读测试 | ${memoryTest.singleThreadRead.speed.toFixed(2)} MB/s | ${memoryTest.singleThreadRead.rating.emoji} ${memoryTest.singleThreadRead.rating.description} |\n`
    section += `| 单线程写测试 | ${memoryTest.singleThreadWrite.speed.toFixed(2)} MB/s | ${memoryTest.singleThreadWrite.rating.emoji} ${memoryTest.singleThreadWrite.rating.description} |\n\n`

    // 内存性能总体评价
    const avgRating = getAverageRating([memoryTest.singleThreadRead.rating, memoryTest.singleThreadWrite.rating])
    if (options.useObsidianCallouts) {
        section += generateMemoryPerformanceCallout(memoryTest, avgRating, options)
    }

    return section
}

/**
 * 生成磁盘测试部分
 */
function generateDiskTestSection(diskDdTest: any, diskFioTest: any, options: MarkdownOptions): string {
    let section = ''

    // DD测试
    section += '#### DD 读写测试\n\n'
    
    if (diskDdTest.tests.length > 0) {
        section += '| 测试项目 | 操作 | 速度 | IOPS | 耗时 |\n'
        section += '| --- | --- | --- | --- | --- |\n'
        
        for (const test of diskDdTest.tests) {
            if (test.writeSpeed && test.readSpeed) {
                // 写入行
                section += `| ${test.operation} | 写入 | ${test.writeSpeed} | ${test.writeIOPS || 'N/A'} | ${test.writeTime || 'N/A'} |\n`
                // 读取行
                section += `| ${test.operation} | 读取 | ${test.readSpeed} | ${test.readIOPS || 'N/A'} | ${test.readTime || 'N/A'} |\n`
            }
        }
        section += '\n'
    }

    // FIO测试
    section += '#### FIO 读写测试\n\n'
    if (diskFioTest.tests.length > 0) {
        // 改为表格格式显示
        section += '| 块大小 | 读取速度 | 读取IOPS | 写入速度 | 写入IOPS | 总速度 | 总IOPS |\n'
        section += '| --- | --- | --- | --- | --- | --- | --- |\n'
        
        for (const test of diskFioTest.tests) {
            section += `| ${test.blockSize} | ${test.read.speed.toFixed(2)} MB/s | ${test.read.iops.toFixed(0)} | `
            section += `${test.write.speed.toFixed(2)} MB/s | ${test.write.iops.toFixed(0)} | `
            section += `${test.total.speed.toFixed(2)} MB/s | ${test.total.iops.toFixed(0)} |\n`
        }
        section += '\n'

        // 性能分析和评级
        const test4k = diskFioTest.tests.find((t: any) => t.blockSize === '4k')
        const test1m = diskFioTest.tests.find((t: any) => t.blockSize === '1m')
        
        if (test4k) {
            const avg4kSpeed = (test4k.read.speed + test4k.write.speed) / 2
            const diskEvaluation = evaluateDiskPerformance(avg4kSpeed)
            
            section += '#### 磁盘性能分析 \n\n'
            section += `**磁盘类型判断：** ${diskEvaluation.type}\n\n`
            section += generateRatingCallout(diskEvaluation.rating, '4K性能评级', options)
            
            // 超售检测
            if (test1m) {
                const overselling = evaluateOverselling(test1m.total.speed, diskEvaluation.type)
                const calloutType = overselling.hasOverselling ? 'warning' : 'success'
                
                if (options.useObsidianCallouts) {
                    section += `> [!${calloutType}] 资源超售检测\n`
                    section += `> ${overselling.message}\n\n`
                } else {
                    section += `**资源超售检测：** ${overselling.message}\n\n`
                }
            }
            
            if (options.useObsidianCallouts) {
                section += '> [!note] 注意\n'
                section += '> 以上分析基于测试数据的统计规律，仅供参考。实际磁盘性能受多种因素影响（文件系统、IO引擎、系统负载等），请结合实际使用场景进行综合评估。\n\n'
            } else {
                section += '**注意：** 以上分析基于测试数据的统计规律，仅供参考。实际磁盘性能受多种因素影响（文件系统、IO引擎、系统负载等），请结合实际使用场景进行综合评估。\n\n'
            }
        }
    }

    return section
}

/**
 * 生成流媒体测试部分
 */
function generateStreamingTests(streamingTest: any, options: MarkdownOptions): string {
    let section = '## 🎬 流媒体解锁测试\n\n'

    if (streamingTest.regionRestrictionCheck.services.length > 0) {
        section += '| 服务 | IPv4 | IPv6 |\n'
        section += '| --- | --- | --- |\n'

        for (const service of streamingTest.regionRestrictionCheck.services) {
            section += `| ${service.name} | ${service.ipv4Status} | ${service.ipv6Status} |\n`
        }
        section += '\n'
    }

    if (streamingTest.commonMediaTests.tiktokRegion) {
        if (options.useObsidianCallouts) {
            section += `> [!info] TikTok 解锁信息\n`
            section += `> **TikTok Region:** ${streamingTest.commonMediaTests.tiktokRegion}\n\n`
        } else {
            section += `**TikTok Region:** ${streamingTest.commonMediaTests.tiktokRegion}\n\n`
        }
    }

    return section
}

/**
 * 生成网络测试部分
 */
function generateNetworkTests(result: VpsTestResult, options: MarkdownOptions): string {
    let section = '## 🌐 网络测试\n\n'

    // IP质量检测
    section += '### IP 质量检测\n\n'
    section += generateIpQualitySection(result.ipQualityTest, options)

    // 邮件端口检测
    section += '### 邮件端口检测\n\n'
    section += generateEmailPortSection(result.emailPortTest, options)

    // 三网回程
    section += '### 三网回程\n\n'
    section += generateNetworkReturnSection(result.networkReturnTest, options)

    // 回程路由
    section += '### 回程路由\n\n'
    section += generateRouteSection(result.routeTest, options)

    return section
}

/**
 * 生成IP质量检测部分
 */
function generateIpQualitySection(ipQualityTest: any, options: MarkdownOptions): string {
    let section = ''

    // IPv4部分
    section += '#### IPv4\n\n'
    section += '| 指标 | 值 | 评级 |\n'
    section += '| --- | --- | --- |\n'
    section += `| 声誉(越高越好) | ${ipQualityTest.ipv4.reputation.value} | ${ipQualityTest.ipv4.reputation.rating.emoji} ${ipQualityTest.ipv4.reputation.rating.description} |\n`
    section += `| 信任得分(越高越好) | ${ipQualityTest.ipv4.trustScore.value} | ${ipQualityTest.ipv4.trustScore.rating.emoji} ${ipQualityTest.ipv4.trustScore.rating.description} |\n`
    section += `| VPN得分(越低越好) | ${ipQualityTest.ipv4.vpnScore.value} | ${ipQualityTest.ipv4.vpnScore.rating.emoji} ${ipQualityTest.ipv4.vpnScore.rating.description} |\n`
    section += `| 代理得分(越低越好) | ${ipQualityTest.ipv4.proxyScore.value} | ${ipQualityTest.ipv4.proxyScore.rating.emoji} ${ipQualityTest.ipv4.proxyScore.rating.description} |\n`
    section += `| 威胁得分(越低越好) | ${ipQualityTest.ipv4.threatScore.value} | ${ipQualityTest.ipv4.threatScore.rating.emoji} ${ipQualityTest.ipv4.threatScore.rating.description} |\n`
    section += `| 欺诈得分(越低越好) | ${ipQualityTest.ipv4.fraudScore.value} | ${ipQualityTest.ipv4.fraudScore.rating.emoji} ${ipQualityTest.ipv4.fraudScore.rating.description} |\n`
    section += `| 滥用得分(越低越好) | ${ipQualityTest.ipv4.abuseScore.value} | ${ipQualityTest.ipv4.abuseScore.rating.emoji} ${ipQualityTest.ipv4.abuseScore.rating.description} |\n`
    section += `| 威胁级别 | ${ipQualityTest.ipv4.threatLevel.value} | ${ipQualityTest.ipv4.threatLevel.rating.emoji} ${ipQualityTest.ipv4.threatLevel.rating.description} |\n\n`

    // IPv6部分
    section += '#### IPv6\n\n'
    section += '| 指标 | 值 | 评级 |\n'
    section += '| --- | --- | --- |\n'
    section += `| 欺诈得分(越低越好) | ${ipQualityTest.ipv6.fraudScore.value} | ${ipQualityTest.ipv6.fraudScore.rating.emoji} ${ipQualityTest.ipv6.fraudScore.rating.description} |\n`
    section += `| 滥用得分(越低越好) | ${ipQualityTest.ipv6.abuseScore.value} | ${ipQualityTest.ipv6.abuseScore.rating.emoji} ${ipQualityTest.ipv6.abuseScore.rating.description} |\n`
    section += `| ASN滥用得分(越低越好) | ${ipQualityTest.ipv6.asnAbuseScore.value} (${ipQualityTest.ipv6.asnAbuseScore.description}) | ${ipQualityTest.ipv6.asnAbuseScore.rating.emoji} ${ipQualityTest.ipv6.asnAbuseScore.rating.description} |\n`
    section += `| 公司滥用得分(越低越好) | ${ipQualityTest.ipv6.companyAbuseScore.value} (${ipQualityTest.ipv6.companyAbuseScore.description}) | ${ipQualityTest.ipv6.companyAbuseScore.rating.emoji} ${ipQualityTest.ipv6.companyAbuseScore.rating.description} |\n`
    section += `| 威胁级别 | ${ipQualityTest.ipv6.threatLevel.value} | ${ipQualityTest.ipv6.threatLevel.rating.emoji} ${ipQualityTest.ipv6.threatLevel.rating.description} |\n\n`

    // Google搜索可行性
    section += `**Google搜索可行性：** ${ipQualityTest.googleSearchViability ? '✅ 可用' : '❌ 不可用'}\n\n`

    return section
}

/**
 * 生成邮件端口检测部分
 */
function generateEmailPortSection(emailPortTest: any, options: MarkdownOptions): string {
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
function generateNetworkReturnSection(networkReturnTest: any, options: MarkdownOptions): string {


    let section = ''

    if (networkReturnTest.telecom.length > 0) {
        section += '【电信回程】\n'
        for (const entry of networkReturnTest.telecom) {
            section += `${entry}\n`
        }
        section += '\n'
    }

    if (networkReturnTest.unicom.length > 0) {
        section += '【联通回程】\n'
        for (const entry of networkReturnTest.unicom) {
            section += `${entry}\n`
        }
        section += '\n'
    }

    if (networkReturnTest.mobile.length > 0) {
        section += '【移动回程】\n'
        for (const entry of networkReturnTest.mobile) {
            section += `${entry}\n`
        }
    }

    return section
}

/**
 * 生成回程路由部分
 */
function generateRouteSection(routeTest: any, options: MarkdownOptions): string {
    let section = '```\n'

    for (const route of routeTest.routes) {
        section += `${route.destination}\n`
        for (const hop of route.hops) {
            section += `${hop}\n`
        }
        section += '\n'
    }

    section += '```\n\n'
    return section
}

/**
 * 生成速度测试部分
 */
function generateSpeedTests(speedTest: any, options: MarkdownOptions): string {
    let section = '## ⚡ 速度测试\n\n'

    if (speedTest.nodes.length > 0) {
        section += '| 位置 | 上传速度 | 下载速度 | 延迟 | 丢包率 |\n'
        section += '| --- | --- | --- | --- | --- |\n'

        for (const node of speedTest.nodes) {
            section += `| ${node.location} | ${node.uploadSpeed} | ${node.downloadSpeed} | ${node.latency} | ${node.packetLoss} |\n`
        }
        section += '\n'
    }

    return section
}

/**
 * 生成页脚
 */
function generateFooter(result: VpsTestResult, options: MarkdownOptions): string {
    let footer = '---\n\n'

    if (options.useObsidianCallouts) {
        footer += `> [!note] 报告生成信息\n`
        footer += `> 本报告由 [VPS-Spectra](https://github.com/Haoyu99/vps-spectra) 自动生成\n`
        footer += `> 生成时间：${new Date().toLocaleString('zh-CN')}\n\n`
    } else {
        footer += `*本报告由 [VPS-Spectra](https://github.com/Haoyu99/vps-spectra) 自动生成*\n`
        footer += `*生成时间：${new Date().toLocaleString('zh-CN')}*\n\n`
    }

    return footer
}

/**
 * 生成评级callout
 */
function generateRatingCallout(rating: RatingResult, title: string, options: MarkdownOptions): string {
    if (!options.useObsidianCallouts) {
        return `**${title}：** ${rating.emoji} ${rating.description}\n\n`
    }

    const calloutType = getCalloutType(rating.level)
    return `> [!${calloutType}] ${title}\n> ${rating.emoji} **${rating.description}**\n\n`
}

/**
 * 生成内存性能callout
 */
function generateMemoryPerformanceCallout(memoryTest: any, avgRating: any, options: MarkdownOptions): string {
    if (!options.useObsidianCallouts) return ''

    const readSpeed = memoryTest.singleThreadRead.speed
    const writeSpeed = memoryTest.singleThreadWrite.speed

    let message = ''
    if (readSpeed < 10240 || writeSpeed < 10240) {
        message = '检测到内存性能较低，可能存在超售或资源限制情况'
    } else if (readSpeed > 50000 && writeSpeed > 20000) {
        message = '内存性能优异，读写速度表现出色'
    } else {
        message = '内存性能表现正常'
    }

    const calloutType = getCalloutType(avgRating.level)
    return `> [!${calloutType}] 内存性能分析\n> ${message}\n\n`
}

/**
 * 获取callout类型
 */
function getCalloutType(level: string): string {
    switch (level) {
        case 'excellent':
            return 'success'
        case 'good':
            return 'info'
        case 'average':
            return 'warning'
        case 'poor':
            return 'danger'
        default:
            return 'note'
    }
}

/**
 * 计算平均评级
 */
function getAverageRating(ratings: RatingResult[]): RatingResult {
    const levels = ['poor', 'average', 'good', 'excellent']
    const avgIndex = Math.round(
        ratings.reduce((sum, rating) => sum + levels.indexOf(rating.level), 0) / ratings.length
    )

    return {
        level: levels[avgIndex] as any,
        description: '平均',
        color: '#666',
        emoji: '📊'
    }
}

/**
 * 根据4K性能评估磁盘类型和评级
 */
function evaluateDiskPerformance(speed4k: number): { type: string, rating: RatingResult } {
    let type: string
    let level: 'excellent' | 'good' | 'average' | 'poor'
    let description: string
    let emoji: string

    if (speed4k >= 200) {
        type = 'NVMe SSD'
        level = 'excellent'
        description = '优秀 (NVMe SSD)'
        emoji = '🚀'
    } else if (speed4k >= 50) {
        type = '标准SSD'
        level = 'good'
        description = '良好 (标准SSD)'
        emoji = '✅'
    } else if (speed4k >= 10) {
        type = 'HDD (机械硬盘)'
        level = 'average'
        description = '一般 (机械硬盘)'
        emoji = '⚠️'
    } else {
        type = '性能不佳'
        level = 'poor'
        description = '较差 (性能受限)'
        emoji = '❌'
    }

    return {
        type,
        rating: {
            level,
            description,
            color: level === 'excellent' ? '#22c55e' : level === 'good' ? '#3b82f6' : level === 'average' ? '#f59e0b' : '#ef4444',
            emoji
        }
    }
}

/**
 * 根据1M性能评估是否存在超售
 */
function evaluateOverselling(speed1m: number, diskType: string): { hasOverselling: boolean, message: string } {
    let threshold: number
    
    if (diskType === 'NVMe SSD') {
        threshold = 1000 // 1GB/s
    } else if (diskType === '标准SSD') {
        threshold = 500 // 500MB/s
    } else {
        threshold = 200 // 200MB/s for HDD
    }

    const hasOverselling = speed1m < threshold
    let message: string

    if (hasOverselling) {
        if (diskType === 'NVMe SSD') {
            message = '检测到严重的资源超开超售，1M性能远低于NVMe SSD应有水平'
        } else if (diskType === '标准SSD') {
            message = '可能存在资源限制，1M性能低于标准SSD正常水平'
        } else {
            message = '磁盘性能受限，可能存在IO限制或超售情况'
        }
    } else {
        message = '磁盘性能表现正常，未发现明显的资源超售问题'
    }

    return { hasOverselling, message }
}