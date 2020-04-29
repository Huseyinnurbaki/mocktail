import React from 'react';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';


const MockItem = (props) => {
    let method = props.data.method.toString().toUpperCase();
    let bgc = 'orange'
    if(method === 'GET') {
        bgc = '#17b027'
        method= method+'  .';
    }
    let endpoint = 'https:localhost:7084/mocktail/' + props.data.endpoint;
    return (
        <dt key={props.index} >
            <InputGroup className="mb-3" onClick={!props.disabled ? () => props.onPressAction(props.data) : null} >
                <InputGroup.Prepend  >
                    <InputGroup.Text style={{ backgroundColor: bgc, color: 'white', fontWeight: '600' }} id="basic-addon1">{method}</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                    placeholder={endpoint}
                    aria-label={endpoint}
                    aria-describedby="basic-addon1"
                    disabled
                />
            </InputGroup>
            
        </dt>
    );
};

export default MockItem;

