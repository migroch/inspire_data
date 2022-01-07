import time
import streamlit as st
import plotly.graph_objects as go
import pandas as pd
from import_styles import *
import bq_query as bq
from prep_vaccines_data import gen_sunburst_df

#st.set_page_config(
#    layout="wide",
#    page_title="Santa Cruz County COVID-19 Vaccines Dashboard",
#    initial_sidebar_state="collapsed",
#)

with st.spinner('Loading data...'):
    #testing_totals = bq.get_testing_totals_from_bq()
    vaccine_totals = bq.get_vaccine_totals_from_bq()
    vaccinated = vaccine_totals.query('Dose == "1st"')
    boosted = vaccine_totals.query('Dose == "Booster"')
    totals_no2nd = pd.concat([vaccinated, boosted])
    # Numbers for summary 
    n_vaccinated = vaccinated['count_unique'].sum()
    n_boosted = boosted['count_unique'].sum()
    n_totals = totals_no2nd['count_unique'].sum()
    n_students_vaccinated = vaccinated.query('Group == "Students"')['count_unique'].sum()
    n_students_boosted = boosted.query('Group == "Students"')['count_unique'].sum()
    n_staff_vaccinated = vaccinated.query('Group == "SC County Educators"')['count_unique'].sum()
    n_staff_boosted = boosted.query('Group == "SC County Educators"')['count_unique'].sum()
    n_community_vaccinated = vaccinated.query('Group == "Community"')['count_unique'].sum()
    n_community_boosted = boosted.query('Group == "Community"')['count_unique'].sum()


def create_sunburst_chart(sunburst_df):
    '''
    Creates a sunburst chart of vaccination numbers using plotly
    '''
    fig = go.Figure(go.Sunburst( 
         ids=sunburst_df['id'],  
         labels=sunburst_df['label'], 
         parents=sunburst_df['parent'], 
         values=sunburst_df['count_unique'], 
         marker = {'colors':sunburst_df['color']},
         branchvalues='total', 
         sort = False, 
         texttemplate = '%{label}<br>%{value} | %{percentRoot:.0%}', 
         textfont_size = 20, 
         hovertemplate = ' %{parent} - %{label}: %{value} <br> % of %{parent}: %{percentParent:.0%}  <br> % of Total: %{percentRoot:.0%} <extra></extra>', 
         hoverlabel = {'font_size':20},          
    ))
    fig.update_layout(

        width=500,
        height=500,
        margin=dict(b=0, t=0, l=0, r=0),
    )
    return fig

def show_vaccination_summary():
    '''
     Vaccination Summary Section
    ''' 
    #st.markdown('<h1 id="vaxsummary" class="text-center text-secondary">Vaccination Summary</h1>', unsafe_allow_html=True)
    st.subheader('Vaccinations Summary')

    # Initialize summary table
    summary_cols = st.columns(2)

    # 2-Dose Vaccinations column
    vax_total_text = summary_cols[0].empty()
    vax_students_text = summary_cols[0].empty()
    vax_staff_text = summary_cols[0].empty()
    vax_community_text = summary_cols[0].empty()

    # Divider
    summary_cols[0].markdown('<div></div>', unsafe_allow_html=True)

    # Boosters column
    boost_total_text = summary_cols[0].empty()    
    boost_students_text = summary_cols[0].empty()
    boost_staff_text = summary_cols[0].empty()
    boost_community_text = summary_cols[0].empty()

    # Generate and display sunburst chart
    with summary_cols[1]:
        sunburst_df = gen_sunburst_df(totals_no2nd)
        fig = create_sunburst_chart(sunburst_df)
        st.plotly_chart(fig, use_container_width=True)

    vax_total_text.markdown("<h1 class='display-5 py-0' style='color:#FF931F; border-bottom: 2px solid lightgray;'>{:.1f}K <span class='h3 p-0' style='color:#FF931F;'>Fully Vaccinated</h3></span></h1>".format(n_vaccinated/1000), unsafe_allow_html=True) 
    vax_students_text.markdown("<h1 class='display-6 py-0' style='color:#0AC244;'>{:.1f}K <span class='h4 p-0' style='color:#0AC244;'>Students</h4></span></h1>".format(n_students_vaccinated/1000), unsafe_allow_html=True)
    vax_staff_text.markdown("<h1 class='display-6 py-0' style='color:#FF1F80;'>{:.1f}K <span class='h4 p-0' style='color:#FF1F80;'>Educators & Staff</h4></span></h1>".format(n_staff_vaccinated/1000), unsafe_allow_html=True)
    vax_community_text.markdown("<h1 class='display-6 py-0' style='color:#2179FD;'>{:.1f}K <span class='h4 p-0' style='color:#2179FD;'>Community</h4></span></h1>".format(n_community_vaccinated/1000), unsafe_allow_html=True)

    boost_total_text.markdown("<h1 class='display-5 py-0' style='color:#F77F00; border-bottom: 2px solid lightgray;'>{:.1f}K <span class='h3 p-0' style='color:#F77F00;'>Total Boosters</h3></span></h1>".format(n_boosted/1000), unsafe_allow_html=True)               
    boost_students_text.markdown("<h1 class='display-6 py-0' style='color:#089B37;'>{:.1f}K <span class='h4 p-0' style='color:#089B37;'>Students</h4></span></h1>".format(n_students_boosted/1000), unsafe_allow_html=True)
    boost_staff_text.markdown("<h1 class='display-6 py-0' style='color:#F5006A;'>{:.1f}K <span class='h4 p-0' style='color:#F5006A;'>Educators & Staff</h4></span></h1>".format(n_staff_boosted/1000), unsafe_allow_html=True)
    boost_community_text.markdown("<h1 class='display-6 py-0' style='color:#0262F2;'>{:.1f}K <span class='h4 p-0' style='color:#0262F2;'>Community</h4></span></h1>".format(n_community_boosted/1000), unsafe_allow_html=True)

    counters_placeholders = [vax_total_text, vax_students_text, vax_staff_text, vax_community_text, 
                        boost_total_text, boost_students_text, boost_staff_text, boost_community_text]
    return counters_placeholders

def animate_vaccination_summary(counters_placeholders): 
    '''
     Loop to annimate summary table numbers
    '''
    vax_total_text, vax_students_text, vax_staff_text, vax_community_text, \
    boost_total_text, boost_students_text, boost_staff_text, boost_community_text = counters_placeholders
    c_vaccinated = 0
    c_boosted = 0
    c_students_vaccinated = 0
    c_students_boosted = 0
    c_staff_vaccinated = 0
    c_staff_boosted = 0
    c_community_vaccinated = 0
    c_community_boosted = 0
    for i in range(100):
        c_vaccinated = int((i+1)*(n_vaccinated/100))
        c_boosted = int((i+1)*(n_boosted/100))
        c_students_vaccinated = int((i+1)*(n_students_vaccinated/100))
        c_students_boosted = int((i+1)*(n_students_boosted/100))
        c_staff_vaccinated = int((i+1)*(n_staff_vaccinated/100))
        c_staff_boosted = int((i+1)*(n_staff_boosted/100))
        c_community_vaccinated = int((i+1)*(n_community_vaccinated/100))
        c_community_boosted = int((i+1)*(n_community_boosted/100))    

        vax_total_text.markdown("<h1 class='display-5 py-0' style='color:#FF931F; border-bottom: 2px solid lightgray;'>{:.1f}K <span class='h3 p-0' style='color:#FF931F;'>Fully Vaccinated</h3></span></h1>".format(c_vaccinated/1000), unsafe_allow_html=True) 
        vax_students_text.markdown("<h1 class='display-6 py-0' style='color:#0AC244;'>{:.1f}K <span class='h4 p-0' style='color:#0AC244;'>Students</h4></span></h1>".format(c_students_vaccinated/1000), unsafe_allow_html=True)
        vax_staff_text.markdown("<h1 class='display-6 py-0' style='color:#FF1F80;'>{:.1f}K <span class='h4 p-0' style='color:#FF1F80;'>Educators & Staff</h4></span></h1>".format(c_staff_vaccinated/1000), unsafe_allow_html=True)
        vax_community_text.markdown("<h1 class='display-6 py-0' style='color:#2179FD;'>{:.1f}K <span class='h4 p-0' style='color:#2179FD;'>Community</h4></span></h1>".format(c_community_vaccinated/1000), unsafe_allow_html=True)

        boost_total_text.markdown("<h1 class='display-5 py-0' style='color:#F77F00; border-bottom: 2px solid lightgray;'>{:.1f}K <span class='h3 p-0' style='color:#F77F00;'>Total Boosters</h3></span></h1>".format(c_boosted/1000), unsafe_allow_html=True)               
        boost_students_text.markdown("<h1 class='display-6 py-0' style='color:#089B37;'>{:.1f}K <span class='h4 p-0' style='color:#089B37;'>Students</h4></span></h1>".format(c_students_boosted/1000), unsafe_allow_html=True)
        boost_staff_text.markdown("<h1 class='display-6 py-0' style='color:#F5006A;'>{:.1f}K <span class='h4 p-0' style='color:#F5006A;'>Educators & Staff</h4></span></h1>".format(c_staff_boosted/1000), unsafe_allow_html=True)
        boost_community_text.markdown("<h1 class='display-6 py-0' style='color:#0262F2;'>{:.1f}K <span class='h4 p-0' style='color:#0262F2;'>Community</h4></span></h1>".format(c_community_boosted/1000), unsafe_allow_html=True)
        
        time.sleep(0.05)



if __name__ == '__main__':
    #import styles
    styles_container = st.container()
    with styles_container:
        import_bootstrap()
        local_css('styles/main.css')

    counters_placeholders = show_vaccination_summary()
    animate_vaccination_summary(counters_placeholders)