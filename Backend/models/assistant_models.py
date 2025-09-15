# models/chatbot_model.py

import os
import requests
import xmltodict
from gen_ai_hub.proxy.langchain.init_models import init_llm
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnableSequence

# Set environment variables for LLM
env_vars = {
    'AICORE_AUTH_URL': 'https://genai-ltim.authentication.eu10.hana.ondemand.com/oauth/token',
    'AICORE_CLIENT_ID': 'sb-b66c3931-8480-4dfd-8108-0992e56cac64!b476474|aicore!b540',
    'AICORE_CLIENT_SECRET': 'edf7fec3-428d-4983-b574-536143d70001$I7GPwBkjWwNnKDZmo7PQ3MZ0w4sDNKtO3pOpYKReCZU=',
    'organizations': ['LTIMindtree', 'SAP'],
    'AICORE_BASE_URL': 'https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com/v2',
    'AICORE_RESOURCE_GROUP': 'default'
}

for key, value in env_vars.items():
    if isinstance(value, list):
        value = ','.join(value)
    os.environ[key] = value

# Initialize LLM
llm = init_llm("gpt-4o", max_tokens=1000)

# Prompt and chain
chat_prompt = PromptTemplate(
    input_variables=["user_query"],
    template="You are an SAP iDoc assistant. Help the user with the following query: '{user_query}'. Provide a clear and complete response."
)
chat_chain = chat_prompt | llm

def get_chat_response(user_query: str, max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            response = chat_chain.invoke({"user_query": user_query})
            response_content = response.content if hasattr(response, 'content') else str(response)
            if response_content.strip().endswith(('.', '!', '?')):
                return response_content
            print(f"Attempt {attempt + 1}: Response seems truncated: {response_content[:100]}...")
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
        if attempt < max_retries - 1:
            print(f"Retrying LLM call (attempt {attempt + 2})...")
    return response_content
