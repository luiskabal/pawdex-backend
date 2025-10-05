const bcrypt = require('bcrypt');

const password = 'password123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
  } else {
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nCopy this hash to use in Prisma Studio for the password field.');
  }
});