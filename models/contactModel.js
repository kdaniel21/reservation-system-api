const mongoose = require('mongoose');

const contactOptions = ['Option1', 'Option2', 'Option3'];

const messageSchema = new mongoose.Schema({
  message: { type: String, required: true },
  user: { name: String, admin: Boolean },
  createdAt: { type: Date, default: Date.now() },
});

const contactSchema = new mongoose.Schema({
  topic: { type: String, required: true, enum: contactOptions },
  message: String,
  priority: { type: Boolean, default: false },
  closed: { type: Boolean, default: false },
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
  messages: [messageSchema],
});

contactSchema.pre('save', function (next, user) {
  if (!this.isNew) return next();

  const firstMessage = {
    message: this.message,
    user: {
      name: user.name,
      admin: user.role === 'admin',
    },
  };
  this.messages.push(firstMessage);
  this.message = undefined;

  next();
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
