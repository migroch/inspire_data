import pandas as pd
import streamlit as st

color_dict = {
    #'A:Educators & Staff':'#FF890A',
    #'Vaccinated - A:Educators & Staff':'#FF931F',
    #'Boosted - A:Educators & Staff':'#F77F00',
    'A:Educators & Staff':'#FF006E',
    'Vaccinated - A:Educators & Staff':'#FF1F80',
    'Boosted - A:Educators & Staff':'#FF5006A',
    'B:Community':'#0D6EFD',
    'Vaccinated - B:Community':'#2179FD',
    'Boosted - B:Community':'#0262F2',
    'C:Students':'#09AB3B',
    'Vaccinated - C:Students':'#0AC244',
    'Boosted - C:Students':'#089B37',    
    'Total':'#ffffff',
}

@st.cache(suppress_st_warning=True, show_spinner=False)
def prep_areachart_data(app_data):
    groups = app_data.Group.unique()
    fig_data = app_data.groupby(['Vaccination_Date', 'Group']).size().unstack('Group', fill_value=0).reset_index()
    fig_data.drop
    for group in groups:
        fig_data[group] = fig_data[group].cumsum()
    fig_data['Week'] = pd.to_datetime(fig_data.Vaccination_Date).dt.week
    fig_data['Week'] = fig_data['Week'] - fig_data['Week'].min() + 1
    fig_data['Vaccination_Date'] = pd.to_datetime(fig_data.Vaccination_Date).dt.strftime('%Y-%m-%d')
    return fig_data[groups.tolist() + ['Week', 'Vaccination_Date']]

@st.cache(suppress_st_warning=True, show_spinner=False)
def gen_sunburst_df(totals_df):
    sunburst_df = totals_df.copy()
    sunburst_df = sunburst_df.replace({'Students':'C:Students', 'Community':'B:Community','SC County Educators':'A:Educators & Staff'})
    sunburst_df = sunburst_df.replace({'1st':'Full Vaccinations', 'Booster':'Boosters'})
    sunburst_df = sunburst_df.rename(columns={'Group':'parent', 'Dose':'label'}) 
    group_totals = sunburst_df.groupby('parent').sum().reset_index() 
    group_totals['label'] = group_totals['parent']
    group_totals['parent'] = 'Total'
    all_total = group_totals.groupby('parent').sum().reset_index()
    all_total['label'] = 'Total'  
    all_total['parent'] = ''  
    sunburst_df = pd.concat([sunburst_df, group_totals, all_total]) 
    sunburst_df = sunburst_df.sort_values(by='parent', ascending=True)
    sunburst_df = sunburst_df.reset_index().drop(columns='index')
    sunburst_df['id'] = sunburst_df['label']+' - '+sunburst_df['parent'] 
    sunburst_df['id'] = sunburst_df['id'].replace({'Total - ':'Total'}).str.replace(' - Total','')
    sunburst_df['percent'] = 100*sunburst_df['count_unique']/sunburst_df.query('label=="Total"').count_unique.iloc[0] 
    sunburst_df['label'] = sunburst_df['label'].str.replace('A:', '').str.replace('B:', '').str.replace('C:', '')
    sunburst_df['color'] = sunburst_df.id.replace(color_dict)
    return sunburst_df    