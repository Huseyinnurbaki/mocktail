

import React from 'react';
import axios from 'axios';

import Heading from '../../components/Heading';
import { getTemplate, saveTemplate } from '../../requests';
import Jumbotron from 'react-bootstrap/Jumbotron';
import ListGroup from 'react-bootstrap/ListGroup';
import Container from 'react-bootstrap/Container';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import PrefixedInput from '../../components/PrefixedInput';
import CustomModal from '../../components/CustomModal';
import BigTextInput from '../../components/BigTextInput';
export default class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            playing: false,
            get: {
                endpoint: '',
                response: {},
                method: 'get'
            },
            post: {
                endpoint: '',
                response: {},
                request: {},
                method: 'post'
            },
            modalValues: {},
            showModal: false,
            apis: [],
            showLoader: true,
			
        };
        this.getAllUrl = 'http://localhost:3000/getall';
        this.setTabs = this.setTabs.bind(this);
        this.save = this.save.bind(this);
        this.handleChangeGet = this.handleChangeGet.bind(this);
        this.handleChangePost = this.handleChangePost.bind(this);
        this.onHide = this.onHide.bind(this);
        this.getApis = this.getApis.bind(this);
    }

    componentDidMount() {
        this.getApis(this.getAllUrl);
    }

    async getApis() {
        const apis = await getTemplate(this.getAllUrl);
        this.setState({apis, showLoader: true});
    }


    setTabs(key) {
        this.setState({ tab: key });
    }
	
    validate(template) {
        console.log(template);
        return true;
		
    }
	
    save(type) {
        const isValidBoolean = this.validate(this.state[type]);
        if(isValidBoolean){
            const toBeSaved = { body: this.state[type] };
            saveTemplate(toBeSaved);
        }
    }

    handleChangeGet(event){
        let { get } = this.state;
        get.endpoint = event.target.value;
        this.setState({ get });
    }
    handleChangePost(event){
        let { post } = this.state;
        post.endpoint = event.target.value;
        this.setState({ post });
    }
	
    onHide(){
        const modalValues = {
            type: '',
            header: '',
            desc: '',
            onHide: '',
            secondaryFunction: ''
        };
        this.setState({ modalValues, showModal: false,});
    }

	



    render() {		

        return (
            <Container fluid style={{width: '80%' }} >
                <CustomModal show={this.state.showModal} vals={this.state.modalValues}	> </CustomModal>
                   
                <Tabs
                    id="controlled-tab-example"
                    activeKey={this.state.tab}
                    onSelect={(k) => this.setTabs(k)}
                >
                    <Tab eventKey="get" title="Get">
                        <Jumbotron>
                            <h1 className="header">Get Request Template</h1>
							
                            <PrefixedInput value={this.state.get.endpoint} onChange={this.handleChangeGet}  ></PrefixedInput>
                            <BigTextInput label="Response" ></BigTextInput>
                            <Button onClick={() => this.save("get")} >Save</Button>

                        </Jumbotron>
							
                    </Tab>
                    <Tab eventKey="post" title="Post">
                        <Jumbotron>
                            <h1 className="header">Post Request Template</h1>
                            <Row>

                                <Col>
                                    <BigTextInput label="Request" ></BigTextInput>
                                </Col>
                                <Col>
                                    <BigTextInput label="Response" ></BigTextInput>
                                </Col>
                            </Row>
                            <Button onClick={() => this.save("post")} >Save</Button>
                        </Jumbotron>
                    </Tab>
					
                </Tabs>
       
                <Row>
                    <Col>
                        <Jumbotron style={{ height: '400px', alignItems: 'center' }} >
                            <h1 className="header">Requests</h1>
							{this.state.showLoader ? 
								<Col style={{  alignSelf: 'center' }}>
							<Row style={{  justifyContent: 'center' }} >
                                <Spinner style={{height: '100px', width: '100px'}} animation="border" variant="warning" />
							</Row>
								</Col>
                                :
                                <ListGroup>
                                    <ListGroup.Item action href="#link1">
          Link 1
                                    </ListGroup.Item>
                                    <ListGroup.Item action href="#link2">
          Link 2
                                    </ListGroup.Item>
                                </ListGroup>
                            }
                        </Jumbotron>
                    </Col>
                    <Col>
                        <Jumbotron style={{ height: '400px' }} >
                            <h1 className="header">Request Details</h1>
                        </Jumbotron>
                    </Col>
                </Row>
            </Container>
        );
    }
}






// if(this.state.endpoint || this.state.request || this.state.response ) {
//     const modalValues = {
//         type: 'Warning',
//         header: 'Attention',
//         desc: 'All Unsaved Data Will Be Lost',
//         onHide: this.onHide,
//         secondaryFunction: () => this.cleanAndSwitch(key),
//     };
//     this.setState({ modalValues, showModal: true });

// } else {
//     this.setState({tab: key});
// }