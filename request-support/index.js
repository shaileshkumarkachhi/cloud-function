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

const createSlackMessage = (build) => {
  console.log("prepare message");
  return  {
    "blocks": [{
      "type": "section",
      "text": {"type": "mrkdwn", "text": "*Team Name* - " + build.name}
    }, {
      "type": "section",
      "text": {
        "type": "mrkdwn", "text": "*Email* - " + build.email
      }
    }, {
      "type": "section",
      "text": {"type": "mrkdwn", "text": "*Contact* - " + build.phone}
    }, {
      "type": "section",
      "text": {"type": "mrkdwn", "text": build.message}
    },
    ]
  };
};

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.sendSupportRequest = (req, res) => {
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
    console.log(JSON.stringify(req.body));
    const body = JSON.parse(JSON.stringify(req.body));
    const message = createSlackMessage(body);
    // Send message to Slack.
    sendSlack(message);
    //sendEmail(message);
    res.status(200).send("sent");
  }
};