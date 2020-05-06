import React, { Component } from "react"
import { BrowserRouter, Route } from "react-router-dom"
import Home from "./containers/Home"
import "./App.css"
import Header from "./components/Header"

class App extends Component {
  render() {
    return (
      <div className="App">
        <Header>fgrtgr</Header>
        <BrowserRouter>
          <Route exact path="/" component={Home} />
        </BrowserRouter>
      </div>
    )
  }
}

export default App
