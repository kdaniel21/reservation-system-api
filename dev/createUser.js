const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/userModel');

dotenv.config({ path: `${__dirname}/../config.env` });

mongoose.connect(process.env.DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createUser = async (userData) => {
  const user = await User.create({
    ...userData,
  });
  console.log('USER: ', user);
  return user;
};

createUser({
  email: 'test@test.com',
  name: 'Test Admin',
  password: 'test1234',
  passwordConfirm: 'test1234',
  role: 'admin',
})
  .then((user) => console.log('Success', user))
  .catch((err) => console.log('Error', err));
