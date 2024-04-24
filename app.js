const express = require('express');
const {google} = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Generate an authentication URL
app.get('/send-email', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send']
  });
  res.redirect(url);
});

// Callback service parsing the authorization token and asking for the access token
app.get('/oauth2callback', async (req, res) => {
  const {tokens} = await oauth2Client.getToken(req.query.code);
  oauth2Client.setCredentials(tokens);
  sendEmail(oauth2Client);
  res.send('Email sent!');
});

// Send email
async function sendEmail(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const emailLines = [
    'Content-Type: text/plain; charset="UTF-8"\n',
    'MIME-Version: 1.0\n',
    'Content-Transfer-Encoding: 7bit\n',
    'to: recipient@example.com\n',
    'from: "sender@example.com"\n',
    'subject: Test Email\n\n',
    'This is a test email sent via Gmail API.'
  ];

  const email = emailLines.join('');
  const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
    },
  });

  console.log(response.data);
}

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
