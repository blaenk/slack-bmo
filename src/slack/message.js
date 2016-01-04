import url from 'url';

export default class Message {
  constructor(message) {
    Object.assign(this, message);

    this.links = parseLinks(message.text);
  }

  isChanged() {
    return this.subtype == 'message_changed';
  }

  getChannel(dataStore) {
    return dataStore.getChannelGroupOrDMById(this.channel);
  }

  getUser(dataStore) {
    return dataStore.users[this.user];
  }
}

const toLink = arg => {
  const parts = arg.split('|');

  return {
    target: parts[0],
    label: parts[1]
  };
};

const parseLinks = text => {
  const tagsRE = /<(.*?)>/g;
  let tmp = [];

  let results = {
    channels: [],
    users: [],
    commands: [],
    urls: []
  };

  while ((tmp = tagsRE.exec(text)) != null) {
    const link = toLink(tmp[1]);

    if (link.target.startsWith("#C")) {
      results.channels.push(link);
    } else if (link.target.startsWith("@U")) {
      results.users.push(link);
    } else if (link.target[0] == '!') {
      results.commands.push(link);
    } else {
      link.target = url.parse(link.target, true);

      results.urls.push(link);
    }
  }

  return results;
};
