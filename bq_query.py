from os.path import exists
import datetime
from google.oauth2 import service_account
from google.cloud import bigquery
import pandas as pd
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

try:
    bq_client = bigquery.Client(project='covidtesting-1602910185026', credentials=credentials)
except:
    print('WARNING: No credential file found, using pandas_gbq as BigQuery client')
    
def bq_query(query):
    if credentials_flag:
        query_job = bq_client.query(query)
        rows_raw = query_job.result()
        rows = [dict(row) for row in rows_raw]
        df = pd.DataFrame(rows) 
    else:
        df = pandas_gbq.read_gbq(query, project_id="covidtesting-1602910185026")
    return df   
    
@st.cache(show_spinner=False, ttl=600)
def get_results_from_bq():
    '''
    Get inspire results data from bigquery
    '''
    query = f"""
    SELECT *
    FROM `InspireTesting.results`
    """
    df = bq_query(query)
    df['Week_First_Day'] = df.Test_Date.apply(
        lambda x: datetime.datetime.strptime(str(x.isocalendar()[0])+'-'+str(x.isocalendar()[1]-1)+'-0', "%Y-%W-%w")
    )
    df['Week_Last_Day'] = df.Test_Date.apply(
        lambda x: datetime.datetime.strptime(str(x.isocalendar()[0])+'-'+str(x.isocalendar()[1])+'-6', "%Y-%W-%w")
    )
    df['Week'] = df.Test_Date.dt.week - df.Test_Date.dt.week.min()  + 1
    df['Test_Date'] = df.Test_Date.dt.date
    df['Group'] = df['Group'].replace({'STAFF':'Staff', 'STUDENT':'Students'})
    df['Gender'] = df['Gender'].fillna('Undisclosed')
    df['Race'] = df['Race'].fillna('Undisclosed')
    df['Ethnicity'] = df['Ethnicity'].fillna('Undisclosed')
    return df

@st.cache(show_spinner=False, ttl=600)
def get_vaccinated_from_bq():
    '''
    Get inspire results data from bigquery
    '''
    query = f"""
    SELECT *
    FROM `InspireTesting.vaccinated`
    """
    df = bq_query(query)
    df['Group'] = df['Group'].replace({'STAFF':'Staff', 'STUDENT':'Students'})
    df['District'] = df['District'].replace({'SANTA-CRUZ-OTHERS':'Other'})

    return df
