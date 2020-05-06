import React from "react"
import axios from "axios"
import _ from "lodash"
import { saveTemplate } from "../../requests"
import {
  Jumbotron,
  Container,
  Tabs,
  Tab,
  Row,
  Col,
  Button,
  Form,
  Spinner,
  Badge,
} from "react-bootstrap"
import PrefixedInput from "../../components/PrefixedInput"
import CustomModal from "../../components/CustomModal"
import BigTextInput from "../../components/BigTextInput"
import MockList from "../../components/MockList"
import MockItemDetail from "../../components/MockItemDetail"
import CustomToast from "../../components/CustomToast"
import TipsNTricks from "../../components/TipsNTricks"
import CustomDropzone from "../../components/CustomDropzone"
import Tips from "./Tips"

export default class Home extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      playing: false,
      get: {
        endpoint: "",
        response: {},
        method: "get",
      },
      post: {
        endpoint: "",
        method: "post",
        response: {},
        request: {},
      },
      modalValues: {},
      showModal: false,
      apis: [],
      showLoader: true,
      selectedApi: {},
      jsonValidatorInput: null,
      isJsonValidatorInputValid: "",
      apiCheck: {},
      deletionStatus: null,
      showToast: true,
      toastBody: "",
      isgetResponseBodyValid: "",
      tip: "",
    }
    this.defaultModalValues = {
      type: "",
      header: "",
      desc: "",
      secondary: "",
    }
    this.save = this.save.bind(this)
    this.clearInputs = this.clearInputs.bind(this)
    this.handleChangeGetEndpoint = this.handleChangeGetEndpoint.bind(this)
    this.handleChangeGetResponse = this.handleChangeGetResponse.bind(this)
    this.handleChangePostEndpoint = this.handleChangePostEndpoint.bind(this)
    this.handleChangePostRequest = this.handleChangePostRequest.bind(this)
    this.handleChangePostResponse = this.handleChangePostResponse.bind(this)
    this.onHide = this.onHide.bind(this)
    this.getApis = this.getApis.bind(this)
    this.cascade = this.cascade.bind(this)
    this.cascadeWarning = this.cascadeWarning.bind(this)
    this.setSelected = this.setSelected.bind(this)
    this.validateJson = this.validateJson.bind(this)
    this.jsonValidatorInputObserver = this.jsonValidatorInputObserver.bind(this)
    this.clearJsonValidator = this.clearJsonValidator.bind(this)
    this.testItem = this.testItem.bind(this)
    this.deleteWarning = this.deleteWarning.bind(this)
    this.deleteSelectedRequest = this.deleteSelectedRequest.bind(this)
    this.onToastClose = this.onToastClose.bind(this)
    this.download = this.download.bind(this)
    this.upload = this.upload.bind(this)
    this.recoverWarning = this.recoverWarning.bind(this)
    this.recover = this.recover.bind(this)
    this.homeRef = React.createRef()
  }

  componentDidMount() {
    this.getApis()
  }

  async getApis() {
    let randomNumber = Math.floor(Math.random() * Tips.length)
    const apis = await axios
      .get("/getall", {
        headers: {
          "content-type": "application/json",
        },
      })
      .then(function (response) {
        console.log(response)
        if (response.data === "") {
          return {}
        }
        return response
      })
      .catch(function (error) {
        console.log(error)
        return "error"
      })
    if (apis === "error") {
      this.setState({
        apis: {},
        showLoader: false,
        selectedApi: {},
        deletionStatus: null,
        modalValues: this.defaultModalValues,
        showModal: false,
        showToast: true,
        toastBody: "Error occured, endpoints could not be retrieved !",
        tip: Tips[randomNumber],
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
        toastBody: "Successfuly fetched mock endpoints.",
        tip: Tips[randomNumber],
      })
    }
  }

  async testItem() {
    let apiCheck

    const endpoint =
      "/mocktail/" + this.state.selectedApi.endpoint
    if (this.state.selectedApi.method === "get") {
      apiCheck = await axios
        .get(endpoint, {
          headers: {
            "content-type": "application/json",
          },
        })
        .then(function (response) {
          console.log(response)
          if (response.data === "") {
            return {}
          }
          return response
        })
        .catch(function (error) {
          console.log(error)
          return {}
        })
    } else {
      apiCheck = await axios
        .post(endpoint, {
          body: this.state.selectedApi.request,
        })
        .then(function (response) {
          console.log(response)
          if (response.data === "") {
            return {}
          }
          return response
        })
        .catch(function (error) {
          console.log(error)
          return {}
        })
    }
    this.setState({ apiCheck, deletionStatus: null })
  }

  validate(template) {
    // const expression = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+) (?:: (\d +))?(?: \/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/
    // const regex = new RegExp(expression)
    try {
      template.endpoint = template.endpoint.toLocaleLowerCase("en-US")
      template.endpoint = template.endpoint.replace(/\s/g, "")

      template.response = JSON.parse(template.response)
      if (template.request) {
        template.request = JSON.parse(template.request)
      }
      console.log("template inside validate returning --> ", template)

      return template
    } catch (error) {
      console.log(error)
    }
    return false
  }

  save(type) {
    const isValidBoolean = this.validate(this.state[type])
    console.log(isValidBoolean)

    if (isValidBoolean) {
      const toBeSaved = { body: isValidBoolean }
      console.log(toBeSaved)
      saveTemplate(toBeSaved)
      this.clearInputs()
      this.getApis()
    } else {
      this.setState({
        showToast: true,
        toastBody: "Please Correct Your Json Object !",
      })
    }
  }

  clearInputs() {
    this.refs.formget.reset()
    this.refs.formpost.reset()
    const get = { endpoint: "", method: "get", response: {} }
    const post = { endpoint: "", method: "post", response: {}, request: {} }
    this.setState({ get, post, selectedApi: {} })
  }

  handleChangeGetEndpoint(event) {
    let { get } = this.state
    get.endpoint = event.target.value
    this.setState({ get })
  }

  handleChangeGetResponse(event) {
    let { get } = this.state
    get.response = event.target.value
    this.setState({ get })
  }
  handleChangePostEndpoint(event) {
    let { post } = this.state
    post.endpoint = event.target.value
    this.setState({ post })
  }

  handleChangePostRequest(event) {
    let { post } = this.state
    post.request = event.target.value
    this.setState({ post })
  }
  handleChangePostResponse(event) {
    let { post } = this.state
    post.response = event.target.value
    this.setState({ post })
  }

  onHide() {
    const modalValues = {
      type: "",
      header: "",
      desc: "",
      secondary: "",
    }
    this.setState({ modalValues, showModal: false })
  }

  cascadeWarning() {
    const modalValues = {
      type: "Warning",
      header: "Cascade",
      desc:
        "You are about to delete every template you added. Are you sure ? This can be reverted from recover tab",
      secondary: "cascade",
    }
    this.setState({ modalValues, showModal: true })
  }

  recoverWarning() {
    const modalValues = {
      type: "Warning",
      header: "Recover",
      desc: "You are about to recover to the moment before you cascaded",
      secondary: "recover",
    }
    this.setState({ modalValues, showModal: true })
  }
  async recover() {
    this.onHide()
    const success = await axios
      .get("/recover", {
        headers: {
          "content-type": "application/json",
        },
      })
      .then(function (response) {
        console.log(response)
        return response
      })
      .catch(function (error) {
        console.log(error)
        return error
      })
    if (success.data) {
      this.getApis()
    } else {
      this.setState({
        showToast: true,
        toastBody: "You can only recover once after cascading !",
      })
    }
  }

  async cascade() {
    this.onHide()
    const success = await axios
      .get("/cascadeall", {
        headers: {
          "content-type": "application/json",
        },
      })
      .then(function (response) {
        console.log(response)
        return response
      })
      .catch(function (error) {
        console.log(error)
        return error
      })
    if (success.data) {
      this.getApis()
    } else {
      this.setState({
        showToast: true,
        toastBody:
          "Could not delete - Pleade create an Issue on Github - Huseyinnurbaki/mocktail",
      })
    }
  }

  setSelected(selectedApi) {
    this.setState({ selectedApi, apiCheck: {}, deletionStatus: null })
  }

  jsonValidatorInputObserver(event) {
    let jsonValidatorInput = event.target.value
    this.setState({ jsonValidatorInput, isJsonValidatorInputValid: "" })
  }
  validateJson(value) {
    // json validator tab
    let isJsonValidatorInputValid = "JSON is not valid !!"
    if (_.isEmpty(value)) {
      isJsonValidatorInputValid = "Input seems empty !"
      this.setState({ isJsonValidatorInputValid })
      return
    }
    try {
      JSON.parse(value)
      isJsonValidatorInputValid = "JSON is valid"
    } catch (error) {
      console.log(error)
      if (error.message) {
        isJsonValidatorInputValid = error.message + " !"
      }
    }
    this.setState({ isJsonValidatorInputValid })
  }
  clearJsonValidator() {
    this.setState({ jsonValidatorInput: null, isJsonValidatorInputValid: "" })
    this.refs.JsonLint.reset()
  }

  async deleteSelectedRequest() {
    const endpoint = "/delete/" + this.state.selectedApi.key

    const deletionStatus = await axios
      .get(endpoint, {
        headers: {
          "content-type": "application/json",
        },
      })
      .then(function (response) {
        console.log(response)
        if (response.data === "") {
          return {}
        }
        return response
      })
      .catch(function (error) {
        console.log(error)
        return {}
      })
    console.log(deletionStatus)
    if (
      deletionStatus.data &&
      deletionStatus.data.status &&
      deletionStatus.data.status === "success"
    ) {
      this.getApis()
    } else {
      this.setState({
        deletionStatus: deletionStatus.status,
        modalValues: this.defaultModalValues,
        showModal: false,
        showToast: true,
        toastBody: "Could not delete the item. !",
      })
    }
  }

  deleteWarning() {
    const modalValues = {
      type: "Warning",
      header: "Delete",
      desc:
        "You are about to delete selected api. Are you sure ? You can revert it if you wish.",
      secondary: "deleteSelectedRequest",
    }
    this.setState({ modalValues, showModal: true })
  }

  onToastClose() {
    this.setState({ showToast: false, toastBody: "" })
  }

  async download() {
    await axios
      .get("/exportall")
      .then(function (response) {
        return response
      })
      .catch(function (error) {
        console.log(error)
        return error
      })
    const link = document.createElement("a")
    link.href = "/mocktail.json"
    link.download = "mocktail.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async upload(fileValue) {
    let convertedFile
    try {
      convertedFile = JSON.parse(fileValue)
    } catch (error) {
      convertedFile = false
      console.log(error)
    }
    if (!convertedFile) {
      this.setState({
        showToast: true,
        toastBody: "Please only upload single json file !",
      })
      return
    }
    const up = await axios
      .post("/upload", {
        body: convertedFile,
      })
      .then(function (response) {
        console.log(response)
        if (response.data === "") {
          return {}
        }
        return response
      })
      .catch(function (error) {
        console.log(error)
        return {}
      })

    if (up.data) {
      this.getApis()
    } else {
      this.setState({
        showToast: true,
        toastBody: "Your jsonfile is not valid !",
      })
    }
  }

  render() {
    return (
      <div style={{ backgroundColor: "rgb(250, 250, 250)" }}>
        <Container fluid style={{ width: "80%" }}>
          <CustomToast
            onToastClose={this.onToastClose}
            showToast={this.state.showToast}
            toastBody={this.state.toastBody}
          />
          <CustomModal
            show={this.state.showModal}
            vals={this.state.modalValues}
            onHide={this.onHide}
            cascade={this.cascade}
            deleteSelectedRequest={this.deleteSelectedRequest}
            recover={this.recover}
          />

          <Tabs
            id="controlled-tab-example"
            activeKey={this.state.activeKey}
            onSelect={(key) => this.setState({ tab: key })}
          >
            <Tab eventKey="get" title="Get">
              <Jumbotron className="jumboTop">
                <Form ref="formget">
                  <Row>
                    <Col>
                      <Col>
                        <h1 className="h1dr">Get Request Template</h1>
                      </Col>
                      <PrefixedInput
                        ref="input"
                        value={this.state.get.endpoint}
                        onChange={this.handleChangeGetEndpoint}
                      ></PrefixedInput>

                      <BigTextInput
                        label="Response Body"
                        value={JSON.stringify(this.state.get.response)}
                        onChange={this.handleChangeGetResponse}
                        style={
                          this.state.isgetResponseBodyValid &&
                          this.state.isgetResponseBodyValid.length > 0
                            ? {
                                borderColor: this.state.isgetResponseBodyValid.includes(
                                  "!"
                                )
                                  ? "red"
                                  : "#4BB543",
                                borderWidth: 1.5,
                              }
                            : {}
                        }
                      />
                    </Col>
                    <TipsNTricks tip={this.state.tip} />
                  </Row>
                </Form>
                <Col>
                  <Button
                    disabled={
                      !this.state.get.endpoint || _.isEmpty(this.state.get.response)
                    }
                    onClick={() => this.save("get")}
                  >
                    Save
                  </Button>
                  <Button
                    disabled={
                      !this.state.get.endpoint && _.isEmpty(this.state.get.response)
                    }
                    style={{ marginLeft: "20px" }}
                    variant="warning"
                    onClick={this.clearInputs}
                  >
                    Clear
                  </Button>
                </Col>
              </Jumbotron>
            </Tab>
            <Tab eventKey="post" title="Post">
              <Jumbotron className="jumboTop">
                <Col>
                  <h1 className="h1dr">Post Request Template</h1>
                </Col>
                <Form ref="formpost">
                  <PrefixedInput
                    ref="input"
                    value={this.state.post.endpoint}
                    onChange={this.handleChangePostEndpoint}
                  ></PrefixedInput>

                  <Row>
                    <Col>
                      <BigTextInput
                        label="Request Body"
                        value={JSON.stringify(this.state.post.request)}
                        onChange={this.handleChangePostRequest}
                      />
                    </Col>
                    <Col>
                      <BigTextInput
                        value={JSON.stringify(this.state.post.response)}
                        label="Response Body"
                        onChange={this.handleChangePostResponse}
                      />
                    </Col>
                  </Row>
                </Form>
                <Col>
                  <Button
                    disabled={
                      !this.state.post.endpoint ||
                      _.isEmpty(this.state.post.request) ||
                      _.isEmpty(this.state.post.response)
                    }
                    onClick={() => this.save("post")}
                  >
                    Save
                  </Button>
                  <Button
                    style={{ marginLeft: "20px" }}
                    variant="warning"
                    disabled={
                      !this.state.post.endpoint &&
                      _.isEmpty(this.state.post.request) &&
                      _.isEmpty(this.state.post.response)
                    }
                    onClick={() => this.clearInputs()}
                  >
                    Clear
                  </Button>
                </Col>
              </Jumbotron>
            </Tab>
            <Tab eventKey="validator" title="JSON Validator">
              <Jumbotron className="jumboTop">
                <Row>
                  <Col>
                    <Col>
                      <h1 className="h1dr">Json Validator</h1>
                    </Col>
                    <Form ref="JsonLint">
                      <BigTextInput
                        onChange={this.jsonValidatorInputObserver}
                        style={
                          this.state.isJsonValidatorInputValid &&
                          this.state.isJsonValidatorInputValid.length > 0
                            ? {
                                borderColor: this.state.isJsonValidatorInputValid.includes(
                                  "!"
                                )
                                  ? "red"
                                  : "#4BB543",
                                borderWidth: 1.5,
                              }
                            : {}
                        }
                      ></BigTextInput>
                    </Form>
                  </Col>
                  <Col>
                    <img
                      src="hm.png"
                      style={{ height: "250px", marginTop: "80px", opacity: "0.85" }}
                      className="headerimg"
                      alt=""
                    />
                  </Col>
                </Row>
                <Col style={{ width: "50%" }}>
                  <Button
                    variant="success"
                    onClick={() => this.validateJson(this.state.jsonValidatorInput)}
                  >
                    Check
                  </Button>
                  <Button
                    style={{ marginLeft: "20px" }}
                    variant="warning"
                    onClick={() => this.clearJsonValidator()}
                  >
                    Clear
                  </Button>
                  <Row style={{ marginTop: '25px' }}>
                    <Col>
                      {this.state.isJsonValidatorInputValid !== "" ? (
                        <h4 className="h1dr">
                          {this.state.isJsonValidatorInputValid}
                        </h4>
                      ) : null}
                    </Col>
                  </Row>
                  {this.state.isJsonValidatorInputValid ? (
                    <Badge
                      variant={
                        this.state.isJsonValidatorInputValid.includes("!")
                          ? "danger"
                          : "success"
                      }
                    >
                      {this.state.isJsonValidatorInputValid.includes("!")
                        ? "Failed"
                        : "Succeeded"}
                    </Badge>
                  ) : null}
                </Col>
              </Jumbotron>
            </Tab>
            <Tab eventKey="export" title="Export">
              <Jumbotron className="jumboTop">
                <Row>
                  <Col>
                    <h1 className="h1dr">Export</h1>
                    <h3 className="h2dr">
                      You can export all mock templates into a json file to easily
                      distribute mock templates.{" "}
                    </h3>
                    <h4 className="h1dr">
                      *Later this file can be uploaded using upload tab.{" "}
                    </h4>

                    <Button
                      style={{ marginTop: "30px" }}
                      variant="danger"
                      onClick={() => this.download()}
                      size="lg"
                    >
                      Download
                    </Button>
                  </Col>
                  <Col>
                    <img
                      src="do.png"
                      style={{ height: "250px", marginTop: "80px", opacity: "0.85" }}
                      className="headerimg"
                      alt=""
                    />
                  </Col>
                </Row>
              </Jumbotron>
            </Tab>
            <Tab eventKey="import" title="Import">
              <Jumbotron className="jumboTop">
                <Row>
                  <Col>
                    <h1 className="h1dr">Import</h1>
                    <h3 className="h2dr">
                      You can import multiple endpoints from file exported by
                      mocktail.{" "}
                    </h3>
                    <h4 className="h1dr">
                      *You can create a json file by yourself but there are many
                      rules, I would not want you to waste your time with filling a
                      json file with rules.{" "}
                    </h4>
                  </Col>
                  <Col>
                    <CustomDropzone upload={this.upload} />
                  </Col>
                </Row>
              </Jumbotron>
            </Tab>
            <Tab eventKey="cascade" title="Cascade">
              <Jumbotron className="jumboTop">
                <Row>
                  <Col>
                    <h1 className="h1dr">Cascade</h1>
                    <h3 className="h2dr">You can always make a clean start</h3>
                    <h4 className="h1dr">
                      *This action can be reverted from Recover tab
                    </h4>

                    <Button
                      style={{ marginTop: "30px" }}
                      variant="danger"
                      onClick={() => this.cascadeWarning()}
                      size="lg"
                    >
                      Cascade
                    </Button>
                  </Col>
                  <Col>
                    <img
                      src="exp.png"
                      style={{ height: "250px", marginTop: "80px", opacity: "0.85" }}
                      className="headerimg"
                      alt=""
                    />
                  </Col>
                </Row>
              </Jumbotron>
            </Tab>
            <Tab eventKey="recover" title="Recover">
              <Jumbotron className="jumboTop">
                <Row>
                  <Col>
                    <h1 className="h1dr">Recover</h1>
                    <h3 className="h2dr">You can recover after cascading.</h3>
                    <h4 className="h1dr">
                      *This action reverts cascade operation.Can only be used right
                      after cascade operation. If you save any template after
                      cascading, you cannot recover.
                    </h4>

                    <Button
                      style={{ marginTop: "30px" }}
                      variant="danger"
                      onClick={() => this.recoverWarning()}
                      size="lg"
                    >
                      Recover
                    </Button>
                  </Col>
                  <Col>
                    <img
                      src="he.png"
                      style={{ height: "250px", marginTop: "80px", opacity: "0.85" }}
                      className="headerimg"
                      alt=""
                    />
                  </Col>
                </Row>
              </Jumbotron>
            </Tab>
          </Tabs>

          <Row>
            <Col>
              <Jumbotron className="jumbos">
                <Col>
                  <h1 className="h1dr">
                    {" "}
                    Total Requests{" "}
                    {this.state.apis && this.state.apis.data
                      ? this.state.apis.data.length
                      : 0}{" "}
                  </h1>
                </Col>
                {this.state.showLoader ? (
                  <Col style={{ alignSelf: "center" }}>
                    <Row style={{ justifyContent: "center" }}>
                      <Spinner
                        style={{ height: "100px", width: "100px" }}
                        animation="border"
                        variant="warning"
                      />
                    </Row>
                  </Col>
                ) : (
                  <MockList
                    apis={this.state.apis}
                    onPressAction={this.setSelected}
                  ></MockList>
                )}
              </Jumbotron>
            </Col>
            <Col>
              <Jumbotron className="jumbos">
                <MockItemDetail
                  disabled
                  data={this.state.selectedApi}
                  deleteSelectedRequest={this.deleteWarning}
                  deletionStatus={this.state.deletionStatus}
                  testItem={this.testItem}
                  apiCheck={this.state.apiCheck}
                />
              </Jumbotron>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}

// Todo validate json ekranında jsonın valid olmayan satırını yaz beautify edip.
