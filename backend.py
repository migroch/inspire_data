import pandas as pd
import datetime
from bq_query import get_results_from_bq

APP_DATA = get_results_from_bq()

def prep_fig_data(app_data):
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

def get_lates_metrics(app_data):
    positive_df = app_data.query('Test_Result=="POSITIVE"')
    ten_days_date = (datetime.datetime.today() - datetime.timedelta(days=10)).date()
    active_df = positive_df.query('Test_Date >= @ten_days_date')

    active_count = active_df.UID.nunique()
    positive_count = positive_df.Test_Result.count()
    unique_count = app_data.UID.nunique()
    total_count = app_data.UID.count()

    return active_count, positive_count, unique_count, total_count