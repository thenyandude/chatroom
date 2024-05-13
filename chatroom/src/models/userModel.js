const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  profilePicture: { type: String, default: "test1.png" },
  usernameColor: { type: String, default: "#000000" },
  pronouns: { type: String, default: "" },
  description: { type: String, default: "" }
});

userSchema.pre('save', async function(next) {
  try {
    if (this.isModified('password') || this.isNew) {
      const hashedPassword = await bcrypt.hash(this.password, 10);
      this.password = hashedPassword;
      console.log(`Password hashed for user '${this.username}': ${hashedPassword}`);
    }
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
