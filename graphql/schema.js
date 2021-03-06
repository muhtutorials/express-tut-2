const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type Post {
    _id: ID!
    title: String!
    content: String!
    imageUrl: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }

  type User {
    _id: ID!
    email: String!
    name: String!
    password: String
    status: String!
    posts: [Post!]!
  }

  input UserInput {
    email: String!
    name: String!
    password: String!
  }

  type Auth {
    token: String!
    userId: String!
  }

  input PostInput {
    title: String!
    content: String!
    imageUrl: String!
  }
  
  type PostList {
    posts: [Post!]!
    totalPosts: Int!
  }
  
  type Status {
    status: String!
  }

  type Query {
    login(email: String!, password: String!): Auth!
    postList(page: Int): PostList!
    postDetail(postId: ID!): Post!
    getUser: User!
  }

  type Mutation {
    createUser(userInput: UserInput): User!
    createPost(postInput: PostInput): Post!
    updatePost(postId: ID!, postInput: PostInput): Post!
    deletePost(postId: ID!): Boolean
    updateStatus(status: String!): User!
  }
`);