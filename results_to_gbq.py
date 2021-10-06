import glob
import pandas as pd
import pandas_gbq
import datetime

def read_inspire_files(pattern):
    files = glob.glob(pattern)
    dfs = pd.DataFrame()
    for f in files:
        print(f'Reading file {f}')
        df = pd.read_csv(f)
        if 'santacruz' not in f: df['District'] = f.split('_')[1].replace('.csv','')
        dfs = dfs.append(df)
    return dfs.reset_index(drop=True)

district_name_map = {'BONNYDOON-UESD':'Bonny Doon', 'HAPPYVALLEY-UESD':'Happy Valley',
                'LIVEOAK-SD':'Live Oak', 'MOUNTAIN-ESD':'Mountain',  'PACIFIC-ESD':'Pacific',
                'PAJAROVALLEY-USD':'Pajaro Valley', 'SANTACRUZ-COE':'Santa Cruz COE',
                'SCCALTED':'Santa Cruz COE', 'SCCSWESTLAKE':'Santa Cruz City Schools',
                'SCCABRILLOCOLLEGE':'Cabrillo College',  'SCCGATEWAY':'Privates',
                'SCCPRIVATESCH':'Privates', 'SANTACRUZ-CS':'Santa Cruz City Schools',
                'SCCOE-CHARTER':'Charters', 'SCCOE-PRIVATE':'Prvates',
                'SCOTTSVALLEY-USD':'Scotts Valley', 'SLVUSD':'San Lorenzo Valley',
                'SOQUEL-UESD':'Soquel'}

### Write rgistrations to BigQuery ###
registrations_df = read_inspire_files('data/registrations/all_*.csv')
registrations_df = registrations_df.rename(columns={col: col.replace(' ','_') for col in registrations_df.columns})
registrations_df['Phone'] = registrations_df['Phone'].astype('Int64')
registrations_df['Registration_Date'] = pd.to_datetime(registrations_df['Registration_Date'])
#registrations_df = registrations_df[~registrations_df.duplicated(subset='')]

registrations_df['key1'] = (registrations_df['Last_Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     registrations_df['DOB'].str.replace('-','')  +
                     registrations_df['First_Name'].str.lower().str.slice(stop=3) )
registrations_df['key2'] = (registrations_df['Last_Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     registrations_df['DOB'].str.replace('-','')  +
                     registrations_df['First_Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) )

pandas_gbq.to_gbq(registrations_df,  "InspireTesting.rgistrations",  if_exists='replace', project_id="covidtesting-1602910185026") 

### Write results to BigQuery ###
results_df = read_inspire_files('data/results/santacruz*.txt')
results_df = results_df.rename(columns={col: col.replace(' ','_') for col in results_df.columns})
results_df['Phone'] = results_df['Phone'].astype('Int64')
results_df['Test_Date'] = pd.to_datetime(results_df.Test_Date)
results_df['Group'] = results_df[['Group','Organization']].apply(
        lambda x: x['Organization'].split('-')[1] if pd.isnull(x['Group']) else x['Group'],
        axis=1
    )
results_df['Group'][~results_df['Group'].isin(['STUDENT', 'STAFF'])] = 'STUDENT'
results_df['Organization'][results_df.Organization=="SCCSWESTLAKE-ES'"] = 'SCCSWESTLAKE-ES'
results_df['Organization'][results_df.Organization=="SCCSWESTLAKE-ES\t"] = 'SCCSWESTLAKE-ES'
results_df['District'][results_df['District'].isna()] = results_df['Organization'][results_df['District'].isna()].str.split('-',expand=True)[0]
results_df['District'] = results_df['District'].replace(district_name_map)

#results_df = results_df[~results_df.duplicated(subset='')]
results_df['key1'] = (results_df['Last_Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     results_df['DOB'].str.replace('-','')  +
                     results_df['First_Name'].str.lower().str.slice(stop=3) )
results_df['key2'] = (results_df['Last_Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     results_df['DOB'].str.replace('-','')  +
                     results_df['First_Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) )

pandas_gbq.to_gbq(results_df,  "InspireTesting.results",  if_exists='replace', project_id="covidtesting-1602910185026")


### Write results-summary to BigQuery ###
results_df['Status'] = results_df.apply(
    lambda x: 'active' if x.Test_Result=='POSITIVE' and x.Test_Date >= (datetime.datetime.today()-datetime.timedelta(days=10)).date()  else None,
    axis=1
)
results_df['Positive'] = results_df['Test_Result'].apply(lambda x: x if x=='POSITIVE' else None)    
summary_df = results_df[['Organization','District','Group','Positive']].groupby(by=['District','Organization','Group']).count()  
active_df = results_df.query('Status=="active"')[['Organization','District','Group','UID']].groupby(by=['District','Organization','Group']).nunique()['UID']
summary_df = summary_df.join(active_df, how='left', on=['District', 'Organization','Group']).astype('Int64') 
summary_df = summary_df.rename(columns={'UID':'Active'})
summary_df = summary_df.reset_index()
summary_df['Active'] = summary_df['Active'].fillna(0)
pandas_gbq.to_gbq(summary_df,  "InspireTesting.summary",  if_exists='replace', project_id="covidtesting-1602910185026")
