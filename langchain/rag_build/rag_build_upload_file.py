from zhipuai_embedding import ZhipuAIEmbeddings
from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
import streamlit as st
import tempfile
import os

embedding = ZhipuAIEmbeddings()
def get_vectordb():
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
    memory = ConversationBufferMemory(
        memory_key="chat_history",  # 与 prompt 的输入变量保持一致。
        return_messages=True  # 将以消息列表的形式返回聊天记录，而不是单个字符串
    )
    retriever=vectordb.as_retriever()
    qa = ConversationalRetrievalChain.from_llm(
        model,
        retriever=retriever,
        memory=memory
    )
    result = qa({"question": input_text})
    return result['answer']


def update_vectordb(uploaded_files):
    docs=[]
    temp_dir = tempfile.TemporaryDirectory(dir="/Users/xiukai.yu/work/py_workspace/langchain/tmp")
    for file in uploaded_files:
        temp_filepath = os.path.join(temp_dir.name, file.name)
        with open(temp_filepath, "wb") as f:
            f.write(file.getvalue())
        loader = TextLoader(temp_filepath, encoding="utf-8")
        docs.extend(loader.load())
    docs_splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=5)
    split_docs = docs_splitter.split_documents(docs)
    embedding = ZhipuAIEmbeddings()
    # 向量数据库持久化路径
    persist_directory="/Users/xiukai.yu/work/py_workspace/langchain/chroma_db"
    vectordb = Chroma.from_documents(split_docs, embedding=embedding, persist_directory=persist_directory)
    print(f"更新后向量库中存储的数量：{vectordb._collection.count()}")

def stream_response(response):
    for chunk in response:
        yield chunk

def main():
    st.set_page_config(page_title="文档回答", layout="wide")
    st.title("文档回答")

    uploaded_files = st.sidebar.file_uploader(label="上传txt文件", type=["txt"], accept_multiple_files=True)

    if not uploaded_files:
        st.info("请先上传TXT文档")
        st.stop()

    #只更新一次文档
    if 'vectordb_updated' not in st.session_state:
        update_vectordb(uploaded_files)
        st.session_state.vectordb_updated = True

    if 'messages' not in st.session_state or st.sidebar.button("清空聊天记录"):
        st.session_state.messages = [{"role":"assistant", "text":"你好，我是文档回答助手"}]

    messages = st.container(height=1000)
    if user_query := st.chat_input("请输入问题..."):
        # 将用户输入添加到对话历史中
        st.session_state.messages.append({"role": "user", "text": user_query})

        # 调用 respond 函数获取回答
        answer = get_chat_qa_chain(user_query)

        response_stream = stream_response(answer)
        assistant_message = messages.chat_message("assistant")
        text_area = assistant_message.empty()

        full_response = ""
        for chunk in response_stream:
            full_response += chunk
            text_area.write(full_response)

        st.session_state.messages.append({"role": "assistant", "text": full_response})
        # # 检查回答是否为 None
        # if answer is not None:
        #     # 将LLM的回答添加到对话历史中
        #     st.session_state.messages.append({"role": "assistant", "text": answer})

        # 显示整个对话历史
        for message in st.session_state.messages:
            if message["role"] == "user":
                messages.chat_message("user").write(message["text"])
            elif message["role"] == "assistant":
                messages.chat_message("assistant").write(message["text"])


if __name__ == "__main__":
    main()
