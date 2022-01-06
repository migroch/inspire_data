import pandas as pd
from bq_query import get_vaccinated_from_bq

APP_DATA = get_vaccinated_from_bq()

def prep_fig_data(app_data):
    groups = app_data.Group.unique()
    fig_data = app_data.groupby(['Vaccination_Date', 'Group']).size().unstack('Group', fill_value=0).reset_index()
    fig_data.drop
    for group in groups:
        fig_data[group] = fig_data[group].cumsum()
    fig_data['Week'] = pd.to_datetime(fig_data.Vaccination_Date).dt.week
    fig_data['Week'] = fig_data['Week'] - fig_data['Week'].min() + 1
    fig_data['Vaccination_Date'] = pd.to_datetime(fig_data.Vaccination_Date).dt.strftime('%Y-%m-%d')
    return fig_data[groups.tolist() + ['Week', 'Vaccination_Date']]