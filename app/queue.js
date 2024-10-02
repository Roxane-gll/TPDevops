// Imports the Google Cloud client library
import { PubSub } from '@google-cloud/pubsub';
import * as fs from 'fs'

async function startQueue(tags = "", tagmode="all") {
  let data;
  fs.readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, function read(
    err,
    data
  ) {
    if (err) {
      throw err;
    }
    data = data;
  });

  const pubsub = new PubSub({ data });
  const topic = await pubsub.topic("dmii2-2");

  // Creates a subscription on that new topic
  const subscription = await topic.subscription("dmii2-2");

  // Receive callbacks for errors on the subscription
  subscription.on('error', (error) => {
    console.error('Received error:', error);
    process.exit(1);
  });

  // Send a message to the topic
  topic.publishMessage({ data: Buffer.from(tags) });
}

export { startQueue };
