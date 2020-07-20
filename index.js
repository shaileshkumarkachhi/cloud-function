// const nodemailer = require('nodemailer');
const IncomingWebhook = require('@slack/webhook').IncomingWebhook;
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

const webhookSecretName = process.env.SLACK_WEBHOOK_NAME;
// let transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.PASSWORD
//   }
// });
// async function sendEmail(data) {
//   console.log("Send email");
//   const mailOptions = {
//     from: process.env.EMAIL, // Something like: Jane Doe <janedoe@gmail.com>
//     to: "shailesh.patel91@gmail.com",
//     bcc: "chikoo.ankit@gmail.com",
//     subject: 'I\'M A PICKLE!!!', // email subject
//     html: `<p style="font-size: 16px;">Pickle Riiiiiiiiiiiiiiiick!!</p>
//                 <br />
//             ` // email content in HTML
//   };
//
//   // returning result
//   return transporter.sendMail(mailOptions, (erro, info) => {
//     if (erro) {
//       console.log(err);
//       return "Failed";
//     }
//     console.log("Sent email");
//     return "Sent";
//   });
// }

// Fetch slack webhook url from secret and send the message
async function sendSlack(message) {
  console.log("Send slack message");
  console.log(JSON.stringify(message));
  const [version] = await client.accessSecretVersion({
    name: webhookSecretName,
  });

  // Extract the payload as a string.
  const slackWebhookUrl = version.payload.data.toString('utf8');
  console.log(slackWebhookUrl);
  const webhook = new IncomingWebhook(slackWebhookUrl);
  webhook.send(message);
}

// eventToBuild transforms pubsub event message to a build object.
const eventToBuild = (data) => {
  return JSON.parse(Buffer.from(data, 'base64').toString());
};

const createSlackMessage = (data) => {

  console.log("prepare message");
  const blocks = [];
  blocks.push({
    "type": "section",
    "text": {"type": "mrkdwn", "text": "*Team Name* - " + data.teamName}
  });
  blocks.push({
    "type": "section",
    "text": {"type": "mrkdwn", "text": "*Captain Name* - " + data.captainName}
  });
  blocks.push({
    "type": "section",
    "text": {"type": "mrkdwn", "text": "*Email* - " + data.email}
  });
  blocks.push({
    "type": "section",
    "text": {"type": "mrkdwn", "text": "*Contact* - " + data.number}
  });
  for (let i = 0; i < data.players.length; i++) {
    const player = {
      "type": "section",
      "text": {"type": "mrkdwn",
        "text": "*Player:* - " + data.players[i].name + " Jersey no :"
            + data.players[i].jersey
      }
    };
    blocks.push(player);
  }
  return {
    "blocks": blocks
  };
};

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.sendRegistrationRequest = (req, res) => {
  // Set CORS headers for preflight requests
  // Allows GETs from any origin with the Content-Type header
  // and caches preflight response for 3600s

  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
  } else {
    let receivedData = JSON.stringify(req.body);
    console.log(receivedData);
    const body = JSON.parse(receivedData);
    const message = createSlackMessage(body);
    // Send message to Slack.
    sendSlack(message);
    //sendEmail(message);
    res.status(200).send("sent");
  }
};