# 🚀 VPS-Spectra

> 专业的VPS测试结果美化工具，将原始测试数据转换为美观的Markdown格式，支持Obsidian callout语法

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/vps-spectra)

## ✨ 特性

- 🎯 **智能解析** - 模块化解析器，自动识别和解析VPS测试数据
- 🎨 **美观输出** - 生成适合论坛分享的Markdown格式
- 📝 **Obsidian支持** - 完整支持Obsidian callout语法
- 🌓 **双主题** - 支持浅色/深色主题切换
- 📱 **响应式** - 完美适配桌面和移动设备
- ⚡ **高性能** - 基于Next.js 15构建，性能优异
- 🔧 **易部署** - 支持Vercel一键部署
- 🏗️ **模块化架构** - 清晰的代码结构，易于维护和扩展

## 🎯 使用场景

- **论坛分享** - 在Discourse、V2EX等论坛分享VPS测试结果
- **博客写作** - 为技术博客生成专业的测试报告
- **文档记录** - 在Obsidian等笔记软件中记录服务器性能
- **对比分析** - 生成标准化格式便于多服务器对比

## 🚀 快速开始

### 在线使用

访问 [VPS-Spectra](https://vps-spectra.vercel.app) 立即开始使用

### 本地部署

```bash
# 克隆项目
git clone https://github.com/your-username/vps-spectra.git
cd vps-spectra

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
npm start
```

### Docker部署

```bash
# 构建镜像
docker build -t vps-spectra .

# 运行容器
docker run -p 3000:3000 vps-spectra
```

### Vercel部署

1. Fork本项目到你的GitHub
2. 在Vercel中导入项目
3. 点击部署即可

## 📖 使用方法

### 1. 获取测试数据

运行VPS测试脚本获取原始数据：

```bash
# 使用融合怪脚本
curl -L https://gitlab.com/spiritysdx/za/-/raw/main/ecs.sh -o ecs.sh && chmod +x ecs.sh && bash ecs.sh
```

### 2. 粘贴数据

将完整的测试输出复制到VPS-Spectra的输入框中

### 3. 生成报告

点击"生成美化报告"按钮，系统将自动：
- 解析测试数据
- 评估性能等级
- 生成美化的Markdown

### 4. 复制使用

复制生成的Markdown内容，可直接在以下平台使用：
- Discourse论坛
- GitHub/GitLab
- Obsidian笔记
- 技术博客

## 🎨 输出示例

### 标准Markdown格式
```markdown
# 🚀 VPS 性能测试报告

## 📊 基础信息
| 项目 | 详情 |
| --- | --- |
| CPU 型号 | Intel(R) Xeon(R) CPU E5-2699 v4 @ 2.20GHz |
| CPU 核心数 | 8 |
```

### Obsidian Callout格式
```markdown
> [!success] 单核性能评级
> 🟢 **优秀 (1500 < 1711 < 2000)**

> [!warning] 内存性能分析
> 检测到内存性能较低，可能存在超售或资源限制情况
```

## 🔧 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **状态管理**: Zustand
- **主题**: next-themes
- **图标**: Lucide React

## 🏗️ 项目架构

### 模块化设计

项目采用模块化架构，按功能将代码拆分为不同模块：

```
src/
├── lib/
│   ├── parsers/           # 解析器模块
│   │   ├── index.ts       # 主解析器
│   │   ├── basicInfoParser.ts      # 基础信息解析器
│   │   ├── hardwareParser.ts       # 硬件性能解析器
│   │   ├── streamingParser.ts      # 流媒体解锁解析器
│   │   ├── networkParser.ts        # 网络测试解析器
│   │   ├── networkReturnParser.ts  # 三网回程解析器
│   │   └── utils.ts                # 解析工具函数
│   ├── evaluators/        # 评估器模块
│   │   ├── index.ts       # 主评估器
│   │   ├── hardwareEvaluators.ts   # 硬件性能评估器
│   │   └── networkEvaluators.ts    # 网络性能评估器
│   └── formatters/        # 格式化器模块
│       ├── index.ts       # 主格式化器
│       ├── basicInfoFormatter.ts   # 基础信息格式化器
│       ├── hardwareFormatter.ts    # 硬件性能格式化器
│       ├── streamingFormatter.ts   # 流媒体格式化器
│       └── networkFormatter.ts     # 网络测试格式化器
└── types/
    └── index.ts           # 类型定义
```

### 解析流程

1. **原始文本解析** - 将输入文本按模块分割
2. **模块化解析** - 各专门解析器处理对应部分
3. **性能评估** - 对解析结果进行评估和评级
4. **格式化输出** - 生成美化的Markdown报告

### 测试模块分类

#### 基础信息
- 硬件配置（CPU、内存、磁盘）
- 系统信息（操作系统、内核、架构）
- 网络配置（虚拟化、NAT、IP信息）

#### 硬件性能测试
- **CPU测试** - 单核/多核性能评估
- **内存测试** - 读写速度测试
- **磁盘测试** - DD和FIO性能测试

#### 流媒体解锁
- IPv4/IPv6解锁状态检测
- TikTok地区识别

#### 网络测试
- **IP质量检测** - 15个数据库综合评估
- **邮件端口检测** - SMTP/POP3/IMAP端口状态
- **三网回程** - 电信/联通/移动回程路由
- **回程路由** - 详细路由跳点分析

## 📊 支持的测试项目

- ✅ 基础系统信息
- ✅ CPU性能测试 (Sysbench)
- ✅ 内存性能测试
- ✅ 磁盘DD读写测试
- ✅ 磁盘FIO读写测试
- ✅ 流媒体解锁测试
- ✅ IP质量检测
- ✅ 邮件端口检测
- ✅ 三网回程测试
- ✅ 回程路由测试
- ✅ 速度测试

## 🎯 评级标准

### CPU性能 (Sysbench)
- 🟢 **优秀**: > 2000分
- 🟡 **良好**: 1000-2000分
- 🟠 **一般**: 500-1000分
- 🔴 **较差**: < 500分

### 内存性能
- 🟢 **优秀**: 读取 > 30GB/s, 写入 > 15GB/s
- 🟡 **良好**: 读取 > 20GB/s, 写入 > 10GB/s
- 🟠 **一般**: 读取 > 10GB/s, 写入 > 5GB/s
- 🔴 **较差**: 低于一般标准

### 磁盘性能 (FIO)
- 🟢 **优秀**: > 100 MB/s
- 🟡 **良好**: 80-100 MB/s
- 🟠 **一般**: 50-80 MB/s
- 🔴 **较差**: < 50 MB/s

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 开发环境设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 代码结构说明

#### 解析器 (Parsers)
- `basicInfoParser.ts` - 解析服务器基础信息
- `hardwareParser.ts` - 解析CPU、内存、磁盘性能数据
- `streamingParser.ts` - 解析流媒体解锁测试结果
- `networkParser.ts` - 解析网络相关测试（IP质量、邮件端口、路由等）

#### 评估器 (Evaluators)
- `hardwareEvaluators.ts` - 硬件性能评级算法
- `networkEvaluators.ts` - 网络质量评级算法

#### 格式化器 (Formatters)
- `basicInfoFormatter.ts` - 基础信息Markdown格式化
- `hardwareFormatter.ts` - 硬件测试结果格式化
- `streamingFormatter.ts` - 流媒体测试结果格式化
- `networkFormatter.ts` - 网络测试结果格式化

### 添加新功能

1. **添加新的测试模块**：
   - 在 `types/index.ts` 中定义新的类型
   - 在对应的解析器中添加解析逻辑
   - 在评估器中添加评级逻辑
   - 在格式化器中添加输出格式

2. **修改评级标准**：
   - 编辑 `evaluators/` 目录下的相应文件
   - 调整评级阈值和描述

3. **优化输出格式**：
   - 编辑 `formatters/` 目录下的相应文件
   - 调整Markdown输出格式

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [spiritLHLS/ecs](https://github.com/spiritLHLS/ecs) - VPS测试脚本
- [oneclickvirt](https://github.com/oneclickvirt) - 测试工具集
- 所有开源项目贡献者

---

**如果这个项目对你有帮助，请给个⭐️支持一下！**