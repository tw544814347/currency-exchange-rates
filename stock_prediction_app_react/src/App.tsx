import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="container bottom small">
        <p>
          数据由<a href="https://iextrading.com/developer" target="_blank" rel="noopener noreferrer">IEX</a>免费提供。
          <br />
          使用本应用即表示您同意<a href="https://iextrading.com/api-exhibit-a" target="_blank" rel="noopener noreferrer">IEX的服务条款</a>。
        </p>
      </footer>
    </div>
  );
}

export default App; 