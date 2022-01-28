exports.getPosts = (req, res) => {
  res.status(200).json({
    posts: [
      {
        _id: '1',
        title: 'One',
        content: 'Darkness imprisoning me',
        imageUrl: 'images/tree.jpeg',
        creator: {
          name: 'igor'
        },
        createdAt: new Date()
      }
    ]
  });
}

exports.postPost = (req, res) => {
  const { title, content } = req.body;

  res.status(201).json({
    message: 'Post created successfully',
    post: { id: new Date().toISOString(), title, content }
  });
}