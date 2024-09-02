import React from 'react';
import { FormControl } from 'react-bootstrap';

const SearchBox = ({ value, onChange }) => {
    return (
        <FormControl
            type="text"
            placeholder="Search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="my-3"
        />
    );
};

export default SearchBox;
