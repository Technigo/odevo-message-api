require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const listEndpoints = require('express-list-endpoints')

const PORT = process.env.PORT || '3000'
const app = express()
app.use(cors())
app.use(express.json())

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/messages"
mongoose.connect(mongoUrl)

mongoose.connection.once("open", () => {
  console.log("Connected to mongodb", mongoUrl)
})

mongoose.connection.on("error", err => {
  console.error("connection error:", err)
})

const Message = mongoose.model('Message', {
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140
  },
  hearts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

app.get('/', (req, res) => {
  res.send(listEndpoints(app))
})

app.get('/messages', (req, res) => {
  Message.find().sort({ createdAt: 'desc' }).limit(20).exec()
    .then(messages => res.json(messages))
    .catch(err => res.status(500).json({ message: 'Could not fetch messages', errors: err.errors }))
})

app.post('/messages', (req, res) => {
  const message = new Message({ message: req.body.message })
  message.save()
    .then(saved => res.status(201).json(saved))
    .catch(err => res.status(400).json({ message: 'Could not save message', errors: err.errors }))
})

app.post('/messages/:id/like', (req, res) => {
  Message.findOneAndUpdate({ _id: req.params.id }, { $inc: { hearts: 1 } }, { new: true })
    .then(message => {
      if (!message) {
        return res.status(404).json({ message: 'Message not found' })
      }
      res.json(message)
    })
    .catch(err => res.status(400).json({ message: 'Could not save heart', errors: err.errors }))
})

app.delete('/messages/:id', (req, res) => {
  Message.findByIdAndDelete(req.params.id)
    .then(message => {
      if (!message) {
        return res.status(404).json({ message: 'Message not found' })
      }
      res.json({ message: 'Message deleted successfully' })
    })
    .catch(err => res.status(400).json({ message: 'Could not delete message', errors: err.errors }))
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
