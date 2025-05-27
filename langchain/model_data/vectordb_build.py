# 在文件开头插入项目根路径到 sys.path
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
# 添加项目根路径到 sys.path，以支持 rag_build 模块导入

from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rag_build.zhipuai_embedding import ZhipuAIEmbeddings

# 读取知识库文档
file_paths = []
folder_path = os.path.abspath(os.path.dirname(__file__))
for root, dirs, files in os.walk(folder_path):
    for file in files:
        file_path = os.path.join(root, file)
        if file_path.split(".")[-1] == 'txt':
            file_paths.append(file_path)
# print(file_paths[:3])

# 设置为doc文档
docs=[]
for file_path in file_paths:
    loader = TextLoader(file_path, encoding="utf-8")
    docs.extend(loader.load())

# print(docs)
# text = docs[0]
# print(f"每一个元素的类型：{type(text)}.",
#     f"该文档的描述性数据：{text.metadata}",
#     f"查看该文档的内容:\n{text.page_content[0:]}",
#     sep="\n------\n")

# 切分
docs_splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=5)
split_docs = docs_splitter.split_documents(docs)
print(split_docs)

# 定义向量数据库持久化路径
persist_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), '../chroma_db'))
embedding=ZhipuAIEmbeddings()
vectordb = Chroma.from_documents(split_docs, embedding=embedding, persist_directory=persist_directory)
print(f"向量库中存储的数量：{vectordb._collection.count()}")

# 相似性检索 chroma使用是余弦相似性
question="公司提供哪些保险福利"
sim_docs = vectordb.similarity_search(question,k=1) ##至少检索到k个内容返回
for i, sim_doc in enumerate(sim_docs):
    print(f"检索到的第{i}个内容: \n{sim_doc.page_content[:500]}")
