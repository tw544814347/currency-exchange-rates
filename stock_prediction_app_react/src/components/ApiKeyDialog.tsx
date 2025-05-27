import React, { useState, useEffect } from 'react';
import { saveApiKey } from '../services/stockService';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState<string>('');
  
  useEffect(() => {
    // 获取已保存的API密钥
    const savedKey = localStorage.getItem('alphavantage_api_key') || '';
    setApiKey(savedKey);
  }, [isOpen]);
  
  const handleSave = () => {
    if (apiKey.trim()) {
      saveApiKey(apiKey.trim());
      onClose();
      window.location.reload(); // 重新加载页面以应用新的API密钥
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="api-key-dialog-overlay">
      <div className="api-key-dialog">
        <div className="api-key-dialog-header">
          <h4>设置API密钥</h4>
        </div>
        <div className="api-key-dialog-body">
          <p>要获取实时股票数据，您需要设置一个Alpha Vantage API密钥。</p>
          <p>您可以在 <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer">Alpha Vantage官网</a> 免费获取API密钥。</p>
          
          <div className="form-group mt-3">
            <label htmlFor="api-key-input">API密钥:</label>
            <input 
              type="text" 
              id="api-key-input"
              className="form-control" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请输入您的Alpha Vantage API密钥" 
            />
          </div>
          
          <div className="stock-code-help mt-4">
            <h5>股票代码示例：</h5>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>市场</th>
                  <th>格式</th>
                  <th>示例</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>美股</td>
                  <td>直接输入代码</td>
                  <td>AAPL, MSFT, GOOGL</td>
                </tr>
                <tr>
                  <td>港股</td>
                  <td>数字代码后加.HK</td>
                  <td>00700.HK, 09988.HK</td>
                </tr>
                <tr>
                  <td>上海A股</td>
                  <td>数字代码后加.SH</td>
                  <td>600519.SH, 601318.SH</td>
                </tr>
                <tr>
                  <td>深圳A股</td>
                  <td>数字代码后加.SZ</td>
                  <td>000858.SZ, 000333.SZ</td>
                </tr>
              </tbody>
            </table>
            <p className="help-tip">提示: 系统会自动尝试为纯数字代码添加后缀，但为确保准确性，建议手动添加正确的后缀。</p>
          </div>
        </div>
        <div className="api-key-dialog-footer">
          <button className="btn btn-secondary me-2" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyDialog; 