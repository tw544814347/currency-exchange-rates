// 引入必要库
import { createApp } from 'https://unpkg.com/vue@3.2.31/dist/vue.esm-browser.js';
import { createRouter, createWebHashHistory } from 'https://unpkg.com/vue-router@4.0.14/dist/vue-router.esm-browser.js';

// 导入组件
import App from './App.js';
import Dashboard from './pages/Dashboard.js';
import StockDetails from './pages/StockDetails.js';
import Prediction from './pages/Prediction.js';
import History from './pages/History.js';
import Settings from './pages/Settings.js';

// 定义路由
const routes = [
  { path: '/', component: Dashboard },
  { path: '/stock/:symbol', component: StockDetails },
  { path: '/prediction', component: Prediction },
  { path: '/history', component: History },
  { path: '/settings', component: Settings }
];

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// 创建Vue应用实例
const app = createApp(App);

// 使用路由
app.use(router);

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('应用错误:', err);
  console.error('错误信息:', info);
};

// 挂载应用
app.mount('#root');

// 导出应用实例供其他模块使用
export { app, router }; 