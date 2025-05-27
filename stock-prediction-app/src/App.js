export default {
  template: `
    <div class="app-container">
      <header class="header">
        <div class="logo">
          <h1>股票预测分析平台</h1>
        </div>
        <div class="header-right">
          <button class="button" @click="toggleSidebar">
            <i class="fas fa-bars"></i>
          </button>
          <span class="user-info">
            <i class="fas fa-user-circle"></i> 用户名
          </span>
        </div>
      </header>
      
      <div class="sidebar" :class="{ open: sidebarOpen }">
        <nav class="nav-menu">
          <ul>
            <li>
              <router-link to="/">
                <i class="fas fa-tachometer-alt"></i> 仪表盘
              </router-link>
            </li>
            <li>
              <router-link to="/prediction">
                <i class="fas fa-chart-line"></i> 股票预测
              </router-link>
            </li>
            <li>
              <router-link to="/history">
                <i class="fas fa-history"></i> 历史记录
              </router-link>
            </li>
            <li>
              <router-link to="/settings">
                <i class="fas fa-cog"></i> 设置
              </router-link>
            </li>
          </ul>
        </nav>
      </div>
      
      <main class="main-content">
        <router-view></router-view>
      </main>
    </div>
  `,
  data() {
    return {
      sidebarOpen: true
    };
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    }
  }
}; 