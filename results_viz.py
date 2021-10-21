import time
import datetime
from typing import Tuple
import pandas as pd
import numpy as np
import streamlit as st
from import_styles import *
from bq_query import get_results_from_bq
from time_chart import time_chart
from gauge_chart import gauge_chart
#import draw_donut from donut_charts
import pdb

st.set_page_config(
    layout="wide",
    page_title="Santa Cruz County Covid Testing Dashboard",
    #page_icon="🧊",
    initial_sidebar_state = "collapsed",
)

def apply_filters(results_df, column, district_filter=False, site_filter=False):
    '''
    Apply filters and return the data frame to use for figures
    '''
    filtered_df = results_df

    ## Apply district and school filters 
    if district_filter:
        districts = np.append(['ALL'], filtered_df['District'].unique())
        district_selected = st.sidebar.selectbox('Select District', districts)
        if district_selected != 'ALL':
            filtered_df = filtered_df.query('District == @district_selected')

    if site_filter:    
        sites = np.append(['ALL'], filtered_df['Organization'].unique())
        site_selected = st.sidebar.selectbox('Select Site', sites)
        if site_selected != 'ALL':
            filtered_df = filtered_df.query('Organization == @site_selected')

    filtered_df, date_range = build_filter_expander(filtered_df)
    ## Apply date filters
    # with st.sidebar.expander("Date Filter"):
    #    week_range = st.slider('Select Weeks', min_value=int(filtered_df.Week.min()),
    #                       max_value=int(filtered_df.Week.max()),
    #                        value = (int(filtered_df.Week.min()), int(filtered_df.Week.max())),
    #                        format = "Week %i",
    #                        help = f"Select the week number since the start of the program (first results on: {filtered_df.Test_Date.min()})"
    #                        )
    # filtered_df = filtered_df.query('Week >= @week_range[0] and Week <= @week_range[1]')

    # date_min = filtered_df.Test_Date.min() 
    # date_max = filtered_df.Test_Date.max()
    # date_filter_col = st.columns([2,1,1,1,1])
    # if filtered_df.size:
    #     date_range = date_filter_col[0].slider('Select dates', 
    #                                             min_value=date_min, 
    #                                             max_value=date_max, 
    #                                             value = (date_min, date_max), 
    #                                             format = "M/D/YY", 
    #                                             #help = 'Filter the date range with the slider'
    #     )   
    #     filtered_df = filtered_df.query('Test_Date >= @date_range[0] and Test_Date <= @date_range[1]')
    # else:
    #     date_range=None   

    if site_filter and district_filter:
        selections_dict = { 'date_range':date_range, 'district': district_selected, 'site':site_selected}
    elif district_filter:
        selections_dict = { 'date_range':date_range, 'district': district_selected}    
    else:
        selections_dict = { 'date_range':date_range}
    return filtered_df, selections_dict

def build_filter_expander(filtered_df):
    with st.expander('Select Filters and Date Range'):
        filter_columns = st.columns([1,1,1,1,3])
        filtered_df = filter_groups(filtered_df, filter_columns[0])
        filtered_df = filter_gender(filtered_df, filter_columns[1])
        filtered_df = filter_race(filtered_df, filter_columns[2])
        filtered_df = filter_ethnicity(filtered_df, filter_columns[3])
        filtered_df, date_range = filter_date_range(filtered_df, filter_columns[4])

    return filtered_df, date_range   

def filter_date_range(filtered_df, column):
    date_min = filtered_df.Test_Date.min()
    date_max = filtered_df.Test_Date.max()

    column.write("Select Date Range:")
    if filtered_df.size:
        date_range = column.slider('Select Dates:',
                                    min_value=date_min,
                                    max_value=date_max,
                                    value=(date_min, date_max),
                                    format="M/D/YY")
        filtered_df = filtered_df.query("Test_Date >= @date_range[0] and Test_Date <= @date_range[1]")
    else:
        date_range=None
    
    return filtered_df, date_range

def filter_groups(filtered_df, column):
    groups = filtered_df['Group'].unique()
    groups_selected = []

    column.write("Group:")
    for group in groups:
        selection = column.checkbox(group, value=True, key=group+'_group_selected', on_change=None, args=None, kwargs=None)
        if selection: 
            groups_selected.append(group)
    
    filtered_df = filtered_df.query('Group in @groups_selected')
    return filtered_df  

def filter_gender(filtered_df, column):
    groups = filtered_df['Gender'].unique()
    groups_selected = []

    column.write("Gender:")
    for group in groups:
        selection = column.checkbox(group, value=True, key=group+'_gender_selected', on_change=None, args=None, kwargs=None)
        if selection: 
            groups_selected.append(group)
    
    filtered_df = filtered_df.query('Gender in @groups_selected')
    return filtered_df  

def filter_race(filtered_df, column):
    groups = filtered_df['Race'].unique()
    groups_selected = []

    column.write("Race:")
    for group in groups:
        selection = column.checkbox(group, value=True, key=group+'_race_selected', on_change=None, args=None, kwargs=None)
        if selection: 
            groups_selected.append(group)
    
    filtered_df = filtered_df.query('Race in @groups_selected')
    return filtered_df  

def filter_ethnicity(filtered_df, column):
    groups = filtered_df['Ethnicity'].unique()
    groups_selected = []

    column.write("Ethnicity:")
    for group in groups:
        selection = column.checkbox(group, value=True, key=group+'_ethnicity_selected', on_change=None, args=None, kwargs=None)
        if selection: 
            groups_selected.append(group)
    
    filtered_df = filtered_df.query('Ethnicity in @groups_selected')
    return filtered_df  

def show_latest_metrics(filtered_df):
    '''
    Show the latest active, positive and total tests metrics
    '''
    total_count = filtered_df.UID.count()
    unique_count = filtered_df.UID.nunique()
    positive_df = filtered_df.query('Test_Result=="POSITIVE"')
    positive_count = positive_df.Test_Result.count()
    ten_days_date = (datetime.datetime.today() - datetime.timedelta(days=10)).date()
    active_df = positive_df.query('Test_Date >= @ten_days_date')
    active_count = len(active_df.UID.unique())
    sum_col1, sum_col2, sum_col3, sum_col4 = st.columns(4)
    sum_col1.markdown("<h5>Current&nbspActive Cases:&nbsp&nbsp&nbsp</h5>", unsafe_allow_html=True)
    a_text = sum_col1.empty()
    sum_col2.markdown("<h5>Total&nbspPositive Tests:&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</h5>", unsafe_allow_html=True)
    p_text = sum_col2.empty()
    sum_col3.markdown("<h5>Total&nbspPeople Tested:&nbsp&nbsp&nbsp&nbsp&nbsp</h5>", unsafe_allow_html=True)
    u_text = sum_col3.empty()
    sum_col4.markdown("<h5>Total&nbspTests Completed:</h5>", unsafe_allow_html=True)
    t_text = sum_col4.empty()
    st.caption(f"Updated daily at 10am (latest test results are from tests completed on: {filtered_df.Test_Date.max().strftime('%m/%d/%y')})")
    return active_count, positive_count, unique_count, total_count, a_text, p_text, u_text, t_text

def animate_metrics(active_count, positive_count,  unique_count, total_count, a_text, p_text, u_text, t_text):
    '''
    Animate the latest metrics text
    '''
    a_count = 0
    p_count = 0
    u_count = 0
    t_count = 0
    for i in range(100):
        a_count = int((i+1)*(active_count/100))
        p_count = int((i+1)*(positive_count/100))
        u_count = int((i+1)*(unique_count/100))/1000
        t_count = int((i+1)*(total_count/100))/1000
        a_text.markdown(f"<p  class='fs-1' style='color:#ff006e'>{a_count}</p>", unsafe_allow_html=True)
        p_text.markdown(f"<p   class='fs-1' style='color:#f77f00'>{p_count}</p>", unsafe_allow_html=True)
        u_text.markdown("<p   class='text-primary fs-1' >{:.1f}K</p>".format(u_count), unsafe_allow_html=True)
        t_text.markdown("<p   class='fs-1' style='color:#09ab3b'>{:.1f}K</p>".format(t_count), unsafe_allow_html=True)
        time.sleep(0.05)  

def get_weeklymetrics_df(filtered_df):
    '''
    Generate weeklymetrics_df
    '''
    weeklymetrics_df_columns =  ['Week', 'Dates', 'Active Cases', 'Positives', 'People Tested', 'Tests Completed' ]
    weeklymetrics_df = pd.DataFrame(columns=weeklymetrics_df_columns)   
    weeks = filtered_df.Week.sort_values().unique()
    if filtered_df.Week_Last_Day.max() < datetime.date.today(): weeks = np.append(weeks, weeks.max()+1)   
    for week in weeks:
        week_df = filtered_df.query('Week == @week')
        if week_df.size:
            total_week_count = week_df.UID.count()
            unique_week_count = week_df.UID.nunique()
            positive_df = week_df.query('Test_Result=="POSITIVE"')
            positive_count = positive_df.Test_Result.count()
            week_date_min = week_df.Week_First_Day.min().date()
            week_date_max = week_df.Week_Last_Day.max().date()
            if datetime.date.today() < week_date_max: week_date_max = datetime.date.today()
            active_date_min = week_date_min  - datetime.timedelta(days=10)
            active_date_max = week_date_max
            active_df = filtered_df.query('Test_Result=="POSITIVE" and Test_Date>=@active_date_min and Test_Date<=@active_date_max')
            active_count = len(active_df.UID.unique())
            dates = week_date_min.strftime('%m/%d/%y')+' - '+week_date_max.strftime('%m/%d/%y')
            row = [week, dates, active_count, positive_count, unique_week_count, total_week_count]
        else:
            total_week_count = 0
            unique_week_count = 0
            positive_count = 0
            week_date_min =  filtered_df.Week_Last_Day.max()+datetime.timedelta(days=1)
            week_date_max =  datetime.datetime.strptime(str(datetime.date.today().isocalendar()[0])+'-'+str(datetime.date.today().isocalendar()[1])+'-6', "%Y-%W-%w").date()
            active_date_min = week_date_min  - datetime.timedelta(days=10)
            active_date_max = week_date_max
            active_df = filtered_df.query('Test_Result=="POSITIVE" and Test_Date>=@active_date_min and Test_Date<=@active_date_max')
            active_count = len(active_df.UID.unique())
            dates = week_date_min.strftime('%m/%d/%y')+' - '+week_date_max.strftime('%m/%d/%y')
            row = [week, dates, active_count, positive_count, unique_week_count, total_week_count]
        weeklymetrics_df = pd.concat([weeklymetrics_df, pd.DataFrame([row], columns=weeklymetrics_df_columns, index=[week])])
    return weeklymetrics_df

def show_weekly_metrics(filtered_df):
    '''
    Show last week's metrics and weekly table
    '''
    weeklymetrics_df = get_weeklymetrics_df(filtered_df)
    lastweek_dates = None
    prevweek_dates = None
    if len(weeklymetrics_df.Week) > 1:
        lastweek_dates = weeklymetrics_df.sort_values('Week').iloc[-2].Dates
    if len(weeklymetrics_df.Week) > 2:   
        prevweek_dates = weeklymetrics_df.sort_values('Week').iloc[-3].Dates
        
    if lastweek_dates:    
        st.markdown(f"<h3>Last Week's Data     <small class='text-muted'>{lastweek_dates}</small></h3>",  unsafe_allow_html=True)
        active_col, positives_col, unique_col, ntests_col = st.columns(4)    
        #week_col.metric(label="Week", value=str(weeklymetrics_df.iloc[-1].Week))
        #dates_col.metric(label="Dates", value=weeklymetrics_df.iloc[-1].Dates)
        def calculate_delta(field):
            try:
                delta = weeklymetrics_df.iloc[-2][field]-weeklymetrics_df.iloc[-3][field]
                delta = delta if delta !=0 else None
            except IndexError:
                delta = None
            return delta
        active_col.metric(label="Active Cases", value=weeklymetrics_df.iloc[-2]['Active Cases'],  delta=calculate_delta('Active Cases'))
        positives_col.metric(label="Positive Tests", value=weeklymetrics_df.iloc[-2].Positives,  delta=calculate_delta('Positives') )
        unique_col.metric(label="People Tested", value=weeklymetrics_df.iloc[-2]['People Tested'],  delta=calculate_delta('People Tested'))
        ntests_col.metric(label="Tests Completed", value=weeklymetrics_df.iloc[-2]['Tests Completed'],  delta=calculate_delta('Tests Completed'))
        st.caption(f"Delta values represent changes from previous week ({prevweek_dates})")
        with st.expander("Show Weekly Table", expanded=False):
            st.subheader("Weekly Table")
            #display_index = 'Week '+ weeklymetrics_df.Week.astype('str')
            #display_df = weeklymetrics_df.set_index(display_index).drop(columns='Week')
            display_df = weeklymetrics_df.sort_values('Week', ascending=False)
            display_df = display_df.drop(columns='Week').set_index('Dates').reset_index()
            display_df_styler = display_df.style.apply(
                lambda x: [f"background-color:{'#09ab3b' if x.name==display_df.index[0] else 'white'};" for row in x]
                , axis=1 )
            st.dataframe(display_df_styler)
            st.caption("Highlighted row shows current week's data (week in progress).")

def prep_fig_data(filtered_df):
    fig_data = pd.DataFrame({ 
        'test_count': filtered_df.groupby(['Test_Date']).size(), 
        'pos_count': filtered_df[filtered_df['Test_Result']=='POSITIVE'].groupby(['Test_Date']).size() 
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
        lambda x: filtered_df[(filtered_df['Test_Date'] >= (x - timedelta_10days)) &
                            (filtered_df['Test_Date'] <= x) &
                            (filtered_df['Test_Result']=='POSITIVE')].UID.nunique()
    )  
    fig_data['Week'] = pd.to_datetime(fig_data.Test_Date).dt.week
    fig_data['Week'] = fig_data['Week']-fig_data['Week'].min()+1
    fig_data['Test_Date'] = pd.to_datetime(fig_data.Test_Date).dt.strftime('%Y-%m-%d')

    return fig_data

def draw_time_chart(fig_data):
    '''
    Create a d3 component with a results vs time chart of test results
    '''
    st.subheader('Time Trend')
    fig_data = list(
        zip(fig_data.Test_Date, fig_data.avg_pos_rate, fig_data.pos_count,
            fig_data.active_count, fig_data.test_count, fig_data.Week)
    )
    time_chart(fig_data,  key="time_chart")

def draw_gauge_chart(fig_data):
    '''
    Create a d3 component with a gauge of 14-day average positive result rate 
    '''
    #st.subheader('14-Day Average Positive Result Rate')
    curr_avg = fig_data.avg_pos_rate.iat[-1]
    max_avg = fig_data.avg_pos_rate.max()
    fig_data = tuple([0, max_avg, curr_avg])
    gauge_chart(fig_data, key="gauge_chart")
    
if __name__ == '__main__':
    # Import Styles
    import_bootstrap()
    local_css('styles/main.css')
    icon_css()
    
    # Get results data from BQ
    results_df = get_results_from_bq()

    # Set header columns as place holders
    title_col, gauge_col = st.columns(2)
        
    # Filter results based on widgets
    filtered_df, selections_dict = apply_filters(results_df, title_col)
    
    if not filtered_df.size:
        st.markdown('<h1 style="color: #699900;">No data...     <small class="text-muted">check your filter selections</small></h1>', unsafe_allow_html=True)
    else:    
        # Set district and n_sites    
        district =  'Santa Cruz County Schools'
        if 'district' in selections_dict.keys():
            district = selections_dict['district']
        if district == 'ALL': district = 'Santa Cruz County Schools'
        n_sites = filtered_df.Organization.str.split('-', expand=True)[0].nunique()      

        # Write title
        title_col.markdown(f'<h1 class="p-0 " style="color: #699900;">{district}</h1><small class="text-muted">{n_sites} School Sites Participating</small>' , unsafe_allow_html=True)

        # Prep figure data 
        fig_data = prep_fig_data(filtered_df)
        
        # Show positivity rate gauge
        with gauge_col:
            draw_gauge_chart(fig_data)
        
        # Show latest metrics
        active_count, positive_count, unique_count,  total_count, a_text, p_text, u_text,  t_text = show_latest_metrics(filtered_df)

        # Show weekly metrics
        show_weekly_metrics(filtered_df)
        
        #with st.expander("Show Time Trends", expanded=True):
        draw_time_chart(fig_data)

        # Animate latest metrics
        animate_metrics(active_count, positive_count, unique_count,  total_count, a_text, p_text, u_text,  t_text)

