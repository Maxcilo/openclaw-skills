#!/usr/bin/env node
/**
 * 流动性监控图表生成器 v3.0
 * 使用持久化存储，生成单独图表和合并图表
 */

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { createCanvas, loadImage } = require('canvas');
const { updateStorage, getHistory } = require('./liquidity-storage.js');
const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.resolve(__dirname, '..');
const DATA_DIR = path.join(WORKSPACE, 'data');
const OUTPUT_DIR = path.join(DATA_DIR, 'charts');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function calculateNetLiquidity(rrp, reserves, tga) {
  const rrpT = rrp / 1000;
  const reservesT = reserves / 1000000;
  const tgaT = tga / 10000;
  return rrpT + reservesT - tgaT;
}

async function generateCharts() {
  // 更新数据
  await updateStorage();
  
  // 获取最近30天数据
  const history = getHistory(30);
  
  if (history.length < 2) {
    console.error('❌ 历史数据不足，无法生成图表');
    process.exit(1);
  }
  
  console.log(`\n📊 生成图表 (${history.length} 天数据)...`);
  
  const dates = history.map(h => h.date.slice(5)); // MM-DD
  const rrpData = history.map(h => parseFloat(h.rrp) * 10); // 转为亿
  const reservesData = history.map(h => parseFloat(h.reserves) / 1000000); // 转为万亿
  const sofrData = history.map(h => parseFloat(h.sofr));
  const tgaData = history.map(h => parseFloat(h.tga));
  const netLiquidityData = history.map(h => 
    calculateNetLiquidity(parseFloat(h.rrp), parseFloat(h.reserves), parseFloat(h.tga))
  );
  
  const width = 1200;
  const height = 800;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
  
  // 图表1: RRP + Reserves + TGA
  const config1 = {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'RRP (亿美元)',
          data: rrpData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          yAxisID: 'y',
          tension: 0.1
        },
        {
          label: 'Bank Reserves (万亿美元)',
          data: reservesData,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          yAxisID: 'y1',
          tension: 0.1
        },
        {
          label: 'TGA (亿美元)',
          data: tgaData,
          borderColor: 'rgb(255, 206, 86)',
          backgroundColor: 'rgba(255, 206, 86, 0.1)',
          yAxisID: 'y2',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: '美联储流动性监控 - 核心指标',
          font: { size: 20 }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'RRP (亿美元)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Reserves (万亿美元)'
          },
          grid: {
            drawOnChartArea: false
          }
        },
        y2: {
          type: 'linear',
          display: false,
          position: 'right'
        }
      }
    }
  };
  
  const image1 = await chartJSNodeCanvas.renderToBuffer(config1);
  const outputPath1 = path.join(OUTPUT_DIR, 'liquidity-core.png');
  fs.writeFileSync(outputPath1, image1);
  console.log('✅ 核心指标图表: ' + outputPath1);
  
  // 图表2: 净流动性
  const config2 = {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: '净流动性 (万亿美元)',
          data: netLiquidityData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: '净流动性趋势 (RRP + Reserves - TGA)',
          font: { size: 20 }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: '万亿美元'
          }
        }
      }
    }
  };
  
  const image2 = await chartJSNodeCanvas.renderToBuffer(config2);
  const outputPath2 = path.join(OUTPUT_DIR, 'liquidity-net.png');
  fs.writeFileSync(outputPath2, image2);
  console.log('✅ 净流动性图表: ' + outputPath2);
  
  // 图表3: SOFR
  const config3 = {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'SOFR (%)',
          data: sofrData,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          fill: true,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'SOFR 隔夜利率趋势',
          font: { size: 20 }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: '利率 (%)'
          }
        }
      }
    }
  };
  
  const image3 = await chartJSNodeCanvas.renderToBuffer(config3);
  const outputPath3 = path.join(OUTPUT_DIR, 'liquidity-sofr.png');
  fs.writeFileSync(outputPath3, image3);
  console.log('✅ SOFR图表: ' + outputPath3);
  
  // 合并3张图表
  console.log('\n📊 合并图表...');
  const [img1, img2, img3] = await Promise.all([
    loadImage(outputPath1),
    loadImage(outputPath2),
    loadImage(outputPath3)
  ]);
  
  const combinedWidth = Math.max(img1.width, img2.width, img3.width);
  const combinedHeight = img1.height + img2.height + img3.height + 40;
  
  const canvas = createCanvas(combinedWidth, combinedHeight);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, combinedWidth, combinedHeight);
  
  let y = 0;
  ctx.drawImage(img1, (combinedWidth - img1.width) / 2, y);
  y += img1.height + 20;
  ctx.drawImage(img2, (combinedWidth - img2.width) / 2, y);
  y += img2.height + 20;
  ctx.drawImage(img3, (combinedWidth - img3.width) / 2, y);
  
  const combinedBuffer = canvas.toBuffer('image/png');
  const combinedPath = path.join(OUTPUT_DIR, 'liquidity-combined.png');
  fs.writeFileSync(combinedPath, combinedBuffer);
  
  console.log('✅ 合并图表: ' + combinedPath);
  console.log('   尺寸: ' + combinedWidth + 'x' + combinedHeight);
  console.log('   大小: ' + (combinedBuffer.length / 1024).toFixed(1) + ' KB');
  
  console.log('\n📊 图表生成完成！');
  console.log('输出目录: ' + OUTPUT_DIR);
}

generateCharts().catch(e => {
  console.error('❌ 生成图表失败:', e.message);
  process.exit(1);
});
