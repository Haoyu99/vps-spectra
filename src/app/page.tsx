'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Download, 
  Copy, 
  Trash2, 
  Settings, 
  Moon, 
  Sun, 
  Zap,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { parseVpsTestResult } from '@/lib/parsers'
import { formatToMarkdown } from '@/lib/formatters'
import type { VpsTestResult, ParseError, MarkdownOptions } from '@/types'

export default function HomePage() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<ParseError[]>([])
  const [result, setResult] = useState<VpsTestResult | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input')
  const [options, setOptions] = useState<MarkdownOptions>({
    useObsidianCallouts: true,
    includeMetadata: true,
    includeTableOfContents: true,
    compactMode: false
  })
  
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 加载保存的数据
    const savedInput = localStorage.getItem('vps-spectra-input')
    if (savedInput) {
      setInput(savedInput)
    }
  }, [])

  // 自动保存输入
  useEffect(() => {
    if (input && mounted) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('vps-spectra-input', input)
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [input, mounted])

  // 重置复制成功状态
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copySuccess])

  const handleProcess = async () => {
    if (!input.trim()) {
      setErrors([{ section: 'input', message: '请先粘贴VPS测试数据', suggestion: '在左侧文本框中粘贴完整的测试结果' }])
      return
    }

    setIsProcessing(true)
    setErrors([])

    try {
      // 模拟处理延迟，提供更好的用户体验
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const { result: parseResult, errors: parseErrors } = parseVpsTestResult(input)
      
      if (parseResult) {
        setResult(parseResult)
        const markdown = formatToMarkdown(parseResult, options, input)
        setOutput(markdown)
        setActiveTab('output')
      }
      
      if (parseErrors.length > 0) {
        setErrors(parseErrors)
      }
    } catch (error) {
      setErrors([{
        section: 'general',
        message: '处理过程中发生错误',
        suggestion: '请检查输入数据格式是否正确'
      }])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
      setCopySuccess(true)
    } catch (error) {
      // 回退方法
      const textarea = document.createElement('textarea')
      textarea.value = output
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopySuccess(true)
    }
  }

  const handleDownload = () => {
    if (!output) return

    const blob = new Blob([output], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vps-test-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    if (confirm('确定要清除所有数据吗？')) {
      setInput('')
      setOutput('')
      setResult(null)
      setErrors([])
      setActiveTab('input')
      localStorage.removeItem('vps-spectra-input')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setInput(content)
      }
      reader.readAsText(file)
    }
  }

  if (!mounted) {
    return null // 避免hydration不匹配
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* 头部 */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  VPS-Spectra
                </h1>
                <p className="text-sm text-muted-foreground">VPS测试结果美化工具</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="切换主题"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 输入面板 */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>输入测试数据</span>
              </h2>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  title="上传文件"
                >
                  <Upload className="w-4 h-4" />
                </label>
                <button
                  onClick={handleClear}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="清除数据"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="请粘贴VPS测试结果数据..."
                className="w-full h-96 p-4 border rounded-lg bg-background resize-none focus:ring-2 focus:ring-primary focus:border-transparent custom-scrollbar"
              />
              {input && (
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                  {input.length} 字符
                </div>
              )}
            </div>

            {/* 处理按钮 */}
            <motion.button
              onClick={handleProcess}
              disabled={isProcessing || !input.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>处理中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>生成美化报告</span>
                </div>
              )}
            </motion.button>

            {/* 错误信息 */}
            <AnimatePresence>
              {errors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  {errors.map((error, index) => (
                    <div key={index} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-destructive">{error.message}</p>
                          {error.suggestion && (
                            <p className="text-xs text-muted-foreground mt-1">{error.suggestion}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 输出面板 */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>美化结果</span>
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="复制到剪贴板"
                >
                  {copySuccess ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="下载Markdown文件"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={output}
                readOnly
                placeholder="处理后的Markdown格式将在这里显示..."
                className="w-full h-96 p-4 border rounded-lg bg-muted/30 resize-none custom-scrollbar font-mono text-sm"
              />
              {output && (
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                  {output.length} 字符
                </div>
              )}
            </div>

            {/* 成功提示 */}
            <AnimatePresence>
              {copySuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <p className="text-sm text-green-700 dark:text-green-400">已复制到剪贴板</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 结果统计 */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">解析统计</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>CPU得分: {result.cpuTest.singleCore.score}/{result.cpuTest.multiCore.score}</div>
                  <div>内存速度: {result.memoryTest.singleThreadRead.speed.toFixed(0)}MB/s</div>
                  <div>服务器运行时间: {result.metadata.testTime}</div>
                  <div>融合怪版本: {result.metadata.version}</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* 功能说明 */}
        <motion.div
          className="mt-12 p-6 bg-muted/30 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4">使用说明</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">1. 粘贴数据</h4>
              <p>将VPS测试脚本的完整输出结果粘贴到左侧文本框中</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">2. 生成报告</h4>
              <p>点击"生成美化报告"按钮，系统将自动解析并美化数据</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">3. 复制分享</h4>
              <p>复制生成的Markdown格式结果，可直接在论坛或博客中使用</p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* 页脚 */}
      <footer className="border-t bg-background/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2024 VPS-Spectra. 专业的VPS测试结果美化工具</p>
            <div className="flex items-center space-x-4">
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="hover:text-foreground transition-colors">文档</a>
              <a href="#" className="hover:text-foreground transition-colors">反馈</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}