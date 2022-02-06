import React, { Component, Fragment } from 'react';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false
  };

  componentDidMount() {
    let graphqlQuery = {
      query: `
        {
          getUser {
            status
          }
        }
      `
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
          throw new Error('Fetching status failed');
        }
        this.setState({ status: resData.data.getUser.status });
      })
      .catch(this.catchError);

    this.loadPosts();
  }

  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }

    let graphqlQuery = {
      query: `
        query PostList($page: Int) {
          postList(page: $page) {
            posts {
              _id
              title
              content
              imageUrl
              creator {
                name
              }
              createdAt
            }
            totalPosts
          }
        }
      `,
      variables: { page }
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
          throw new Error('Fetching posts failed');
        }
        this.setState({
          posts: resData.data.postList.posts.map(post => {
            return {
              ...post,
              imagePath: post.imageUrl
            };
          }),
          totalPosts: resData.data.postList.totalPosts,
          postsLoading: false
        });
      })
      .catch(this.catchError);
  };

  statusUpdateHandler = event => {
    event.preventDefault();

    let graphqlQuery = {
      query: `
        mutation UpdateStatus($status: String!) {
          updateStatus(status: $status) {
            status
          }
        }
      `,
      variables: { status: this.state.status }
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
          throw new Error('Updating status failed');
        }
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };
      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = ({ title, content, image }) => {
    this.setState({
      editLoading: true
    });

    const formData = new FormData();
    formData.append('image', image);
    if (this.state.editPost) {
      formData.append('oldPath', this.state.editPost.imagePath);
    }

    fetch('http://localhost:8080/post-image', {
      method: 'PUT',
      body: formData,
      headers: {
        Authorization: 'Bearer ' + this.props.token,
      }
    })
      .then(res => res.json())
      .then(resData => {
        const imageUrl = resData.filePath || 'undefined';

        let graphqlQuery = {
          query: `
            mutation CreatePost($title: String!, $content: String!, $imageUrl: String!) {
              createPost(postInput: {
                title: $title,
                content: $content,
                imageUrl: $imageUrl
              }) {
                _id
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
          variables: { title, content, imageUrl }
        }

        if (this.state.editPost) {
          graphqlQuery = {
            query: `
              mutation UpdatePost($postId: ID!, $title: String!, $content: String!, $imageUrl: String!) {
                updatePost(postId: $postId, postInput: {
                  title: $title,
                  content: $content,
                  imageUrl: $imageUrl
                }) {
                  _id
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
            variables: { postId: this.state.editPost._id, title, content, imageUrl }
          }
        }

        return fetch('http://localhost:8080/graphql', {
          method: 'POST',
          body: JSON.stringify(graphqlQuery),
          headers: {
            Authorization: 'Bearer ' + this.props.token,
            'Content-Type': 'application/json'
          }
        })
      })
      .then(res => res.json())
      .then(resData => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Post creation failed"
          );
        }
        let resDataField = 'createPost';
        if (this.state.editPost) {
          resDataField = 'updatePost'
        }
        const { _id, title, content, imageUrl, creator, createdAt } = resData.data[resDataField];
        const post = {
          _id,
          title,
          content,
          imageUrl,
          creator,
          createdAt
        };
        this.setState(prevState => {
          let updatedPosts = [...prevState.posts];
          if (prevState.editPost) {
            const postIndex = prevState.posts.findIndex(
              p => p._id === prevState.editPost._id
            );
            updatedPosts[postIndex] = post;
          } else {
            updatedPosts.unshift(post);
            if (updatedPosts.length > 2) {
              updatedPosts.pop()
            }
          }
          return {
            posts: updatedPosts,
            totalPosts: prevState.editPost ? this.state.totalPosts : this.state.totalPosts + 1,
            isEditing: false,
            editPost: null,
            editLoading: false
          };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err
        });
      });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });

    const graphqlQuery = {
      query: `
        mutation DeletePost($postId: ID!) {
          deletePost(postId: $postId)
        }
      `,
      variables: { postId }
    }

    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      body: JSON.stringify(graphqlQuery),
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.errors) {
          throw new Error('Deleting post failed');
        }
        this.setState(prevState => {
          this.loadPosts()
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
