from os.path import exists
from google.oauth2 import service_account
from google.cloud import bigquery
import pandas_gbq
import streamlit as st

# Create API client.
if exists('.streamlit/secrets.toml'):
    credentials = service_account.Credentials.from_service_account_info(
        st.secrets["gcp_service_account"]
    )
    credentials_flag = True
else:
    credentials = None
    credentials_flag = None

#bq_client = bigquery.Client(project='covidtesting-1602910185026', credentials=credentials)
    
def bq_query(query):
    if credentials_flag:
        ## Perform query.
        ## Uses st.cache to only rerun when the query changes or after 10 min.
        #query_job = bq_client.query(query)
        #rows_raw = query_job.result()
        ## Convert to list of dicts. Required for st.cache to hash the return value.
        #rows = [dict(row) for row in rows_raw]
        #return rows
        df = pandas_gbq.read_gbq(query, project_id="covidtesting-1602910185026", credentials=credentials)
    else:
        df = pandas_gbq.read_gbq(query, project_id="covidtesting-1602910185026")
    return df   
    
#@st.cache
def get_results_from_bq():
    '''
    Get inspire results data from bigquery
    '''
    query = f"""
    SELECT *
    FROM `InspireTesting.results`
    """
    df = bq_query(query)
    df['Week'] = df.Test_Date.dt.week - df.Test_Date.dt.week.min()  + 1
    df['Test_Date'] = df.Test_Date.dt.date    
    return df
