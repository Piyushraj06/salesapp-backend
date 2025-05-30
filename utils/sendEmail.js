const nodemailer = require('nodemailer');

async function sendEmail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'your_email@gmail.com', // use your Gmail
      pass: 'abcd efgh ijkl mnop'   // use 16-character App Password here
    }
  });

  await transporter.sendMail({
    from: '"Support Team" <your_email@gmail.com>',
    to,
    subject,
    html
  });
}

module.exports = sendEmail;
