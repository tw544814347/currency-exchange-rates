import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container">
      <h1 className="mb-4">关于股票预测应用</h1>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">项目介绍</h5>
          <p className="card-text">
            这是一个使用React和TypeScript构建的股票预测应用，允许用户搜索股票代码并查看实时股票数据和图表。
          </p>
          <h5 className="card-title mt-4">技术栈</h5>
          <ul>
            <li>React 18</li>
            <li>TypeScript</li>
            <li>React Router</li>
            <li>Chart.js & React-chartjs-2</li>
            <li>Bootstrap 5</li>
            <li>Axios</li>
          </ul>
          <h5 className="card-title mt-4">数据来源</h5>
          <p className="card-text">
            本应用使用IEX Trading API获取实时股票数据。请注意，此API可能有请求限制和使用条款。
          </p>
        </div>
      </div>
    </div>
  );
};

export default About; 