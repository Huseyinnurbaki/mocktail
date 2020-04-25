import React from 'react';
import Form from 'react-bootstrap/Form';

const BigTextInput = (props) => {
    return (
        <Form.Group controlId="exampleForm.ControlTextarea1">
            <Form.Label>{props.label}</Form.Label>
            <Form.Control as="textarea" rows="3" />
        </Form.Group>
    );
};

export default BigTextInput;



