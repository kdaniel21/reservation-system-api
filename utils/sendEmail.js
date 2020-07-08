const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');
const htmlToText = require('html-to-text');
const pug = require('pug');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// exports.sendInvitation = (email, name, token) => {
//   const msg = {
//     to: email,
//     from: 'kissd621@gmail.com',
//     subject: 'Invitation to the reservation system',
//     text: `Dear ${name}! Looks like you've been invited to the reservation system. To register please click on the link! The invitation is available only for 24 hours.
//     http://localhost:4200/auth/register/${token}`,
//   };

//   return sgMail.send(msg);
// };

// exports.sendPasswordReset = (email, name, token) => {
//   const msg = {
//     to: email,
//     from: 'kissd621@gmail.com',
//     subject: 'Reset Your Password',
//     text: `Dear ${name}! Looks like you've forgotten your password. Click on this link to create a new one.
//     http://localhost:4200/auth/reset-password/${token}`,
//   };

//   return sgMail.send(msg);
// };

// EMAIL HANDLER
module.exports = class Email {
  constructor(user, url, templateData) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `${process.env.EMAIL_NAME} <${process.env.EMAIL_FROM}>`;
    this.templateData = templateData;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Production email transporter using SendGrid
      return nodemailer.createTransport(
        nodemailerSendgrid({ apiKey: process.env.SENDGRID_API_KEY })
      );
    }

    // Dev email transporter (preferably mailtrap.io)
    return nodemailer.createTransport({
      host: process.env.DEV_EMAIL_HOST,
      port: process.env.DEV_EMAIL_PORT,
      auth: {
        user: process.env.DEV_EMAIL_USER,
        pass: process.env.DEV_EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(template, subject) {
    const html = pug.renderFile(`${__dirname}/email/${template}.pug`, {
      ...this.templateData,
      firstName: this.firstName,
    });

    const text = htmlToText.fromString(html);

    const mailOptions = {
      to: this.to,
      from: this.from,
      subject,
      text,
      html,
    };
    await this.newTransport().sendMail(mailOptions);
  }

  sendInvitationMail() {
    return this.sendEmail('invitation', 'Invitation to the Reservation System');
  }

  sendPasswordResetEmail() {
    return this.sendEmail('password-reset', 'Reset Your Password');
  }

  sendRegistrationConfirmEmail() {
    return this.sendEmail('registration-confirm', 'Welcome Onboard!');
  }
};
