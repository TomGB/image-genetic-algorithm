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
const setupMutate = require('./mutate');

const width = 875;
const height = 350;

const {
  mutateX,
  mutateY,
  mutateColour,
  mutateAlpha,
} = setupMutate(width, height);

const populationSize = 30;
const numTriangles = 50;
const mutationPercentage = 0.1;
const cullPercentage = 0.8;
const newBloodPercentage = 0;

const enableMouse = canvas => {
  document.addEventListener('mousemove', ({ pageX: x, pageY: y }) => {
    const imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width,canvas.height);
  
    var i = (y * imgData.width + x)*4, d = imgData.data;
    console.log([d[i],d[i+1],d[i+2],d[i+3]]);
  })
};

const v = (init, mutateFunction) => {
  let value = init;

  return {
    set: _new => value = _new,
    get: () => value,
    clone: () => v(value, mutateFunction),
    mutate: () => value = mutateFunction(value),
  }
}

const point = (_x, _y) => {
  const x = _x || v(Math.floor(Math.random() * width), mutateX);
  const y = _y || v(Math.floor(Math.random() * height), mutateY);
  const clone = () => point(x.clone(), y.clone());

  return { x, y, clone };
};

const closePoint = ({ x, y }) => {
  const newX = mutateX(x);
  const newY = mutateY(y);
  return point(newX, newY);
}

const rgb = (_r, _g, _b, _a) => {
  const r = _r || v(Math.floor(Math.random() * 255), mutateColour);
  const g = _g || v(Math.floor(Math.random() * 255), mutateColour);
  const b = _b || v(Math.floor(Math.random() * 255), mutateColour);
  const a = _a || v(Math.random(), mutateAlpha);
  const clone = () => rgb(r.clone(), g.clone(), b.clone(), a.clone());

  return { r, g, b, a, clone };
};

const newTriangle = (_p1, _p2, _p3, _colour) => {
  const p1 = _p1 || point();
  const p2 = _p2 || closePoint(p1);
  const p3 = _p3 || closePoint(p2);
  const colour = _colour || rgb();

  const { r, g, b, a } = colour;

  const attributesMap = [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, r, g, b, a];

  const mutate = () => {
    const thingToMutate = Math.floor(Math.random() * 10);
    attributesMap[thingToMutate].mutate();
  }

  const clone = () => newTriangle(p1.clone(), p2.clone(), p3.clone(), colour.clone())

  return { p1, p2, p3, colour, mutate, clone };
};

const newGenome = () => [...Array(numTriangles)].map(() => newTriangle());

let population = [...Array(populationSize)].map(newGenome);

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

const mate = (a, b) => a.map((gene, index) => Math.random() < 0.5 ? gene.clone() : b[index].clone());

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

    const [triangle] = genome.splice(geneToMutate, 1);
    const newTriangle = triangle.clone();
    newTriangle.mutate();
    genome.push(newTriangle);
  });

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

const runGeneration = async (aPopulation, image, index) => {
  console.log('in gen', index);
  const runExperiment = createExperiment(image);
  const outcome = runExperiment(aPopulation);
  const populationByFitness = outcome.sort(({ fitness: a }, { fitness: b }) => a - b);
  console.log(populationByFitness.map(({ fitness }) => fitness));
  population = generateNewPopulation(populationByFitness);
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
    const newBest = await runGeneration(population, image, genNum++);
    if (newBest.fitness !== previousBest) {
      await drawGenomeInBrowser(newBest.genome, image);
      previousBest = newBest.fitness;
    } else {
      await new Promise(resolve => setTimeout(resolve, 2));
    }
  };
};

start();

},{"./compareImageCanvas":2,"./drawGenomeInBrowser":3,"./drawTriangle":4,"./loadImage":5,"./mutate":6}],2:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
const weightedRandom = (x = Math.random()) => {
  const A = 2;
  const B = 0;
  const C = 0;
  const W = -0.5;

  const y = Math.pow((A * (x + W)), 3) + B * (x + W) + C;

  return y;
}

const constrain = (value, min, max) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

const setup = (width, height) => {
  const mutateX = current => {
    const mutated = Math.floor(current + (weightedRandom() * width / 2));
    return constrain(mutated, 0, width);
  }
  
  const mutateY = current => {
    const mutated = Math.floor(current + (weightedRandom() * height / 2));
    return constrain(mutated, 0, height);
  }
  
  const mutateColour = current => {
    const mutated = Math.floor(current + (weightedRandom() * 255 / 2));
    return constrain(mutated, 0, 255);
  }
  
  const mutateAlpha = current => {
    const mutated = current + (weightedRandom() * 0.5);
    return constrain(mutated, 0, 1);
  }

  return {
    mutateX,
    mutateY,
    mutateColour,
    mutateAlpha,
  }
}

// const test = async () => {
//   const testMutate = setup(100,100).mutateAlpha;

//   let testVar = 50;
//   while (true) {
//     testVar = testMutate(testVar)
//     console.log(testVar);
//     await new Promise(resolve => setTimeout(resolve, 100));
//     // console.log(weightedRandom() * 50)
//   }
// }

// test();

module.exports = setup;
},{}]},{},[1]);
