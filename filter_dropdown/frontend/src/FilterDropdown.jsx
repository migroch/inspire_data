import React, { useEffect, useState, useRef } from "react";
import { Streamlit, withStreamlitConnection, } from "streamlit-component-lib";
import { Select} from "antd";
import "./FilterDropdown.css";

const FilterDropdown = (props) => {
    const svgRef = useRef(null);
    Streamlit.setFrameHeight(50);

    const {Option} = Select;

    const data = props.args.data;
    const field = props.args.field;
    const options = [];

    for (let i = 0; i < data.length; i++) {
        options.push(<Option key={data[i]}>{data[i]}</Option>);
    }
    
    function handleChange(value) {
        Streamlit.setComponentValue(value);
    }

    return (
        <div className="filterdropdown-container">
            <Select
                mode="multiple"
                allowClear
                style={{ width: '100%'}}
                placeholder={"Select " + field} 
                defaultValue={[]}
                onChange={handleChange}
            >
                {options}
            </Select>
        </div>
    )
}

// Export component
export default withStreamlitConnection(FilterDropdown)