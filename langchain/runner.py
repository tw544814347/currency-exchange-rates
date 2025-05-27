#!/usr/bin/env python3
import threading
import os
import sys
import webview


def run_streamlit():
    # 后台启动 Streamlit 服务，使用同一 Python 解释器和 venv 环境
    cmd = f"\"{sys.executable}\" -m streamlit run rag_build/rag_build.py --server.port 8501"
    os.system(cmd)

if __name__ == "__main__":
    # 在后台线程运行 Streamlit
    threading.Thread(target=run_streamlit, daemon=True).start()
    # 主线程创建并启动 Webview 窗口
    webview.create_window("RAG Chat", "http://localhost:8501")
    webview.start() 