const bcrypt = require('bcrypt');

async function checkPassword() {
    const plaintextPassword = 'test';  // Replace with the plaintext password
    const hashFromDatabase = '$2b$10$oU/XR.JgxgWqNj6YiMS1vO6AzTCRlF1ia/9gb7ddXgz0y2sI1bhr.';  // Replace with the hash from the database

    const isMatch = await bcrypt.compare(plaintextPassword, hashFromDatabase);
    console.log('Password match:', isMatch);
}

checkPassword();
