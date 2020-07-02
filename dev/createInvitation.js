const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Invitation = require('../models/invitationModel');

dotenv.config({ path: `${__dirname}/../config.env` });

mongoose.connect(process.env.DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createInvitation = async (invitationData) => {
  const invitation = await Invitation.create({
    ...invitationData,
  });
  return invitation;
};

createInvitation({})
  .then((user) => console.log('Success', user))
  .catch((err) => console.log('Error', err));
