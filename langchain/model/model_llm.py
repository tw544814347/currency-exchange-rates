# from langchain_openai import ChatOpenAI
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.output_parsers import StrOutputParser
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import StrOutputParser

model = ChatOpenAI(
    model='deepseek-chat',
    openai_api_key = 'sk-f39fe1d883d444dea19711206412e023',
    base_url = 'https://api.deepseek.com'
)

prompt = ChatPromptTemplate.from_template("帮我写一篇关于{topic}的技术文章，100个字左右")

chain = prompt | model | StrOutputParser()

result = chain.invoke({"topic":"人工智能"})

print(result)


