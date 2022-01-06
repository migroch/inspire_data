from os.path import exists
import datetime
from google.oauth2 import service_account
from google.cloud import bigquery
import pandas as pd
import pandas_gbq
import streamlit as st
import pdb


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
def get_testing_totals_from_bq():
    '''
    Get total test counts from BigQuery
    '''
    query = f"""
    SELECT * FROM  `CovidTestingDB.Totals`
    """
    df = bq_query(query)

    return df

@st.cache(show_spinner=False, ttl=600)
def get_vaccine_totals_from_bq():
    '''
    Get total test counts from BigQuery
    '''
    query = f"""
    SELECT * FROM  `CovidVaccinesDB.Totals`
    """
    df = bq_query(query)
    
    return df    

@st.cache(show_spinner=False, ttl=600)
def get_results_from_bq():
    '''
    Get inspire testing results from bigquery
    '''
    query = f"""
    SELECT UID, District, Organization, `Group`, Gender, Race, Ethnicity, Test_Date, Test_Result
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
    df['Group'] = df['Group'].replace({'STAFF':'Educators & Staff', 'STUDENT':'Students'})
    df['Group'] = df['Group'].apply(lambda x: x if x in ['Students', 'Educators & Staff'] else 'Community' )
    df['Gender'] = df['Gender'].fillna('Unknown')
    df['Race'] = df['Race'].fillna('Unknown')
    df['Ethnicity'] = df['Ethnicity'].fillna('Unknown')

    return df

@st.cache(show_spinner=False, ttl=600)
def get_vaccinated_from_bq():
    '''
    Get inspire vaccination data from bigquery
    '''
    query = f"""
    SELECT key2 as UID, Org_Description as District, School_Site as Organization, Ed_Group as `Group`, date as Vaccination_Date, Vaccinated_Date_1st, Vaccinated_Date_2nd, Date_of_Birth as DOB, Dose, Gender, Race, Ethnicity
    FROM `CovidVaccinesDB.vax_viz2`
    WHERE Derived_Status IN ('Vaccinated','Vaccinated (Unconfirmed)')
    AND (duplicated <> 'toss' or duplicated is NULL)
    AND date is not null
    AND Dose <> '2nd'
    """
    df = bq_query(query)
    #df = df[~df.duplicated(subset=['UID','Dose'])]
    df['Week_First_Day'] = df.Vaccination_Date.apply(
        lambda x: x if pd.isnull(x) else datetime.datetime.strptime(str(x.isocalendar()[0])+'-'+str(x.isocalendar()[1]-1)+'-0', "%Y-%W-%w")
    )
    df['Week_Last_Day'] = df.Vaccination_Date.apply(
        lambda x: x if pd.isnull(x) else datetime.datetime.strptime(str(x.isocalendar()[0])+'-'+str(x.isocalendar()[1])+'-6', "%Y-%W-%w")
    )
    df['Week'] = df.Vaccination_Date.dt.week - df.Vaccination_Date.dt.week.min()  + 1
    df['Vaccination_Date'] = df.Vaccination_Date.dt.date
    df['Group'] = df['Group'].replace({'SC County Educators':'Educators & Staff'})
    df['District'] = df['District'].replace({'SANTA-CRUZ-OTHERS':'Other'})
    df['Gender'] = df['Gender'].replace({'F / Femenino':'Female', 'M / Masculino':'Male', 'Non Binary / No Binario':'Other', 'F':'Female', 'M':'Male'})
    df['Gender'] = df['Gender'].fillna('Unknown')
    df['Race'] = df['Race'].fillna('Unknown')
    df['Ethnicity'] = df['Ethnicity'].fillna('Unknown')
    df['Ethnicity'] = df['Ethnicity'].replace({
        'Hispanic; Latino or Spanish orgin':'Hispanic', 
        'Not of Hispanic; Latino; or Spanish origin':'Non-Hispanic',
        'Prefer Not to Say / Prefiero no decirlo':'Unknown',
        'Mexican; Mexican American; Chicano':'Hispanic',
        'Guatemalan':'Hispanic',
        'Salvadoran':'Hispanic',
        })
    df['Dose'] = df['Dose'].replace({'1st':'Inital vaccination (1-2 Dose)'})

    return df


