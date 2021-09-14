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

inspire_df = read_inspire_files('data/registrations/all_*.csv')
inspire_df['Phone'] = inspire_df['Phone'].astype('Int64')
#inspire_df = inspire_df[~inspire_df.duplicated(subset='')]

inspire_df['key1'] = (inspire_df['Last Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     inspire_df['DOB'].str.replace('-','')  +
                     inspire_df['First Name'].str.lower().str.slice(stop=3) )
inspire_df['key2'] = (inspire_df['Last Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     inspire_df['DOB'].str.replace('-','')  +
                     inspire_df['First Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) )


### Generate SCCS SIS  merge ###
sccs_df = pd.read_csv('data/SCCS Student SIS-testing - Sheet1.csv')
sccs_df['DOB (MM/DD/YYYY)'] =  pd.to_datetime(sccs_df['DOB (MM/DD/YYYY)'])
sccs_df['DOB'] = sccs_df['DOB (MM/DD/YYYY)'].dt.strftime('%Y%m%d')
sccs_df = sccs_df[~sccs_df.duplicated(subset='Local_ID (SIS ID)')]

sccs_df['key1'] = (sccs_df['last_name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     sccs_df['DOB'] + sccs_df['first_name'].str.lower().str.slice(stop=3) )
sccs_df['key2'] = (sccs_df['last_name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     sccs_df['DOB'] + sccs_df['first_name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) )

sccs_merged = sccs_df.merge(inspire_df, on='key2', how='left')
sccs_merged = sccs_merged[~sccs_merged.Organization.isna()]

dupkeys = sccs_merged[sccs_merged.key2.duplicated()].key2
sccs_merged['duplicated'] = None
sccs_merged['duplicated'][sccs_merged.key2.isin(dupkeys)] = 'x'

#sccs_merged = sccs_merged.drop(columns=[col for col in sccs_merged.columns if '_y' in col])
sccs_merged = sccs_merged.rename(columns={'Local_ID (SIS ID)':'Local_ID', 'DOB (MM/DD/YYYY)':'DOB'})

col_selction = ['Local_ID', 'SSID', 'first_name', 'last_name',
       'DOB', 'school_site',  'Registration Date',  'Phone', 'Email', 'OID', 'SUBORG',
                'Group', 'Organization', 'District', 'duplicated']
final_df = sccs_merged[col_selction]
final_df.to_csv('data/sccs_merged.csv', index=False)


### Generate SCCOE Power Schools merge ###
ps_alted = pd.read_csv('data/PS_ALTED.text')
ps_sped = pd.read_csv('data/PS_SPED.text')
ps_df = pd.concat([ps_alted, ps_sped])
ps_df['SSID'] = ps_df['SSID'].astype('Int64')
ps_df['DOB'] = pd.to_datetime(ps_df.DOB)
ps_df['DOB'] = ps_df['DOB'].dt.strftime('%Y%m%d')
ps_df = ps_df[~ps_df.duplicated(subset='Student Number')]

ps_df['key1'] = (ps_df['Student Last Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     ps_df['DOB'] + ps_df['Student First Name'].str.lower().str.slice(stop=3) )
ps_df['key2'] = (ps_df['Student Last Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) +
                     ps_df['DOB'] + ps_df['Student First Name'].apply(lambda s: s.lower().split('-')[0].split(' ')[0]) )

ps_merged = ps_df.merge(inspire_df, on='key2', how='left')
ps_merged = ps_merged[~ps_merged.Organization.isna()]

dupkeys = ps_merged[ps_merged.key2.duplicated()].key2
ps_merged['duplicated'] = None
ps_merged['duplicated'][ps_merged.key2.isin(dupkeys)] = 'x'

ps_merged['Testing Consent Inspire'] = 1

col_selction = ['Student Number', 'Testing Consent Inspire']
final_df = ps_merged[col_selction]
final_df.to_csv('data/ps_merged.csv', index=False)
