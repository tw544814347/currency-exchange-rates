import StockApi from '../services/StockApi.js';

export default {
  template: `
    <div class="market-overview">
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">加载市场数据中...</div>
      </div>
      
      <div v-else>
        <div class="market-filter">
          <select v-model="selectedMarket" class="market-selector" @change="filterMarket">
            <option value="all">全部市场</option>
            <option value="sh">上证</option>
            <option value="sz">深证</option>
            <option value="hk">港股</option>
            <option value="us">美股</option>
          </select>
          
          <div class="market-tabs">
            <div 
              v-for="tab in tabs" 
              :key="tab.key"
              :class="['tab-item', { active: activeTab === tab.key }]" 
              @click="changeTab(tab.key)"
            >
              {{ tab.name }}
            </div>
          </div>
        </div>
        
        <div class="stock-list">
          <table class="table">
            <thead>
              <tr>
                <th>名称</th>
                <th>最新价</th>
                <th>涨跌幅</th>
                <th>成交量</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(stock, index) in filteredStocks" :key="index">
                <td class="stock-name">
                  <div class="name">{{ stock.name || stock.symbol }}</div>
                  <div class="code">{{ stock.symbol }}</div>
                </td>
                <td class="stock-price">{{ formatPrice(stock.price) }}</td>
                <td :class="['change', stock.changePercent > 0 ? 'up' : 'down']">
                  {{ stock.changePercent > 0 ? '+' : '' }}{{ formatChange(stock.changePercent) }}%
                </td>
                <td>{{ formatVolume(stock.volume) }}</td>
                <td class="actions">
                  <button class="action-button" @click="viewStock(stock)">
                    <i class="fas fa-chart-line"></i>
                  </button>
                  <button class="action-button" @click="addToWatchlist(stock)">
                    <i class="fas fa-star"></i>
                  </button>
                  <button class="action-button" @click="runPrediction(stock)">
                    <i class="fas fa-magic"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredStocks.length === 0">
                <td colspan="5" class="no-data">
                  暂无数据
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      loading: true,
      selectedMarket: 'all',
      activeTab: 'hot',
      tabs: [
        { key: 'hot', name: '热门' },
        { key: 'gainers', name: '涨幅榜' },
        { key: 'losers', name: '跌幅榜' },
        { key: 'turnover', name: '换手率' },
      ],
      stocks: [],
      // 股票分类缓存
      categories: {
        hot: [],     // 热门股票
        gainers: [],  // 涨幅榜
        losers: [],   // 跌幅榜
        turnover: []  // 换手率
      },
      // 市场股票数据缓存
      marketCache: {
        all: [],
        sh: [],
        sz: [],
        hk: [],
        us: []
      }
    };
  },
  computed: {
    filteredStocks() {
      // 如果数据未加载完成，返回空数组
      if (this.loading) return [];
      
      // 使用缓存的分类数据
      if (this.categories[this.activeTab] && this.categories[this.activeTab].length > 0) {
        // 进一步按市场筛选
        if (this.selectedMarket === 'all') {
          return this.categories[this.activeTab];
        } else {
          return this.categories[this.activeTab].filter(stock => this.getMarketFromSymbol(stock.symbol) === this.selectedMarket);
        }
      }
      
      return [];
    }
  },
  mounted() {
    // 组件加载时获取数据
    this.fetchMarketData();
  },
  methods: {
    async fetchMarketData() {
      this.loading = true;
      
      try {
        // 获取热门股票
        const hotStocks = await StockApi.getHotStocks(20);
        
        // 分类处理
        this.processStocks(hotStocks);
        
        // 更新股票列表
        this.stocks = hotStocks;
      } catch (error) {
        console.error('获取市场数据失败:', error);
        // 加载失败时使用示例数据
        this.useExampleData();
      } finally {
        this.loading = false;
      }
    },
    processStocks(stocks) {
      // 重置分类
      for (const key in this.categories) {
        this.categories[key] = [];
      }
      
      // 添加到热门分类
      this.categories.hot = [...stocks];
      
      // 根据涨跌幅分类
      const sortedByChange = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
      
      // 涨幅榜 - 取前5个正涨幅
      this.categories.gainers = sortedByChange
        .filter(stock => stock.changePercent > 0)
        .slice(0, 5);
      
      // 跌幅榜 - 取后5个负跌幅
      this.categories.losers = sortedByChange
        .filter(stock => stock.changePercent < 0)
        .slice(-5)
        .reverse();
      
      // 换手率 - 在实际应用中应该有换手率数据，这里简单取成交量最大的5个
      const sortedByVolume = [...stocks].sort((a, b) => {
        const volA = parseFloat(a.volume.replace(/[^\d.-]/g, ''));
        const volB = parseFloat(b.volume.replace(/[^\d.-]/g, ''));
        return volB - volA;
      }).slice(0, 5);
      this.categories.turnover = sortedByVolume;
      
      // 按市场分类缓存
      this.marketCache.all = stocks;
      this.marketCache.sh = stocks.filter(stock => this.getMarketFromSymbol(stock.symbol) === 'sh');
      this.marketCache.sz = stocks.filter(stock => this.getMarketFromSymbol(stock.symbol) === 'sz');
      this.marketCache.hk = stocks.filter(stock => this.getMarketFromSymbol(stock.symbol) === 'hk');
      this.marketCache.us = stocks.filter(stock => this.getMarketFromSymbol(stock.symbol) === 'us');
    },
    getMarketFromSymbol(symbol) {
      // 根据股票代码判断市场
      if (symbol.includes('.SH') || symbol.includes('.SS')) return 'sh';
      if (symbol.includes('.SZ')) return 'sz';
      if (symbol.includes('.HK')) return 'hk';
      // 默认美股
      return 'us';
    },
    filterMarket() {
      console.log('切换市场到:', this.selectedMarket);
      // 过滤已有的分类数据，无需重新请求API
    },
    changeTab(tabKey) {
      this.activeTab = tabKey;
      console.log('切换分类到:', tabKey);
    },
    viewStock(stock) {
      // 跳转到股票详情页
      this.$router.push(`/stock/${stock.symbol}`);
    },
    addToWatchlist(stock) {
      // 添加到自选
      const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
      
      // 检查是否已存在
      if (!watchlist.find(item => item.symbol === stock.symbol)) {
        watchlist.push({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          addedAt: new Date().toISOString()
        });
        
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        alert(`已将 ${stock.name || stock.symbol} 添加到自选`);
      } else {
        alert(`${stock.name || stock.symbol} 已在自选列表中`);
      }
    },
    runPrediction(stock) {
      // 跳转到预测页面
      this.$router.push({
        path: '/prediction',
        query: { stockSymbol: stock.symbol }
      });
    },
    useExampleData() {
      // 示例数据，当API请求失败时使用
      const exampleStocks = [
        {
          name: '阿里巴巴',
          symbol: 'BABA',
          price: 82.15,
          changePercent: 1.25,
          volume: '11.2M',
        },
        {
          name: '腾讯控股',
          symbol: '00700.HK',
          price: 320.80,
          changePercent: -0.58,
          volume: '9.8M',
        },
        {
          name: '贵州茅台',
          symbol: '600519.SH',
          price: 1689.50,
          changePercent: 2.03,
          volume: '2.1M',
        },
        {
          name: '宁德时代',
          symbol: '300750.SZ',
          price: 214.32,
          changePercent: 3.65,
          volume: '8.5M',
        },
        {
          name: '美团',
          symbol: '03690.HK',
          price: 112.10,
          changePercent: -1.22,
          volume: '6.7M',
        }
      ];
      
      this.stocks = exampleStocks;
      this.processStocks(exampleStocks);
    },
    formatPrice(price) {
      // 格式化价格显示
      return typeof price === 'number' ? price.toFixed(2) : price;
    },
    formatChange(change) {
      // 格式化涨跌幅显示
      return typeof change === 'number' ? change.toFixed(2) : change;
    },
    formatVolume(volume) {
      // 格式化成交量
      if (!volume) return '0';
      
      // 如果已经是格式化的字符串（包含K、M、B）
      if (typeof volume === 'string' && /[KMB]/.test(volume)) {
        return volume;
      }
      
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
    }
  }
}; 