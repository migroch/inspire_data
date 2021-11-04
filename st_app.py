import datetime
import streamlit as st
import pandas as pd
import time
import backend as bk
from import_styles import *
from filter_dropdown import filter_dropdown
from gauge_chart import gauge_chart
from time_chart import time_chart

# Initial data load
app_data = bk.APP_DATA

def refresh_data(query):
    global app_data
    app_data = app_data.query(query)

if __name__ == '__main__':
    ## Initialize page configurations and containers
    st.set_page_config(
        layout="wide",
        page_title="Santa Cruz County COVID-19 Testing Dashboard",
        initial_sidebar_state="collapsed",
    )

    styles_container = st.container()
    app_container = st.container()

    with styles_container:
        import_bootstrap()
        local_css('styles/main.css')
        icon_css()

    with app_container:
        # Set header columns as placeholders
        title_col, gauge_col = st.columns(2)

        if not app_data.size:
            st.markdown('<h1 style="color: #699900;">No data...     <small class="text-muted">check your filter selections</small></h1>', unsafe_allow_html=True)
        else:
            district = 'Santa Cruz County Schools'
            n_sites = app_data.Organization.str.split('-', expand=True)[0].nunique()

        # Set expander for filter dropdowns and date slider
        with st.expander('Show filters', expanded=False):
            dropdown_fields = ['Group', 'Gender', 'Race', 'Ethnicity']
            filter_columns = st.columns([10,10,10,10,1])
            for i, field in enumerate(dropdown_fields):
                with filter_columns[i]:
                    selection = filter_dropdown(list(app_data[field].unique()), field=field, key=field.lower()+'_filter_dropdown')
                    if selection:
                        refresh_data(query=f'{field} in @selection')
            
            date_slider_container = st.container()
            with date_slider_container:
                date_min = app_data.Test_Date.min()
                date_max = app_data.Test_Date.max()

                if app_data.size:
                    date_range = st.slider('Select Dates:',
                                            min_value=date_min,
                                            max_value=date_max,
                                            value=(date_min, date_max),
                                            format="M/D/YY")
                    refresh_data(query='Test_Date >= @date_range[0] and Test_Date <= @date_range[1]')

        # Set figure data after filtering
        fig_data = bk.prep_fig_data(app_data)

        # Set title and gauge chart after filtering
        with title_col:
            st.markdown(f'<h1 class="p-0 " style="color: #699900;">{district}</h1><small class="text-muted">{n_sites} School Sites Participating</small>' , unsafe_allow_html=True)
        with gauge_col:
            gauge_data = tuple([0, 0.02, fig_data.avg_pos_rate.iat[-1]])
            gauge_chart(gauge_data, key="gauge_chart")
        
        # Set latest metrics animation bar with bootstrap
        summ_cols = st.columns(4)
        summ_cols[0].markdown("<h5>Current&nbspActive Cases:&nbsp&nbsp&nbsp</h5>", unsafe_allow_html=True)
        summ_cols[1].markdown("<h5>Total&nbspPositive Tests:&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</h5>", unsafe_allow_html=True)
        summ_cols[2].markdown("<h5>Total&nbspPeople Tested:&nbsp&nbsp&nbsp&nbsp&nbsp</h5>", unsafe_allow_html=True)
        summ_cols[3].markdown("<h5>Total&nbspTests Completed:</h5>", unsafe_allow_html=True)

        ## set placeholders for summary text
        col_text0 = summ_cols[0].empty()
        col_text1 = summ_cols[1].empty()
        col_text2 = summ_cols[2].empty()
        col_text3 = summ_cols[3].empty()

        
        ## Get latest metrics and animate
        active_count, positive_count, unique_count, total_count = bk.get_lates_metrics(app_data)
        a_count = 0
        p_count = 0
        u_count = 0
        t_count = 0
        for i in range(100):
            a_count = int((i+1)*(active_count/100))
            p_count = int((i+1)*(positive_count/100))
            u_count = int((i+1)*(unique_count/100))/1000
            t_count = int((i+1)*(total_count/100))/1000

            col_text0.markdown(f"<p  class='fs-1' style='color:#ff006e'>{a_count}</p>", unsafe_allow_html=True)
            col_text1.markdown(f"<p  class='fs-1' style='color:#f77f00'>{p_count}</p>", unsafe_allow_html=True)
            col_text2.markdown("<p   class='text-primary fs-1' >{:.1f}K</p>".format(u_count), unsafe_allow_html=True)
            col_text3.markdown("<p   class='fs-1' style='color:#09ab3b'>{:.1f}K</p>".format(t_count), unsafe_allow_html=True)

            time.sleep(0.005)

        st.caption(f"Updated daily at 10am (latest test results are from tests completed on: {app_data.Test_Date.max().strftime('%m/%d/%y')})")

        # Set last week's data metrics bar
        lastweek_dates = True
        prevweek_dates = None

        if lastweek_dates:
            st.markdown(f"<h3>Last Week's Data     <small class='text-muted'>{lastweek_dates}</small></h3>",  unsafe_allow_html=True)
            last_summ_cols = st.columns(4)

            ## TODO: add delta value
            last_summ_cols[0].metric(label="Active Cases", value=1)
            last_summ_cols[1].metric(label="Positive Tests", value=1)
            last_summ_cols[2].metric(label="People Tested", value=1)
            last_summ_cols[3].metric(label="Tests Completed", value=1)
            st.caption(f"Delta values represent changes from previous week ({prevweek_dates})")

            with st.expander("Show Weekly Table", expanded=False):
                st.subheader("Weekly Table")
                ## TODO: add weekly table view

        # Time chart section
        time_trend_container = st.container()
        with time_trend_container:
            time_data = list(
                zip(fig_data.Test_Date, fig_data.avg_pos_rate, fig_data.pos_count,
                    fig_data.active_count, fig_data.test_count, fig_data.Week)
            )
            st.subheader('Time Trend')
            time_chart(time_data, key="time_chart")