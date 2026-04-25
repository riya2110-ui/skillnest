const router = require('express').Router();
const ForumPost = require('../models/ForumPost');
const authMiddleware = require('../middleware/authMiddleware');

// Get all forum posts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .populate('user', 'firstName lastName avatar profile.role')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new post
router.post('/', authMiddleware, async (req, res) => {
  const { title, content, type, company } = req.body;
  try {
    const newPost = new ForumPost({
      user: req.user.id,
      title,
      content,
      type,
      company
    });
    const savedPost = await newPost.save();
    const populatedPost = await ForumPost.findById(savedPost._id).populate('user', 'firstName lastName avatar profile.role');
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Like/Unlike a post
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const likeIndex = post.likes.indexOf(req.user.id);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json(post.likes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a comment
router.post('/:id/comment', authMiddleware, async (req, res) => {
  const { text } = req.body;
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const user = await require('../models/User').findById(req.user.id);
    
    post.comments.push({
      user: req.user.id,
      userName: `${user.firstName} ${user.lastName}`,
      text
    });

    await post.save();
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
