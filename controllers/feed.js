exports.getPosts = (req, res) => {
  res.status(200).json({
    posts: [
      {
        title: 'One',
        content: 'Darkness imprisoning me'
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