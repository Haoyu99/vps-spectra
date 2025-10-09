import type { NetworkReturnTest, ParseError } from '@/types'

/**
 * 专门解析三网回程测试结果的优化函数
 * 针对固定格式的输入数据进行优化
 */
export function parseNetworkReturnTestOptimized(section: string, errors: ParseError[]): NetworkReturnTest {
  const lines = section.split('\n').filter(line => line.trim() !== '')
  
  // 初始化结果
  const result: NetworkReturnTest = {
    telecom: [],
    unicom: [],
    mobile: []
  }

  try {
    // 分别收集各运营商的线路信息
    for (const line of lines) {
      // 跳过标题行、说明行和位置信息行
      if (
        line.includes('三网回程--基于') || 
        line.includes('准确线路') || 
        line.includes('同一目标地址') ||
        line.includes('检测可能已越过') ||
        (line.includes('国家:') && line.includes('城市:') && line.includes('服务商:'))
      ) {
        continue
      }

      // 根据关键词分类到不同的运营商
      if (line.includes("电信")) {
        result.telecom.push(line.trim())
      } else if (line.includes("联通")) {
        result.unicom.push(line.trim())
      } else if (line.includes("移动")) {
        result.mobile.push(line.trim())
      }
    }

    return result
  } catch (error) {
    errors.push({
      section: 'networkReturnTest',
      message: '三网回程测试结果解析失败',
      suggestion: '请检查三网回程测试数据格式'
    })
    return { telecom: [], unicom: [], mobile: [] }
  }
}


