import 'babel-polyfill';

import Bot from '../lib/bot.js';
import assert from 'assert';

describe('Bot', () => {
  it('should have a name', () => {
    const bot = new Bot('bob');
    assert.equal('bob', bot.name);
  });
});
