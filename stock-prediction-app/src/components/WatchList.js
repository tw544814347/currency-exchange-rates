import StockApi from '../services/StockApi.js';

export default {
  template: `
    <div class="watchlist">
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">加载自选股数据中...</div>
      </div>
      
      <div v-else-if="watchlist.length === 0" class="empty-watchlist">
        <i class="fas fa-star empty-icon"></i>
        <p>暂无自选股票</p>
        <p class="hint">可在股票详情页添加股票到自选</p>
      </div>
      
      <div v-else>
        <div class="watchlist-header">
          <span>我的自选 ({{ watchlist.length }})</span>
          <div class="header-actions">
            <button class="action-button" @click="refreshAll" :disabled="refreshing">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': refreshing }"></i>
            </button>
            <button class="action-button" @click="showEditMode = !showEditMode">
              <i class="fas fa-pencil-alt"></i>
            </button>
          </div>
        </div>
        
        <div class="watchlist-items">
          <div 
            v-for="(stock, index) in watchlist" 
            :key="stock.symbol"
            class="watchlist-item"
          >
            <div class="item-main" @click="viewStock(stock)">
              <div class="stock-info">
                <div class="stock-name">{{ stock.name || stock.symbol }}</div>
                <div class="stock-symbol">{{ stock.symbol }}</div>
              </div>
              
              <div class="stock-price-info">
                <div class="current-price">{{ formatPrice(stock.price) }}</div>
                <div :class="['change', stock.changePercent > 0 ? 'up' : 'down']">
                  {{ stock.changePercent > 0 ? '+' : '' }}{{ formatChange(stock.changePercent) }}%
                </div>
              </div>
            </div>
            
            <div class="item-actions">
              <button class="action-button" @click="runPrediction(stock)">
                <i class="fas fa-magic"></i>
              </button>
              <button v-if="showEditMode" class="action-button remove" @click="removeFromWatchlist(index)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="add-stock-form" v-if="!showEditMode">
        <input 
          type="text" 
          v-model="newStockSymbol" 
          class="form-input"
          placeholder="输入股票代码添加到自选"
          @keyup.enter="addStockBySymbol"
        />
        <button class="button" @click="addStockBySymbol" :disabled="loading || refreshing">
          <i class="fas fa-plus"></i> 添加
        </button>
      </div>
      
      <div v-if="searchResults.length > 0" class="search-results">
        <div class="search-results-header">搜索结果</div>
        <div 
          v-for="result in searchResults" 
          :key="result.symbol"
          class="search-result-item"
          @click="addStock(result)"
        >
          <div class="stock-name">{{ result.name }}</div>
          <div class="stock-symbol">{{ result.symbol }} ({{ result.region }})</div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      loading: true,
      watchlist: [],
      showEditMode: false,
      newStockSymbol: '',
      refreshing: false,
      searchResults: []
    };
  },
  mounted() {
    // 组件加载时获取自选股数据
    this.loadWatchlist();
  },
  methods: {
    async loadWatchlist() {
      this.loading = true;
      
      try {
        // 从本地存储加载自选股列表
        const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        
        if (savedWatchlist.length > 0) {
          // 获取每个股票的最新报价
          const watchlistWithQuotes = [];
          
          for (const stock of savedWatchlist) {
            try {
              const quote = await StockApi.getQuote(stock.symbol);
              watchlistWithQuotes.push({
                ...stock,
                ...quote
              });
            } catch (error) {
              console.error(`获取${stock.symbol}报价失败:`, error);
              // 添加不含报价的股票信息
              watchlistWithQuotes.push({
                ...stock,
                price: 0,
                changePercent: 0
              });
            }
          }
          
          this.watchlist = watchlistWithQuotes;
        }
      } catch (error) {
        console.error('加载自选股失败:', error);
        // 使用空列表
        this.watchlist = [];
      } finally {
        this.loading = false;
      }
    },
    saveWatchlist() {
      // 仅保存必要信息到本地存储
      const simpleWatchlist = this.watchlist.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        addedAt: stock.addedAt || new Date().toISOString()
      }));
      
      localStorage.setItem('watchlist', JSON.stringify(simpleWatchlist));
    },
    viewStock(stock) {
      // 跳转到股票详情页
      this.$router.push(`/stock/${stock.symbol}`);
    },
    removeFromWatchlist(index) {
      if (confirm(`确定要从自选股中移除 ${this.watchlist[index].name || this.watchlist[index].symbol} 吗？`)) {
        this.watchlist.splice(index, 1);
        this.saveWatchlist();
      }
    },
    runPrediction(stock) {
      // 跳转到预测页面
      this.$router.push({
        path: '/prediction',
        query: { stockSymbol: stock.symbol }
      });
    },
    async refreshAll() {
      if (this.refreshing || this.watchlist.length === 0) return;
      
      this.refreshing = true;
      
      try {
        const updatedWatchlist = [...this.watchlist];
        
        for (let i = 0; i < updatedWatchlist.length; i++) {
          try {
            const stock = updatedWatchlist[i];
            const quote = await StockApi.getQuote(stock.symbol);
            
            // 更新股票数据
            updatedWatchlist[i] = {
              ...stock,
              ...quote
            };
          } catch (error) {
            console.error(`更新${updatedWatchlist[i].symbol}报价失败:`, error);
          }
        }
        
        this.watchlist = updatedWatchlist;
      } catch (error) {
        console.error('刷新自选股数据失败:', error);
      } finally {
        this.refreshing = false;
      }
    },
    async addStockBySymbol() {
      if (!this.newStockSymbol || this.refreshing) return;
      
      // 清空之前的搜索结果
      this.searchResults = [];
      
      // 检查是否已经存在
      const exists = this.watchlist.some(stock => 
        stock.symbol.toLowerCase() === this.newStockSymbol.toLowerCase());
      
      if (exists) {
        alert('该股票已在自选列表中');
        return;
      }
      
      this.refreshing = true;
      
      try {
        // 先直接尝试获取股票报价
        try {
          const quote = await StockApi.getQuote(this.newStockSymbol);
          
          // 如果成功获取报价，直接添加到自选股
          if (quote && quote.symbol) {
            this.addStock(quote);
            this.newStockSymbol = '';
            return;
          }
        } catch (error) {
          console.log('直接查询失败，尝试搜索股票');
        }
        
        // 如果直接查询失败，尝试搜索
        const searchResults = await StockApi.searchStocks(this.newStockSymbol);
        
        if (searchResults && searchResults.length > 0) {
          // 显示搜索结果
          this.searchResults = searchResults;
        } else {
          alert('未找到该股票，请检查代码是否正确');
        }
      } catch (error) {
        console.error('添加股票失败:', error);
        alert('添加股票失败，请稍后再试');
      } finally {
        this.refreshing = false;
      }
    },
    async addStock(stock) {
      // 检查是否已经存在
      const exists = this.watchlist.some(item => item.symbol === stock.symbol);
      
      if (exists) {
        alert('该股票已在自选列表中');
        return;
      }
      
      this.refreshing = true;
      
      try {
        // 获取股票报价
        const quote = await StockApi.getQuote(stock.symbol);
        
        // 添加到自选股
        this.watchlist.push({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          addedAt: new Date().toISOString(),
          ...quote
        });
        
        // 保存到本地存储
        this.saveWatchlist();
        
        // 清空搜索结果和输入框
        this.searchResults = [];
        this.newStockSymbol = '';
      } catch (error) {
        console.error('添加股票失败:', error);
        
        // 即使获取报价失败，也添加基本信息
        this.watchlist.push({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          addedAt: new Date().toISOString(),
          price: 0,
          changePercent: 0
        });
        
        this.saveWatchlist();
      } finally {
        this.refreshing = false;
      }
    },
    formatPrice(price) {
      // 格式化价格显示
      return typeof price === 'number' ? price.toFixed(2) : (price || '0.00');
    },
    formatChange(change) {
      // 格式化涨跌幅显示
      return typeof change === 'number' ? change.toFixed(2) : (change || '0.00');
    }
  }
}; 