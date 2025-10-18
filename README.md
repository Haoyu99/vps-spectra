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

- **论坛分享** - 在LINUX DO、IDC Flare 等论坛分享VPS测试结果
- **博客写作** - 为技术博客生成专业的测试报告
- **文档记录** - 在Obsidian等笔记软件中记录服务器性能
- **对比分析** - 生成标准化格式便于多服务器对比

## 🚀 快速开始

### 在线使用

访问 [VPS-Spectra](https://vps-spectra.vercel.app) 立即开始使用

### 本地部署

```bash
# 克隆项目
git clone https://github.com/haoyu99/vps-spectra.git
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


## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [spiritLHLS/ecs](https://github.com/spiritLHLS/ecs) - VPS测试脚本
- [oneclickvirt](https://github.com/oneclickvirt) - 测试工具集
- 所有开源项目贡献者

---

**如果这个项目对你有帮助，请给个⭐️支持一下！**