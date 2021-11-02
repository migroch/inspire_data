import streamlit as st
import time
from import_styles import *

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
        with title_col:
            st.write('insert title here')
        with gauge_col:
            st.write('insert gauge chart here')

        # Set expander for filter dropdowns and date slider
        with st.expander('Show filters', expanded=False):
            dropdown_fields = ['Group', 'Gender', 'Race', 'Ethnicity']
            filter_columns = st.columns([10,10,10,10,1])
            for i, field in enumerate(dropdown_fields):
                with filter_columns[i]:
                    st.write(f'insert {field} dropdown here')
            
            date_slider_container = st.container()
            with date_slider_container:
                st.write('insert date slider here')

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

        a_count = 0
        p_count = 0
        u_count = 0
        t_count = 0
        for i in range(100):
            a_count += 1
            p_count += 1
            u_count += 1
            t_count += 1

            col_text0.markdown(f"<p  class='fs-1' style='color:#ff006e'>{a_count}</p>", unsafe_allow_html=True)
            col_text1.markdown(f"<p  class='fs-1' style='color:#ff006e'>{p_count}</p>", unsafe_allow_html=True)
            col_text2.markdown(f"<p  class='fs-1' style='color:#ff006e'>{u_count}</p>", unsafe_allow_html=True)
            col_text3.markdown(f"<p  class='fs-1' style='color:#ff006e'>{t_count}</p>", unsafe_allow_html=True)

            time.sleep(0.005)

        st.caption(f"Updated daily at 10am (latest test results are from tests completed on:")

        # Set last week's data metrics bar
        