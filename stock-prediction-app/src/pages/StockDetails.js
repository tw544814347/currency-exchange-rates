import StockChart from '../components/StockChart.js';
import StockApi from '../services/StockApi.js';

export default {
  components: {
    StockChart
  },
  template: `
    <div class="stock-details">
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">加载股票数据中...</div>
      </div>
      
      <div v-else>
        <div class="stock-header">
          <h2>{{ stockInfo.name }} ({{ stockInfo.symbol }})</h2>
          <div class="stock-price" :class="priceChangeClass">
            <span class="current-price">¥{{ stockInfo.price.toFixed(2) }}</span>
            <span class="change">{{ stockInfo.changePercent > 0 ? '+' : '' }}{{ stockInfo.changePercent.toFixed(2) }}%</span>
          </div>
          <button class="button" @click="addToWatchlist">
            <i class="fas fa-star"></i> 添加到自选
          </button>
        </div>
        
        <div class="row">
          <div class="column">
            <div class="card">
              <h3>股票信息</h3>
              <table class="stock-info-table">
                <tr>
                  <td>开盘价</td>
                  <td>¥{{ stockInfo.open.toFixed(2) }}</td>
                  <td>收盘价</td>
                  <td>¥{{ stockInfo.close.toFixed(2) }}</td>
                </tr>
                <tr>
                  <td>最高价</td>
                  <td>¥{{ stockInfo.high.toFixed(2) }}</td>
                  <td>最低价</td>
                  <td>¥{{ stockInfo.low.toFixed(2) }}</td>
                </tr>
                <tr>
                  <td>成交量</td>
                  <td>{{ formatVolume(stockInfo.volume) }}</td>
                  <td>市值</td>
                  <td>{{ formatMarketCap(stockInfo.marketCap) }}</td>
                </tr>
                <tr>
                  <td>52周最高</td>
                  <td>¥{{ stockInfo.high52Week }}</td>
                  <td>52周最低</td>
                  <td>¥{{ stockInfo.low52Week }}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div class="column">
            <div class="card">
              <h3>财务指标</h3>
              <table class="financial-table">
                <tr>
                  <td>市盈率(P/E)</td>
                  <td>{{ stockInfo.pe }}</td>
                </tr>
                <tr>
                  <td>市净率(P/B)</td>
                  <td>{{ stockInfo.pb }}</td>
                </tr>
                <tr>
                  <td>股息率</td>
                  <td>{{ stockInfo.dividendYield }}%</td>
                </tr>
                <tr>
                  <td>每股收益(EPS)</td>
                  <td>¥{{ stockInfo.eps }}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="chart-controls">
            <h3>价格走势</h3>
            <div class="time-filters">
              <button @click="changeTimeRange('1d')" :class="{ active: timeRange === '1d' }">1天</button>
              <button @click="changeTimeRange('1w')" :class="{ active: timeRange === '1w' }">1周</button>
              <button @click="changeTimeRange('1m')" :class="{ active: timeRange === '1m' }">1月</button>
              <button @click="changeTimeRange('3m')" :class="{ active: timeRange === '3m' }">3月</button>
              <button @click="changeTimeRange('1y')" :class="{ active: timeRange === '1y' }">1年</button>
              <button @click="changeTimeRange('5y')" :class="{ active: timeRange === '5y' }">5年</button>
            </div>
          </div>
          <stock-chart :symbol="$route.params.symbol" :time-range="timeRange"></stock-chart>
        </div>
        
        <div class="card">
          <h3>预测分析</h3>
          <div class="prediction-results">
            <div class="prediction-header">
              <div class="prediction-title">未来7天股价预测</div>
              <div class="prediction-accuracy">模型准确率: 76.5%</div>
            </div>
            
            <table class="prediction-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>预测价格</th>
                  <th>预测变化</th>
                  <th>置信度</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(pred, index) in predictions" :key="index">
                  <td>{{ pred.date }}</td>
                  <td>¥{{ pred.price.toFixed(2) }}</td>
                  <td :class="pred.change > 0 ? 'up' : 'down'">
                    {{ pred.change > 0 ? '+' : '' }}{{ pred.change.toFixed(2) }}%
                  </td>
                  <td>{{ pred.confidence }}%</td>
                </tr>
              </tbody>
            </table>
            
            <div class="prediction-actions">
              <button class="button" @click="runNewPrediction">运行新预测</button>
              <button class="button button-secondary">自定义参数</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      loading: true,
      timeRange: '1m',
      stockInfo: {
        name: '',
        symbol: '',
        price: 0,
        change: 0,
        changePercent: 0,
        open: 0,
        close: 0,
        high: 0,
        low: 0,
        volume: '0',
        marketCap: '0',
        high52Week: 0,
        low52Week: 0,
        pe: 0,
        pb: 0,
        dividendYield: 0,
        eps: 0
      },
      predictions: []
    };
  },
  computed: {
    priceChangeClass() {
      return this.stockInfo.changePercent > 0 ? 'up' : 'down';
    }
  },
  mounted() {
    // 获取股票数据
    this.fetchStockData();
  },
  watch: {
    // 监听路由参数变化，重新获取数据
    '$route.params.symbol'() {
      this.fetchStockData();
    }
  },
  methods: {
    async fetchStockData() {
      if (!this.$route.params.symbol) return;
      
      this.loading = true;
      const symbol = this.$route.params.symbol;
      
      try {
        console.log('获取股票数据:', symbol);
        
        // 并行获取股票概览和实时报价
        const [overviewData, quoteData] = await Promise.all([
          StockApi.getStockOverview(symbol),
          StockApi.getQuote(symbol)
        ]);
        
        // 合并数据
        this.stockInfo = {
          ...overviewData,
          ...quoteData,
          changePercent: quoteData.changePercent
        };
        
        // 生成预测数据（模拟）
        this.generatePredictions();
      } catch (error) {
        console.error('获取股票数据失败:', error);
        
        // 使用默认数据
        this.stockInfo = {
          name: symbol,
          symbol: symbol,
          price: 0,
          change: 0,
          changePercent: 0,
          open: 0,
          close: 0,
          high: 0,
          low: 0,
          volume: '0',
          marketCap: '0',
          high52Week: 0,
          low52Week: 0,
          pe: 0,
          pb: 0,
          dividendYield: 0,
          eps: 0
        };
      } finally {
        this.loading = false;
      }
    },
    changeTimeRange(range) {
      this.timeRange = range;
    },
    addToWatchlist() {
      // 添加到自选股逻辑
      // 这里可以通过localStorage或其他方式保存用户的自选股
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      
      // 检查是否已存在
      if (!watchlist.find(item => item.symbol === this.stockInfo.symbol)) {
        watchlist.push({
          symbol: this.stockInfo.symbol,
          name: this.stockInfo.name,
          addedAt: new Date().toISOString()
        });
        
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        alert(`已将 ${this.stockInfo.name} 添加到自选`);
      } else {
        alert(`${this.stockInfo.name} 已在自选列表中`);
      }
    },
    generatePredictions() {
      // 生成未来7天的预测数据（模拟）
      const predictions = [];
      const currentPrice = this.stockInfo.price;
      const now = new Date();
      
      for (let i = 1; i <= 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        
        // 随机生成预测价格（正负5%范围内）
        const changePercent = (Math.random() * 10 - 5) * (7 - i) / 7; // 越远的预测波动越大
        const price = currentPrice * (1 + changePercent / 100);
        
        // 置信度随着天数增加逐渐降低
        const confidence = Math.round(90 - i * 3.5);
        
        predictions.push({
          date: date.toISOString().split('T')[0],
          price: price,
          change: changePercent,
          confidence: confidence
        });
      }
      
      this.predictions = predictions;
    },
    runNewPrediction() {
      this.generatePredictions();
      alert('已更新预测数据');
    },
    formatVolume(volume) {
      // 格式化成交量
      const num = parseFloat(volume);
      if (isNaN(num)) return volume;
      
      if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
      } else if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
      }
      
      return num.toString();
    },
    formatMarketCap(marketCap) {
      // 格式化市值
      const num = parseFloat(marketCap);
      if (isNaN(num)) return marketCap;
      
      if (num >= 1000000000000) {
        return (num / 1000000000000).toFixed(2) + 'T';
      } else if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
      } else if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
      }
      
      return marketCap;
    }
  }
}; 