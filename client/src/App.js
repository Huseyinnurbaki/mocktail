import React, { Component } from "react"
import { BrowserRouter, Route } from "react-router-dom"
import Home from "./containers/Home"
import "./App.css"
import Header from "./components/Header"

class App extends Component {
  render() {
    console.log(process.env.NODE_ENV);
    return (
      <div className="App">
        <Header>Mocktail</Header>
        <BrowserRouter>
          <Route exact path="/" component={Home} />
        </BrowserRouter>
      </div>
    )
  }
}

export default App
