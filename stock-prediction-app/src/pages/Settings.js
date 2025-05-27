export default {
  template: `
    <div class="settings-page">
      <h2 class="page-title">系统设置</h2>
      
      <div class="card">
        <h3>用户偏好</h3>
        
        <div class="settings-section">
          <div class="form-group">
            <label class="form-label">默认预测模型</label>
            <select v-model="settings.defaultModel" class="form-input">
              <option value="lstm">LSTM深度学习</option>
              <option value="arima">ARIMA时间序列</option>
              <option value="prophet">Prophet预测</option>
              <option value="ensemble">组合模型</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">默认预测周期</label>
            <select v-model="settings.defaultDuration" class="form-input">
              <option value="1w">1周</option>
              <option value="2w">2周</option>
              <option value="1m">1个月</option>
              <option value="3m">3个月</option>
              <option value="6m">6个月</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">图表显示主题</label>
            <select v-model="settings.chartTheme" class="form-input">
              <option value="light">浅色主题</option>
              <option value="dark">深色主题</option>
              <option value="colorful">多彩主题</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">价格显示货币</label>
            <select v-model="settings.currency" class="form-input">
              <option value="CNY">人民币 (¥)</option>
              <option value="USD">美元 ($)</option>
              <option value="HKD">港币 (HK$)</option>
              <option value="EUR">欧元 (€)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>自选股设置</h3>
        
        <div class="settings-section">
          <div class="form-group">
            <label class="form-label">自选股显示数量</label>
            <input type="number" v-model="settings.watchlistSize" class="form-input" min="5" max="30" />
          </div>
          
          <div class="form-group">
            <label class="form-label">自动更新间隔</label>
            <select v-model="settings.updateInterval" class="form-input">
              <option value="realtime">实时</option>
              <option value="5sec">5秒</option>
              <option value="30sec">30秒</option>
              <option value="1min">1分钟</option>
              <option value="5min">5分钟</option>
            </select>
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.showTrends" />
              显示短期趋势指标
            </label>
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.showPredictions" />
              在自选股中显示预测信息
            </label>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>通知设置</h3>
        
        <div class="settings-section">
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.notifications.email" />
              通过邮件接收预测结果
            </label>
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.notifications.browser" />
              浏览器通知
            </label>
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.notifications.priceAlerts" />
              价格提醒
            </label>
          </div>
          
          <div class="form-group" v-if="settings.notifications.priceAlerts">
            <label class="form-label">价格波动阈值 (%)</label>
            <input type="number" v-model="settings.priceAlertThreshold" class="form-input" min="1" max="10" step="0.5" />
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>模型参数默认值</h3>
        
        <div class="settings-section">
          <div class="collapsible-section">
            <div class="section-header" @click="toggleSection('lstm')">
              <span>LSTM模型设置</span>
              <i :class="expandedSections.lstm ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            </div>
            
            <div class="section-content" v-if="expandedSections.lstm">
              <div class="form-group">
                <label class="form-label">隐藏层数</label>
                <input type="number" v-model="settings.models.lstm.layers" class="form-input" min="1" max="5" />
              </div>
              
              <div class="form-group">
                <label class="form-label">时间步长</label>
                <input type="number" v-model="settings.models.lstm.timeSteps" class="form-input" min="5" max="100" />
              </div>
              
              <div class="form-group">
                <label class="form-label">学习率</label>
                <input type="number" v-model="settings.models.lstm.learningRate" class="form-input" min="0.001" max="0.1" step="0.001" />
              </div>
            </div>
          </div>
          
          <div class="collapsible-section">
            <div class="section-header" @click="toggleSection('arima')">
              <span>ARIMA模型设置</span>
              <i :class="expandedSections.arima ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            </div>
            
            <div class="section-content" v-if="expandedSections.arima">
              <div class="form-group">
                <label class="form-label">自回归阶数(p)</label>
                <input type="number" v-model="settings.models.arima.p" class="form-input" min="0" max="5" />
              </div>
              
              <div class="form-group">
                <label class="form-label">差分阶数(d)</label>
                <input type="number" v-model="settings.models.arima.d" class="form-input" min="0" max="2" />
              </div>
              
              <div class="form-group">
                <label class="form-label">移动平均阶数(q)</label>
                <input type="number" v-model="settings.models.arima.q" class="form-input" min="0" max="5" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>数据源设置</h3>
        
        <div class="settings-section">
          <div class="form-group">
            <label class="form-label">优先数据源</label>
            <select v-model="settings.dataSource" class="form-input">
              <option value="yahoo">雅虎财经</option>
              <option value="sina">新浪财经</option>
              <option value="eastmoney">东方财富</option>
              <option value="tushare">TuShare</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">历史数据最大回溯</label>
            <select v-model="settings.maxHistoryLookback" class="form-input">
              <option value="1y">1年</option>
              <option value="2y">2年</option>
              <option value="5y">5年</option>
              <option value="10y">10年</option>
              <option value="max">全部历史</option>
            </select>
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.includePreMarket" />
              包括盘前交易数据
            </label>
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.includeAfterHours" />
              包括盘后交易数据
            </label>
          </div>
        </div>
      </div>
      
      <div class="action-buttons">
        <button class="button" @click="saveSettings">
          <i class="fas fa-save"></i> 保存设置
        </button>
        <button class="button button-secondary" @click="resetToDefaults">
          <i class="fas fa-undo"></i> 恢复默认设置
        </button>
      </div>
    </div>
  `,
  data() {
    return {
      settings: {
        defaultModel: 'lstm',
        defaultDuration: '1m',
        chartTheme: 'light',
        currency: 'CNY',
        watchlistSize: 10,
        updateInterval: '5sec',
        showTrends: true,
        showPredictions: true,
        notifications: {
          email: false,
          browser: true,
          priceAlerts: true
        },
        priceAlertThreshold: 5,
        dataSource: 'yahoo',
        maxHistoryLookback: '5y',
        includePreMarket: false,
        includeAfterHours: true,
        models: {
          lstm: {
            layers: 2,
            timeSteps: 20,
            learningRate: 0.01
          },
          arima: {
            p: 2,
            d: 1,
            q: 2
          }
        }
      },
      expandedSections: {
        lstm: false,
        arima: false
      },
      saveStatus: '',
      saveTimer: null
    };
  },
  methods: {
    toggleSection(section) {
      this.expandedSections[section] = !this.expandedSections[section];
    },
    saveSettings() {
      // 在实际应用中，这里应该保存设置到服务器
      console.log('保存设置:', this.settings);
      
      // 显示保存状态
      this.saveStatus = '设置已保存!';
      
      // 清除之前的计时器
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
      }
      
      // 设置计时器清除状态消息
      this.saveTimer = setTimeout(() => {
        this.saveStatus = '';
      }, 3000);
      
      // 模拟触发成功消息
      alert('设置已成功保存');
    },
    resetToDefaults() {
      if (confirm('确定要重置所有设置到默认值吗？这将无法撤销。')) {
        this.settings = {
          defaultModel: 'lstm',
          defaultDuration: '1m',
          chartTheme: 'light',
          currency: 'CNY',
          watchlistSize: 10,
          updateInterval: '5sec',
          showTrends: true,
          showPredictions: true,
          notifications: {
            email: false,
            browser: true,
            priceAlerts: true
          },
          priceAlertThreshold: 5,
          dataSource: 'yahoo',
          maxHistoryLookback: '5y',
          includePreMarket: false,
          includeAfterHours: true,
          models: {
            lstm: {
              layers: 2,
              timeSteps: 20,
              learningRate: 0.01
            },
            arima: {
              p: 2,
              d: 1,
              q: 2
            }
          }
        };
        
        alert('设置已重置为默认值');
      }
    }
  }
}; 