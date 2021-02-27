const {
  initContext,
  initShaderProgram,
  initBuffer,
  getProgramInfo,
  drawScene,
  getMouseCoords,
} = require('./lib');
const lerp = require('./lib/utils');

const canvas = document.getElementById('glCanvas');
// Programme shader de sommet.
const shaderVertex = document.getElementById('vertex-shader-3d');
// Programme shader de couleur.
const shaderFragment = document.getElementById('fragment-shader-3d');

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.style.width = `${window.innerWidth * devicePixelRatio}px`;
canvas.style.height = `${window.innerHeight * devicePixelRatio}px`;

// Coordinates x and y mouse for lerp effect.
let xStart = 0;
let yStart = 0;
let xEnd = 0;
let yEnd = 0;

const main = () => {
  // Programme shader de couleur
  const context = initContext(canvas);
  const shaderProgram = initShaderProgram(
    context,
    shaderVertex,
    shaderFragment
  );
  const programInfo = getProgramInfo(context, shaderProgram);
  const buffers = initBuffer(context);

  const render = () => {
    const lerpX = lerp(xStart, xEnd, 0.1);
    const lerpY = lerp(yStart, yEnd, 0.1);
    const positions = getMouseCoords(lerpX, lerpY, canvas);

    drawScene(context, programInfo, buffers, positions);
    xStart = lerpX;
    yStart = lerpY;

    requestAnimationFrame(render);
  };

  render();
};

const onResize = () => {
  canvas.style.width = `${window.innerWidth * devicePixelRatio}px`;
  canvas.style.height = `${window.innerHeight * devicePixelRatio}px`;

  main();
};

window.addEventListener('mousemove', (e) => {
  e.preventDefault();
  const { clientX, clientY } = e;

  xEnd = clientX;
  yEnd = clientY;
});

window.addEventListener('resize', onResize, false);
main();
