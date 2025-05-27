// 股票数据API服务

/**
 * Alpha Vantage API服务
 * 注意: 需要在下面填入您的API密钥
 * 免费API密钥可以从 https://www.alphavantage.co/support/#api-key 获取
 */
let apiKey = localStorage.getItem('alphavantage_api_key') || 'YOUR_API_KEY_HERE';

// 更新API密钥
export const updateApiKey = (newApiKey) => {
  apiKey = newApiKey;
  console.log('API密钥已更新');
};

const BASE_URL = 'https://www.alphavantage.co/query';

/**
 * 获取股票日线数据
 * @param {string} symbol - 股票代码，例如：AAPL、BABA、600519.SH
 * @param {string} outputSize - 数据量，可选 'compact'(最近100条) 或 'full'(最多20年数据)
 * @returns {Promise<Array>} - 处理后的股票数据
 */
export const getDailyStockData = async (symbol, outputSize = 'compact') => {
  try {
    // 检查API密钥
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error('未设置API密钥');
    }
    
    const response = await fetch(`${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${apiKey}`);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      console.warn('API使用频率限制提醒:', data['Note']);
    }
    
    const timeSeriesData = data['Time Series (Daily)'];
    if (!timeSeriesData) {
      throw new Error('无法获取股票数据');
    }
    
    return formatStockData(timeSeriesData);
  } catch (error) {
    console.error('获取股票数据失败:', error);
    throw error;
  }
};

/**
 * 获取股票详细信息
 * @param {string} symbol - 股票代码
 * @returns {Promise<Object>} - 处理后的股票信息
 */
async function getStockOverview(symbol) {
  try {
    const response = await fetch(`${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    return {
      symbol: data.Symbol || symbol,
      name: data.Name || '未知',
      price: 0, // 需要通过其他API调用获取当前价格
      change: 0, // 需要计算
      open: 0,
      high: 0,
      low: 0,
      close: 0,
      volume: data.Volume || '0',
      marketCap: data.MarketCapitalization || '0',
      high52Week: data['52WeekHigh'] || '0',
      low52Week: data['52WeekLow'] || '0',
      pe: data.PERatio || '0',
      pb: data.PriceToBookRatio || '0',
      dividendYield: data.DividendYield || '0',
      eps: data.EPS || '0'
    };
  } catch (error) {
    console.error('获取股票概览信息失败:', error);
    // 返回基本信息，防止UI错误
    return {
      symbol: symbol,
      name: symbol,
      price: 0,
      change: 0,
      // 其他必要字段
      open: 0, high: 0, low: 0, close: 0,
      volume: '0', marketCap: '0',
      high52Week: '0', low52Week: '0',
      pe: '0', pb: '0', dividendYield: '0', eps: '0'
    };
  }
}

/**
 * 获取实时股票报价
 * @param {string} symbol - 股票代码
 * @returns {Promise<Object>} - 股票实时数据
 */
export const getQuote = async (symbol) => {
  try {
    // 检查API密钥
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error('未设置API密钥');
    }
    
    const response = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    const quote = data['Global Quote'];
    if (!quote) {
      throw new Error('无法获取实时报价');
    }
    
    return {
      symbol: quote['01. symbol'] || symbol,
      price: parseFloat(quote['05. price']) || 0,
      change: parseFloat(quote['09. change']) || 0,
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
      open: parseFloat(quote['02. open']) || 0,
      high: parseFloat(quote['03. high']) || 0,
      low: parseFloat(quote['04. low']) || 0,
      close: parseFloat(quote['08. previous close']) || 0,
      volume: quote['06. volume'] || '0',
    };
  } catch (error) {
    console.error('获取实时报价失败:', error);
    return {
      symbol: symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      open: 0, high: 0, low: 0, close: 0,
      volume: '0'
    };
  }
};

/**
 * 搜索股票
 * @param {string} keywords - 搜索关键词
 * @returns {Promise<Array>} - 匹配的股票列表
 */
export const searchStocks = async (keywords) => {
  try {
    // 检查API密钥
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error('未设置API密钥');
    }
    
    const response = await fetch(`${BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    return data.bestMatches ? data.bestMatches.map(stock => ({
      symbol: stock['1. symbol'],
      name: stock['2. name'],
      type: stock['3. type'],
      region: stock['4. region'],
      currency: stock['8. currency']
    })) : [];
  } catch (error) {
    console.error('搜索股票失败:', error);
    return [];
  }
};

/**
 * 获取市场指数数据
 * @returns {Promise<Array>} - 主要市场指数数据
 */
export const getMarketIndices = async () => {
  // Alpha Vantage免费版对股指数据有限制，这里使用模拟数据
  return [
    { name: '上证指数', symbol: '000001.SS', value: 3000 + Math.random() * 500, change: (Math.random() * 4 - 2) },
    { name: '深证成指', symbol: '399001.SZ', value: 10000 + Math.random() * 2500, change: (Math.random() * 4 - 2) },
    { name: '创业板指', symbol: '399006.SZ', value: 2200 + Math.random() * 500, change: (Math.random() * 4 - 2) },
  ];
};

/**
 * 获取热门股票列表
 * @param {number} limit - 返回数量
 * @returns {Promise<Array>} - 热门股票列表
 */
export const getHotStocks = async (limit = 10) => {
  // 热门股票列表
  const popularSymbols = [
    // 美股科技股
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'INTC', 'AMD',
    // 中国科技股
    'BABA', 'PDD', 'BIDU', 'JD', 'NTES', 'TCOM', 'TME', 'IQ', 'BILI', 'NIO',
    // 中国港股
    '00700.HK', '09988.HK', '03690.HK', '09999.HK', '01810.HK', '02269.HK', '02020.HK',
    // 中国A股
    '600519.SH', '601398.SH', '600036.SH', '601318.SH', '600276.SH', 
    '000858.SZ', '300750.SZ', '002594.SZ', '000333.SZ', '002415.SZ'
  ];
  
  const result = [];
  
  for (let i = 0; i < Math.min(limit, popularSymbols.length); i++) {
    try {
      const quote = await getQuote(popularSymbols[i]);
      result.push(quote);
    } catch (error) {
      console.warn(`获取${popularSymbols[i]}数据失败:`, error);
    }
  }
  
  return result;
};

// 工具函数

/**
 * 格式化股票历史数据
 * @param {Object} timeSeriesData - API返回的时间序列数据
 * @returns {Array} - 格式化后的数据
 */
const formatStockData = (timeSeriesData) => {
  return Object.entries(timeSeriesData).map(([date, values]) => ({
    date,
    open: parseFloat(values['1. open']),
    high: parseFloat(values['2. high']),
    low: parseFloat(values['3. low']),
    close: parseFloat(values['4. close']),
    volume: parseInt(values['5. volume'])
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
};

// 导出API函数
export default {
  getDailyStockData,
  getStockOverview,
  getQuote,
  searchStocks,
  getMarketIndices,
  getHotStocks
}; 