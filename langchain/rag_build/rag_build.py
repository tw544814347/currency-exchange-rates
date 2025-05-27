import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
# 添加项目根路径到 sys.path，以支持 rag_build 模块导入

from zhipuai_embedding import ZhipuAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
import streamlit as st
# duckduckgo_search 免费网络搜索
try:
    from duckduckgo_search import ddg
except ImportError:
    ddg = None  # 如果导入失败，则不使用网络搜索
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import StrOutputParser

def get_vectordb():
    # 定义 Embeddings
    embedding = ZhipuAIEmbeddings()
    # 向量数据库持久化路径
    persist_directory="/Users/wei.tao/Desktop/langchain/chroma_db"
    # 加载数据库
    vectordb = Chroma(
        persist_directory=persist_directory,  # 允许我们将persist_directory目录保存到磁盘上
        embedding_function=embedding
    )
    print(f"向量库中存储的数量：{vectordb._collection.count()}")
    return vectordb

def get_chat_qa_chain(input_text):
    vectordb = get_vectordb()
    model = ChatOpenAI(
        model='deepseek-chat',
        openai_api_key='sk-f39fe1d883d444dea19711206412e023',
        base_url='https://api.deepseek.com'
    )
    # 本地向量检索
    retriever = vectordb.as_retriever()
    local_docs = retriever.get_relevant_documents(input_text)
    local_context = "\n\n".join([doc.page_content for doc in local_docs])
    # 使用 DuckDuckGo 免费搜索前3条链接
    web_results = []
    # 如果 ddg 可用，则使用 DuckDuckGo 免费搜索
    if ddg:
        try:
            results = ddg(input_text, max_results=3)
            web_results = [item['href'] for item in results] if results else []
        except Exception:
            web_results = []
    # 构建融合本地文档和网络搜索的 prompt
    prompt = ChatPromptTemplate.from_template(
        "结合以下本地知识库内容，和网络搜索结果的链接，回答用户的问题：\n"
        "本地内容：\n{local_context}\n\n"
        "网络链接：\n{web_results}\n\n"
        "问题：{question}"
    )
    chain = prompt | model | StrOutputParser()
    result = chain.invoke({
        "local_context": local_context,
        "web_results": "\n".join(web_results),
        "question": input_text
    })
    return result

def main():
    st.set_page_config(page_title="文档回答", layout="wide")
    st.title("文档回答")
    if 'messages' not in st.session_state:
        st.session_state.messages = []

    messages = st.container(height=1000)
    if prompt := st.chat_input("Say something"):
        # 将用户输入添加到对话历史中
        st.session_state.messages.append({"role": "user", "text": prompt})

        # 调用 respond 函数获取回答
        answer = get_chat_qa_chain(prompt)
        # 检查回答是否为 None
        if answer is not None:
            # 将LLM的回答添加到对话历史中
            st.session_state.messages.append({"role": "assistant", "text": answer})

        # 显示整个对话历史
        for message in st.session_state.messages:
            if message["role"] == "user":
                messages.chat_message("user").write(message["text"])
            elif message["role"] == "assistant":
                messages.chat_message("assistant").write(message["text"])

# 运行脚本时只启动 Streamlit 应用
if __name__ == "__main__":
    main()
