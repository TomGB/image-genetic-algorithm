const onLoad = image => new Promise(resolve => {
  image.addEventListener('load', () => resolve(image));
});

const loadImage = async url => {
  const image = new Image();
  image.src = url;
  return onLoad(image);
}

module.exports = loadImage;