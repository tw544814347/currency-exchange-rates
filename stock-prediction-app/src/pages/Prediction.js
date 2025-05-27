import StockChart from '../components/StockChart.js';

export default {
  components: {
    StockChart
  },
  template: `
    <div class="prediction-page">
      <h2 class="page-title">股票预测</h2>
      
      <div class="card">
        <h3>选择股票和预测参数</h3>
        <div class="form-container">
          <div class="form-group">
            <label class="form-label">股票代码</label>
            <div class="stock-search">
              <input type="text" v-model="stockSymbol" class="form-input" placeholder="输入股票代码或名称" />
              <button class="button" @click="searchStock">
                <i class="fas fa-search"></i> 搜索
              </button>
            </div>
            <div v-if="stockInfo.name" class="selected-stock">
              <div class="stock-info">
                <span class="stock-name">{{ stockInfo.name }}</span>
                <span class="stock-symbol">{{ stockInfo.symbol }}</span>
              </div>
              <div class="stock-price" :class="stockInfo.change > 0 ? 'up' : 'down'">
                <span class="price">¥{{ stockInfo.price }}</span>
                <span class="change">{{ stockInfo.change > 0 ? '+' : '' }}{{ stockInfo.change }}%</span>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">预测模型</label>
              <select v-model="predictionModel" class="form-input">
                <option value="lstm">LSTM深度学习</option>
                <option value="arima">ARIMA时间序列</option>
                <option value="prophet">Prophet预测</option>
                <option value="ensemble">组合模型</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">预测时长</label>
              <select v-model="predictionDuration" class="form-input">
                <option value="1w">1周</option>
                <option value="2w">2周</option>
                <option value="1m">1个月</option>
                <option value="3m">3个月</option>
                <option value="6m">6个月</option>
              </select>
            </div>
          </div>
          
          <div class="prediction-details">
            <div class="section-title">高级设置</div>
            <div class="toggle-button" @click="showAdvanced = !showAdvanced">
              {{ showAdvanced ? '隐藏高级设置' : '显示高级设置' }}
              <i :class="showAdvanced ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            </div>
            
            <div v-if="showAdvanced" class="advanced-settings">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">数据时间范围</label>
                  <select v-model="dataTimeframe" class="form-input">
                    <option value="1y">1年</option>
                    <option value="2y">2年</option>
                    <option value="5y">5年</option>
                    <option value="max">全部历史</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">数据间隔</label>
                  <select v-model="dataInterval" class="form-input">
                    <option value="1d">日线</option>
                    <option value="1h">小时线</option>
                    <option value="1w">周线</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">包含特征</label>
                <div class="feature-checkboxes">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="features.price" />
                    价格数据
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="features.volume" />
                    交易量
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="features.ma" />
                    移动平均线
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="features.sentiment" />
                    舆情分析
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="features.macroeconomic" />
                    宏观经济指标
                  </label>
                </div>
              </div>
              
              <div v-if="predictionModel === 'lstm'" class="model-specific-settings">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">LSTM层数</label>
                    <input type="number" v-model="lstmLayers" class="form-input" min="1" max="5" />
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">时间步长</label>
                    <input type="number" v-model="timeSteps" class="form-input" min="5" max="60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="prediction-actions">
            <button class="button" @click="runPrediction" :disabled="!stockSymbol">
              <i class="fas fa-play"></i> 开始预测
            </button>
            <button class="button button-secondary" @click="resetSettings">
              <i class="fas fa-redo"></i> 重置
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="predictionResults.length > 0" class="card prediction-results">
        <h3>预测结果</h3>
        <div class="results-summary">
          <div class="summary-item">
            <span class="label">预测周期</span>
            <span class="value">{{ getPredictionDurationText() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">使用模型</span>
            <span class="value">{{ getModelName() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">预测趋势</span>
            <span class="value" :class="trend.direction === 'up' ? 'up' : 'down'">
              {{ trend.direction === 'up' ? '上涨' : '下跌' }} ({{ trend.percentage }}%)
            </span>
          </div>
          <div class="summary-item">
            <span class="label">模型置信度</span>
            <span class="value">{{ confidence }}%</span>
          </div>
        </div>
        
        <div class="chart-container">
          <h4>价格预测图表</h4>
          <stock-chart :prediction-data="predictionResults" :show-prediction="true"></stock-chart>
        </div>
        
        <table class="table prediction-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>预测价格</th>
              <th>变化率</th>
              <th>最低价</th>
              <th>最高价</th>
              <th>置信区间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(result, index) in predictionResults" :key="index">
              <td>{{ result.date }}</td>
              <td>¥{{ result.price.toFixed(2) }}</td>
              <td :class="result.change > 0 ? 'up' : 'down'">
                {{ result.change > 0 ? '+' : '' }}{{ result.change.toFixed(2) }}%
              </td>
              <td>¥{{ result.low.toFixed(2) }}</td>
              <td>¥{{ result.high.toFixed(2) }}</td>
              <td>±{{ result.confidence }}%</td>
            </tr>
          </tbody>
        </table>
        
        <div class="action-buttons">
          <button class="button">
            <i class="fas fa-download"></i> 导出结果
          </button>
          <button class="button button-secondary">
            <i class="fas fa-share-alt"></i> 分享预测
          </button>
          <button class="button button-secondary">
            <i class="fas fa-save"></i> 保存到历史
          </button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      stockSymbol: '',
      stockInfo: {
        name: '',
        symbol: '',
        price: 0,
        change: 0
      },
      predictionModel: 'lstm',
      predictionDuration: '1m',
      dataTimeframe: '2y',
      dataInterval: '1d',
      showAdvanced: false,
      features: {
        price: true,
        volume: true,
        ma: true,
        sentiment: false,
        macroeconomic: false
      },
      lstmLayers: 2,
      timeSteps: 20,
      predictionResults: [],
      trend: {
        direction: 'up',
        percentage: 3.25
      },
      confidence: 78
    };
  },
  methods: {
    searchStock() {
      if (!this.stockSymbol) return;
      
      // 模拟API请求获取股票信息
      this.stockInfo = {
        name: '阿里巴巴',
        symbol: '09988.HK',
        price: 82.15,
        change: 1.25
      };
    },
    runPrediction() {
      if (!this.stockSymbol) return;
      
      // 在实际应用中，这里应该调用API进行预测
      console.log('运行预测', {
        stock: this.stockSymbol,
        model: this.predictionModel,
        duration: this.predictionDuration,
        features: this.features
      });
      
      // 模拟预测结果
      setTimeout(() => {
        this.generatePredictionResults();
      }, 1000);
    },
    resetSettings() {
      this.predictionModel = 'lstm';
      this.predictionDuration = '1m';
      this.dataTimeframe = '2y';
      this.dataInterval = '1d';
      this.features = {
        price: true,
        volume: true,
        ma: true,
        sentiment: false,
        macroeconomic: false
      };
      this.lstmLayers = 2;
      this.timeSteps = 20;
    },
    generatePredictionResults() {
      // 生成模拟预测数据
      const results = [];
      const baseDate = new Date();
      const basePrice = this.stockInfo.price;
      let currentPrice = basePrice;
      
      // 确定预测天数
      let days = 30; // 默认一个月
      if (this.predictionDuration === '1w') days = 7;
      if (this.predictionDuration === '2w') days = 14;
      if (this.predictionDuration === '3m') days = 90;
      if (this.predictionDuration === '6m') days = 180;
      
      for (let i = 0; i < days; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        
        // 生成随机价格波动
        const randomChange = ((Math.random() * 2 - 0.5) * 2) + (this.trend.direction === 'up' ? 0.2 : -0.2);
        currentPrice = currentPrice * (1 + randomChange / 100);
        
        // 计算置信区间
        const confidenceFactor = (days - i) / days; // 预测越远，置信度越低
        const dayConfidence = this.confidence * confidenceFactor;
        const range = currentPrice * (dayConfidence / 100) * 0.5;
        
        results.push({
          date: date.toISOString().split('T')[0],
          price: currentPrice,
          change: randomChange,
          low: currentPrice - range,
          high: currentPrice + range,
          confidence: Math.round(dayConfidence)
        });
      }
      
      this.predictionResults = results;
    },
    getPredictionDurationText() {
      const mapping = {
        '1w': '一周',
        '2w': '两周',
        '1m': '一个月',
        '3m': '三个月',
        '6m': '六个月'
      };
      return mapping[this.predictionDuration] || '一个月';
    },
    getModelName() {
      const mapping = {
        'lstm': 'LSTM深度学习',
        'arima': 'ARIMA时间序列',
        'prophet': 'Prophet预测',
        'ensemble': '组合模型'
      };
      return mapping[this.predictionModel] || 'LSTM深度学习';
    }
  }
}; 