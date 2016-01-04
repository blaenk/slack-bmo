import _ from 'lodash';

import Message from './message';

export default class MessageContext {
  constructor(message, bot) {
    this.message = new Message(message);
    this.bot = bot;
  }

  // sugar for consistency (not brevity)
  // ctx.handle(handler) → handler(ctx)
  handle(handler) {
    handler(this);
  }

  // send message via RTM
  // ctx.send("some message")
  // ctx.send({message: "some message", props: stuff})
  send(message) {
    if (typeof message == 'string' || message instanceof String) {
      message = {text: message};
    }

    message = Object.assign({
      type: 'message',
      channel: this.message.channel
    }, message);

    this.bot.rtm.send(message);
  }

  // send message via postMessage
  // this allows richer formatting
  postMessage(message, opts, cb) {
    cb = cb || (() => {});
    opts = Object.assign({
      username: this.bot.name,
      as_user: true
    }, opts);

    this.bot.webClient.chat.postMessage(
      this.message.channel,
      message,
      opts,
      cb
    );
  }

  // ctx.pattern(/([\S]+)\.gif/, gif);
  pattern(re, handler) {
    let matches = re.exec(this.message.text);

    if (matches) {
      handler(this, matches);
    }
  }

  patterns(...objs) {
    for (const o of objs) {
      this.pattern(o.pattern, o.handler);
    }
  }

  // ctx.url('en.wikipedia.org', wikipedia.unfurl);
  url(host, handler) {
    if (this.message.links.urls) {
      for (const url of this.message.links.urls) {
        if (url.target.host == host) {
          handler(this, url);
        }
      }
    }
  }

  // registers a url handler for many urls
  // this preserves the order of the urls when handling them,
  // i.e. it runs all handlers that match a given url before
  // moving to the next url, so as to keep related information together
  urls(...objs) {
    if (!this.message.links.urls) {
      return;
    }

    for (const url of this.message.links.urls) {
      for (const o of objs) {
        if (url.target.host == o.host) {
          o.handler(this, url);
        }
      }
    }
  }

  // ctx.command(['g', 'google'], google.search);
  command(prefixes, handler) {
    if (!Array.isArray(prefixes)) {
      prefixes = [prefixes];
    }

    // longest matches first, otherwise the shorter matches
    // will win out every time
    prefixes = prefixes.sort((a, b) => a.length < b.length);

    // construct regex once and capture it in closure
    // ['google', 'g'] becomes /^\.(?:google|g)\s+/
    const escaped = prefixes.map(_.escapeRegExp).join('|');
    const constructed = String.raw`^\.(?:${escaped})\s*`;
    const re = new RegExp(constructed);

    const matches = re.exec(this.message.text);

    if (matches) {
      const body = this.message.text.slice(matches[0].length);
      handler(this, body);
    }
  }

  commands(...objs) {
    for (const o of objs) {
      this.command(o.triggers, o.handler);
    }
  }

  parseAssignment(body, pre, sep) {
    if (pre) {
      pre = String.raw`(?:${pre}\s+)?`;
    } else {
      pre = '';
    }

    const pat = String.raw`(?:"([\S\s]+)"|\/([\S\s]+)\/([gim]*)?)`;
    const re = new RegExp(String.raw`^${pre}${pat}\s+${sep}:`, 'm');

    const matches = re.exec(body);

    if (!matches) {
      return {error: 'invalid input!'};
    }

    let assignment = body.slice(matches[0].length).trim();

    if (!assignment) {
      return {error: 'missing assignment!'};
    }

    let pattern;

    if (matches[1]) {
      // literal string
      pattern = new RegExp('^' + _.escapeRegExp(matches[1]) + '$', 'm');
    } else if (matches[2]) {
      // regex
      pattern = new RegExp(matches[2], matches[3]);
    }

    return {pattern, assignment};
  }
}
