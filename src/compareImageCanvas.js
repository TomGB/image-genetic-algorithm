let imagePixels;

const getCanvasPixels = canvas => {
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

  const pixels = [...Array(Math.ceil(data.length / 4))].map((_, i) => {
    const red = data[i * 4];
    const green = data[i * 4 + 1];
    const blue = data[i * 4 + 2];
    const alpha = data[i * 4 + 3];

    return {
      red, green, blue, alpha
    }
  });

  return pixels;
}

const getImagePixels = image => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, image.width, image.height);

  return getCanvasPixels(canvas, context);
}

const getDifference = (a, b) => {
  return a.reduce((acc, pixel, i) => {
    if (b[i]) {
      const redDiff = pixel.red - b[i].red;
      const greenDiff = pixel.green - b[i].green;
      const blueDiff = pixel.blue - b[i].blue;
      const totalDiff = Math.abs(redDiff) + Math.abs(greenDiff) + Math.abs(blueDiff);
      return acc + totalDiff;
    }
    return Number.MAX_SAFE_INTEGER;
  }, 0);
}

const saveImagePixels = image => {
  imagePixels = getImagePixels(image);
};

const compareImageCanvas = canvas => getDifference(imagePixels, getCanvasPixels(canvas));

module.exports = {
  compareImageCanvas,
  getImagePixels,
  getDifference,
  saveImagePixels,
};
