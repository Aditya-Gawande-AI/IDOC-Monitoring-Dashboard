# idoc_ai_service.py

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
askai_prompt = PromptTemplate(
    input_variables=["error_message"],
    template="Given the following iDoc error message: '{error_message}', provide a complete step-by-step guide to resolve the error. Ensure the response is comprehensive and does not stop abruptly."
)
askai_chain = askai_prompt | llm

# API credentials
IDOC_API_URL = "http://172.19.151.9:8000/sap/opu/odata/sap/Z_IDOCSTATUS_SRV/OStatusSet"
API_USERNAME = "10837890"
API_PASSWORD = "Sunday@2025"

def fetch_failed_idocs():
    try:
        response = requests.get(IDOC_API_URL, auth=(API_USERNAME, API_PASSWORD), timeout=10)
        response.raise_for_status()
        data = xmltodict.parse(response.text)
        idocs = data.get('feed', {}).get('entry', [])
        if isinstance(idocs, dict):
            idocs = [idocs]
        return [
            {
                'IDocNO': idoc.get('content', {}).get('m:properties', {}).get('d:E_IDocNo', ''),
                'Msgtype': idoc.get('content', {}).get('m:properties', {}).get('d:E_Msgtype', ''),
                'Sender': idoc.get('content', {}).get('m:properties', {}).get('d:E_Sender', ''),
                'Receiver': idoc.get('content', {}).get('m:properties', {}).get('d:E_Receiver', ''),
                'Statxt': idoc.get('content', {}).get('m:properties', {}).get('d:E_Statxt', '')
            }
            for idoc in idocs
        ]
    except requests.RequestException as e:
        print(f"Error fetching iDocs: {str(e)}")
        return []

def invoke_with_retry(chain: RunnableSequence, input_data: dict, max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            response = chain.invoke(input_data)
            response_content = response.content if hasattr(response, 'content') else str(response)
            if response_content.strip().endswith(('.', '!', '?')):
                return response_content
            print(f"Attempt {attempt + 1}: Response seems truncated: {response_content[:100]}...")
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
        if attempt < max_retries - 1:
            print(f"Retrying LLM call (attempt {attempt + 2})...")
    return response_content
