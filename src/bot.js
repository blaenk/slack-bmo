import events from 'events';

import Bluebird from 'bluebird';
const mumble = Bluebird.promisifyAll(require('mumble'));

import express from 'express';
import bodyParser from 'body-parser';

import slack from 'slack-client';

import MessageContext from './slack/message_context';

export default class Bot extends events.EventEmitter {
  constructor(name = "bot") {
    super();
    this.name = name;
  }

  messageContext(fn) {
    return message => {
      fn(new MessageContext(message, this));
    };
  }

  connectToSlack(opts) {
      this.webClient = new slack.WebClient(opts.token);
      this.rtm = new slack.RtmClient(this.webClient, {logLevel: 'debug'});
      this.rtm.start();
      return Bluebird.resolve(this.rtm);
  }

  connectToMumble(opts) {
    return mumble.connectAsync(opts.uri, opts)
      .then(connection => {
        this.mumbleConnection = connection;
        connection.authenticate(this.name);

        connection.on('error', console.error);

        return Bluebird.resolve(connection);
      });
  }

  listenForHooks(opts) {
    this.app = express();

    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.use(bodyParser.json());

    this.app.post('/slash/whisper', (req, res) => {
      if (opts.tokens.whisper != req.body.token) {
        res.sendStatus(403);
        return;
      }

      res.send('whispering');
    });

    this.app.listen(4000, () => {
      console.log('listening for hooks');
    });
  }
}
