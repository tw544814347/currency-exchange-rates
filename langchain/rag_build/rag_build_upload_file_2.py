import tempfile

import streamlit as st
from langchain_community.document_loaders import TextLoader
from langchain_openai import ChatOpenAI
import os
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableBranch, RunnablePassthrough
from langchain_text_splitters import RecursiveCharacterTextSplitter

from zhipuai_embedding import ZhipuAIEmbeddings
from langchain_community.vectorstores import Chroma

def get_retriever():
    # 定义 Embeddings
    embedding = ZhipuAIEmbeddings()
    # 向量数据库持久化路径
    persist_directory = "/Users/wei.tao/Desktop/langchain/chroma_db"
    # 加载数据库
    vectordb = Chroma(
        persist_directory=persist_directory,
        embedding_function=embedding
    )
    return vectordb.as_retriever()

def combine_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs["context"])

def get_qa_history_chain():
    retriever = get_retriever()
    llm = ChatOpenAI(
        model='deepseek-chat',
        openai_api_key='sk-f39fe1d883d444dea19711206412e023',
        base_url='https://api.deepseek.com'
    )
    condense_question_system_template = (
        "请根据聊天记录总结用户最近的问题，"
        "如果没有多余的聊天记录则返回用户的问题。"
    )
    condense_question_prompt = ChatPromptTemplate([
            ("system", condense_question_system_template),
            ("placeholder", "{chat_history}"),
            ("human", "{input}"),
        ])

    retrieve_docs = RunnableBranch(
        (lambda x: not x.get("chat_history", False), (lambda x: x["input"]) | retriever, ),
        condense_question_prompt | llm | StrOutputParser() | retriever,
    )

    system_prompt = (
        "你是一个问答任务的助手。 "
        "请使用检索到的上下文片段回答这个问题。 "
        "如果你不知道答案就说不知道。 "
        "请使用简洁的话语回答用户。"
        "\n\n"
        "{context}"
    )
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("placeholder", "{chat_history}"),
            ("human", "{input}"),
        ]
    )
    qa_chain = (
        RunnablePassthrough().assign(context=combine_docs)
        | qa_prompt
        | llm
        | StrOutputParser()
    )

    qa_history_chain = RunnablePassthrough().assign(
        context = retrieve_docs,
        ).assign(answer=qa_chain)
    return qa_history_chain

def gen_response(chain, input, chat_history):
    response = chain.stream({
        "input": input,
        "chat_history": chat_history
    })
    for res in response:
        if "answer" in res.keys():
            yield res["answer"]

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


# Streamlit 应用程序界面
def main():
    st.set_page_config(page_title="文档回答", layout="wide")
    st.title("文档回答")

    uploaded_files = st.sidebar.file_uploader(label="上传txt文件", type=["txt"], accept_multiple_files=True)

    if not uploaded_files:
        st.info("请先上传TXT文档")
        st.stop()

    # 只更新一次文档
    if 'vectordb_updated' not in st.session_state:
        update_vectordb(uploaded_files)
        st.session_state.vectordb_updated = True

    # 用于跟踪对话历史
    if "messages" not in st.session_state:
        st.session_state.messages = []
    # 存储检索问答链
    if "qa_history_chain" not in st.session_state:
        st.session_state.qa_history_chain = get_qa_history_chain()
    messages = st.container(height=1000)
    # 显示整个对话历史
    for message in st.session_state.messages:
            with messages.chat_message(message[0]):
                st.write(message[1])
    if user_query := st.chat_input("Say something"):
        # 将用户输入添加到对话历史中
        st.session_state.messages.append(("human", user_query))
        with messages.chat_message("human"):
            st.write(user_query)

        answer = gen_response(
            chain=st.session_state.qa_history_chain,
            input=user_query,
            chat_history=st.session_state.messages
        )
        with messages.chat_message("ai"):
            output = st.write_stream(answer)
        st.session_state.messages.append(("ai", output))


if __name__ == "__main__":
    main()