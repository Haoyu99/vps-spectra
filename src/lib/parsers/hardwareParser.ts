import type { CpuTest, MemoryTest, DiskDdTest, DiskFioTest, ParseError } from '@/types'
import {
  evaluateCpuSingleCore,
  evaluateCpuMultiCore,
  evaluateCpuEfficiency,
  evaluateMemoryRead,
  evaluateMemoryWrite,
  evaluateMemoryOverall
} from '@/lib/evaluators'

/**
 * 硬件性能测试解析器
 * 负责解析CPU、内存、磁盘性能测试结果
 */

/**
 * 解析CPU测试结果
 * @param section CPU测试文本段落
 * @param errors 错误收集数组
 * @returns 解析后的CPU测试结果
 */
export function parseCpuTest(section: string, errors: ParseError[]): CpuTest {
  const lines = section.replace(/[\r]/g, '').split('\n').filter(line => line.trim() !== '');
  
  let singleScore = 0;
  let multiScore = 0;
  let threadCount = 1;

  try {
    for (const line of lines) {
      const singleMatch = line.match(/1\s*线程测试.*?(\d+)\s+Scores/);
      if (singleMatch) {
        singleScore = parseInt(singleMatch[1]);
        continue;
      }

      const multiMatch = line.match(/(\d+)\s*线程测试.*?(\d+)\s+Scores/);
      if (multiMatch && parseInt(multiMatch[1]) > 1) {
        threadCount = parseInt(multiMatch[1]);
        multiScore = parseInt(multiMatch[2]);
      }
    }

    const efficiency = singleScore > 0 ? multiScore / (singleScore * threadCount) : 0;

    return {
      singleCore: {
        score: singleScore,
        rating: evaluateCpuSingleCore(singleScore)
      },
      multiCore: {
        score: multiScore,
        threads: threadCount,
        rating: evaluateCpuMultiCore(multiScore, singleScore, threadCount),
        efficiency: efficiency,
        efficiencyRating: evaluateCpuEfficiency(efficiency)
      }
    };
  } catch (error) {
    errors.push({
      section: 'cpuTest',
      message: 'CPU测试结果解析失败',
      suggestion: '请检查CPU测试数据格式'
    });
    throw error;
  }
}

/**
 * 解析内存测试结果
 * @param section 内存测试文本段落
 * @param errors 错误收集数组
 * @returns 解析后的内存测试结果
 */
export function parseMemoryTest(section: string, errors: ParseError[]): MemoryTest {
  const lines = section.replace(/[\r]/g, '').split('\n').filter(line => line.trim() !== '');
  
  let readSpeed = 0;
  let writeSpeed = 0;

  try {
    for (const line of lines) {
      const readMatch = line.match(/单线程读测试.*?([0-9.]+)\s*MB\/s/);
      if (readMatch) {
        readSpeed = parseFloat(readMatch[1]);
        continue;
      }

      const writeMatch = line.match(/单线程写测试.*?([0-9.]+)\s*MB\/s/);
      if (writeMatch) {
        writeSpeed = parseFloat(writeMatch[1]);
      }
    }

    return {
      singleThreadRead: {
        speed: readSpeed,
        rating: evaluateMemoryRead(readSpeed)
      },
      singleThreadWrite: {
        speed: writeSpeed,
        rating: evaluateMemoryWrite(writeSpeed)
      },
      overallRating: evaluateMemoryOverall(readSpeed, writeSpeed)
    };
  } catch (error) {
    errors.push({
      section: 'memoryTest',
      message: '内存测试结果解析失败',
      suggestion: '请检查内存测试数据格式'
    });
    throw error;
  }
}

/**
 * 解析磁盘DD测试结果
 * @param section 磁盘DD测试文本段落
 * @param errors 错误收集数组
 * @returns 解析后的磁盘DD测试结果
 */
export function parseDiskDdTest(section: string, errors: ParseError[]): DiskDdTest {
  const lines = section.replace(/[\r]/g, '').split('\n').filter(line => line.trim() !== '');
  const tests: DiskDdTest['tests'] = [];

  try {
    for (const line of lines) {
      if (line.includes('Block') && (line.includes('MB/s') || line.includes('GB/s'))) {
        const operationMatch = line.match(/(.+?Block)/);
        if (!operationMatch) continue;
        
        const operation = operationMatch[1].trim();
        
        const speedMatches = line.match(/([0-9.]+\s*[GM]?B\/s\s*\([^)]+\))/g);
        
        if (speedMatches && speedMatches.length >= 2) {
          const writeInfo = speedMatches[0];
          const readInfo = speedMatches[1];
          
          const writeSpeedMatch = writeInfo.match(/([0-9.]+\s*[GM]?B\/s)/);
          const writeIOPSMatch = writeInfo.match(/\(([\d.]+)\s*IOPS/);
          const writeTimeMatch = writeInfo.match(/([0-9.]+s)\)/);
          
          const readSpeedMatch = readInfo.match(/([0-9.]+\s*[GM]?B\/s)/);
          const readIOPSMatch = readInfo.match(/\(([\d.]+)\s*IOPS/);
          const readTimeMatch = readInfo.match(/([0-9.]+s)\)/);

          tests.push({
            operation,
            writeSpeed: writeSpeedMatch ? writeSpeedMatch[1] : undefined,
            writeIOPS: writeIOPSMatch ? writeIOPSMatch[1] + ' IOPS' : undefined,
            writeTime: writeTimeMatch ? writeTimeMatch[1] : undefined,
            readSpeed: readSpeedMatch ? readSpeedMatch[1] : undefined,
            readIOPS: readIOPSMatch ? readIOPSMatch[1] + ' IOPS' : undefined,
            readTime: readTimeMatch ? readTimeMatch[1] : undefined
          });
        }
      }
    }

    return { tests };
  } catch (error) {
    errors.push({
      section: 'diskDdTest',
      message: '磁盘DD测试结果解析失败',
      suggestion: '请检查磁盘DD测试数据格式'
    });
    return { tests: [] };
  }
}

/**
 * 解析磁盘FIO测试结果
 * @param section 磁盘FIO测试文本段落
 * @param errors 错误收集数组
 * @returns 解析后的磁盘FIO测试结果
 */
export function parseDiskFioTest(section: string, errors: ParseError[]): DiskFioTest {
  const lines = section.split('\n').filter(line => line.trim() !== '')
  const tests: DiskFioTest['tests'] = []
  
  try {
    let currentBlockSizes: string[] = []
    let currentReadData: Array<{speed: number, iops: number}> = []
    let currentWriteData: Array<{speed: number, iops: number}> = []
    let currentTotalData: Array<{speed: number, iops: number}> = []
    
    for (const line of lines) {
      // 解析块大小表头行
      const blockSizeMatch = line.match(/Block Size\s*\|\s*([^|]+)\s*\|\s*([^|]+)/)
      if (blockSizeMatch) {
        // 如果之前有数据，先保存
        if (currentBlockSizes.length > 0 && currentReadData.length > 0) {
          for (let i = 0; i < Math.min(currentBlockSizes.length, 2); i++) {
            tests.push({
              blockSize: currentBlockSizes[i],
              read: currentReadData[i] || {speed: 0, iops: 0},
              write: currentWriteData[i] || {speed: 0, iops: 0},
              total: currentTotalData[i] || {speed: 0, iops: 0}
            })
          }
        }
        
        // 重置并提取新的块大小信息
        const size1 = blockSizeMatch[1].trim().replace(/\s*\(IOPS\)/, '')
        const size2 = blockSizeMatch[2].trim().replace(/\s*\(IOPS\)/, '')
        currentBlockSizes = [size1, size2]
        currentReadData = []
        currentWriteData = []
        currentTotalData = []
        continue
      }

      // 跳过分隔线和空行
      if (line.includes('------') || line.trim() === '' || line.includes('|') && !line.match(/\d/)) {
        continue
      }

      // 解析数据行
      const dataMatch = line.match(/(Read|Write|Total)\s*\|\s*([0-9.]+\s*[GM]?B\/s)\s*\(([0-9.]+k?)\)\s*\|\s*([0-9.]+\s*[GM]?B\/s)\s*\(([0-9.]+k?)\)/)
      if (dataMatch) {
        const operation = dataMatch[1]
        
        // 解析第一列数据
        const speed1Str = dataMatch[2]
        const speed1 = parseFloat(speed1Str) * (speed1Str.includes('GB') ? 1000 : 1)
        const iops1 = parseFloat(dataMatch[3].replace('k', '')) * (dataMatch[3].includes('k') ? 1000 : 1)
        
        // 解析第二列数据
        const speed2Str = dataMatch[4]
        const speed2 = parseFloat(speed2Str) * (speed2Str.includes('GB') ? 1000 : 1)
        const iops2 = parseFloat(dataMatch[5].replace('k', '')) * (dataMatch[5].includes('k') ? 1000 : 1)

        // 根据操作类型存储数据
        if (operation === 'Read') {
          currentReadData = [{speed: speed1, iops: iops1}, {speed: speed2, iops: iops2}]
        } else if (operation === 'Write') {
          currentWriteData = [{speed: speed1, iops: iops1}, {speed: speed2, iops: iops2}]
        } else if (operation === 'Total') {
          currentTotalData = [{speed: speed1, iops: iops1}, {speed: speed2, iops: iops2}]
        }
      }
    }

    // 处理最后一组数据
    if (currentBlockSizes.length > 0 && currentReadData.length > 0) {
      for (let i = 0; i < Math.min(currentBlockSizes.length, 2); i++) {
        tests.push({
          blockSize: currentBlockSizes[i],
          read: currentReadData[i] || {speed: 0, iops: 0},
          write: currentWriteData[i] || {speed: 0, iops: 0},
          total: currentTotalData[i] || {speed: 0, iops: 0}
        })
      }
    }

    return {
      tests
    }
  } catch (error) {
    errors.push({
      section: 'diskFioTest',
      message: '磁盘FIO测试结果解析失败',
      suggestion: '请检查磁盘FIO测试数据格式'
    })
    return {
      tests: []
    }
  }
}