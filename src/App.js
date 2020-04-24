import React, { Component } from 'react';
import { BrowserRouter, Route, Link } from 'react-router-dom'
import Home from './containers/Home'
import './App.css';

class App extends Component {

	render() {
		return (
			<div className="App">
				<BrowserRouter>
					<div className="menu">
						<ul>
							<li>
								<Link to="/">HOME</Link>
							</li>
						</ul>
					</div>
					<Route exact path="/" component={Home} />

				</BrowserRouter>
			</div>
		);
	}
}

export default App;
