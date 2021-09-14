import pandas as pd
import pandas_gbq

def get_results_from_bq():
    '''
    Get inspire results data from bigquery
    '''
    query = f"""
    SELECT *
    FROM `InspireTesting.results`
    """
    results_df = pandas_gbq.read_gbq(query, project_id="covidtesting-1602910185026")
    return results_df

results_df = get_results_from_bq()
print results_df


