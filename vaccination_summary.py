import time
from pandas.core.arrays.boolean import coerce_to_array
import streamlit as st
import pandas as pd
from import_styles import *
import bq_query as bq
import plotly.graph_objects as go

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

color_dict = {
    #'A:Educators & Staff':'#FF890A',
    #'Vaccinated - A:Educators & Staff':'#FF931F',
    #'Boosted - A:Educators & Staff':'#F77F00',
    'A:Educators & Staff':'#FF006E',
    'Vaccinated - A:Educators & Staff':'#FF1F80',
    'Boosted - A:Educators & Staff':'#FF5006A',
    'B:Community':'#0D6EFD',
    'Vaccinated - B:Community':'#2179FD',
    'Boosted - B:Community':'#0262F2',
    'C:Students':'#09AB3B',
    'Vaccinated - C:Students':'#0AC244',
    'Boosted - C:Students':'#089B37',    
    'Total':'#ffffff',
}

def gen_sunburst_df(totals_df):
    sunburst_df = totals_df.copy()
    sunburst_df = sunburst_df.replace({'Students':'C:Students', 'Community':'B:Community','SC County Educators':'A:Educators & Staff'})
    sunburst_df = sunburst_df.replace({'1st':'Vaccinated', 'Booster':'Boosted'})
    sunburst_df = sunburst_df.rename(columns={'Group':'parent', 'Dose':'label'}) 
    group_totals = sunburst_df.groupby('parent').sum().reset_index() 
    group_totals['label'] = group_totals['parent']
    group_totals['parent'] = 'Total'
    all_total = group_totals.groupby('parent').sum().reset_index()
    all_total['label'] = 'Total'  
    all_total['parent'] = ''  
    sunburst_df = pd.concat([sunburst_df, group_totals, all_total]) 
    sunburst_df = sunburst_df.sort_values(by='parent', ascending=True)
    sunburst_df = sunburst_df.reset_index().drop(columns='index')
    sunburst_df['id'] = sunburst_df['label']+' - '+sunburst_df['parent'] 
    sunburst_df['id'] = sunburst_df['id'].replace({'Total - ':'Total'}).str.replace(' - Total','')
    sunburst_df['percent'] = 100*sunburst_df['count_unique']/sunburst_df.query('label=="Total"').count_unique.iloc[0] 
    sunburst_df['label'] = sunburst_df['label'].str.replace('A:', '').str.replace('B:', '').str.replace('C:', '')
    sunburst_df['color'] = sunburst_df.id.replace(color_dict)
    return sunburst_df

def create_sunburst_chart(sunburst_df):
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

    ## Vaccination Summary Section
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

    # Set numbers for summary 
    n_vaccinated = vaccinated['count_unique'].sum()
    n_boosted = boosted['count_unique'].sum()
    n_totals = totals_no2nd['count_unique'].sum()
    n_students_vaccinated = vaccinated.query('Group == "Students"')['count_unique'].sum()
    n_students_boosted = boosted.query('Group == "Students"')['count_unique'].sum()
    n_staff_vaccinated = vaccinated.query('Group == "SC County Educators"')['count_unique'].sum()
    n_staff_boosted = boosted.query('Group == "SC County Educators"')['count_unique'].sum()
    n_community_vaccinated = vaccinated.query('Group == "Community"')['count_unique'].sum()
    n_community_boosted = boosted.query('Group == "Community"')['count_unique'].sum()

    # Loop to annimate summary table numbers
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

        vax_total_text.markdown("<h1 class='display-5 py-0' style='color:#FF931F; border-bottom: 2px solid lightgray;'>{:.1f}K <span class='h3 p-0' style='color:#FF931F;'>Total 2-Dose Vaccinations</h3></span></h1>".format(c_vaccinated/1000), unsafe_allow_html=True) 
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

    show_vaccination_summary()