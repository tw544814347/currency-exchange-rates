import React, { useState, useEffect } from 'react';
import StockQuote from '../components/StockQuote';
import StockChart from '../components/StockChart';
import ApiKeyDialog from '../components/ApiKeyDialog';
import { StockQuote as StockQuoteType, StockChartData } from '../types/stock';
import { getStockQuote, getStockChartData, hasApiKey } from '../services/stockService';

const Home: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('');
  const [stock, setStock] = useState<StockQuoteType>({} as StockQuoteType);
  const [chartData, setChartData] = useState<StockChartData[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState<boolean>(false);
  
  // 检查API密钥是否已设置
  useEffect(() => {
    const checkApiKey = () => {
      if (!hasApiKey()) {
        setIsApiKeyDialogOpen(true);
      }
    };
    
    checkApiKey();
  }, []);

  const handleSearch = async () => {
    if (!symbol) return;
    
    if (!hasApiKey()) {
      setIsApiKeyDialogOpen(true);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setStock({} as StockQuoteType);
      setChartData([]);

      console.log('正在搜索股票:', symbol);
      const quoteData = await getStockQuote(symbol);
      console.log('获取到的股票数据:', quoteData);
      setStock(quoteData);

      console.log('正在获取图表数据...');
      const graphData = await getStockChartData(symbol);
      console.log('获取到的图表数据:', graphData);
      setChartData(graphData);
    } catch (err: any) {
      console.error('搜索过程中出错:', err);
      if (err.response) {
        console.error('错误响应:', err.response);
        if (err.response.status === 404) {
          setError('找不到指定的股票代码...');
        } else {
          setError(`获取数据时出错: ${err.response.status} ${err.response.statusText}`);
        }
      } else if (err.message) {
        setError(`${err.message}`);
      } else {
        setError('获取数据时出错，请稍后再试...');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const openApiKeyDialog = () => {
    setIsApiKeyDialogOpen(true);
  };

  return (
    <div className="container">
      <h1 className="mb-4">股票预测应用</h1>
      
      <div className="alert alert-info mb-4">
        <strong>股票代码格式说明：</strong>
        <div className="row mt-2">
          <div className="col-md-3">
            <h6>美股</h6>
            <ul className="mb-0">
              <li><strong>AAPL</strong> - 苹果公司</li>
              <li><strong>MSFT</strong> - 微软公司</li>
            </ul>
          </div>
          <div className="col-md-3">
            <h6>港股 (必须加.HK)</h6>
            <ul className="mb-0">
              <li><strong>00700.HK</strong> - 腾讯控股</li>
              <li><strong>09988.HK</strong> - 阿里巴巴</li>
            </ul>
          </div>
          <div className="col-md-3">
            <h6>上证 (必须加.SH)</h6>
            <ul className="mb-0">
              <li><strong>600519.SH</strong> - 贵州茅台</li>
              <li><strong>601318.SH</strong> - 中国平安</li>
            </ul>
          </div>
          <div className="col-md-3">
            <h6>深证 (必须加.SZ)</h6>
            <ul className="mb-0">
              <li><strong>000858.SZ</strong> - 五粮液</li>
              <li><strong>000333.SZ</strong> - 美的集团</li>
            </ul>
          </div>
        </div>
        <p className="mt-2 mb-0 small"><strong>注意:</strong> 系统会自动尝试为纯数字代码添加后缀，但为确保准确性，建议手动添加正确的后缀。</p>
      </div>
      
      <div className="row mb-4">
        <div className="col-md-10">
          <input
            type="text"
            className="form-control"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="输入股票代码..."
            autoFocus
          />
        </div>
        <div className="col-md-2">
          <button
            className="btn btn-primary full-width"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              '搜索'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>错误!</strong> {error}
        </div>
      )}

      <div className="row">
        <div className="col-md-5">
          {stock.symbol && <StockQuote stock={stock} />}
        </div>
        <div className="col-md-7">
          {chartData.length > 0 && (
            <StockChart 
              chartData={chartData} 
              companyName={stock.companyName} 
            />
          )}
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <button 
          className="btn btn-outline-secondary btn-sm" 
          onClick={openApiKeyDialog}
        >
          设置API密钥
        </button>
        <p className="small mt-2 text-muted">
          使用Alpha Vantage API。如需更改API密钥，请点击上方按钮。
        </p>
      </div>
      
      <ApiKeyDialog 
        isOpen={isApiKeyDialogOpen} 
        onClose={() => setIsApiKeyDialogOpen(false)} 
      />
    </div>
  );
};

export default Home; 