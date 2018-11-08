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
