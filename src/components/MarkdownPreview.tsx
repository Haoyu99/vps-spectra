'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Copy, Download, CheckCircle,
  Info, AlertCircle, AlertTriangle, CheckCircle2, 
  XCircle, Flame, HelpCircle, Lightbulb, Bug,
  ListChecks, Quote, FileText, Zap, ClipboardList,
  List, ChevronRight
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { Components } from 'react-markdown'

interface MarkdownPreviewProps {
  isOpen: boolean
  onClose: () => void
  markdown: string
}

interface TocItem {
  id: string
  text: string
  level: number
  children?: TocItem[]
}

interface FlatTocItem {
  id: string
  text: string
  level: number
}

export default function MarkdownPreview({ isOpen, onClose, markdown }: MarkdownPreviewProps) {
  const [copySuccess, setCopySuccess] = useState(false)
  const [showToc, setShowToc] = useState(true)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const contentRef = useRef<HTMLDivElement>(null)

  // ESC键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // 重置复制状态
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copySuccess])

  // 渲染完成后处理 callout 和生成目录
  useEffect(() => {
    if (!isOpen || !contentRef.current) return

    const calloutData = (globalThis as any).__calloutData || {}
    const calloutPlaceholders = contentRef.current.querySelectorAll('[data-callout-id]')
    
    calloutPlaceholders.forEach((placeholder: Element) => {
      const calloutId = placeholder.getAttribute('data-callout-id')
      if (!calloutId || !calloutData[calloutId]) return

      const data = calloutData[calloutId]
      const calloutElement = createCalloutElement(data.type, data.title, data.content)
      placeholder.replaceWith(calloutElement)
    })

    // 生成目录
    generateTableOfContents()

    // 清理
    return () => {
      if ((globalThis as any).__calloutData) {
        delete (globalThis as any).__calloutData
      }
    }
  }, [isOpen, markdown])

  // 生成目录
  const generateTableOfContents = () => {
    if (!contentRef.current) return

    const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const flatItems: FlatTocItem[] = []

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1))
      const text = heading.textContent || ''
      const id = `heading-${index}`
      
      // 为标题添加 ID
      heading.id = id
      
      flatItems.push({ id, text, level })
    })

    // 构建树形结构
    const tree = buildTocTree(flatItems)
    setTocItems(tree)
    
    // 默认展开到二级标题
    const defaultExpanded = new Set<string>()
    tree.forEach(item => {
      // 展开一级标题
      defaultExpanded.add(item.id)
      // 如果有二级标题，也展开
      if (item.children && item.children.length > 0) {
        item.children.forEach(child => {
          if (child.level === 2) {
            // 二级标题本身不需要展开，但其父级（一级）已展开
          }
        })
      }
    })
    setExpandedItems(defaultExpanded)
  }

  // 构建树形目录结构
  const buildTocTree = (flatItems: FlatTocItem[]): TocItem[] => {
    const tree: TocItem[] = []
    const stack: TocItem[] = []

    flatItems.forEach((item) => {
      const tocItem: TocItem = { ...item, children: [] }

      // 找到合适的父节点
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop()
      }

      if (stack.length === 0) {
        // 顶级节点
        tree.push(tocItem)
      } else {
        // 添加为子节点
        const parent = stack[stack.length - 1]
        if (!parent.children) parent.children = []
        parent.children.push(tocItem)
      }

      stack.push(tocItem)
    })

    return tree
  }

  // 切换展开/收起
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // 滚动到指定标题
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 渲染目录项
  const renderTocItem = (item: TocItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)

    return (
      <div key={item.id}>
        <div className="flex items-center gap-1 group">
          {/* 展开/收起按钮 */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(item.id)}
              className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0"
              title={isExpanded ? "收起" : "展开"}
            >
              <ChevronRight 
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* 标题文本 */}
          <button
            onClick={() => scrollToHeading(item.id)}
            className="flex-1 text-left text-sm hover:text-primary transition-colors py-1 leading-relaxed"
            style={{ paddingLeft: `${depth * 12}px` }}
          >
            <span className="line-clamp-2">
              {item.text}
            </span>
          </button>
        </div>

        {/* 子项 */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-2">
                {item.children!.map((child) => renderTocItem(child, depth + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopySuccess(true)
    } catch (error) {
      const textarea = document.createElement('textarea')
      textarea.value = markdown
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopySuccess(true)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vps-test-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 预处理 Markdown，将 Obsidian callout 转换为 HTML
  const processedMarkdown = preprocessObsidianCallouts(markdown)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-background border rounded-lg shadow-2xl z-50 flex flex-col"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="text-lg font-semibold">Markdown 预览</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowToc(!showToc)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title={showToc ? "隐藏目录" : "显示目录"}
                >
                  <List className="w-4 h-4" />
                </button>
                
                {/* 复制按钮和提示 */}
                <div className="relative">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="复制到剪贴板"
                  >
                    {copySuccess ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* 复制成功提示 */}
                  <AnimatePresence>
                    {copySuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 px-3 py-2 bg-green-500 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>已复制到剪贴板</span>
                        </div>
                        {/* 小箭头 */}
                        <div className="absolute -top-1 right-3 w-2 h-2 bg-green-500 transform rotate-45"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="下载Markdown文件"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="关闭 (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* 目录侧边栏 - 使用绝对定位避免影响布局 */}
              <AnimatePresence>
                {showToc && tocItems.length > 0 && (
                  <motion.div
                    initial={{ x: -280 }}
                    animate={{ x: 0 }}
                    exit={{ x: -280 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="absolute left-0 top-0 bottom-0 w-[280px] border-r bg-background z-10 shadow-lg"
                  >
                    <div className="p-4 h-full overflow-y-auto custom-scrollbar">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          目录
                        </h4>
                        {tocItems.length > 0 && (
                          <button
                            onClick={() => {
                              if (expandedItems.size > 0) {
                                setExpandedItems(new Set())
                              } else {
                                // 展开所有一级标题
                                const allIds = new Set<string>()
                                tocItems.forEach(item => {
                                  allIds.add(item.id)
                                  if (item.children) {
                                    item.children.forEach(child => allIds.add(child.id))
                                  }
                                })
                                setExpandedItems(allIds)
                              }
                            }}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            {expandedItems.size > 0 ? '全部收起' : '全部展开'}
                          </button>
                        )}
                      </div>
                      <nav className="space-y-0.5">
                        {tocItems.map((item) => renderTocItem(item, 0))}
                      </nav>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 主内容区域 - 添加左侧 padding 的过渡 */}
              <motion.div 
                className="flex-1 overflow-y-auto custom-scrollbar"
                style={{ paddingTop: '24px', paddingRight: '24px', paddingBottom: '24px' }}
                animate={{ 
                  paddingLeft: showToc && tocItems.length > 0 ? 304 : 24
                }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              >
                <div 
                  ref={contentRef}
                  className="prose prose-slate dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-6
                  prose-h1:text-3xl prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b
                  prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                  prose-h4:text-lg prose-h4:mt-5 prose-h4:mb-2
                  prose-h5:text-base prose-h5:mt-4 prose-h5:mb-2
                  prose-h6:text-sm prose-h6:mt-3 prose-h6:mb-1
                  prose-p:leading-relaxed prose-p:my-3
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:font-semibold prose-strong:text-foreground
                  prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                  prose-ul:my-4 prose-ol:my-4
                  prose-li:my-1
                  prose-table:border-collapse prose-table:w-full prose-table:my-6
                  prose-th:border prose-th:p-3 prose-th:bg-muted prose-th:font-semibold prose-th:text-left
                  prose-td:border prose-td:p-3
                  prose-hr:my-8 prose-hr:border-t-2
                  prose-img:rounded-lg prose-img:shadow-md">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={customComponents}
                  >
                    {processedMarkdown}
                  </ReactMarkdown>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Obsidian callout 配置
const CALLOUT_TYPES: Record<string, { 
  icon: any; 
  color: string; 
  bgColor: string;
  borderColor: string;
  iconColor: string;
}> = {
  note: {
    icon: FileText,
    color: 'rgb(68, 138, 255)',
    bgColor: 'rgba(68, 138, 255, 0.1)',
    borderColor: 'rgb(68, 138, 255)',
    iconColor: 'rgb(68, 138, 255)'
  },
  abstract: {
    icon: ClipboardList,
    color: 'rgb(0, 191, 165)',
    bgColor: 'rgba(0, 191, 165, 0.1)',
    borderColor: 'rgb(0, 191, 165)',
    iconColor: 'rgb(0, 191, 165)'
  },
  summary: {
    icon: ClipboardList,
    color: 'rgb(0, 191, 165)',
    bgColor: 'rgba(0, 191, 165, 0.1)',
    borderColor: 'rgb(0, 191, 165)',
    iconColor: 'rgb(0, 191, 165)'
  },
  tldr: {
    icon: ClipboardList,
    color: 'rgb(0, 191, 165)',
    bgColor: 'rgba(0, 191, 165, 0.1)',
    borderColor: 'rgb(0, 191, 165)',
    iconColor: 'rgb(0, 191, 165)'
  },
  info: {
    icon: Info,
    color: 'rgb(68, 138, 255)',
    bgColor: 'rgba(68, 138, 255, 0.1)',
    borderColor: 'rgb(68, 138, 255)',
    iconColor: 'rgb(68, 138, 255)'
  },
  todo: {
    icon: ListChecks,
    color: 'rgb(68, 138, 255)',
    bgColor: 'rgba(68, 138, 255, 0.1)',
    borderColor: 'rgb(68, 138, 255)',
    iconColor: 'rgb(68, 138, 255)'
  },
  tip: {
    icon: Flame,
    color: 'rgb(0, 191, 165)',
    bgColor: 'rgba(0, 191, 165, 0.1)',
    borderColor: 'rgb(0, 191, 165)',
    iconColor: 'rgb(0, 191, 165)'
  },
  hint: {
    icon: Flame,
    color: 'rgb(0, 191, 165)',
    bgColor: 'rgba(0, 191, 165, 0.1)',
    borderColor: 'rgb(0, 191, 165)',
    iconColor: 'rgb(0, 191, 165)'
  },
  important: {
    icon: Flame,
    color: 'rgb(0, 191, 165)',
    bgColor: 'rgba(0, 191, 165, 0.1)',
    borderColor: 'rgb(0, 191, 165)',
    iconColor: 'rgb(0, 191, 165)'
  },
  success: {
    icon: CheckCircle2,
    color: 'rgb(0, 200, 83)',
    bgColor: 'rgba(0, 200, 83, 0.1)',
    borderColor: 'rgb(0, 200, 83)',
    iconColor: 'rgb(0, 200, 83)'
  },
  check: {
    icon: CheckCircle2,
    color: 'rgb(0, 200, 83)',
    bgColor: 'rgba(0, 200, 83, 0.1)',
    borderColor: 'rgb(0, 200, 83)',
    iconColor: 'rgb(0, 200, 83)'
  },
  done: {
    icon: CheckCircle2,
    color: 'rgb(0, 200, 83)',
    bgColor: 'rgba(0, 200, 83, 0.1)',
    borderColor: 'rgb(0, 200, 83)',
    iconColor: 'rgb(0, 200, 83)'
  },
  question: {
    icon: HelpCircle,
    color: 'rgb(236, 117, 0)',
    bgColor: 'rgba(236, 117, 0, 0.1)',
    borderColor: 'rgb(236, 117, 0)',
    iconColor: 'rgb(236, 117, 0)'
  },
  help: {
    icon: HelpCircle,
    color: 'rgb(236, 117, 0)',
    bgColor: 'rgba(236, 117, 0, 0.1)',
    borderColor: 'rgb(236, 117, 0)',
    iconColor: 'rgb(236, 117, 0)'
  },
  faq: {
    icon: HelpCircle,
    color: 'rgb(236, 117, 0)',
    bgColor: 'rgba(236, 117, 0, 0.1)',
    borderColor: 'rgb(236, 117, 0)',
    iconColor: 'rgb(236, 117, 0)'
  },
  warning: {
    icon: AlertTriangle,
    color: 'rgb(236, 117, 0)',
    bgColor: 'rgba(236, 117, 0, 0.1)',
    borderColor: 'rgb(236, 117, 0)',
    iconColor: 'rgb(236, 117, 0)'
  },
  caution: {
    icon: AlertTriangle,
    color: 'rgb(236, 117, 0)',
    bgColor: 'rgba(236, 117, 0, 0.1)',
    borderColor: 'rgb(236, 117, 0)',
    iconColor: 'rgb(236, 117, 0)'
  },
  attention: {
    icon: AlertTriangle,
    color: 'rgb(236, 117, 0)',
    bgColor: 'rgba(236, 117, 0, 0.1)',
    borderColor: 'rgb(236, 117, 0)',
    iconColor: 'rgb(236, 117, 0)'
  },
  failure: {
    icon: XCircle,
    color: 'rgb(233, 49, 71)',
    bgColor: 'rgba(233, 49, 71, 0.1)',
    borderColor: 'rgb(233, 49, 71)',
    iconColor: 'rgb(233, 49, 71)'
  },
  fail: {
    icon: XCircle,
    color: 'rgb(233, 49, 71)',
    bgColor: 'rgba(233, 49, 71, 0.1)',
    borderColor: 'rgb(233, 49, 71)',
    iconColor: 'rgb(233, 49, 71)'
  },
  missing: {
    icon: XCircle,
    color: 'rgb(233, 49, 71)',
    bgColor: 'rgba(233, 49, 71, 0.1)',
    borderColor: 'rgb(233, 49, 71)',
    iconColor: 'rgb(233, 49, 71)'
  },
  danger: {
    icon: Zap,
    color: 'rgb(233, 49, 71)',
    bgColor: 'rgba(233, 49, 71, 0.1)',
    borderColor: 'rgb(233, 49, 71)',
    iconColor: 'rgb(233, 49, 71)'
  },
  error: {
    icon: Zap,
    color: 'rgb(233, 49, 71)',
    bgColor: 'rgba(233, 49, 71, 0.1)',
    borderColor: 'rgb(233, 49, 71)',
    iconColor: 'rgb(233, 49, 71)'
  },
  bug: {
    icon: Bug,
    color: 'rgb(233, 49, 71)',
    bgColor: 'rgba(233, 49, 71, 0.1)',
    borderColor: 'rgb(233, 49, 71)',
    iconColor: 'rgb(233, 49, 71)'
  },
  example: {
    icon: ListChecks,
    color: 'rgb(124, 77, 255)',
    bgColor: 'rgba(124, 77, 255, 0.1)',
    borderColor: 'rgb(124, 77, 255)',
    iconColor: 'rgb(124, 77, 255)'
  },
  quote: {
    icon: Quote,
    color: 'rgb(158, 158, 158)',
    bgColor: 'rgba(158, 158, 158, 0.1)',
    borderColor: 'rgb(158, 158, 158)',
    iconColor: 'rgb(158, 158, 158)'
  },
  cite: {
    icon: Quote,
    color: 'rgb(158, 158, 158)',
    bgColor: 'rgba(158, 158, 158, 0.1)',
    borderColor: 'rgb(158, 158, 158)',
    iconColor: 'rgb(158, 158, 158)'
  }
}

// 预处理 Obsidian callout 语法
function preprocessObsidianCallouts(markdown: string): string {
  const lines = markdown.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    
    // 检测 callout 开始
    const calloutMatch = line.match(/^>\s*\[!(\w+)\]\s*(.*)$/)
    if (calloutMatch) {
      const [, type, title] = calloutMatch
      
      // 收集 callout 内容
      const contentLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const content = lines[i].replace(/^>\s*/, '')
        contentLines.push(content)
        i++
      }
      
      // 生成 HTML callout，使用特殊标记以便后续处理
      const calloutId = `CALLOUT_${Math.random().toString(36).substr(2, 9)}`
      const calloutData = {
        id: calloutId,
        type: type.toLowerCase(),
        title,
        content: contentLines.join('\n')
      }
      
      // 暂存 callout 数据
      if (!(globalThis as any).__calloutData) {
        (globalThis as any).__calloutData = {}
      }
      (globalThis as any).__calloutData[calloutId] = calloutData
      
      result.push(`<div data-callout-id="${calloutId}"></div>`)
      continue
    }
    
    result.push(line)
    i++
  }
  
  return result.join('\n')
}

// 创建 callout DOM 元素
function createCalloutElement(type: string, title: string, content: string): HTMLElement {
  const config = CALLOUT_TYPES[type] || CALLOUT_TYPES.note
  
  // 创建容器
  const container = document.createElement('div')
  container.className = 'obsidian-callout'
  container.style.cssText = `
    background-color: ${config.bgColor};
    border-left: 4px solid ${config.borderColor};
    border-radius: 4px;
    padding: 12px 12px 12px 24px;
    margin: 1em 0;
  `
  
  // 创建标题区域
  const titleDiv = document.createElement('div')
  titleDiv.className = 'callout-title'
  titleDiv.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: ${config.color};
    margin-bottom: ${content ? '8px' : '0'};
  `
  
  // 创建图标
  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  iconSvg.setAttribute('width', '16')
  iconSvg.setAttribute('height', '16')
  iconSvg.setAttribute('viewBox', '0 0 24 24')
  iconSvg.setAttribute('fill', 'none')
  iconSvg.setAttribute('stroke', 'currentColor')
  iconSvg.setAttribute('stroke-width', '2')
  iconSvg.setAttribute('stroke-linecap', 'round')
  iconSvg.setAttribute('stroke-linejoin', 'round')
  iconSvg.style.color = config.iconColor
  iconSvg.innerHTML = getIconPath(type)
  
  // 创建标题文本
  const titleSpan = document.createElement('span')
  titleSpan.textContent = title || type.charAt(0).toUpperCase() + type.slice(1)
  
  titleDiv.appendChild(iconSvg)
  titleDiv.appendChild(titleSpan)
  container.appendChild(titleDiv)
  
  // 创建内容区域
  if (content) {
    const contentDiv = document.createElement('div')
    contentDiv.className = 'callout-content prose prose-sm dark:prose-invert'
    
    // 渲染 Markdown 内容
    const renderedContent = renderInlineMarkdown(content)
    contentDiv.innerHTML = renderedContent
    
    container.appendChild(contentDiv)
  }
  
  return container
}

// 渲染行内 Markdown（粗体、斜体、链接、代码）
function renderInlineMarkdown(text: string): string {
  let html = text
  
  // 处理链接 [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>')
  
  // 处理粗体 **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  
  // 处理斜体 *text*
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
  
  // 处理行内代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
  
  // 处理换行
  html = html.replace(/\n/g, '<br>')
  
  return html
}

// 获取图标的 SVG 路径
function getIconPath(type: string): string {
  const paths: Record<string, string> = {
    note: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    danger: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    bug: '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
    question: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    tip: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    example: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
    todo: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    abstract: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>'
  }
  
  // 别名映射
  const aliases: Record<string, string> = {
    summary: 'abstract',
    tldr: 'abstract',
    hint: 'tip',
    important: 'tip',
    check: 'success',
    done: 'success',
    help: 'question',
    faq: 'question',
    caution: 'warning',
    attention: 'warning',
    failure: 'danger',
    fail: 'danger',
    missing: 'danger',
    error: 'danger',
    cite: 'quote'
  }
  
  const iconType = aliases[type] || type
  return paths[iconType] || paths.note
}

// 自定义组件
const customComponents: Components = {
  // 自定义表格样式
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border-collapse" {...props} />
    </div>
  ),
  // 自定义代码块
  code: ({ node, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    const isInline = !match
    
    if (isInline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  },
  // 自定义分割线
  hr: ({ node, ...props }) => (
    <hr className="my-8 border-t-2 border-border" {...props} />
  ),
}
