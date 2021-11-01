import streamlit as st

def local_css(file_name):
    with open(file_name) as f:
        st.markdown('<style class="style-import">{}</style>'.format(f.read()), unsafe_allow_html=True)

def remote_css(url):
    st.markdown('<script class="style-import" src="{}" crossorigin="anonymous"></script>'.format(url), unsafe_allow_html=True)

def icon_css():
    remote_css('https://kit.fontawesome.com/445632ee1a.js')

def import_bootstrap():
    local_css("styles/bootstrap.min.css")
    st.markdown('''
    <script class="style-import" src="styles/bootstrap.bundle.min.js"></script>
    ''', unsafe_allow_html=True)


