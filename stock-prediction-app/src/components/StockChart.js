import StockApi from '../services/StockApi.js';

export default {
  props: {
    symbol: {
      type: String,
      default: ''
    },
    timeRange: {
      type: String,
      default: '1m'
    },
    predictionData: {
      type: Array,
      default: () => []
    },
    showPrediction: {
      type: Boolean,
      default: false
    }
  },
  template: `
    <div class="stock-chart">
      <div ref="chartContainer" class="chart-container"></div>
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">加载数据中...</div>
      </div>
    </div>
  `,
  data() {
    return {
      loading: true,
      chartInstance: null,
      stockData: [],
      chartOptions: {
        chart: {
          type: 'area',
          height: 350,
          zoom: {
            enabled: true
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 2
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 90, 100]
          }
        },
        tooltip: {
          x: {
            format: 'yyyy-MM-dd'
          }
        },
        xaxis: {
          type: 'datetime'
        },
        yaxis: {
          tooltip: {
            enabled: true
          }
        },
        legend: {
          position: 'top'
        }
      }
    };
  },
  mounted() {
    this.initChart();
    if (this.symbol) {
      this.fetchData();
    }
  },
  watch: {
    symbol(newSymbol) {
      if (newSymbol) {
        this.fetchData();
      }
    },
    timeRange() {
      if (this.symbol) {
        this.fetchData();
      }
    },
    predictionData: {
      handler(newData) {
        if (newData && newData.length > 0) {
          this.updatePredictionData();
        }
      },
      deep: true
    }
  },
  methods: {
    initChart() {
      // 在实际应用中，我们会引入ApexCharts库
      // 这里使用模拟的方式展示图表
      console.log('初始化图表');
      
      // 模拟加载完成
      setTimeout(() => {
        this.loading = false;
        
        // 创建一个模拟的图表元素
        const chartElement = document.createElement('div');
        chartElement.className = 'mock-chart';
        chartElement.innerHTML = '<div class="chart-placeholder">股票图表区域 - ' + (this.symbol || '未选择股票') + '</div>';
        
        // 清空容器并添加图表
        const container = this.$refs.chartContainer;
        if (container) {
          container.innerHTML = '';
          container.appendChild(chartElement);
        }
      }, 1000);
    },
    async fetchData() {
      if (!this.symbol) return;
      
      this.loading = true;
      
      try {
        console.log('获取股票数据:', this.symbol, this.timeRange);
        
        // 根据时间范围确定请求参数
        const outputSize = this.getOutputSizeFromTimeRange();
        
        // 使用API服务获取真实数据
        const data = await StockApi.getDailyStockData(this.symbol, outputSize);
        
        // 过滤数据，仅保留指定时间范围内的数据
        this.stockData = this.filterDataByTimeRange(data);
        
        // 更新图表
        this.updateChart();
      } catch (error) {
        console.error('获取股票数据失败:', error);
        // 如果API请求失败，使用模拟数据作为后备方案
        this.stockData = this.generateMockData();
        this.updateChart();
      } finally {
        this.loading = false;
      }
    },
    getOutputSizeFromTimeRange() {
      // 根据时间范围确定请求数据量
      if (this.timeRange === '1d' || this.timeRange === '1w' || this.timeRange === '1m') {
        return 'compact'; // 近100天数据
      } else {
        return 'full'; // 完整数据，最多20年
      }
    },
    filterDataByTimeRange(data) {
      if (!data || !data.length) return [];
      
      const now = new Date();
      let daysAgo = 30; // 默认一个月
      
      if (this.timeRange === '1d') daysAgo = 1;
      if (this.timeRange === '1w') daysAgo = 7;
      if (this.timeRange === '3m') daysAgo = 90;
      if (this.timeRange === '1y') daysAgo = 365;
      if (this.timeRange === '5y') daysAgo = 365 * 5;
      
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      
      return data.filter(item => new Date(item.date) >= cutoffDate);
    },
    updateChart() {
      // 在实际应用中，这里会更新ApexCharts图表
      console.log('更新图表数据:', this.stockData.length + '个数据点');
      
      // 简单显示最新数据
      const container = this.$refs.chartContainer;
      if (container) {
        // 清空容器
        container.innerHTML = '';
        
        // 创建一个模拟的图表元素
        const chartElement = document.createElement('div');
        chartElement.className = 'mock-chart';
        
        // 创建一个简单的表格显示数据
        let content = `<div class="chart-title">${this.symbol} 股价数据</div>`;
        
        if (this.stockData.length > 0) {
          // 显示最新价格
          const latestData = this.stockData[this.stockData.length - 1];
          content += `<div class="latest-price">最新价: ¥${latestData.close.toFixed(2)}</div>`;
          
          // 创建简单的线图
          content += `<div class="simple-chart">`;
          // 这里创建一个非常简单的图表展示，实际应用中应该使用专业的图表库
          content += `<svg width="100%" height="200" style="background-color: #f9f9f9;">`;
          
          // 获取最高和最低价格，用于计算比例
          const prices = this.stockData.map(d => d.close);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const range = maxPrice - minPrice;
          
          // 绘制折线
          let path = '';
          this.stockData.forEach((dataPoint, index) => {
            const x = (index / (this.stockData.length - 1)) * 100;
            const y = 100 - ((dataPoint.close - minPrice) / range) * 80; // 80% 的高度用于图表
            
            if (index === 0) {
              path += `M${x},${y}`;
            } else {
              path += ` L${x},${y}`;
            }
          });
          
          content += `<path d="${path}" stroke="${latestData.close > this.stockData[0].close ? '#00C853' : '#FF5252'}" stroke-width="2" fill="none" />`;
          content += `</svg>`;
          content += `</div>`;
          
          // 添加数据表格
          content += `<table class="data-preview">`;
          content += `<tr><th>日期</th><th>开盘</th><th>最高</th><th>最低</th><th>收盘</th><th>成交量</th></tr>`;
          
          // 显示最新的5个数据点
          const recentData = this.stockData.slice(-5).reverse();
          recentData.forEach(dataPoint => {
            content += `<tr>
              <td>${dataPoint.date}</td>
              <td>${dataPoint.open.toFixed(2)}</td>
              <td>${dataPoint.high.toFixed(2)}</td>
              <td>${dataPoint.low.toFixed(2)}</td>
              <td>${dataPoint.close.toFixed(2)}</td>
              <td>${dataPoint.volume.toLocaleString()}</td>
            </tr>`;
          });
          
          content += `</table>`;
        } else {
          content += `<div class="no-data">暂无数据</div>`;
        }
        
        chartElement.innerHTML = content;
        container.appendChild(chartElement);
      }
      
      // 如果有预测数据，也添加到图表
      if (this.showPrediction && this.predictionData.length > 0) {
        this.updatePredictionData();
      }
    },
    updatePredictionData() {
      if (!this.showPrediction || !this.predictionData.length) return;
      
      console.log('添加预测数据到图表:', this.predictionData.length + '个数据点');
      
      // 在实际应用中，这里会在图表上添加预测数据系列
      const container = this.$refs.chartContainer;
      if (container) {
        const predictionElement = document.createElement('div');
        predictionElement.className = 'prediction-indicator';
        predictionElement.innerHTML = '<div class="prediction-label">包含预测数据</div>';
        
        // 检查是否已经添加了预测标签
        if (!container.querySelector('.prediction-indicator')) {
          container.appendChild(predictionElement);
        }
      }
    },
    generateMockData() {
      // 生成模拟的股票数据
      const data = [];
      const now = new Date();
      let days = 30; // 默认一个月
      
      if (this.timeRange === '1d') days = 1;
      if (this.timeRange === '1w') days = 7;
      if (this.timeRange === '3m') days = 90;
      if (this.timeRange === '1y') days = 365;
      if (this.timeRange === '5y') days = 365 * 5;
      
      let price = 100; // 初始价格
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // 生成随机价格波动
        const change = (Math.random() * 2 - 1) * 2; // -2% 到 +2% 的变化
        price = price * (1 + change / 100);
        
        // 为每天生成OHLC数据
        const dayData = {
          date: date.toISOString().split('T')[0],
          open: price * (1 - Math.random() * 0.01),
          high: price * (1 + Math.random() * 0.01),
          low: price * (1 - Math.random() * 0.01),
          close: price,
          volume: Math.floor(Math.random() * 10000000)
        };
        
        data.push(dayData);
      }
      
      return data;
    }
  }
}; 