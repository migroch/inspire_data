#! /bin/bash

cd data/results/
sh ftp_download.sh
cd ../../
python results_to_gbq.py
