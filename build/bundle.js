(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const {
  compareImageCanvas,
  getImagePixels,
  getDifference,
  saveImagePixels,
} = require('./compareImageCanvas');
const loadImage = require('./loadImage');
const drawGenomeInBrowser = require('./drawGenomeInBrowser');
const drawTriangle = require('./drawTriangle');

const width = 875;
const height = 350;

const populationSize = 30;
const numTriangles = 50;
const mutationPercentage = 0.04;
const cullPercentage = 0.8;
const newBloodPercentage = 0;

const enableMouse = canvas => {
  document.addEventListener('mousemove', ({ pageX: x, pageY: y }) => {
    const imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width,canvas.height);
  
    var i = (y * imgData.width + x)*4, d = imgData.data;
    console.log([d[i],d[i+1],d[i+2],d[i+3]]);
  })
}

const newRandomPoint = () => [Math.floor(Math.random() * width), Math.floor(Math.random() * height)];
const newRandomRGB = () => [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.random()];

const newTriangle = () => ({
  p1: newRandomPoint(),
  p2: newRandomPoint(),
  p3: newRandomPoint(),
  colour: newRandomRGB(),
});

const newGenome = () => [...Array(numTriangles)].map(newTriangle);

const generations = [[...Array(populationSize)].map(newGenome)];

const createExperiment = image => generation => generation.map(genome => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  genome.forEach(triangle => {
    drawTriangle(ctx, triangle)
  });

  const fitness = compareImageCanvas(canvas);

  return { genome, fitness };
});

const mate = (a, b) => a.map((gene, index) => Math.random() < 0.5 ? gene : b[index]);

const breed = (survivers, quantity) => {
  const babies = [];

  while (babies.length < quantity) {
    const ai = Math.floor(Math.random() * survivers.length);
    const bit = Math.floor(Math.random() * (survivers.length - 1));
    const bi = Math.floor(bit < ai ? bit : bit + 1);
    const a = survivers[ai];
    const b = survivers[bi];

    babies.push(mate(a, b));
  }

  return babies;
}

const mutate = (genome, index) => {
  if (index === 0) return genome;

  const numMutations = genome.length * mutationPercentage;

  [...Array(numMutations)].forEach(() => {
    const geneToMutate = Math.floor(Math.random() * genome.length);
    genome.splice(geneToMutate, 1)
    genome.push(newTriangle());
  })
  return genome;
};

const generateNewPopulation = oldGen => {
  const cullNumber = Math.floor(populationSize * cullPercentage);
  const survivers = oldGen.slice(0, - cullNumber).map(({ genome }) => genome);
  const numNewBlood = Math.floor(cullNumber * newBloodPercentage);
  const newPopulation = survivers.concat(breed(survivers, cullNumber - numNewBlood)).concat([...Array(numNewBlood)].map(newGenome));
  const mutatedPopulation = newPopulation.map(mutate);
  return mutatedPopulation;
};

const runGeneration = async (generation, image, index) => {
  console.log('in gen', index);
  const runExperiment = createExperiment(image);
  const outcome = runExperiment(generation);
  const populationByFitness = outcome.sort(({ fitness: a }, { fitness: b }) => a - b);
  console.log(populationByFitness.map(({ fitness }) => fitness));
  generations.push(generateNewPopulation(populationByFitness));
  return populationByFitness[0];
}

const start = async () => {
  const image = await loadImage('./beach.jpeg');
  const image2 = await loadImage('./beach2.jpg');

  let previousBest = 0;
  saveImagePixels(image);
  console.log(getDifference(getImagePixels(image), getImagePixels(image2)));
  let genNum = 0;

  while (true) {
    const newBest = await runGeneration(generations[genNum], image, genNum++);
    if (newBest.fitness !== previousBest) {
      await drawGenomeInBrowser(newBest.genome, image);
      previousBest = newBest.fitness;
    } else {
      await new Promise(resolve => setTimeout(resolve, 2));
    }
  };
};

start();

},{"./compareImageCanvas":2,"./drawGenomeInBrowser":3,"./drawTriangle":4,"./loadImage":5}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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
},{"./drawTriangle":4}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
const onLoad = image => new Promise(resolve => {
  image.addEventListener('load', () => resolve(image));
});

const loadImage = async url => {
  const image = new Image();
  image.src = url;
  return onLoad(image);
}

module.exports = loadImage;
},{}]},{},[1]);
