const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendInvitation = (email, name, token) => {
  const msg = {
    to: email,
    from: 'kissd621@gmail.com',
    subject: 'Invitation to the reservation system',
    text: `Dear ${name}! Looks like you've been invited to the reservation system. To register please click on the link! The invitation is available only for 24 hours.
    http://localhost:4200/auth/register/${token}`,
  };

  return sgMail.send(msg);
};

exports.sendPasswordReset = (email, name, token) => {
  const msg = {
    to: email,
    from: 'kissd621@gmail.com',
    subject: 'Reset Your Password',
    text: `Dear ${name}! Looks like you've forgotten your password. Click on this link to create a new one.
    http://localhost:4200/auth/reset-password/${token}`,
  };

  return sgMail.send(msg);
};
