import Bot from '../lib/bot.js';

import Bluebird from 'bluebird';

describe('Bot', () => {
  it('should have a name', () => {
    const bot = new Bot('bob');
    assert.equal('bob', bot.name);
  });

  it('should test promises', () => {
    return Bluebird.resolve(1).should.eventually.equal(1);
  });
});
