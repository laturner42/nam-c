import seedrandom from 'seedrandom';

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
}