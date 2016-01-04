BMO facilitates the creation of [slack bots](https://api.slack.com/bot-users).

### Install

``` bash
$ npm install beemo
```

### Example

Create a `Bot` and use it to connect to slack given your bot token. This will return a promise of an `rtm` object which represents the [Real-Time Messaging API](https://api.slack.com/rtm). You can then listen to events emitted by this object, such as `'message'`. See [node-slack-client](https://github.com/l12s/node-slack-client) for more information.

The `messageContext()` handler augments a raw RTM message into a [`MessageContext`](https://github.com/blaenk/bmo/blob/master/src/slack/message_context.js) which contains a reference to the `Bot` as well as an augmented [`Message`](https://github.com/blaenk/bmo/blob/master/src/slack/message.js) which contains additional properties such as parsed links that were contained in the raw message.

The `MessageContext` also contains methods that facilitate the processing of messages, such as registering commands, detecting URLs, and matching on arbitrary patterns. Generic handlers can also be created which simply take a `MessageContext` object.

``` javascript
const Bot = require('bmo').Bot;

const bmo = new Bot("bmo");

bmo.connectToSlack({token: process.env.SLACK_TOKEN})
.then(rtm => {
  rtm.on('message', bmo.messageContext(ctx => {
    // you: .say how are you
    // bot: how are you
    ctx.command('say', (ctx, body) => {
      ctx.send(body);
    });

    // you: https://en.wikipedia.org/wiki/Test
    // bot: someone sent a wikipedia link!
    ctx.url('en.wikipedia.org', (ctx, url) => {
      ctx.send('someone sent a wikipedia link!');
    });

    // you: have you seen smirk.gif before?
    // bot: the gif 'smirk' was matched!
    ctx.pattern(/([\S]+)\.gif/, (ctx, matches) => {
      ctx.send(`the gif '${matches[1]}' was matched!`);
    });
  }));
});
```
