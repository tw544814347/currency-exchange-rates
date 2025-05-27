import StockChart from '../components/StockChart.js';
import MarketOverview from '../components/MarketOverview.js';
import WatchList from '../components/WatchList.js';
import StockApi from '../services/StockApi.js';

export default {
  components: {
    StockChart,
    MarketOverview,
    WatchList
  },
  template: `
    <div class="dashboard-container">
      <h2 class="page-title">市场概览</h2>
      
      <div class="market-summary">
        <div class="card">
          <h3>市场指数</h3>
          <div v-if="loadingIndices" class="loading-container">
            <div class="spinner"></div>
            <span>加载中...</span>
          </div>
          <div v-else class="index-list">
            <div v-for="(index, i) in marketIndices" :key="i" :class="['index-item', index.change > 0 ? 'up' : 'down']">
              <span class="index-name">{{ index.name }}</span>
              <span class="index-value">{{ formatNumber(index.value) }}</span>
              <span class="index-change">{{ index.change > 0 ? '+' : '' }}{{ index.change.toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="column">
          <div class="card">
            <h3>热门股票</h3>
            <market-overview></market-overview>
          </div>
        </div>
        <div class="column">
          <div class="card">
            <h3>我的自选</h3>
            <watch-list></watch-list>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>预测模型表现</h3>
        <div class="model-performance">
          <div class="model-item">
            <h4>LSTM模型</h4>
            <div class="performance-stats">
              <div class="stat">
                <span class="stat-label">准确率</span>
                <span class="stat-value">78.5%</span>
              </div>
              <div class="stat">
                <span class="stat-label">误差率</span>
                <span class="stat-value">3.2%</span>
              </div>
            </div>
          </div>
          <div class="model-item">
            <h4>ARIMA模型</h4>
            <div class="performance-stats">
              <div class="stat">
                <span class="stat-label">准确率</span>
                <span class="stat-value">72.1%</span>
              </div>
              <div class="stat">
                <span class="stat-label">误差率</span>
                <span class="stat-value">4.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>最近预测</h3>
        <stock-chart symbol="AAPL" time-range="1m"></stock-chart>
      </div>
    </div>
  `,
  data() {
    return {
      loadingIndices: true,
      marketIndices: []
    };
  },
  mounted() {
    // 组件挂载后的逻辑
    console.log('仪表盘组件已加载');
    this.fetchMarketIndices();
  },
  methods: {
    async fetchMarketIndices() {
      try {
        this.loadingIndices = true;
        // 获取市场指数数据
        this.marketIndices = await StockApi.getMarketIndices();
      } catch (error) {
        console.error('获取市场指数失败:', error);
        // 使用模拟数据
        this.marketIndices = [
          { name: '上证指数', symbol: '000001.SS', value: 3250.55, change: 1.2 },
          { name: '深证成指', symbol: '399001.SZ', value: 12120.32, change: -0.5 },
          { name: '创业板指', symbol: '399006.SZ', value: 2589.77, change: 0.8 }
        ];
      } finally {
        this.loadingIndices = false;
      }
    },
    formatNumber(num) {
      // 格式化数字，添加千位分隔符
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  }
}; 