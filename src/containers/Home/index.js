

import React, { textarea} from 'react';
import axios from 'axios';

import { getTemplate, saveTemplate } from '../../requests';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Container from 'react-bootstrap/Container';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Spinner';
import PrefixedInput from '../../components/PrefixedInput';
import CustomModal from '../../components/CustomModal';
import BigTextInput from '../../components/BigTextInput';
import MockList from '../../components/MockList';
import MockItemDetail from '../../components/MockItemDetail';

export default class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            playing: false,
            get: {
                endpoint: '',
                response: '',
                method: 'get'
            },
            post: {
				endpoint: '',
				method: 'post',
				response: {},
				request: {},
            },
            modalValues: {},
            showModal: false,
            apis: [],
			showLoader: true,
			selectedApi: {},
			jsonValidatorInput: null,
			isJsonValidatorInputValid: ''
        };
        this.getAllUrl = 'http://localhost:3000/getall';
		this.cascadaAllUrl = 'http://localhost:3000/cascadeall';
        this.setTabs = this.setTabs.bind(this);
        this.save = this.save.bind(this);
        this.clearInputs = this.clearInputs.bind(this);
        this.handleChangeGetEndpoint = this.handleChangeGetEndpoint.bind(this);
        this.handleChangePostEndpoint = this.handleChangePostEndpoint.bind(this);
        this.handleChangeGetResponse = this.handleChangeGetResponse.bind(this);
        this.handleChangePost = this.handleChangePost.bind(this);
        this.onHide = this.onHide.bind(this);
        this.getApis = this.getApis.bind(this);
        this.cascadem = this.cascadem.bind(this);
        this.cascadeWarning = this.cascadeWarning.bind(this);
        this.setSelected = this.setSelected.bind(this);
        this.validateJson = this.validateJson.bind(this);
        this.jsonValidatorInputObserver = this.jsonValidatorInputObserver.bind(this);
        this.clearJsonValidator = this.clearJsonValidator.bind(this);
    }

    componentDidMount() {
        this.getApis(this.getAllUrl);
    }

    async getApis() {
		const apis = await axios
			.get(this.getAllUrl, {
				headers: {
					'content-type': 'application/json',
				},
			})
			.then(function (response) {
				console.log(response);
				return response;
			})
			.catch(function (error) {
				console.log(error);
				return error;
			});
		// const apis = getTemplate(this.getAllUrl);
		console.log(apis);
		
        this.setState({apis, showLoader: false});
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
			console.log(toBeSaved);
			saveTemplate(toBeSaved);
			this.clearInputs()
			this.getApis();
        }
    }
    clearInputs() {
		const get = { endpoint: '', response: {}, method: 'get' };
		const post = { endpoint: '', method: 'post', response: {}, request: {} };
		this.refs.formget.reset();
		this.refs.formpost.reset();
		this.setState({get, post});
    }

    handleChangeGetEndpoint(event){
        let { get } = this.state;
		get.endpoint = event.target.value;
        this.setState({ get });
    }

	handleChangeGetResponse(event){
        let { get } = this.state;
        get.response = event.target.value;
        this.setState({ get });
    }
    handleChangePost(event){
        let { post } = this.state;
        post.endpoint = event.target.value;
        this.setState({ post });
	}
	handleChangePostEndpoint(event) {
		let { post } = this.state;
		post.endpoint = event.target.value;
		this.setState({ post });
	}
	
    onHide(){
        const modalValues = {
            type: '',
            header: '',
            desc: '',
			secondary: ''
        };
        this.setState({ modalValues, showModal: false});
    }
	
    cascadeWarning() {
        const modalValues = {
            type: 'Warning',
            header: 'Atttention',
            desc: 'You are about to delete every template you added. Are you sure ? this is irreversible',
            secondary: 'cascade'
        };
        this.setState({ modalValues, showModal: true });
	}
	
	cascadem(){
		console.log("yes");
		this.onHide();
		
		// getTemplate(this.cascadaAllUrl);
	}

	setSelected(selectedApi){
		this.setState({selectedApi})
	}

	jsonValidatorInputObserver(event) {
		let jsonValidatorInput = event.target.value;
		this.setState({ jsonValidatorInput, isJsonValidatorInputValid: '' });
	}
	validateJson(value) {
		let isJsonValidatorInputValid = 'JSON is not valid !!';
		try {
			JSON.parse(value);
			isJsonValidatorInputValid = 'JSON is valid';
		} catch (error) {
			console.log(error);
			console.log(error);
			console.log(error);
			console.log(error);
			
			
		}
		this.setState({isJsonValidatorInputValid})
	}
	clearJsonValidator(){
		this.setState({ jsonValidatorInput: null, isJsonValidatorInputValid: '' });
		this.refs.JsonLint.reset();
	}


    render() {

		 
        return (
            <Container fluid style={{width: '80%' }} >
                <CustomModal
				show={this.state.showModal}
				vals={this.state.modalValues}
				onHide={this.onHide}
				cascadem={this.cascadem}
				> </CustomModal>
                   
                <Tabs
                    id="controlled-tab-example"
                    activeKey={this.state.tab}
                    onSelect={(k) => this.setTabs(k)}
                >
                    <Tab eventKey="get" title="Get">
                        <Jumbotron>
                            <h1 className="header">Get Request Template</h1>
								<Form ref="formget">
                            <PrefixedInput ref="input" value={this.state.get.endpoint} onChange={this.handleChangeGetEndpoint}  ></PrefixedInput>
                            <Row>

								<BigTextInput label="Response" value={JSON.stringify(this.state.get.response)} onChange={this.handleChangeGetResponse} ></BigTextInput>
                                <Col>
                                    <h1 className="header">Get Request Template</h1>
                                </Col>

                            </Row>
								</Form>
							<Button disabled={!this.state.get.endpoint || !this.state.get.response} onClick={() => this.save("get")} >Save</Button>
							<Button disabled={!this.state.get.endpoint && !this.state.get.response} style={{marginLeft: '20px'}} variant="warning" onClick={this.clearInputs} >Clear</Button>
							
								

                        </Jumbotron>
							
                    </Tab>
                    <Tab eventKey="post" title="Post">
                        <Jumbotron>
                            <h1 className="header">Post Request Template</h1>
							<Form ref="formpost">
								
							<PrefixedInput ref="input" value={this.state.post.endpoint} onChange={this.handleChangePostEndpoint}  ></PrefixedInput>

                            <Row>
                                <BigTextInput label="Request" ></BigTextInput>
                                <BigTextInput label="Response" ></BigTextInput>
                            </Row>
							</Form>
                            <Button onClick={() => this.save("post")} >Save</Button>
							<Button style={{ marginLeft: '20px' }} variant="warning" onClick={this.clearInputs} >Clear</Button>

                        </Jumbotron>
                    </Tab>
                    <Tab eventKey="cascade" title="Cascade">
                        <Jumbotron>
                            <h1 className="header">Cascade</h1>
                            <h2 className="header">You can always make a clean start</h2>
                            <h3 className="header">*This action is irreversible</h3>
                  
							<Button variant="danger" onClick={() => this.cascadeWarning()} >Cascade</Button>
                        </Jumbotron>
                    </Tab>
                    <Tab eventKey="validator" title="JSON Validator">
                        <Jumbotron>
                             <h1 className="header">Json Validator</h1>
							 <Row>
								 <Col>
								<Form ref="jsonvalidator">
                           <BigTextInput label="JsonLint" onChange={this.jsonValidatorInputObserver} ></BigTextInput>
								</Form>
								 </Col>
							<Col>
							{
								this.state.isJsonValidatorInputValid !== ''
								?
								<h1 className="header">{this.state.isJsonValidatorInputValid}</h1>
								:
								<h1 className="header">Got nothing to validate  </h1>
								
							}
							{
								this.state.isJsonValidatorInputValid
								?
								<Badge
								variant={this.state.isJsonValidatorInputValid.includes('!') ? 'danger' : 'success'}>
								{this.state.isJsonValidatorInputValid.includes('!') ? 'Failed' : 'Succeeded'}</Badge>
								:
								null
								
							}
							{/* { buraya valid json ı beautify edip yaz - valid olmayanı da beautify edip yaz
								this.state.jsonValidatorInput 
								?
								<pre>{ jsonBeautified }</pre>
								:
								null

							} 
							 {/* <textarea 
								 type="text"
								 style={{width: '500px'}}
								 disabled
								 label="JsonLintValue"
								 value={this.state.jsonValidatorInput}
							></textarea> */}
							</Col>
							 </Row>
                  
							<Button variant="success" onClick={() => this.validateJson(this.state.jsonValidatorInput)} >Check</Button>
							<Button variant="warning" onClick={() => this.clearJsonValidator()}>Clear</Button>
                        </Jumbotron>
                    </Tab>
                    <Tab disabled eventKey="export" title="Export">
                        <Jumbotron>
                            {/* <h1 className="header">Cascade</h1>
                            <h2 className="header">You can always make a clean start</h2>
                            <h3 className="header">*This action is irreversible</h3>
                  
							<Button variant="danger" onClick={() => this.cascadeWarning()} >Cascade</Button> */}
                        </Jumbotron>
                    </Tab>
                    <Tab disabled eventKey="import" title="Import">
                        <Jumbotron>
                            {/* <h1 className="header">Cascade</h1>
                            <h2 className="header">You can always make a clean start</h2>
                            <h3 className="header">*This action is irreversible</h3>
                  
							<Button variant="danger" onClick={() => this.cascadeWarning()} >Cascade</Button> */}
                        </Jumbotron>
                    </Tab>
					
                </Tabs>
       
                <Row>
                    <Col>
						<Jumbotron style={{ alignItems: 'center', minHeight: '400px' }} >
							<h1 className="header"> Total Requests {this.state.apis && this.state.apis.data ? this.state.apis.data.length : 0} </h1>
                            {this.state.showLoader ? 
                                <Col style={{  alignSelf: 'center' }}>
                                    <Row style={{  justifyContent: 'center' }} >
                                        <Spinner style={{height: '100px', width: '100px'}} animation="border" variant="warning" />
                                    </Row>
                                </Col>
								:
								
								<MockList apis={this.state.apis} onPressAction={this.setSelected} ></MockList>
                            }
                        </Jumbotron>
                    </Col>
                    <Col>
                        <Jumbotron style={{ minHeight: '400px' }} >
                            <h1 className="header">Request Details</h1>
							<MockItemDetail data={this.state.selectedApi} ></MockItemDetail>
							{/* {this.state.selectedApi && this.state.selectedApi.method
							?
							<Button variant="danger" onClick={() => this.deleteItem()} >Delete</Button>
							:
							null
							} */}
							{this.state.selectedApi && this.state.selectedApi.method
							?
							<Button variant="success" onClick={() => this.testItem()} >Test</Button>
							:
							null
							}
                        </Jumbotron>
                    </Col>
                </Row>
            </Container>
        );
    }
}

// Todo validate json ekranında jsonın valid olmayan satırını yaz beautify edip. 