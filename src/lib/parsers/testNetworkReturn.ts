import { parseNetworkReturnTestOptimized } from './networkReturnParser'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// 读取测试数据
const testData1 = readFileSync(resolve(__dirname, '../../public/row_result.txt'), 'utf-8')
const testData2 = readFileSync(resolve(__dirname, '../../public/row_result2.txt'), 'utf-8')

// 提取三网回程部分
const extractNetworkReturnSection = (input: string): string => {
  const startMarker = "上游及三网回程--基于oneclickvirt/backtrace开源"
  const endMarker = "回程路由--基于nexttrace开源"
  
  const startIndex = input.indexOf(startMarker)
  const endIndex = input.indexOf(endMarker)
  
  if (startIndex === -1) return ""
  if (endIndex === -1) return input.substring(startIndex)
  
  return input.substring(startIndex, endIndex)
}

const section1 = extractNetworkReturnSection(testData1)
const section2 = extractNetworkReturnSection(testData2)

console.log("=== 测试数据1解析结果 ===")
const errors1: any[] = []
const result1 = parseNetworkReturnTestOptimized(section1, errors1)
console.log("电信线路:")
result1.telecom.forEach(line => console.log(`  ${line}`))
console.log("联通线路:")
result1.unicom.forEach(line => console.log(`  ${line}`))
console.log("移动线路:")
result1.mobile.forEach(line => console.log(`  ${line}`))
console.log("错误:", errors1)

console.log("\n=== 测试数据2解析结果 ===")
const errors2: any[] = []
const result2 = parseNetworkReturnTestOptimized(section2, errors2)
console.log("电信线路:")
result2.telecom.forEach(line => console.log(`  ${line}`))
console.log("联通线路:")
result2.unicom.forEach(line => console.log(`  ${line}`))
console.log("移动线路:")
result2.mobile.forEach(line => console.log(`  ${line}`))
console.log("错误:", errors2)