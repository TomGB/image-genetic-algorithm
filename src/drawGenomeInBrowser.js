const drawTriangle = require('./drawTriangle');

const drawGenomeInBrowser = async (genome, image) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  genome.forEach(triangle => {
    drawTriangle(ctx, triangle)
  });

  document.body.insertBefore(canvas, document.body.firstChild);

  return new Promise(resolve => setTimeout(resolve, 2));
}

module.exports = drawGenomeInBrowser;