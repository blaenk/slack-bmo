import util from 'util';

import Bluebird from 'bluebird';

import request from 'request-promise';
import moment from 'moment';
import htmlparser from 'htmlparser2';

class InvalidItemError {}
util.inherits(InvalidItemError, Error);

const hnItemUrl = id => `https://news.ycombinator.com/item?id=${id}`;
const hnUserUrl = name => `https://news.ycombinator.com/user?id=${name}`;

const getItem = id => request({
  url: `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
  json: true
});

const formatStory = post => {
  const date = `${moment.unix(post.time).fromNow()}`;
  const author = `<${hnUserUrl(post.by)}|${post.by}>`;

  return Bluebird.resolve({
    fallback: post.title,
    unfurl_links: true,
    unfurl_media: true,
    mrkdwn_in: ["pretext", "text"],
    title: post.title,
    title_link: hnItemUrl(post.id),
    text:
`*${post.score}* points. *${post.descendants}* comments. posted by ${author} ${date}
${post.url}`
  });
};

const findRootOf = id => {
  if (id == null) {
    return Bluebird.reject({message: "couldn't find root"});
  }

  return getItem(id).then(item => {
    switch (item.type) {
    case 'story':
      return Bluebird.resolve(item);
    case 'comment':
      return findRootOf(item.parent);
    default:
      return Bluebird.reject({message: "root isn't a story", root: item});
    }
  });
};

const formatComment = comment => {
  return Bluebird.join(toPlain(comment.text), findRootOf(comment.parent),
  (text, root) => {
    const date = `<${hnItemUrl(comment.id)}|${moment.unix(comment.time).fromNow()}>`;
    const title = `<https://news.ycombinator.com/item?id=${root.id}|${root.title}>`;

    return {
      fallback: text,
      unfurl_links: true,
      unfurl_media: true,
      mrkdwn_in: ["pretext", "text"],
      author_name: comment.by,
      author_link: hnUserUrl(comment.by),
      author_icon: 'https://news.ycombinator.com/y18.gif',
      text: `_posted ${date} on ${title}_\n\n${text}`
    };
  });
};

const unfurl = (ctx, url) => {
  if (ctx.message.type != 'message' ||
      ctx.message.subtype == 'message_changed' || !ctx.message.channel) {
    return;
  }

  const id = url.target.query.id;

  getItem(id)
    .then(item => {
      switch (item.type) {
      case 'story': return formatStory(item);
      case 'comment': return formatComment(item);
      default: return Bluebird.reject(new InvalidItemError(id));
      }
    })
    .then(formatted => {
      const load = {attachments: JSON.stringify([formatted])};

      ctx.postMessage('', load);
    })
    .catch(e => console.error(e));
};

class Visitor {
  constructor() {
    this.text = [];
  }

  collectText(html) {
    this.text = [];
    this.visitNodes(html);
    return this.text.join("");
  }

  visitNode(node) {
    if (node == null) {
      return;
    }

    switch (node.type) {
    case 'text':
      this.visitText(node);
      break;
    case 'tag':
      this.visitTag(node);
      break;
    }
  }

  visitText(node) {
    this.text.push(node.data);
  }

  visitTag(node) {
    switch (node.name) {
    case 'a':
      this.visitLink(node);
      break;
    case 'p':
      this.visitParagraph(node);
      break;
    case 'code':
      this.visitCode(node);
      break;
    case 'i':
      this.visitItalic(node);
      break;
    default:
      this.visitChildren(node);
    }
  }

  visitNodes(nodes) {
    for (const node of nodes) {
      this.visitNode(node);
    }
  }

  visitChildren(node) {
    if (node.children) {
      this.visitNodes(node.children);
    }
  }

  visitLink(node) {
    this.text.push(node.attribs.href);
  }

  visitParagraph(node) {
    this.text.push("\n\n");
    this.visitChildren(node);
  }

  visitCode(node) {
    this.text.push("```\n");
    this.visitChildren(node);
    this.text.push("```\n");
  }

  visitItalic(node) {
    this.text.push('_');
    this.visitChildren(node);
    this.text.push('_');
  }
}

const toPlain = html => {
  return new Bluebird((resolve, reject) => {
    const visitor = new Visitor();

    const handler = new htmlparser.DomHandler((error, dom) => {
      if (error) {
        reject(error);
      } else {
        resolve(visitor.collectText(dom));
      }
    });

    const parser = new htmlparser.Parser(handler, {decodeEntities: true});

    parser.write(html);
    parser.end();
  });
};

export default {
  unfurl
};
