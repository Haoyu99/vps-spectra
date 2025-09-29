import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VPS-Spectra | VPS测试结果美化工具',
  description: '将VPS基准测试数据转换为美观的Markdown格式，支持Obsidian callout语法，适合论坛分享',
  keywords: ['VPS', '基准测试', 'Markdown', 'Obsidian', '论坛分享'],
  authors: [{ name: 'VPS-Spectra Team' }],
  creator: 'VPS-Spectra Team',
  publisher: 'VPS-Spectra',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://vps-spectra.vercel.app',
    title: 'VPS-Spectra | VPS测试结果美化工具',
    description: '将VPS基准测试数据转换为美观的Markdown格式，支持Obsidian callout语法',
    siteName: 'VPS-Spectra',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VPS-Spectra | VPS测试结果美化工具',
    description: '将VPS基准测试数据转换为美观的Markdown格式，支持Obsidian callout语法',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}