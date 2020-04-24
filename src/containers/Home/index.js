

import React from 'react';
import Heading from '../../components/Heading'
import { getTemplate, postTemplate } from '../../requests';

export default class Home extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			playing: false
		}
		this.getAllUrl = 'http://localhost:3000/getall'
		this.setData = {
			url: 'http://localhost:3000/setall',
			body: {
				hey: "123"
			}
		}

	}

	componentDidMount() {

	}


	render() {

		return (
			<div className="home-container">
				<Heading title="Husistant" />
				<Heading title="Husistant" />
				<Heading title="Husistant" />
				<button onClick={() => getTemplate(this.getAllUrl)}>
					Toggle Tune
				</button>
				<button onClick={() => postTemplate(this.setData)}>
					post
				</button>

				
			</div>
		);
	}
}



