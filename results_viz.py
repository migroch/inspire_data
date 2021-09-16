import pandas as pd
import pandas_gbq
import numpy as np
from math import pi
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from matplotlib.lines import Line2D
import streamlit as st

def draw_donut():
    districts = np.append(['ALL'], results_df['District'].unique())
    district_selected = st.sidebar.selectbox('Select District', districts)
    
    # figure data
    if district_selected == 'ALL':
        fig_data = results_counts_all
    else:
        fig_data = results_counts_dis[results_counts_dis['District']==district_selected]

    colors = {'NEGATIVE': '#99ff99',
              'POSITIVE':'#66b3ff',
              'INCONCLUSIVE': '#ffcc99',
              'INVALID': '#ff9999'}
    fig_colors = []
    for i, row in fig_data.iterrows():
        fig_colors = np.append(fig_colors, colors[row['Test_Result']])

    explode = (0.05,0.05,0.05,0.05)
    total_tests = fig_data['count'].sum()

    fig1, ax1 = plt.subplots()

    plt.pie(fig_data['count'], colors=fig_colors, autopct='%1.1f%%', startangle=90, pctdistance=0.85, explode=explode[:len(fig_data)])

    # draw circle
    center_cir = plt.Circle((0,0), 0.7, fc='white')
    fig = plt.gcf()
    fig.gca().add_artist(center_cir)
    fig.suptitle('Total Tests Administered: ' + str(total_tests), fontsize=20)

    # legend
    legend_elements = [Line2D([0], [0], marker='s', color='w', label='Negative: '+str(fig_data[fig_data['Test_Result']=='NEGATIVE']['count'].values), markerfacecolor=colors['NEGATIVE'], markersize=10),
                       Line2D([0], [0], marker='s', color='w', label='Positive: '+str(fig_data[fig_data['Test_Result']=='POSITIVE']['count'].values), markerfacecolor=colors['POSITIVE'], markersize=10),
                       Line2D([0], [0], marker='s', color='w', label='Inconclusive: '+str(fig_data[fig_data['Test_Result']=='INCONCLUSIVE']['count'].values), markerfacecolor=colors['INCONCLUSIVE'], markersize=10),
                       Line2D([0], [0], marker='s', color='w', label='Invalid: '+str(fig_data[fig_data['Test_Result']=='INVALID']['count'].values), markerfacecolor=colors['INVALID'], markersize=10)]
    ax1.legend(handles=legend_elements, loc='center', frameon=False)

    # equal aspect ratio 
    # label = ax1.annotate(, xy=(0,0), fontsize=10, ha='center')
    ax1.axis('equal')
    plt.tight_layout()

    st.pyplot(fig)


def draw_progress():
    districts = np.append(['ALL'], results_df['District'].unique())
    district_selected = st.sidebar.selectbox('Select District', districts)

    # figure data
    if district_selected == 'ALL':
        fig_data = results_counts_all.sort_values(by='count', ascending=True).reset_index()
    else:
        fig_data = results_counts_dis[results_counts_dis['District']==district_selected].sort_values(by='count', ascending=True).reset_index()

    colors = {'NEGATIVE': '#99ff99',
              'POSITIVE':'#66b3ff',
              'INCONCLUSIVE': '#ffcc99',
              'INVALID': '#ff9999'}
    start_angle = 90
    total_tests = fig_data['count'].sum()

    fig_data['xs'] = [(i * pi * 2) / fig_data['count'].sum() for i in fig_data['count']]
    ys = [-0.2, 1, 2.2, 3.4]
    left = (start_angle * pi * 2) / 360

    fig, ax = plt.subplots()
    ax = plt.subplot(projection='polar')

    # plot bars and points
    for i, row in fig_data.iterrows():
        ax.barh(ys[i], row['xs'], left=left, height=1, color=colors[row['Test_Result']])
        ax.text(pi/2, ys[i] - 0.2, str(row['count']), fontsize=10)
    
    # legend
    legend_elements = [Line2D([0], [0], marker='s', color='w', label='Negative', markerfacecolor=colors['NEGATIVE'], markersize=10),
                       Line2D([0], [0], marker='s', color='w', label='Positive', markerfacecolor=colors['POSITIVE'], markersize=10),
                       Line2D([0], [0], marker='s', color='w', label='Inconclusive', markerfacecolor=colors['INCONCLUSIVE'], markersize=10),
                       Line2D([0], [0], marker='s', color='w', label='Invalid', markerfacecolor=colors['INVALID'], markersize=10)]
    ax.legend(handles=legend_elements, loc='center', frameon=False)
    
    # clear ticks, grids, spines
    plt.ylim(-4,4)
    plt.xticks([])
    plt.yticks([])
    ax.spines.clear()

    fig.suptitle('Total Tests Administered: ' + str(total_tests), fontsize=10)
    plt.tight_layout()
    st.pyplot(fig)

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


if __name__ == '__main__':
    results_df = get_results_from_bq()
    results_counts_all = pd.DataFrame({'count': results_df.groupby(['Test_Result']).size()}).reset_index()
    results_counts_dis = pd.DataFrame({'count': results_df.groupby(['District','Test_Result']).size()}).reset_index()
    
    # draw_progress()
    draw_donut()