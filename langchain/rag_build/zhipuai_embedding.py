from typing import List
from langchain_core.embeddings import Embeddings
from zhipuai import ZhipuAI


# 官方
# def zhipu_embedding(text: str):
#     api_key = '33590521e81d45dea2059253486345fa.IJDbmBknPoqX25A3'
#     client = ZhipuAI(api_key=api_key)
#     response = client.embeddings.create(
#         model="embedding-2",
#         input=text,
#     )
#     return response
# #
#
# text = '要生成 embedding 的输入文本，字符串形式。'
# response = zhipu_embedding(text=text)
#
# print(f'生成embedding的model为：{response.model}')
# print(f'生成的embedding长度为：{len(response.data[0].embedding)}')
# print(f'embedding（前10）为: {response.data[0].embedding[:10]}')



# 自己封装
class ZhipuAIEmbeddings(Embeddings):

    def __init__(self):
        from zhipuai import ZhipuAI
        self.client = ZhipuAI(api_key="33590521e81d45dea2059253486345fa.IJDbmBknPoqX25A3")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        result = []
        for i in range(0, len(texts), 64):
            embeddings = self.client.embeddings.create(
                model="embedding-3",
                input=texts[i:i + 64]
            )
            result.extend([embeddings.embedding for embeddings in embeddings.data])
        return result

    def embed_query(self, text: str) -> List[float]:
        return self.embed_documents([text])[0]

# 实例化
# embedding = ZhipuAIEmbeddings()

# 测试调用
# vector = embedding.embed_query("量子计算")
# print(len(vector))
