const drawTriangle = (ctx, triangle) => {
  const {
    p1,
    p2,
    p3,
    colour: { r, g, b, a },
  } = triangle;

  ctx.fillStyle = `rgba(${r.get()}, ${g.get()}, ${b.get()}, ${a.get()})`;

  ctx.beginPath();
  ctx.moveTo(p1.x.get(), p1.y.get());
  ctx.lineTo(p2.x.get(), p2.y.get());
  ctx.lineTo(p3.x.get(), p3.y.get());
  ctx.fill();
}

module.exports = drawTriangle;
