import os
from typing import Dict
from typing import List
from typing import Tuple

import streamlit.components.v1 as components

_RELEASE = False  # on packaging, pass this to True

if not _RELEASE:
    _component_func = components.declare_component("gauge_chart", url="http://localhost:3001",)
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("gauge_chart", path=build_dir)


def filter_dropdown(
    data: List[str],
    key=None,
):
    """Display a line chart with overlapping circles on a list of (x, y) points, using the D3 library.

    :param data: A list of (x, y) points
    :param width:  Width of canvas, in pixels
    :param key:  An optional string to use as the unique key for the widget.
    """       
    component_value = _component_func(
        data=data,
        key=key,
        default=None,
    )
    return component_value
