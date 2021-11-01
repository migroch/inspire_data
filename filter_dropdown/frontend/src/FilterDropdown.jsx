import React, { useEffect, useState, useRef } from "react";
import { Streamlit, withStreamlitConnection, } from "streamlit-component-lib";
import { Select} from "antd";
import "./FilterDropdown.css";

const FilterDropdown = (props) => {
    const {Option} = Select;
    const data = props.args.data;
    const field = props.args.field;
    const options = [];

    const containerRef = useRef(null);
    const [height, setHeight] = useState(24);
    const [value, setValue] = useState([]);
    const [dropdown, setDropdown] = useState(false);

    for (let i = 0; i < data.length; i++) {
        options.push(<Option key={data[i]}>{data[i]}</Option>);
    }

    function handleValueChange(value) {
        setValue(value);
        Streamlit.setComponentValue(value);
    }

    function handleDropdownChange(open) {
        setDropdown(open);
    }

    useEffect(() => {
        function handleHeightChange(){
            let height = containerRef.current.offsetHeight; 
            if (dropdown) {
                let dropdown_height = 32*options.length+30;
                dropdown_height = dropdown_height > 256 ? 256 + 30 : dropdown_height;
                height += dropdown_height;
            }
            console.log(height);
            setHeight(height);
            Streamlit.setFrameHeight(height);
        }

        handleHeightChange();
    }, [height, value, dropdown, options.length]);

    return (
        <div className="filterdropdown-container" ref={containerRef}>
            <Select
                dropdownClassName="filterdropdown"
                mode="multiple"
                allowClear
                showArrow={true}
                size = {"small"}
                style={{ width: '100%'}}
                placeholder={"Select " + field} 
                defaultValue={[]}
                onChange={handleValueChange}
                onDropdownVisibleChange={handleDropdownChange}
            >
                {options}
            </Select>
        </div>
    )
}

// Export component
export default withStreamlitConnection(FilterDropdown)