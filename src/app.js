import 'babel-polyfill';
import 'source-map-support/register';

import dotenv from 'dotenv';

dotenv.load();

import process from 'process';
import fs from 'fs';

import Bot from './bot';

import wikipedia from './features/wikipedia';
import hn from './features/hacker_news';
import google from './features/google';
import soundboard from './features/soundboard';
import mumble from './features/mumble';
import alias from './features/alias';
import respond from './features/respond';
import say from './features/say';

const bmo = new Bot("bmo");

bmo.connectToSlack({token: process.env.SLACK_TOKEN})
.then(rtm => {
  const gif =
    ({bot, message}, matches) =>
      console.log(`matched gif: "${matches[1]}"`);

  rtm.on('message', bmo.messageContext(ctx => {
    ctx.command('unalias', alias.unregister);
    ctx.command('unrespond', respond.unregister);

    ctx.handle(alias.rewrite);
    ctx.handle(respond.respond);

    ctx.patterns(
      {pattern: /([\S]+)\.gif/, handler: gif}
    );

    ctx.urls(
      {host: 'en.wikipedia.org',     handler: wikipedia.unfurl},
      {host: 'news.ycombinator.com', handler: hn.unfurl}
    );

    ctx.commands(
      {triggers: 'alias',         handler: alias.register},
      {triggers: 'respond',       handler: respond.register},
      {triggers: 'say',           handler: say.command},
      {triggers: ['g', 'google'], handler: google.search},
      {triggers: ['w', 'wiki'],   handler: wikipedia.search},
      {triggers: 'play',          handler: soundboard.play}
    );

    ctx.handle(mumble.echo);
  }));
});

bmo.connectToMumble({
  uri: process.env.MUMBLE_URI,
  key: fs.readFileSync(process.env.MUMBLE_KEY),
  cert: fs.readFileSync(process.env.MUMBLE_CERT)
})
.then(conn => {
  conn.on('user-connect', user => console.dir(user));
  conn.on('user-disconnect', user => console.dir(user));

  conn.on('message', (message, actor, scope) =>
          console.dir({message, actor, scope}));

  conn.on('voice-start', (user) => console.dir(user));
  conn.on('voice-end', (user) => {
    console.dir(user);
  });
});

// bmo.listenForHooks({
//   tokens: {
//     whisper: process.env.SLACK_SLASH_WHISPER
//   }
// });
