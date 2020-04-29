

import React from 'react';
import axios from 'axios';
import _ from 'lodash';
import { getTemplate, saveTemplate } from '../../requests';
import { Jumbotron, Container, Tabs, Tab, Row, Col, Button, Form, Spinner, Badge, } from 'react-bootstrap';
import PrefixedInput from '../../components/PrefixedInput';
import CustomModal from '../../components/CustomModal';
import BigTextInput from '../../components/BigTextInput';
import MockList from '../../components/MockList';
import MockItemDetail from '../../components/MockItemDetail';
import CustomToast from '../../components/CustomToast';

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
			isJsonValidatorInputValid: '',
			apiCheck: {},
			deletionStatus: null,
			showToast: true,
			toastBody: ''
        };
		this.getAllUrl = 'http://localhost:7084/getall';
		this.cascadaAllUrl = 'http://localhost:7084/cascadeall';
		this.defaultModalValues = {
			type: '',
			header: '',
			desc: '',
			secondary: ''
		};
        this.save = this.save.bind(this);
        this.clearInputs = this.clearInputs.bind(this);
        this.handleChangeGetEndpoint = this.handleChangeGetEndpoint.bind(this);
        this.handleChangeGetResponse = this.handleChangeGetResponse.bind(this);
        this.handleChangePostEndpoint = this.handleChangePostEndpoint.bind(this);
		this.handleChangePostRequest = this.handleChangePostRequest.bind(this);
        this.handleChangePostResponse = this.handleChangePostResponse.bind(this);
        this.onHide = this.onHide.bind(this);
        this.getApis = this.getApis.bind(this);
        this.cascadem = this.cascadem.bind(this);
        this.cascadeWarning = this.cascadeWarning.bind(this);
        this.setSelected = this.setSelected.bind(this);
        this.validateJson = this.validateJson.bind(this);
        this.jsonValidatorInputObserver = this.jsonValidatorInputObserver.bind(this);
        this.clearJsonValidator = this.clearJsonValidator.bind(this);
        this.testItem = this.testItem.bind(this);
        this.deleteWarning = this.deleteWarning.bind(this);
        this.deleteSelectedRequest = this.deleteSelectedRequest.bind(this);
        this.anythingMissing = this.anythingMissing.bind(this);
        this.onToastClose = this.onToastClose.bind(this);
    }

    componentDidMount() {
        this.getApis();
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
				if(response.data === "") {
					return {}
				}
				return response;
			})
			.catch(function (error) {
				console.log(error);
				return 'error'
			});

			if(apis === 'error') {
				this.setState({
					apis: {},
					showLoader: false,
					selectedApi: {},
					deletionStatus: null,
					modalValues: this.defaultModalValues,
					showModal: false,
					showToast: true,
					toastBody: 'Error occured, endpoints could not be retrieved !'
				})

			} else {
				this.setState({
					apis,
					showLoader: false,
					selectedApi: {},
					deletionStatus: null,
					modalValues: this.defaultModalValues,
					showModal: false,
					showToast: true,
					toastBody: 'Successfuly fetched mock endpoints.'
				})

			}

		}
	
	async testItem() {
		let apiCheck;
		
		const endpoint = 'http://localhost:7084/mocktail/' + this.state.selectedApi.endpoint;
		if(this.state.selectedApi.method === 'get') {
			apiCheck = await axios
			.get(endpoint, {
				headers: {
					'content-type': 'application/json',
				},
			})
			.then(function (response) {
				console.log(response);
				if(response.data === "") {
					return {}
				}
				return response;
			})
			.catch(function (error) {
				console.log(error);
				return {}
			});		
		} else {
			apiCheck = await axios
			.post(endpoint, {
				body: this.state.selectedApi.request
			})
			.then(function (response) {
				console.log(response);
				if(response.data === "") {
					return {}
				}
				debugger;
				return response;
			})
			.catch(function (error) {
				console.log(error);
				debugger;
				return {}
			});	
		}
		this.setState({apiCheck, deletionStatus: null})

	}

	
    validate(template) {
		console.log(template);
		try {
			template.response = JSON.parse(template.response)
			if(template.request){
				template.request = JSON.parse(template.request)
			}
			console.log("template inside validate returning --> ", template);
			
			return template
		} catch (error) {
			console.log(error);
			
		}
        return false;
		
    }
	anythingMissing(data) {
		if(data.method === 'get') {
			if(data.endpoint === '' || data.response === {}) {
				return true;
			}
		} else {
			if(data.endpoint === '' || data.response === {} || data.request === {}) {
				return true;
			}
		}
		return false;

	}
    save(type) {
		const missingParts = this.anythingMissing(this.state[type]);
		if(missingParts) {
			console.log(missingParts);
			return;
			// burada kes servise gitme
		}
		const isValidBoolean = this.validate(this.state[type]);
		console.log(isValidBoolean);
		
        if(isValidBoolean){
			const toBeSaved = { body: isValidBoolean };
			console.log(toBeSaved);
			saveTemplate(toBeSaved);
			this.clearInputs()
			this.getApis();
        } else {
			// hata verdir
		}
	}

    clearInputs() {
		const get = { endpoint: '', method: 'get', response: {} };
		const post = { endpoint: '', method: 'post', response: {}, request: {} };
		this.refs.formget.reset();
		this.refs.formpost.reset();
		this.setState({ get, post, selectedApi: {}});
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
	handleChangePostEndpoint(event) {
		let { post } = this.state;
		post.endpoint = event.target.value;
		this.setState({ post });
	}

	handleChangePostRequest(event){
		let { post } = this.state;
		post.request = event.target.value;
		this.setState({ post });
	}
	handleChangePostResponse(event){
		let { post } = this.state;
		post.response = event.target.value;
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
            header: 'Cascade',
            desc: 'You are about to delete every template you added. Are you sure ? this is irreversible',
            secondary: 'cascade'
        };
        this.setState({ modalValues, showModal: true });
	}
	
	cascadem(){
		this.onHide();
		getTemplate(this.cascadaAllUrl);
	}

	setSelected(selectedApi){
		this.setState({selectedApi, apiCheck: {}, deletionStatus: null})
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

	async deleteSelectedRequest(){
		const endpoint = 'http://localhost:7084/delete/' + this.state.selectedApi.key;

		const deletionStatus = await axios
			.get(endpoint, {
				headers: {
					'content-type': 'application/json',
				},
			})
			.then(function (response) {
				console.log(response);
				if (response.data === "") {
					return {}
				}
				return response;
			})
			.catch(function (error) {
				console.log(error);
				return {}
			});
		console.log(deletionStatus);
		if(deletionStatus.data && deletionStatus.data.status && deletionStatus.data.status === 'success') {
			this.getApis();
		} else {
			this.setState({
				deletionStatus: deletionStatus.status,
				modalValues: this.defaultModalValues,
				showModal: false,
				showToast: true,
				toastBody: 'Could not delete the item. !'
			})
		}
	}

	deleteWarning() {
		const modalValues = {
			type: 'Warning',
			header: 'Delete',
			desc: 'You are about to delete selected api. Are you sure ? You can revert it if you wish.',
			secondary: 'deleteSelectedRequest'
		};
		this.setState({ modalValues, showModal: true });
	}

	onToastClose() {
		this.setState({showToast: false, toastBody: ''})
	}

    render() {

		 
        return (
			<div>

			
            <Container fluid style={{width: '80%' }} >
                <CustomModal
				show={this.state.showModal}
				vals={this.state.modalValues}
				onHide={this.onHide}
				cascadem={this.cascadem}
				deleteSelectedRequest={this.deleteSelectedRequest}
				> </CustomModal>
                   
				   <CustomToast
				   onToastClose={this.onToastClose}
				   showToast={this.state.showToast}
				   toastBody={this.state.toastBody}
				   />
                <Tabs
                    id="controlled-tab-example"
                    activeKey={this.state.tab}
					onSelect={(key) => this.setState({ tab: key })}
					>
                    <Tab eventKey="get" title="Get">
                        <Jumbotron>
                            <h1 className="header">Get Request Template</h1>
								<Form ref="formget">
                            <PrefixedInput ref="input" value={this.state.get.endpoint} onChange={this.handleChangeGetEndpoint}  ></PrefixedInput>
                            <Row>

									<BigTextInput
									  label="Response"
									  value={JSON.stringify(this.state.get.response)} 
									  onChange={this.handleChangeGetResponse}
									  ></BigTextInput>
                                <Col>
                                    <h1 className="header">Get Request Template</h1>
                                </Col>

                            </Row>
								</Form>
							<Button disabled={!this.state.get.endpoint || _.isEmpty(this.state.get.response) } onClick={() => this.save("get")} >Save</Button>
							<Button disabled={!this.state.get.endpoint && _.isEmpty(this.state.get.response)} style={{marginLeft: '20px'}} variant="warning" onClick={this.clearInputs} >Clear</Button>
							
								

                        </Jumbotron>
							
                    </Tab>
                    <Tab eventKey="post" title="Post">
                        <Jumbotron>
                            <h1 className="header">Post Request Template</h1>
							<Form ref="formpost">
								
							<PrefixedInput ref="input" value={this.state.post.endpoint} onChange={this.handleChangePostEndpoint}  ></PrefixedInput>

                            <Row>
                                <BigTextInput
								label="Request"
								value={JSON.stringify(this.state.post.request)} 
								onChange={this.handleChangePostRequest} 
								/>
                                <BigTextInput
								value={JSON.stringify(this.state.post.response)} 
								label="Response"
								onChange={this.handleChangePostResponse} 
								/>
                            </Row>
							</Form>
							<Button disabled={!this.state.post.endpoint || _.isEmpty(this.state.post.request)  || _.isEmpty(this.state.post.response) }  onClick={() => this.save("post")} >Save</Button>
							<Button
							style={{ marginLeft: '20px' }}
							variant="warning"
							onClick={this.clearInputs}
							disabled={!this.state.post.endpoint && _.isEmpty(this.state.post.request)  && _.isEmpty(this.state.post.response) }  onClick={() => this.save("post")}
							>Clear</Button>

                        </Jumbotron>
                    </Tab>         
                    <Tab eventKey="validator" title="JSON Validator">
                        <Jumbotron>
                             <h1 className="header">Json Validator</h1>
							 <Row>
								 <Col>
								<Form ref="JsonLint">
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
							<Button style={{ marginLeft: '20px' }} variant="warning" onClick={() => this.clearJsonValidator()}>Clear</Button>
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
					<Tab eventKey="cascade" title="Cascade">
						<Jumbotron>
							<h1 className="header">Cascade</h1>
							<h2 className="header">You can always make a clean start</h2>
							<h3 className="header">*This action is irreversible</h3>

							<Button variant="danger" onClick={() => this.cascadeWarning()} >Cascade</Button>
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
							<MockItemDetail
							disabled 
							data={this.state.selectedApi}
							deleteSelectedRequest={this.deleteWarning}
							deletionStatus={this.state.deletionStatus}
							testItem={this.testItem}
							apiCheck={this.state.apiCheck}

							
							/>
							{this.state.apiCheck && this.state.apiCheck.status
							?
							<Badge
								variant={this.state.apiCheck.status !== 'success' ? 'danger' : 'success'}>
								{this.state.apiCheck.status !== 'success' ? this.state.apiCheck.error : 'Succeeded'}</Badge>
							:
							null
							}
                        </Jumbotron>
                    </Col>
                </Row>
            </Container>
			</div>
        );
    }
}

// Todo validate json ekranında jsonın valid olmayan satırını yaz beautify edip. 