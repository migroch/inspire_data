import sys
import time
import time
import streamlit as st
import bq_query as bq
from import_styles import *
from bq_query import get_vaccinated_from_bq, get_vaccinated_raw_from_bq
from prep_vaccines_data import prep_areachart_data

sys.path.append("./components")
from filter_dropdown import filter_dropdown
from area_chart import area_chart

st.set_page_config(
    layout="wide",
    page_title="Santa Cruz County COVID-19 Vaccines Dashboard",
    initial_sidebar_state="collapsed",
)

from vaccination_summary import *

# Initial data load
with st.spinner('Loading data...'):
    app_data = get_vaccinated_from_bq()

def refresh_data(query):
    global app_data
    app_data = app_data.query(query)

def draw_area_chart(fig_data):
    '''
    Generate the area chart of vaccinations over time
    '''    
    groups = app_data.Group.sort_values().unique()
    fig_data.rename({'Vaccination_Date':'date'}, axis=1, inplace=True)
    fig_data = fig_data[['date'] + groups.tolist()]
    area_data = fig_data.to_json(orient='records')
    colors = {'Students':'#09AB3B', 'Educators & Staff':'#FF006E', 'Community':'#0D6EFD'}
    area_chart(data=area_data, groups=groups.tolist(), colors=[colors[group] for group in groups], key="area_chart")

def show_raw_table(date_range):
    '''
    Show table with raw data from inspire
    '''
    with st.expander("Show Daily Count Tables (Raw Inspire Data)", expanded=False):
        st.subheader("Daily Summary Tables")
        st.caption("Raw data from Inspire, counting all vaccinations.")
        tb_cols = st.columns(2)
        table_df = get_vaccinated_raw_from_bq()
        table_df = table_df.query("Vaccination_Date >= @date_range[0] and Vaccination_Date <= @date_range[1]")
        table_df = table_df[['Vaccination_Date', 'Vaccination_Type', 'Group']]

        table_dfp = table_df.pivot_table(index='Vaccination_Date', columns='Group', values='Vaccination_Type', aggfunc='count')
        table_dfp['Total'] = table_dfp.sum(axis=1) # Add total column
        table_dfp = table_dfp.sort_values(['Vaccination_Date'], ascending=False)
        table_dfp = table_dfp[['Total', 'STUDENT', 'STAFF', 'OTHERS']]
        table_dfp = table_dfp.fillna(0).astype(int)
        with tb_cols[0]:
            #st.markdown(table_dfp.style.to_html(), unsafe_allow_html=True)
            st.dataframe(table_dfp.style)        

        table_dfg = table_df.groupby(['Vaccination_Date', 'Vaccination_Type']).count()
        table_dfg = table_dfg.rename(columns={'Group':'Count'})
        table_dfg = table_dfg.sort_values(['Vaccination_Date','Count'], ascending=False)
        with tb_cols[1]:
            st.markdown(table_dfg.style.to_html(), unsafe_allow_html=True)
            #st.dataframe(table_dfg.style)

        

if __name__ == '__main__':
    ## Initialize page configurations and containers
    styles_container = st.container()
    with styles_container:
        import_bootstrap()
        local_css('styles/main.css')
        icon_css()

    ## Header    
    #st.markdown(f'<h1 id="title"  style="color: #699900;">COVID-19 Vaccinations <small class="text-muted">Updated daily<small/></h1>' , unsafe_allow_html=True)
    #st.markdown(f'<h1 id="title" style="color: #699900;">Vaccines provided by the Santa Cruz COE</h1>' , unsafe_allow_html=True)
    #st.header("Vaccines provided by the Santa Cruz COE")

    summary_container = st.container()
    with summary_container:
        counters_placeholders = show_vaccination_summary()
         

    timechart_container = st.container()

    with timechart_container:
        st.subheader('Vaccinations Over Time')    

        with st.expander('Show filters', expanded=False):
            date_min = app_data.Vaccination_Date.min()
            date_max = app_data.Vaccination_Date.max()
            date_range = [date_min, date_max]
            #date_slider_container = st.container()
            #with date_slider_container:
            date_cols = st.columns(2)
            with date_cols[0]:
                date_range[0] = st.date_input('Start Date', date_min, date_min, date_max)
            with date_cols[1]:
                date_range[1] = st.date_input('End Date', date_max, date_min, date_max)    
            if app_data.size:
                    #date_range = st.slider('Select Dates:',
                    #                        min_value=date_min,
                    #                        max_value=date_max,
                    #                        value=(date_min, date_max),
                    #                        format="M/D/YY")
                refresh_data(query='Vaccination_Date >= @date_range[0] and Vaccination_Date <= @date_range[1]')

            dropdown_fields = ['District', 'Group', 'Dose', 'Gender', 'Race', 'Ethnicity']
            filter_columns = st.columns([10,10,10,10,10,10])
            for i, field in enumerate(dropdown_fields):
                with filter_columns[i]:
                    selection = filter_dropdown(list(app_data[field].sort_values().unique()), field=field, key=field.lower()+'_filter_dropdown')
                    if selection:
                        refresh_data(query=f'{field} in @selection')            

        # Set figure data
        fig_data = prep_areachart_data(app_data)
        draw_area_chart(fig_data)

    # Show raw table
    show_raw_table(date_range)

    # Animate summary counters after area chart is shown
    with summary_container:
        animate_vaccination_summary(counters_placeholders)


