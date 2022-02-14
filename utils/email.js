const nodemailer = require('nodemailer');
const catchAsync = require('./catchAsync');

const sendEmail = catchAsync(async (options) => {
  // Create a transporter..
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOption = {
    from: 'OmPrakash Sirvi <omprakashsirvi0211@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  await transporter.sendMail(mailOption);
  // Define email options
  // Actually send the email
});

module.exports = sendEmail;
