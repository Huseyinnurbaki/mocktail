import React from 'react';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';

const BigTextInput = (props) => {
    return (
        <Col>
            <Form.Group controlId="exampleForm.ControlTextarea1">
                <Form.Label className='BigTextInputLabel' >{props.label}</Form.Label>
                <Form.Control
                {...props}
                as="textarea"
                rows="6"
                onChange={props.onChange}
                value={props.disabled ? props.value : undefined}
                />
            </Form.Group>
        </Col>
    );
};

export default BigTextInput;



