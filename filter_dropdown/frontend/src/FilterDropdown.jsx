import React, { useEffect, useState, useRef } from "react";
import { Streamlit, withStreamlitConnection, } from "streamlit-component-lib";
import * as d3 from "d3";
import { Menu, Dropdown } from "antd";
// import { DownOutlined } from "@ant-design/icons"

const FilterDropdown = (props) => {

    const filters = props.args.filters;

    return (
        <div className="filterdropdown-container">
        </div>
    )
}

// Export component
export default withStreamlitConnection(FilterDropdown)