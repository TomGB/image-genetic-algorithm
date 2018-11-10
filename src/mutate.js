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