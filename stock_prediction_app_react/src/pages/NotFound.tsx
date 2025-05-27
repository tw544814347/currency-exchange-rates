import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="container text-center">
      <h1 className="display-1 mt-5">404</h1>
      <h2 className="mb-4">页面未找到</h2>
      <p className="lead">
        您访问的页面不存在或已被移除。
      </p>
      <Link to="/" className="btn btn-primary">
        返回首页
      </Link>
    </div>
  );
};

export default NotFound; 