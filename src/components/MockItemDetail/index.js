import React from 'react';
import {Col, Button ,Badge} from 'react-bootstrap';
import BigTextInput from '../BigTextInput'
import MockItem from '../MockItem'

const MockItemDetail = (props) => {
    if(!props.data.method) {
        return (
            <h3 className="header">Choose a template from left</h3>
        )
    }
    let method = props.data.method.toString().toUpperCase();
    // console.log("mockitemdetail -->", JSON.stringify(props.data.request, null, 2));
    
    return (
        <Col style={{ alignSelf: 'center' }}>
            <MockItem disabled={props.disabled} data={props.data} ></MockItem>
            {method === 'POST' ? 
            <BigTextInput label={'Request'} disabled value={JSON.stringify(props.data.request, null, 2)} ></BigTextInput>
            :
            null
            }
            <BigTextInput label={'Reponse'}  disabled value={JSON.stringify(props.data.response, null, 2)}></BigTextInput>
            <Button variant="success" onClick={props.testItem} >Test</Button>
            <Button style={{ marginLeft: '20px' }} variant="danger" onClick={props.deleteSelectedRequest} >Delete</Button>
            {
                props.status ?
                <Badge variant={'warning'}> {props.status}</Badge>
                :
                null
            }
            <h1>{props.apiCheck ? props.apiCheck.status : null}</h1>
        </Col>
    );
};

export default MockItemDetail;
