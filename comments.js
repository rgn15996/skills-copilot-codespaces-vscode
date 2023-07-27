// Create web server application with Express
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const cors = require('cors')
const app = express()

// Middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())

// Create comments array
const commentsByPostId = {}

// Create endpoint for post request
app.post('/posts/:id/comments', async (req, res) => {
  const commentId = randomBytes(4).toString('hex')
  const { content } = req.body

  // Get comments for post id
  const comments = commentsByPostId[req.params.id] || []

  // Push new comment into comments array
  comments.push({ id: commentId, content, status: 'pending' })

  // Update comments array
  commentsByPostId[req.params.id] = comments

  // Send event to event bus
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: { id: commentId, content, postId: req.params.id, status: 'pending' }
  })

  res.status(201).send(comments)
})

// Create endpoint for get request
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || [])
})

// Create endpoint for event bus
app.post('/events', async (req, res) => {
  console.log('Received event: ', req.body.type)

  const { type, data } = req.body

  if (type === 'CommentModerated') {
    const { postId, id, status, content } = data

    // Get comments for post id
    const comments = commentsByPostId[postId]

    // Find comment in comments array
    const comment = comments.find(comment => {
      return comment.id === id
    })

    // Update comment status
    comment.status = status

    // Send event to event bus
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: { id, status, postId, content }
    })
  }

  res.send({})
})

// Listen for requests
app.listen(4001, () => {
  console.log('Listening on port 4001')
})

// Function to generate random bytes
