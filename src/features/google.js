import querystring from 'querystring';

import request from 'request-promise';
import _ from 'lodash';

const searchRequest = query => {
  return request({
    url: 'https://ajax.googleapis.com/ajax/services/search/web?v=1.0',
    json: true,
    format: 'json',
    qs: {q: query},
  });
};

const search = (ctx, query) => {
  if (!query) {
    ctx.send('empty query!');
    return;
  }

  ctx.send('searching google ...');

  const escaped = querystring.escape(query).replace(/%20/g, '+');
  const url = `https://www.google.com/search?q=${escaped}`;

  searchRequest(query)
    .then((response) => {
      const results = response.responseData.results;

      const filtered =
        _.chain(results)
        .filter(r => r.GsearchResultClass == 'GwebSearch')
        .map((result, index) =>
              `${index + 1}. <${result.unescapedUrl}|${result.titleNoFormatting}>`)
        .value();

      let message;

      if (filtered.length < 1) {
        message = "No results";
      } else {
        message = filtered.join("\n");
      }

      const body =
`Google results for *${query}*

${message}

source: ${url}`;

      ctx.postMessage(body);
    });
};

export default {
  search
};
