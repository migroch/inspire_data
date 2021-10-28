import React, { useEffect, useState, useRef } from "react";
import { Streamlit, withStreamlitConnection, } from "streamlit-component-lib";
import { Select, Dropdown, Space } from "antd";
// import { DownOutlined } from "@ant-design/icons"

const FilterDropdown = (props) => {

    const data = props.args.data;
    const options = [];

    for (let i = 0; i < data.length; i++) {
        const value = i.toString(36) + i;
        options.push({
            label: `${data[i]}: ${value}`,
            value,
        });
    }
    
    const [value, setValue] = useState(['a10', 'c12', 'h17', 'j19', 'k20']);
    const selectProps = {
        mode: 'multiple',
        style: {
            width: '100%',
        },
        value,
        options,
        onChange: (newValue) => {
            setValue(newValue);
        },
        placeholder: 'Select Item...',
        maxTagCount: 'responsive',
    };

    return (
        <div className="filterdropdown-container">
            <Space
                direction="vertical"
                style={{
                    width: '100%',
                }}
            >
                <Select {...selectProps} />
                <Select {...selectProps} disabled />
            </Space>
        </div>
    )
}

// Export component
export default withStreamlitConnection(FilterDropdown)