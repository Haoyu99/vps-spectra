import type { BasicInfo, MarkdownOptions } from '@/types'

/**
 * 基础信息格式化器
 * 负责将基础信息格式化为Markdown
 */

/**
 * 生成基础信息部分
 */
export function generateBasicInfo(basicInfo: BasicInfo, options: MarkdownOptions): string {
    let section = '## 📊 基础信息\n\n'

    // 硬件规格
    section += '### 💻 硬件规格\n\n';
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

    // 系统信息
    section += '### ⚙️ 系统信息\n\n';
    section += '| 项目 | 详情 |\n';
    section += '| :--- | :--- |\n';
    section += `| **操作系统** | ${basicInfo.system} |\n`;
    section += `| **架构** | ${basicInfo.arch} |\n`;
    section += `| **内核版本** | ${basicInfo.kernel} |\n`;
    section += `| **TCP 加速** | ${basicInfo.tcpAcceleration} |\n`;
    section += `| **在线时间** | ${basicInfo.uptime} |\n`;
    section += `| **系统负载** | ${basicInfo.load.join(', ')} |\n\n`;

    // 网络配置
    section += '### 🌐 网络配置\n\n';
    section += '| 项目 | 详情 |\n';
    section += '| :--- | :--- |\n';
    section += `| **虚拟化架构** | ${basicInfo.virtualization} |\n`;
    section += `| **NAT 类型** | ${basicInfo.natType} |\n`;
    section += `| **IPv4 信息** | ${basicInfo.ipv4.location} (${basicInfo.ipv4.asn}) |\n`;
    section += `| **IPv6 信息** | ${basicInfo.ipv6.location} (${basicInfo.ipv6.asn}) |\n`;
    section += `| **IPv6 子网** | ${basicInfo.ipv6.subnet} |\n\n`;

    return section
}