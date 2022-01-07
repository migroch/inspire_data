import pandas as pd
import numpy as np
import datetime
import streamlit as st

@st.cache(suppress_st_warning=True, show_spinner=False)
def prep_fig_data(app_data):
    '''
    Generate figure dataframe
    '''
    fig_data = pd.DataFrame({ 
        'test_count': app_data.groupby(['Test_Date']).size(), 
        'pos_count': app_data[app_data['Test_Result']=='POSITIVE'].groupby(['Test_Date']).size() 
    }).reset_index()
    fig_data['pos_count'] = fig_data.pos_count.fillna(0)
    fig_data['pos_rate'] = 100.0*fig_data['pos_count']/fig_data['test_count']
    fig_data = fig_data.rename(columns={'index':'Test_Date'})
    
    # Compute 10-day active cases & 14-day positive rate averages
    timedelta_14days = datetime.timedelta(days=14)
    timedelta_10days = datetime.timedelta(days=10)
    fig_data['avg_pos_rate'] = fig_data['Test_Date'].apply(
        lambda x:  fig_data[(fig_data['Test_Date'] >= (x - timedelta_14days)) &
                            (fig_data['Test_Date'] <= x)]['pos_count'].sum() /
        fig_data[(fig_data['Test_Date'] >= (x - timedelta_14days)) &
                (fig_data['Test_Date'] <= x)]['test_count'].sum()
    ) 
    fig_data['active_count'] = fig_data['Test_Date'].apply(
        lambda x: app_data[(app_data['Test_Date'] >= (x - timedelta_10days)) &
                            (app_data['Test_Date'] <= x) &
                            (app_data['Test_Result']=='POSITIVE')].UID.nunique()
    )  
    fig_data['Week'] = pd.to_datetime(fig_data.Test_Date).dt.week
    fig_data['Week'] = fig_data['Week']-fig_data['Week'].min()+1
    fig_data['Test_Date'] = pd.to_datetime(fig_data.Test_Date).dt.strftime('%Y-%m-%d')

    return fig_data

@st.cache(suppress_st_warning=True, show_spinner=False)
def get_latest_metrics(app_data):
    '''
    Pull latest metrics for active, positive, unique, and total counts
    '''
    ten_days_date = (datetime.datetime.today() - datetime.timedelta(days=10)).date()

    active_count = app_data.query('Test_Result=="POSITIVE" and Test_Date >= @ten_days_date').UID.nunique()
    positive_count = app_data.query('Test_Result=="POSITIVE"').Test_Result.count()
    unique_count = app_data.UID.nunique()
    total_count = app_data.UID.count()

    return active_count, positive_count, unique_count, total_count

@st.cache(suppress_st_warning=True, show_spinner=False)
def get_weekly_metrics(app_data):
    '''
    Generate weekly metrics dataframe
    '''
    weekly_metrics_columns =  ['Week', 'Dates', 'Active Cases', 'Positives', 'People Tested', 'Tests Completed' ]
    weekly_metrics = pd.DataFrame(columns=weekly_metrics_columns)   
    
    weeks = app_data.Week.sort_values().unique()
    if app_data.Week_Last_Day.max() < datetime.date.today(): 
        weeks = np.append(weeks, weeks.max()+1)   
    
    for week in weeks:
        week_df = app_data.query('Week == @week')
        if week_df.size:
            week_date_min = week_df.Week_First_Day.min().date()
            week_date_max = week_df.Week_Last_Day.max().date()
            if datetime.date.today() < week_date_max: 
                week_date_max = datetime.date.today()
            active_date_min = week_date_min  - datetime.timedelta(days=10)
            active_date_max = week_date_max

            active_weekly_count = app_data.query('Test_Result=="POSITIVE" and Test_Date>=@active_date_min and Test_Date<=@active_date_max').UID.nunique()
            positive_weekly_count = week_df.query('Test_Result=="POSITIVE"').Test_Result.count()
            unique_weekly_count = week_df.UID.nunique()
            total_weekly_count = week_df.UID.count()

            dates = week_date_min.strftime('%m/%d/%y')+' - '+week_date_max.strftime('%m/%d/%y')
            row = [week, dates, active_weekly_count, positive_weekly_count, unique_weekly_count, total_weekly_count]
        else:
            week_date_min =  app_data.Week_Last_Day.max()+datetime.timedelta(days=1)
            week_date_max =  datetime.datetime.strptime(str(datetime.date.today().isocalendar()[0])+'-'+str(datetime.date.today().isocalendar()[1])+'-6', "%Y-%W-%w").date()
            active_date_min = week_date_min  - datetime.timedelta(days=10)
            active_date_max = week_date_max
            if datetime.date.today() < week_date_max: 
                week_date_max = datetime.date.today()

            active_weekly_count = app_data.query('Test_Result=="POSITIVE" and Test_Date>=@active_date_min and Test_Date<=@active_date_max').UID.nunique()
            positive_weekly_count = 0
            unique_weekly_count = 0
            total_weekly_count = 0

            dates = week_date_min.strftime('%m/%d/%y')+' - '+week_date_max.strftime('%m/%d/%y')
            row = [week, dates, active_weekly_count, positive_weekly_count, unique_weekly_count, total_weekly_count]
        
        weekly_metrics = pd.concat([weekly_metrics, pd.DataFrame([row], columns=weekly_metrics_columns, index=[week])])
    
    return weekly_metrics