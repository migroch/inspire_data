from math import  pi
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
import streamlit as st


def  get_pct_labels(x):
    if x < 2: return None
    return f"{x: .0f}%"
    
def get_count_string(count, total ):
    if len(count):
        pct = 100*count[0]/total
        return str(count[0])+f' | {pct:.1f}%'
    return '0'

def draw_donut(filtered_df):
    '''
    Draw a donut chart of test results
    '''
    fig_data = pd.DataFrame({'count': filtered_df.groupby(['Test_Result']).size()}).reset_index()
    
    colors = {'NEGATIVE': '#99ff99',
              'POSITIVE':'#F63366',
              'INCONCLUSIVE': '#ffcc99',
              'INVALID': '#E7E9EB'}
    fig_colors = []
    for i, row in fig_data.iterrows():
        fig_colors = np.append(fig_colors, colors[row['Test_Result']])

    explode = (0.05,0.05,0.05,0.05)
    total_tests = fig_data['count'].sum()

    fig1, ax1 = plt.subplots()

    plt.pie(fig_data['count'], colors=fig_colors, autopct=get_pct_labels, center=(0,0),
            startangle=90, pctdistance=0.85, explode=explode[:len(fig_data)])

    # draw circle
    center_cir = plt.Circle((0,0), 0.7, fc='white')
    fig = plt.gcf()
    fig.gca().add_artist(center_cir)
    #fig.suptitle('Total Tests Administered: ' + str(total_tests), y=1, fontsize=20)

    # legend
    legend_elements = [
        Line2D([0], [0], marker='s', color='w', label='Negative: '+get_count_string(fig_data[fig_data['Test_Result']=='NEGATIVE']['count'].values, total_tests), markerfacecolor=colors['NEGATIVE'], markersize=10),
        Line2D([0], [0], marker='s', color='w', label='Positive: '+get_count_string(fig_data[fig_data['Test_Result']=='POSITIVE']['count'].values, total_tests), markerfacecolor=colors['POSITIVE'], markersize=10),
        Line2D([0], [0], marker='s', color='w', label='Inconclusive: '+get_count_string(fig_data[fig_data['Test_Result']=='INCONCLUSIVE']['count'].values, total_tests), markerfacecolor=colors['INCONCLUSIVE'], markersize=10),
        Line2D([0], [0], marker='s', color='w', label='Invalid: '+get_count_string(fig_data[fig_data['Test_Result']=='INVALID']['count'].values, total_tests), markerfacecolor=colors['INVALID'], markersize=10)
    ]
    ax1.legend(handles=legend_elements, loc='center', frameon=False)

    # equal aspect ratio 
    # label = ax1.annotate(, xy=(0,0), fontsize=10, ha='center')
    ax1.axis('equal')
    plt.tight_layout()

    st.pyplot(fig)

def draw_progress(filtered_df):
    '''
    Draw a progress chart of test results
    '''
    fig_data = pd.DataFrame({'count': filtered_df.groupby(['Test_Result']).size()}).reset_index()

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

