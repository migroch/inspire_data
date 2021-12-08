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

        # Set figure data
        fig_data = pv.prep_fig_data(app_data)

        # Set title
        with title_col:
            st.markdown(f'<h1 class="p-0 " style="color: #699900;">{district}</h1><small class="text-muted">{n_sites} School Sites Participating</small>' , unsafe_allow_html=True)

        # Stacked area chart section
        stacked_area_container = st.container()
        with stacked_area_container:
            area_data = list(zip(fig_data.Vaccination_Date, fig_data.Students, fig_data.Staff))
            st.subheader('Time Trend')
            area_chart(area_data, key="area_chart")