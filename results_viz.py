import datetime
import pandas as pd
import numpy as np
import streamlit as st
from import_styles import *
from bq_query import get_results_from_bq
from time_chart import time_chart
#import draw_donut from donut_charts
#import pdb
    
def apply_filters(results_df, site_filter=False):
    '''
    Apply filters and return the data frame to use for figures
    '''
    filtered_df = results_df
    
    ## Apply district and school filters
    districts = np.append(['ALL'], filtered_df['District'].unique())
    district_selected = st.sidebar.selectbox('Select District', districts)
    if district_selected != 'ALL':
        filtered_df = filtered_df.query('District == @district_selected')

    if site_filter:    
        sites = np.append(['ALL'], filtered_df['Organization'].unique())
        site_selected = st.sidebar.selectbox('Select Site', sites)
        if site_selected != 'ALL':
            filtered_df = filtered_df.query('Organization == @site_selected')

    ## Apply group filters
    groups = np.append(['ALL'], filtered_df['Group'].unique())
    group_selected =  st.sidebar.selectbox('Select Group', groups)
    if group_selected != 'ALL':
        filtered_df = filtered_df.query('Group == @group_selected')

    ## Apply date filters
    with st.sidebar.expander("Week and Date Filters"):
        week_range = st.slider('Select Weeks', min_value=int(filtered_df.Week.min()),
                               max_value=int(filtered_df.Week.max()),
                               value = (int(filtered_df.Week.min()), int(filtered_df.Week.max())),
                               format = "Week %i",
                               help = f"Select the week number since the start of the program (first results on: {filtered_df.Test_Date.min()})"
                               )
        filtered_df = filtered_df.query('Week >= @week_range[0] and Week <= @week_range[1]')
        
        date_range = st.slider('Select Dates', min_value=filtered_df.Test_Date.min(),
                               max_value=filtered_df.Test_Date.max(),
                               value = (filtered_df.Test_Date.min(), filtered_df.Test_Date.max()),
                               format = "M/D/YY",
                               help = "Select the dates within the selected weeks"
                               )   
        filtered_df = filtered_df.query('Test_Date >= @date_range[0] and Test_Date <= @date_range[1]')
        
    if site_filter:
        selections_dict = {'week_range':week_range, 'date_range':date_range, 'district': district_selected, 'site':site_selected}
    else:
        selections_dict = {'week_range':week_range, 'date_range':date_range, 'district': district_selected}
    return filtered_df, selections_dict

def get_weeklymetrics_df(filtered_df):
    weeklymetrics_df_columns =  ['Week', 'Dates', 'Active Cases', 'Positives', 'Tests Completed' ]
    weeklymetrics_df = pd.DataFrame(columns=weeklymetrics_df_columns)   
    weeks = filtered_df.Week.sort_values().unique()
    for week in weeks:
        week_df = filtered_df.query('Week == @week')
        total_week_count = week_df.UID.count()
        positive_df = week_df.query('Test_Result=="POSITIVE"')
        positive_count = positive_df.Test_Result.count()
        week_date_min = week_df.Test_Date.min()
        week_date_max = week_df.Test_Date.max()
        active_date_min = week_date_min  - datetime.timedelta(days=10)
        active_date_max = week_date_max
        active_df = filtered_df.query('Test_Result=="POSITIVE" and Test_Date>=@active_date_min and Test_Date<=@active_date_max')
        active_count = len(active_df.UID.unique())
        dates = week_date_min.strftime('%m/%d/%y')+'-'+week_date_max.strftime('%m/%d/%y')
        row = [week, dates, active_count, positive_count, total_week_count]
        weeklymetrics_df = pd.concat([weeklymetrics_df, pd.DataFrame([row], columns=weeklymetrics_df_columns, index=[week])])

    return weeklymetrics_df

def show_metrics(filtered_df):
    '''
    Show the active, positive and total tests metrics
    '''
    total_count = filtered_df.UID.count()
    positive_df = filtered_df.query('Test_Result=="POSITIVE"')
    positive_count = positive_df.Test_Result.count()
    ten_days_date = (datetime.datetime.today() - datetime.timedelta(days=10)).date()
    active_df = positive_df.query('Test_Date >= @ten_days_date')
    active_count = len(active_df.UID.unique())
    sum_col1, sum_col2, sum_col3 = st.columns(3)
    sum_col1.subheader("Current Active Cases:")
    sum_col1.markdown(f"<p  class='text-danger fs-1'>{active_count}</p>", unsafe_allow_html=True)
    sum_col2.subheader("Total Positive Tests:")
    sum_col2.markdown(f"<p   class='text-warning fs-1'>{positive_count}</p>", unsafe_allow_html=True)
    sum_col3.subheader('Total Test Administered:')
    sum_col3.markdown(f"<p   class='text-success fs-1'>{total_count}</p>", unsafe_allow_html=True)

    weeklymetrics_df = get_weeklymetrics_df(filtered_df)
    lastweek_dates = weeklymetrics_df.sort_values('Week').iloc[-2].Dates
    prevweek_dates = weeklymetrics_df.sort_values('Week').iloc[-3].Dates
    st.subheader(f"Last Week's Data")
    st.text(f"{lastweek_dates}")
    active_col, positives_col, ntests_col = st.columns(3)    
    #week_col.metric(label="Week", value=str(weeklymetrics_df.iloc[-1].Week))
    #dates_col.metric(label="Dates", value=weeklymetrics_df.iloc[-1].Dates)
    delta = weeklymetrics_df.iloc[-2]['Active Cases']-weeklymetrics_df.iloc[-3]['Active Cases']
    delta = delta if delta !=0 else None 
    active_col.metric(label="Active Cases", value=weeklymetrics_df.iloc[-2]['Active Cases'],  delta=delta)
    delta = weeklymetrics_df.iloc[-2].Positives-weeklymetrics_df.iloc[-3].Positives
    delta = delta if delta !=0 else None 
    positives_col.metric(label="Positive Tests", value=weeklymetrics_df.iloc[-2].Positives,  delta=delta )
    delta = weeklymetrics_df.iloc[-2]['Tests Completed']-weeklymetrics_df.iloc[-3]['Tests Completed']
    delta = delta if delta !=0 else None 
    ntests_col.metric(label="Tests Completed", value=weeklymetrics_df.iloc[-2]['Tests Completed'],  delta=delta)
    st.caption(f"Delta values represent changes from previous week ({prevweek_dates})")
    with st.expander("Show Weekly Data"):
        st.subheader("Weekly Data")
        display_index = 'Week '+ weeklymetrics_df.Week.astype('str')
        display_df = weeklymetrics_df.set_index(display_index).drop(columns='Week')
        display_df = display_df.sort_values('Week', ascending=False)
        st.dataframe(display_df)

def draw_time_chart(filtered_df):
    '''
    Create a d3 component with a results vs time chart of test results
    '''
    st.subheader('Time Trends')
    fig_data = pd.DataFrame({ 
        'test_count': filtered_df.groupby(['Test_Date']).size(), 
        'pos_count': filtered_df[filtered_df['Test_Result']=='POSITIVE'].groupby(['Test_Date']).size() 
     }).reset_index()
    fig_data['pos_count'] = fig_data.pos_count.fillna(0)
    fig_data['pos_rate'] = 100.0*fig_data['pos_count']/fig_data['test_count']
    fig_data = fig_data.rename(columns={'index':'Test_Date'})
    timedelta_10days = datetime.timedelta(days=10) 
    fig_data['active_count'] = fig_data['Test_Date'].apply(
        lambda x: filtered_df[(filtered_df['Test_Date'] >= (x - timedelta_10days)) &
                              (filtered_df['Test_Date'] <= x) &
                              (filtered_df['Test_Result']=='POSITIVE')
                              ].UID.nunique()
    )  
    fig_data['Week'] = pd.to_datetime(fig_data.Test_Date).dt.week
    fig_data['Week'] = fig_data['Week']-fig_data['Week'].min()+1
    fig_data['Test_Date'] = pd.to_datetime(fig_data.Test_Date).dt.strftime('%Y-%m-%d')
    fig_data = list(
        zip(fig_data.Test_Date, fig_data.pos_rate, fig_data.pos_count,
            fig_data.active_count, fig_data.test_count, fig_data.Week)
    )

    #circle_radius = st.sidebar.slider("Circle radius", 1, 25, 5)
    #circle_color = st.sidebar.color_picker("Circle color", "#ED647C")

    time_chart(fig_data,  key="time_chart")    
    
if __name__ == '__main__':
    results_df = get_results_from_bq()
    filtered_df, selections_dict = apply_filters(results_df)
    district = selections_dict['district']
    if district == 'ALL': district = 'Santa Cruz County'
    #title_col1, title_col2 = st.columns(2)
    #title_col1.title('Tests Results for:')
    st.markdown(f'<h1 style="color: grey;">{district}</h1>' , unsafe_allow_html=True)
    show_metrics(filtered_df)
    with st.expander("Show Time Trends"):
        draw_time_chart(filtered_df)
    #draw_donut(filtered_df)
