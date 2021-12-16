import pandas as pd
from bq_query import get_vaccinated_from_bq

APP_DATA = get_vaccinated_from_bq()

def prep_fig_data(app_data):
    fig_data = app_data.groupby(['Vaccination_Date', 'Group']).size().unstack('Group', fill_value=0).reset_index()
    fig_data.drop
    fig_data['Contract/Vendor'] = fig_data['Contract/Vendor'].cumsum()
    fig_data['Others'] = fig_data['Others'].cumsum()
    fig_data['Staff'] = fig_data['Staff'].cumsum()
    fig_data['Students'] = fig_data['Students'].cumsum()
    fig_data['Week'] = pd.to_datetime(fig_data.Vaccination_Date).dt.week
    fig_data['Week'] = fig_data['Week'] - fig_data['Week'].min() + 1
    fig_data['Vaccination_Date'] = pd.to_datetime(fig_data.Vaccination_Date).dt.strftime('%Y-%m-%d')

    return fig_data[['Staff', 'Students', 'Week', 'Vaccination_Date']]