import Bot from './bot';

import Message from './slack/message';
import MessageContext from './slack/message_context';

import wikipedia from './features/wikipedia';
import hn from './features/hacker_news';
import google from './features/google';
import soundboard from './features/soundboard';
import mumble from './features/mumble';
import alias from './features/alias';
import respond from './features/respond';
import say from './features/say';

module.exports = {
  Bot,
  slack: {
    Message,
    MessageContext
  },
  features: {
    wikipedia,
    hn,
    google,
    soundboard,
    mumble,
    alias,
    respond,
    say
  }
};
