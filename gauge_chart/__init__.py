import os
from typing import Dict
from typing import List
from typing import Tuple

import streamlit.components.v1 as components

_RELEASE = True  # on packaging, pass this to True

if not _RELEASE:
    _component_func = components.declare_component("gauge_chart", url="http://localhost:3001",)
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("gauge_chart", path=build_dir)


def gauge_chart(
    data: Tuple[float, float, float],
    rotation: float = 0,
    thickness: float = 0.3,
    arc: float = 1,
    ticks: int = 5,
    color_scheme: str = "interpolateRdYlBu",
    color_step: int = 150,
    tick_color: str = "#FFFFFF",
    needle_color: str = "#BB345B",
    key=None,
):
    """Display a line chart with overlapping circles on a list of (x, y) points, using the D3 library.

    :param data: A list of (x, y) points
    :param width:  Width of canvas, in pixels
    :param key:  An optional string to use as the unique key for the widget.
    """       
    component_value = _component_func(
        data=data,
        rotation=rotation,
        thickness=thickness,
        arc=arc,
        ticks=ticks,
        color_scheme=color_scheme,
        color_step=color_step,
        tick_color=tick_color,
        needle_color=needle_color,
        key=key,
        default=None,
    )
    return component_value
