import { PubSub } from '@google-cloud/pubsub';
import { Storage } from '@google-cloud/storage';
import * as photoModel from './photo_model.js';
import ZipStream from 'zip-stream';
import request from 'request';
import moment from 'moment';

const pubSubClient = new PubSub();

function listenForMessages(subscriptionNameOrId = 'dmii2-2') {
  // References an existing subscription; if you are unsure if the
  // subscription will exist, try the optimisticSubscribe sample.
  const subscription = pubSubClient.subscription(subscriptionNameOrId);

  // Create an event handler to handle messages
  let messageCount = 0;
  const messageHandler = message => {
    console.log(message.data.toString());
    messageCount += 1;

    uploadFile(message.data.toString());

    // "Ack" (acknowledge receipt of) the message
    message.ack();
  };

  // Listen for new messages until timeout is hit
  subscription.on('message', messageHandler);
}

export { listenForMessages, getFile };

let storage = new Storage();

async function uploadFile(tags, tagmode = 'all') {
  const file = await storage
    .bucket('dmii2024bucket')
    .file('roxane-files.zip');

  var zip = new ZipStream();

  const stream = file.createWriteStream({
    metadata: {
      contentType: "application/zip",
      cacheControl: 'private'
    },
    resumable: false
  });

  zip.pipe(stream);

  let queue = await photoModel
    .getFlickr10FirstPhotos(tags, tagmode)
    .then(photos => {
      return photos;
    });

  function addNextFile() {
    var photo = queue.shift();
    var photoURL = request(photo?.media?.b);
    zip.entry(photoURL, { name: photo.title+".jpg" }, err => {
      if (err) throw err;
      if (queue.length > 0) addNextFile();
      else {
        zip.finalize();
        return new Promise((resolve, reject) => {
          stream.on('error', err => {
            reject(err);
          });
          stream.on('finish', () => {
            console.log('Finish');
            resolve('Ok');
          });
          stream.end(zip.buffer);
        });
      }
    });
  }

  addNextFile();
}

async function getFile() {
  const options = {
    action: 'read',
    expires: moment().add(2, 'days').unix() * 1000
    };
    const signedUrls = await storage
    .bucket(process.env.STORAGE_BUCKET)
    .file('roxane-files.zip')
    .getSignedUrl(options);
  
  return signedUrls
}
