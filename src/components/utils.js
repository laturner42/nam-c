import seedrandom from 'seedrandom';

const getContent = (message, oneLiner) => {
  if (!message) return null;
  let output; 
  if (
    !message.content
    || !message.content['m.relates_to']
    || !message.content['m.relates_to']['m.in_reply_to']
    || !message.content.body.startsWith('>')) {
    output = (message.content.body || '').trim();
  } else {
    const allLines = message.content.body.split('\n');
    let index = 0;
    while (allLines[index].startsWith('>')) {
      index += 1;
    }
    output = allLines.slice(index + 1).join('\n');
  }
  const maxLength = 30;
  if (oneLiner && (output.length > maxLength || output.indexOf('\n') >= 0)) {
    return output.split('\n')[0].substr(0, maxLength) + '...';
  } else {
    return output;
  }
};

// Crude random color generator 
const getRandomColor = (seed, minBrightness = 0, maxBrightness = 255) => {
  const rng = seedrandom(seed);
  const rgb = [Math.floor(rng() * 256), Math.floor(rng() * 256), Math.floor(rng() * 256)];
  while ((rgb[0] + rgb[1] + rgb[2]) / 3 < minBrightness) {
    rgb[0] = Math.min(Math.floor(rgb[0] * 1.1), 255);
    rgb[1] = Math.min(Math.floor(rgb[1] * 1.1), 255)
    rgb[2] = Math.min(Math.floor(rgb[2] * 1.1), 255)
  }
  while ((rgb[0] + rgb[1] + rgb[2]) / 3 > maxBrightness) {
    rgb[0] = Math.min(Math.floor(rgb[0] * 0.9), 255);
    rgb[1] = Math.min(Math.floor(rgb[1] * 0.9), 255)
    rgb[2] = Math.min(Math.floor(rgb[2] * 0.9), 255)
  }
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

module.exports = {
  getRandomColor,
  getContent,
}