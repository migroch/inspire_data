import pandas as pd
import pandas_gbq
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import streamlit as st

def get_results_from_bq():
    '''
    Get inspire results data from bigquery
    '''
    query = f"""
    SELECT *
    FROM `InspireTesting.results`
    """
    results_df = pandas_gbq.read_gbq(query, project_id="covidtesting-1602910185026")
    return results_df

results_df = get_results_from_bq()
results_counts_all = pd.DataFrame({'count': results_df.groupby(['Test_Result']).size()}).reset_index()
results_counts_dis = pd.DataFrame({'count': results_df.groupby(['District','Test_Result']).size()}).reset_index()

def draw_donut():
    districts = np.append(['ALL'], results_df['District'].unique())
    district_selected = st.sidebar.selectbox('Select District', districts)
    
    # figure data
    if district_selected == 'ALL':
        fig_data = results_counts_all
    else:
        fig_data = results_counts_dis[results_counts_dis['District']==district_selected]

    colors = ['#ff9999','#66b3ff','#99ff99','#ffcc99']
    explode = (0.05,0.05,0.05,0.05)
    total_tests = fig_data['count'].sum()

    fig1, ax1 = plt.subplots()

    plt.pie(fig_data['count'], colors=colors[:len(fig_data)], labels=fig_data['Test_Result'], 
            autopct='%1.1f%%', startangle=90, pctdistance=0.85, explode=explode[:len(fig_data)])

    # draw circle
    center_cir = plt.Circle((0,0), 0.7, fc='white')
    fig = plt.gcf()
    fig.gca().add_artist(center_cir)
    fig.suptitle('COVID-19 Test Results for ' + district_selected, fontsize=20)

    # equal aspect ratio 
    label = ax1.annotate('Total Tests Administered: ' + str(total_tests), xy=(0,0), fontsize=10, ha='center')
    ax1.axis('equal')
    plt.tight_layout()

    st.pyplot(fig)

# def draw_area(district):


draw_donut()
