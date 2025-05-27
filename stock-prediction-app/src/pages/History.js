export default {
  template: `
    <div class="history-page">
      <h2 class="page-title">预测历史记录</h2>
      
      <div class="card">
        <div class="filter-controls">
          <div class="search-bar">
            <input type="text" v-model="searchQuery" class="form-input" placeholder="搜索股票代码或名称" />
            <button class="button" @click="search">
              <i class="fas fa-search"></i> 搜索
            </button>
          </div>
          
          <div class="filter-options">
            <div class="filter-group">
              <label>模型:</label>
              <select v-model="filterModel" class="form-input">
                <option value="">全部</option>
                <option value="lstm">LSTM</option>
                <option value="arima">ARIMA</option>
                <option value="prophet">Prophet</option>
                <option value="ensemble">组合模型</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>准确度:</label>
              <select v-model="filterAccuracy" class="form-input">
                <option value="">全部</option>
                <option value="high">高 (>80%)</option>
                <option value="medium">中 (60-80%)</option>
                <option value="low">低 (<60%)</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>日期:</label>
              <select v-model="filterDate" class="form-input">
                <option value="">全部</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="year">今年</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="history-list">
          <table class="table">
            <thead>
              <tr>
                <th>日期</th>
                <th>股票</th>
                <th>预测模型</th>
                <th>预测时长</th>
                <th>准确率</th>
                <th>预测趋势</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(record, index) in filteredRecords" :key="index">
                <td>{{ record.date }}</td>
                <td>{{ record.stockName }} ({{ record.stockSymbol }})</td>
                <td>{{ record.model }}</td>
                <td>{{ record.duration }}</td>
                <td :class="getAccuracyClass(record.accuracy)">{{ record.accuracy }}%</td>
                <td :class="record.trend > 0 ? 'up' : 'down'">
                  {{ record.trend > 0 ? '上涨' : '下跌' }} {{ Math.abs(record.trend) }}%
                </td>
                <td class="actions">
                  <button class="action-button" @click="viewDetails(record)">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="action-button" @click="duplicatePrediction(record)">
                    <i class="fas fa-copy"></i>
                  </button>
                  <button class="action-button" @click="deleteRecord(index)">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
          <button :disabled="currentPage === 1" @click="currentPage--">
            <i class="fas fa-chevron-left"></i> 上一页
          </button>
          <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
          <button :disabled="currentPage === totalPages" @click="currentPage++">
            下一页 <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      
      <div v-if="selectedRecord" class="card prediction-details">
        <div class="detail-header">
          <h3>预测详情</h3>
          <button class="close-button" @click="selectedRecord = null">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="detail-content">
          <div class="detail-info">
            <div class="info-group">
              <span class="label">股票:</span>
              <span class="value">{{ selectedRecord.stockName }} ({{ selectedRecord.stockSymbol }})</span>
            </div>
            <div class="info-group">
              <span class="label">预测日期:</span>
              <span class="value">{{ selectedRecord.date }}</span>
            </div>
            <div class="info-group">
              <span class="label">预测模型:</span>
              <span class="value">{{ selectedRecord.model }}</span>
            </div>
            <div class="info-group">
              <span class="label">预测时长:</span>
              <span class="value">{{ selectedRecord.duration }}</span>
            </div>
            <div class="info-group">
              <span class="label">准确率:</span>
              <span class="value" :class="getAccuracyClass(selectedRecord.accuracy)">
                {{ selectedRecord.accuracy }}%
              </span>
            </div>
            <div class="info-group">
              <span class="label">预测趋势:</span>
              <span class="value" :class="selectedRecord.trend > 0 ? 'up' : 'down'">
                {{ selectedRecord.trend > 0 ? '上涨' : '下跌' }} {{ Math.abs(selectedRecord.trend) }}%
              </span>
            </div>
          </div>
          
          <div class="chart-container">
            <!-- 这里可以显示预测图表 -->
            <div class="placeholder-chart">预测图表</div>
          </div>
          
          <div class="detail-actions">
            <button class="button">
              <i class="fas fa-download"></i> 导出报告
            </button>
            <button class="button button-secondary">
              <i class="fas fa-chart-line"></i> 对比实际
            </button>
            <button class="button button-secondary">
              <i class="fas fa-redo"></i> 重新预测
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      searchQuery: '',
      filterModel: '',
      filterAccuracy: '',
      filterDate: '',
      currentPage: 1,
      itemsPerPage: 10,
      selectedRecord: null,
      
      // 模拟数据
      records: [
        {
          date: '2023-05-01',
          stockName: '阿里巴巴',
          stockSymbol: '09988.HK',
          model: 'LSTM',
          duration: '1个月',
          accuracy: 85,
          trend: 3.2
        },
        {
          date: '2023-04-28',
          stockName: '腾讯控股',
          stockSymbol: '00700.HK',
          model: 'ARIMA',
          duration: '2周',
          accuracy: 78,
          trend: 1.5
        },
        {
          date: '2023-04-25',
          stockName: '美团',
          stockSymbol: '03690.HK',
          model: 'Prophet',
          duration: '1个月',
          accuracy: 72,
          trend: -2.1
        },
        {
          date: '2023-04-22',
          stockName: '京东集团',
          stockSymbol: '09618.HK',
          model: 'LSTM',
          duration: '3个月',
          accuracy: 66,
          trend: 4.2
        },
        {
          date: '2023-04-18',
          stockName: '百度集团',
          stockSymbol: '09888.HK',
          model: '组合模型',
          duration: '1个月',
          accuracy: 82,
          trend: 2.8
        },
        {
          date: '2023-04-15',
          stockName: '小米集团',
          stockSymbol: '01810.HK',
          model: 'LSTM',
          duration: '2周',
          accuracy: 71,
          trend: -1.2
        },
        {
          date: '2023-04-10',
          stockName: '网易',
          stockSymbol: '09999.HK',
          model: 'ARIMA',
          duration: '1个月',
          accuracy: 68,
          trend: 0.9
        }
      ]
    };
  },
  computed: {
    filteredRecords() {
      let result = this.records;
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(record => 
          record.stockName.toLowerCase().includes(query) || 
          record.stockSymbol.toLowerCase().includes(query)
        );
      }
      
      // 模型过滤
      if (this.filterModel) {
        result = result.filter(record => 
          record.model.toLowerCase() === this.filterModel.toLowerCase()
        );
      }
      
      // 准确度过滤
      if (this.filterAccuracy) {
        if (this.filterAccuracy === 'high') {
          result = result.filter(record => record.accuracy >= 80);
        } else if (this.filterAccuracy === 'medium') {
          result = result.filter(record => record.accuracy >= 60 && record.accuracy < 80);
        } else if (this.filterAccuracy === 'low') {
          result = result.filter(record => record.accuracy < 60);
        }
      }
      
      // 日期过滤
      if (this.filterDate) {
        const today = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (this.filterDate === 'today') {
          result = result.filter(record => {
            const recordDate = new Date(record.date);
            return (today - recordDate) < oneDay;
          });
        } else if (this.filterDate === 'week') {
          result = result.filter(record => {
            const recordDate = new Date(record.date);
            return (today - recordDate) < (7 * oneDay);
          });
        } else if (this.filterDate === 'month') {
          result = result.filter(record => {
            const recordDate = new Date(record.date);
            return (today - recordDate) < (30 * oneDay);
          });
        } else if (this.filterDate === 'year') {
          result = result.filter(record => {
            const recordDate = new Date(record.date);
            return (today - recordDate) < (365 * oneDay);
          });
        }
      }
      
      return result;
    },
    totalPages() {
      return Math.ceil(this.filteredRecords.length / this.itemsPerPage);
    },
    paginatedRecords() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredRecords.slice(start, end);
    }
  },
  methods: {
    search() {
      // 搜索处理逻辑
      this.currentPage = 1;
    },
    getAccuracyClass(accuracy) {
      if (accuracy >= 80) return 'high-accuracy';
      if (accuracy >= 60) return 'medium-accuracy';
      return 'low-accuracy';
    },
    viewDetails(record) {
      this.selectedRecord = record;
    },
    duplicatePrediction(record) {
      // 复制预测逻辑
      this.$router.push({
        path: '/prediction',
        query: { stockSymbol: record.stockSymbol, model: record.model }
      });
    },
    deleteRecord(index) {
      if (confirm('确定要删除这条预测记录吗？')) {
        this.records.splice(index, 1);
      }
    }
  }
}; 