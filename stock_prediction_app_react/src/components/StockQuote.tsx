import React from 'react';
import { StockQuote as StockQuoteType } from '../types/stock';

interface StockQuoteProps {
  stock: StockQuoteType;
}

const StockQuote: React.FC<StockQuoteProps> = ({ stock }) => {
  if (!stock.symbol) {
    return null;
  }

  const changeClass = stock.change >= 0 ? 'text-success' : 'text-danger';

  return (
    <div className="quote">
      <div className="row">
        <div className="col-6">股票代码:</div>
        <div className="col-6">{stock.symbol}</div>
      </div>
      <div className="row">
        <div className="col-6">公司名称:</div>
        <div className="col-6">{stock.companyName}</div>
      </div>
      <div className="row">
        <div className="col-6">最新价格 (USD):</div>
        <div className="col-6">${stock.latestPrice}</div>
      </div>
      <div className="row">
        <div className="col-6">涨跌额 (USD):</div>
        <div className={`col-6 ${changeClass}`}>{stock.change}</div>
      </div>
      <div className="row">
        <div className="col-6">涨跌幅 (%):</div>
        <div className={`col-6 ${changeClass}`}>{(stock.changePercent * 100).toFixed(2)}%</div>
      </div>
      <div className="row">
        <div className="col-6">最新时间:</div>
        <div className="col-6">{stock.latestTime}</div>
      </div>
    </div>
  );
};

export default StockQuote; 