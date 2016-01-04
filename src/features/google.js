import querystring from 'querystring';

import Bluebird from 'bluebird';
import _ from 'lodash';

import google from 'google';

const googleAsync = Bluebird.promisify(google, {multiArgs: true});

const search = (ctx, query) => {
  if (!query) {
    ctx.send('empty query!');
    return;
  }

  ctx.send('searching google ...');

  const escaped = querystring.escape(query).replace(/%20/g, '+');
  const url = `https://www.google.com/search?q=${escaped}`;

  googleAsync(query)
    .spread((next, links) => {
      const results =
        _.chain(links)
        .filter(l => l.link && l.title)
        .uniq(false, link => link.link)
        .map((result, index) =>
              `${index + 1}. <${result.link}|${result.title}>`)
        .take(3)
        .value();

      let response;

      if (results.length < 1) {
        response = "No results";
      } else {
        response = results.join("\n");
      }

      const body =
`Google results for *${query}*

${response}

source: ${url}`;

      ctx.postMessage(body);
    });
};

export default {
  search
};
