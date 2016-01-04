import util from 'util';
import querystring from 'querystring';

import Bluebird from 'bluebird';
import request from 'request-promise';
import _ from 'lodash';

class PageNotFoundError {}
util.inherits(PageNotFoundError, Error);

class NoResultsError {}
util.inherits(NoResultsError, Error);

// search
// https://en.wikipedia.org/w/api.php
//   ?format=json
//   &action=query
//   &list=search
//   &srenablerewrites=1
//   &srprop=size
//   &srsearch=python+programming+language

const searchRequest = query => {
  return request({
    url: 'https://en.wikipedia.org/w/api.php',
    json: true,
    qs: {
      format: 'json',
      action: 'query',
      redirects: true,
      list: 'search',
      srenablerewrites: true,
      srprop: 'size',
      srlimit: 1,
      srsearch: query
    }
  })
    .then(results => {
      if (results.query.search.length < 1) {
        return Bluebird.reject(new NoResultsError());
      }

      return Bluebird.resolve(_.first(results.query.search));
    });
};

// excerpt call
// https://en.wikipedia.org/w/api.php
//   ?format=json
//   &action=query
//   &redirects=1
//   &prop=extracts
//   &exintro=
//   &explaintext=
//   &titles=query

const extractRequest = title => {
  return request({
    url: 'https://en.wikipedia.org/w/api.php',
    qs: {
      format: 'json',
      action: 'query',
      redirects: true,
      prop: 'extracts',
      exintro: true,
      explaintext: true,
      titles: title
    },
    json: true
  })
    .then(extracts => {
      if ('-1' in extracts.query.pages) {
        return Bluebird.reject(new PageNotFoundError(title));
      }

      const resultId = _(extracts.query.pages).keys().first();

      return Bluebird.resolve(extracts.query.pages[resultId]);
    });
};

const formatArticle = article => {
  const splitPoint = article.extract.indexOf("\n");
  let summary;

  if (splitPoint != -1) {
    summary = article.extract.slice(0, splitPoint);
  } else {
    summary = article.extract;
  }

  if (/may refer to:/.test(summary)) {
    summary = "Disambiguation page";
  }

  return {
    fallback: article.title,
    unfurl_links: true,
    unfurl_media: true,
    mrkdwn_in: ["pretext", "text"],
    title: article.title,
    text: summary
  };
};

const search = (ctx, query) => {
  if (!query) {
    ctx.send('empty query!');
    return;
  }

  ctx.send('searching wikipedia ...');

  extractRequest(query)
    .catch(PageNotFoundError, () =>
           searchRequest(query).then(article => extractRequest(article.title)))
    .then(article => {
      const replaced = article.title.replace(/ /g, '_');
      const escaped = querystring.escape(replaced);
      const link = `https://en.wikipedia.org/wiki/${escaped}`;

      const formatted = formatArticle(article);
      formatted.pretext = `Wikipedia result for *${query}*`,
      formatted.title_link = link;

      const opts = {attachments: JSON.stringify([formatted])};

      ctx.postMessage('', opts);
    })
    .catch(NoResultsError, () => {
      ctx.send('no results found');
    });
};

const unfurl = (ctx, url) => {
  if (ctx.message.type != 'message' ||
      ctx.message.subtype == 'message_changed' || !ctx.message.channel) {
    return;
  }

  extractRequest(url.target.path.replace(/^\/wiki\//g, ''))
    .then(article => {
      const formatted = formatArticle(article);
      formatted.title_link = url.target.href;

      const opts = {attachments: JSON.stringify([formatted])};

      ctx.postMessage('', opts);
    });
};

export default {
  search,
  unfurl
};
