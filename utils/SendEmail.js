const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: ENV_VARS.EMAIL_USER,
      pass: ENV_VARS.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: ENV_VARS.EMAIL_USER,
    to: options.to || "maulik.paghadal3301@gmail.com",
    subject: options.subject,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
