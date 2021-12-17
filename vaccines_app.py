import streamlit as st
import pandas as pd
import time
import sys
sys.path.append("./components")
import prep_vaccines_data as pv
from import_styles import *
from filter_dropdown import filter_dropdown
from area_chart import area_chart

# Initial data load
app_data = pv.APP_DATA

def refresh_data(query):
    global app_data
    app_data = app_data.query(query)

if __name__ == '__main__':
    ## Initialize page configurations and containers
    st.set_page_config(
        layout="wide",
        page_title="Santa Cruz County COVID-19 Vaccines Dashboard",
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
        title_col, empty_col = st.columns(2)

        if not app_data.size:
            st.markdown('<h1 style="color: #699900;">No data...     <small class="text-muted">check your filter selections</small></h1>', unsafe_allow_html=True)
        else:
            district = 'Santa Cruz County Schools'
            n_sites = app_data.Organization.str.split('-', expand=True)[0].nunique()

        # Set expander for filter dropdowns and date slider
        with st.expander('Show filters', expanded=False):
            dropdown_fields = ['Vaccine Dose', 'Gender', 'Race', 'Ethnicity']
            filter_columns = st.columns([10,10,10,10,1])
            for i, field in enumerate(dropdown_fields):
                with filter_columns[i]:
                    selection = filter_dropdown(list(app_data[field].unique()), field=field, key=field.lower()+'_filter_dropdown')
                    if selection:
                        refresh_data(query=f'{field} in @selection')
            
            date_slider_container = st.container()
            with date_slider_container:
                date_min = app_data.Vaccination_Date.min()
                date_max = app_data.Vaccination_Date.max()

                if app_data.size:
                    date_range = st.slider('Select Dates:',
                                            min_value=date_min,
                                            max_value=date_max,
                                            value=(date_min, date_max),
                                            format="M/D/YY")
                    refresh_data(query='Vaccination_Date >= @date_range[0] and Vaccination_Date <= @date_range[1]')

        # Set figure data
        fig_data = pv.prep_fig_data(app_data)

        # Set title
        with title_col:
            st.markdown(f'<h1 class="p-0 " style="color: #699900;">{district}</h1><small class="text-muted">{n_sites} School Sites Participating</small>' , unsafe_allow_html=True)

        # Stacked area chart section
        stacked_area_container = st.container()
        with stacked_area_container:
            # groups = ['Students', 'Staff']
            fig_data.rename({'Vaccination_Date':'date'}, axis=1, inplace=True)
            fig_data = fig_data[['date','Students','Staff']]
            area_data = fig_data.to_json(orient='records')
            # area_data = list(zip(fig_data.Vaccination_Date, fig_data.Students, fig_data.Staff))
            st.subheader('Time Trend')
            area_chart(data=area_data, groups=['Students', 'Staff'], colors=['#f77f00', '#ff006e'], key="area_chart")