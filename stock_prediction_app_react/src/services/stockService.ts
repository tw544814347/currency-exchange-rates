import axios from 'axios';
import { StockQuote, StockChartData } from '../types/stock';

// 使用Alpha Vantage API
const BASE_URL = 'https://www.alphavantage.co/query';

// 从localStorage获取API密钥
const getApiKey = (): string => {
  return localStorage.getItem('alphavantage_api_key') || '';
};

// 保存API密钥到localStorage
export const saveApiKey = (apiKey: string): void => {
  localStorage.setItem('alphavantage_api_key', apiKey);
};

// 检查是否已设置API密钥
export const hasApiKey = (): boolean => {
  const key = getApiKey();
  return key !== null && key !== '';
};

// 格式化股票代码，根据Alpha Vantage的要求
const formatStockSymbol = (symbol: string): string => {
  // 去除空格并转大写
  let formatted = symbol.trim().toUpperCase();
  
  // Alpha Vantage对于非美股可能需要特殊处理
  // 例如，有些交易所需要特定格式，这里添加一些常见的转换
  
  // 如果是形如 "600519" 的A股代码，可能需要添加后缀
  if (/^\d{6}$/.test(formatted)) {
    // 默认添加上海交易所后缀，用户需要手动指定深圳
    formatted = formatted + '.SH';
    console.log(`检测到可能的A股代码，已自动添加上证后缀: ${formatted}`);
  }
  
  // 如果是形如 "00700" 的港股代码，可能需要添加后缀
  if (/^\d{5}$/.test(formatted) || /^\d{4}$/.test(formatted)) {
    formatted = formatted + '.HK';
    console.log(`检测到可能的港股代码，已自动添加港股后缀: ${formatted}`);
  }
  
  return formatted;
};

// 获取股票数据
export const getStockQuote = async (symbol: string): Promise<StockQuote> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('请先设置API密钥');
    }
    
    // 格式化股票代码
    const formattedSymbol = formatStockSymbol(symbol);
    console.log(`正在请求股票数据: ${formattedSymbol}`);
    
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${formattedSymbol}&apikey=${apiKey}`;
    console.log('请求URL:', url);
    
    const response = await axios.get(url);
    console.log('API响应:', response.data);
    
    // 处理Alpha Vantage响应格式
    const data = response.data['Global Quote'];
    if (!data || Object.keys(data).length === 0) {
      console.error('API返回的数据为空或格式不正确', response.data);
      
      // 检查是否有错误信息或API限制提示
      if (response.data.Note) {
        throw new Error(`API限制: ${response.data.Note}`);
      } else if (response.data.Information) {
        throw new Error(`API信息: ${response.data.Information}`);
      } else {
        throw new Error(`没有找到股票数据，请检查股票代码"${formattedSymbol}"是否正确。常见格式：美股直接输入代码(AAPL)，港股添加.HK后缀(00700.HK)，上证添加.SH后缀(600519.SH)，深证添加.SZ后缀(000858.SZ)`);
      }
    }
    
    // 将Alpha Vantage数据转换为我们的StockQuote格式
    const quote: StockQuote = {
      symbol: data['01. symbol'],
      companyName: data['01. symbol'], // Alpha Vantage不提供公司名称，使用股票代码替代
      latestPrice: parseFloat(data['05. price']),
      change: parseFloat(data['09. change']),
      changePercent: parseFloat(data['10. change percent'].replace('%', '')) / 100,
      latestTime: new Date().toLocaleString() // 使用当前时间
    };
    
    return quote;
  } catch (error) {
    console.error('获取股票数据失败:', error);
    throw error;
  }
};

// 获取图表数据
export const getStockChartData = async (symbol: string): Promise<StockChartData[]> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('请先设置API密钥');
    }
    
    // 格式化股票代码
    const formattedSymbol = formatStockSymbol(symbol);
    console.log(`正在请求图表数据: ${formattedSymbol}`);
    
    const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${formattedSymbol}&outputsize=compact&apikey=${apiKey}`;
    console.log('请求URL:', url);
    
    const response = await axios.get(url);
    console.log('图表数据API响应的键:', Object.keys(response.data));
    
    const timeSeries = response.data['Time Series (Daily)'];
    if (!timeSeries) {
      console.error('API返回的图表数据为空或格式不正确', response.data);
      
      // 检查是否有错误信息或API限制提示
      if (response.data.Note) {
        throw new Error(`API限制: ${response.data.Note}`);
      } else if (response.data.Information) {
        throw new Error(`API信息: ${response.data.Information}`);
      } else {
        throw new Error(`没有找到图表数据，请检查股票代码"${formattedSymbol}"是否正确。常见格式：美股直接输入代码(AAPL)，港股添加.HK后缀(00700.HK)，上证添加.SH后缀(600519.SH)，深证添加.SZ后缀(000858.SZ)`);
      }
    }
    
    // 将Alpha Vantage数据转换为我们的StockChartData格式
    const chartData: StockChartData[] = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseFloat(values['5. volume'])
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // 按日期排序
    
    return chartData;
  } catch (error) {
    console.error('获取图表数据失败:', error);
    throw error;
  }
}; 