const { createCanvas } = require('canvas');

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

const width = 640;
const height = 429;

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

// const enableMouse = canvas => {
//   document.addEventListener('mousemove', ({ pageX: x, pageY: y }) => {
//     const imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width,canvas.height);
  
//     var i = (y * imgData.width + x)*4, d = imgData.data;
//     console.log([d[i],d[i+1],d[i+2],d[i+3]]);
//   })
// };

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
  const p2 = _p2 || point();
  const p3 = _p3 || point();
  const colour = _colour || rgb();

  const { r, g, b, a } = colour;

  const attributesMap = [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, r, g, b, a];

  const mutate = () => {
    attributesMap.filter(() => Math.floor(Math.random()*2))
      .forEach(attribute => attribute.mutate());
  }

  const clone = () => newTriangle(p1.clone(), p2.clone(), p3.clone(), colour.clone())

  return { p1, p2, p3, colour, mutate, clone };
};

const newGenome = () => [...Array(numTriangles)].map(() => newTriangle());

let population = [...Array(populationSize)].map(newGenome);

const createExperiment = image => generation => generation.map(genome => {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

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
  const image = await loadImage('./darth-maul.jpeg');
  const image2 = await loadImage('./beach2.jpg');

  let previousBest = 0;
  saveImagePixels(image);
  console.log(getDifference(getImagePixels(image), getImagePixels(image2)));
  let genNum = 0;

  const startTimer = () => {
    const startTime = new Date();

    const endTimer = () => {
      const endTime = new Date();
      const timeDiff = endTime - startTime;
      console.log('time', timeDiff);
    }

    return endTimer;
  };

  while (true) {
    const endTimer = startTimer();
    const newBest = await runGeneration(population, image, genNum++);
    if (newBest.fitness !== previousBest) {
      endTimer();
      // await drawGenomeInBrowser(newBest.genome, image);
      previousBest = newBest.fitness;
    } else {
      await new Promise(resolve => setTimeout(resolve, 2));
    }
  };
};

start();
