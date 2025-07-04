const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'admin'], required: true },
  name: { type: String }, 
  company: { type: String }
});

module.exports = mongoose.model('User', userSchema);