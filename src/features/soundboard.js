import fs from 'fs';

import lame from 'lame';

const play = (bot, message) => {
  if (!message.text.includes("bmo shutdown")) {
    return;
  }

  const decoder = new lame.Decoder();
  const file = fs.createReadStream('who-wants-to-play.mp3');

  let stream;

  decoder.on('format', format => {
    stream.pipe(bot.mumbleConnection.inputStream({
      channels: format.channels,
      sampleRate: format.sampleRate
    }));
  });

  stream = file.pipe(decoder);
};

export default {
  play
};
