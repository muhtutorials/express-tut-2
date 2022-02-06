import React, { Component } from 'react';

import Image from '../../../components/Image/Image';
import './SinglePost.css';

class SinglePost extends Component {
  state = {
    title: '',
    author: '',
    date: '',
    image: '',
    content: ''
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;

    let graphqlQuery = {
      query: `
        query PostDetail($postId: ID!) {
          postDetail(postId: $postId) {
            title
            content
            imageUrl
            creator {
              name
            }
            createdAt
          }
        }
      `,
      variables: { postId }
    }

    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      body: JSON.stringify(graphqlQuery),
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.errors) {
          throw new Error('Fetching post failed');
        }
        this.setState({
          title: resData.data.postDetail.title,
          author: resData.data.postDetail.creator.name,
          image: 'http://localhost:8080/' + resData.data.postDetail.imageUrl,
          date: new Date(resData.data.postDetail.createdAt).toLocaleDateString('en-US'),
          content: resData.data.postDetail.content
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.image} />
        </div>
        <p>{this.state.content}</p>
      </section>
    );
  }
}

export default SinglePost;
