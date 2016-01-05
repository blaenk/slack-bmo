import Bluebird from 'bluebird';

import Bot from '../lib/bot.js';

describe('Bot', () => {
  // chai
  it('should have a name', () => {
    const bot = new Bot('bob');
    assert.equal('bob', bot.name);
  });

  // chai-as-promised
  it('should test promises', () => {
    return Bluebird.resolve(1).should.eventually.equal(1);
  });

  // sinon
  it('should test promise stubs', () => {
    const stub = sinon.stub().returns(Bluebird.resolve('foo'));
    stub().should.eventually.equal('foo');
  });

  it.only('should test that mocks have preprogrammed expectations', () => {
    const api = {method: () => {}};
    const mock = sinon.mock(api);
    mock.expects('method').once().withArgs(42);

    const fn = obj => obj.method(42);

    fn(api);

    mock.verify();
  });

  // sinon-chai
  it('should test callbacks', () => {
    const fn = (name, cb) => cb(`hello ${name}`);
    const spy = sinon.spy();
    fn('bob', spy);
    spy.should.have.been.calledWith('hello bob');
  });
});
