import fs from 'fs';
import path from 'path';

import lame from 'lame';

const play = (ctx, body) => {
  const mp3 = path.join('sounds', body + '.mp3');

  if (!fs.statSync(mp3)) {
    ctx.send('no such file!');
    return;
  }

  const decoder = new lame.Decoder();
  const file = fs.createReadStream(mp3);

  let stream;

  decoder.on('format', format => {
    stream.pipe(ctx.bot.mumbleConnection.inputStream({
      channels: format.channels,
      sampleRate: format.sampleRate
    }));
  });

  stream = file.pipe(decoder);
};

export default {
  play
};
