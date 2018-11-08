const drawTriangle = (ctx, triangle) => {
  const {
    p1: [p1x, p1y],
    p2: [p2x, p2y],
    p3: [p3x, p3y],
    colour: [r, g, b, a],
  } = triangle;

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;

  ctx.beginPath();
  ctx.moveTo(p1x, p1y);
  ctx.lineTo(p2x, p2y);
  ctx.lineTo(p3x, p3y);
  ctx.fill();
}

module.exports = drawTriangle;
