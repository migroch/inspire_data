import glob
import pandas as pd
import pandas_gbq

### Read inspire registration files ###
def read_inspire_files(pattern):
    files = glob.glob(pattern)
    dfs = pd.DataFrame()
    for f in files:
        print(f'Reading file {f}')
        df = pd.read_csv(f)
        df['District'] = f.split('_')[1].replace('.csv','')
        dfs = dfs.append(df)
    return dfs.reset_index(drop=True)

inspire_df = read_inspire_files('data/results/all_*.csv')
inspire_df['Phone'] = inspire_df['Phone'].astype('Int64')
#inspire_df = inspire_df[~inspire_df.duplicated(subset='')]

inspire_df['key1'] = (inspire_df['Last Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     inspire_df['DOB'].str.replace('-','')  +
                     inspire_df['First Name'].str.lower().str.slice(stop=3) )
inspire_df['key2'] = (inspire_df['Last Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     inspire_df['DOB'].str.replace('-','')  +
                     inspire_df['First Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) )

inspire_df = inspire_df.rename(columns={col: col.replace(' ','_') for col in inspire_df.columns})

pandas_gbq.to_gbq(inspire_df,  "InspireTesting.results",  if_exists='replace', project_id="covidtesting-1602910185026") 
