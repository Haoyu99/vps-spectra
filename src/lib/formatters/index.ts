import type { VpsTestResult, MarkdownOptions } from '@/types'

// 导入各模块格式化器
import { generateBasicInfo } from './basicInfoFormatter'
import { generateHardwareTests } from './hardwareFormatter'
import { generateStreamingTests } from './streamingFormatter'
import { generateNetworkTests } from './networkFormatter'

/**
 * 主格式化器
 * 协调各个模块格式化器，生成完整的Markdown报告
 */

/**
 * 将VPS测试结果格式化为Markdown
 * 
 * 格式化流程：
 * 1. 生成文档头部（标题、元数据）
 * 2. 基础信息格式化
 * 3. 硬件性能测试格式化
 * 4. 流媒体解锁测试格式化
 * 5. 网络测试格式化
 * 6. 生成文档尾部
 * 
 * @param result VPS测试结果
 * @param options Markdown格式化选项
 * @param inputText 原始输入文本（保留兼容性）
 * @returns 格式化后的Markdown文本
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
    markdown += generateHardwareTests(
        result.cpuTest,
        result.memoryTest,
        result.diskDdTest,
        result.diskFioTest,
        options
    )

    // 流媒体解锁测试
    markdown += generateStreamingTests(result.streamingTest, options)

    // 网络测试
    markdown += generateNetworkTests(
        result.ipQualityTest,
        result.emailPortTest,
        result.networkReturnTest,
        result.routeTest,
        result.speedTest,
        options
    )

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
            header += `> **融合怪版本：** ${result.metadata.version}\n`
            header += `> **测试耗时：** ${result.metadata.totalDuration}\n`
            header += `> **测试时间：** ${result.metadata.testTime}\n\n`
        } else {
            header += `**融合怪版本：** ${result.metadata.version} \n`
            header += `**测试耗时：** ${result.metadata.totalDuration} \n`
            header += `**测试时间：** ${result.metadata.testTime} \n\n`
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
 * 生成页脚
 */
function generateFooter(result: VpsTestResult, options: MarkdownOptions): string {
    let footer = '---\n\n'

    if (options.useObsidianCallouts) {
        footer += `> [!note] 报告生成信息\n`
        footer += `> 本报告由 [VPS-Spectra](https://github.com/Haoyu99/vps-spectra) 生成\n`
        footer += `> 生成时间：${new Date().toLocaleString('zh-CN')}\n\n`
    } else {
        footer += `*本报告由 [VPS-Spectra](https://github.com/Haoyu99/vps-spectra) 生成*\n`
        footer += `*生成时间：${new Date().toLocaleString('zh-CN')}*\n\n`
    }

    return footer
}

// 重新导出各模块格式化器，以便外部直接使用
export { generateBasicInfo } from './basicInfoFormatter'
export { generateHardwareTests } from './hardwareFormatter'
export { generateStreamingTests } from './streamingFormatter'
export { generateNetworkTests } from './networkFormatter'