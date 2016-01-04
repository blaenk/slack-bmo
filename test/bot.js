import 'babel-polyfill';

import Bot from '../lib/bot.js';
import chai from 'chai';

describe('Bot', () => {
  it('should have a name', () => {
    const bot = new Bot('bob');
    chai.assert.equal('bob', bot.name);
  });
});
