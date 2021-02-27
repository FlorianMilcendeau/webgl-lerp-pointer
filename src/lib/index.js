/* eslint-disable no-alert */
const { mat4 } = require('gl-matrix');

const resizeCanvasToDisplaySize = (canvas) => {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  // Check if the canvas is not the same size.
  const needResize = canvas.width !== width || canvas.height !== height;

  if (needResize) {
    Object.assign(canvas, { width });
    Object.assign(canvas, { height });
  }

  return needResize;
};

const initContext = (canvas) => {
  const context = canvas.getContext('webgl');

  resizeCanvasToDisplaySize(canvas);
  context.viewport(0, 0, canvas.width, canvas.height);
  context.clearColor(1, 1, 1, 1);
  context.clear(canvas.COLOR_BUFFER_BIT || canvas.DEPTH_BUFFER_BIT);

  return context;
};

const getProgramInfo = (gl, shaderProgram) => {
  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        'uProjectionMatrix'
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };
};

const getMouseCoords = (x, y, canvas) => {
  const _X = (x / canvas.clientWidth) * (15 * Math.PI) - (15 * Math.PI) / 2;
  const _Y = -(y / canvas.clientHeight) * (7.5 * Math.PI) + (7.5 * Math.PI) / 2;
  return { x: _X, y: _Y };
};

/**
 * Crée un shader du type fourni, charge le source et le compile.
 */
const loadShader = (gl, type, source) => {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  // Vérifier s'il a ét compilé avec succès
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

const initShaderProgram = (gl, vsSource, fsSource) => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource.text);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource.text);

  // Créer le programme shader
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Si la création du programme shader a échoué, alerte
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Impossible d'initialiser le programme shader : ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
    return null;
  }

  return shaderProgram;
};

const initBuffer = (gl) => {
  // Créer un tampon des positions pour le carré.
  const positionBuffer = gl.createBuffer();

  // Définir le positionBuffer comme étant celui auquel appliquer les opérations
  // de tampon à partir d'ici.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Créer maintenant un tableau des positions pour le cercle.
  let vertices = [];

  for (let i = 0; i <= 360; i += 1) {
    // degrees to radians
    const j = (i * Math.PI) / 180;
    // X Y Z
    const vert1 = [
      Math.sin(j),
      Math.cos(j),
      // 0,
    ];
    const vert2 = [
      0,
      0,
      // 0,
    ];

    vertices = vertices.concat(vert1);
    vertices = vertices.concat(vert2);
  }

  // Passer mainenant la liste des positions à WebGL pour construire la forme.
  // Nous faisons cela en créant un Float32Array à partir du tableau JavaScript,
  // puis en l'utilisant pour remplir le tampon en cours.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  return { position: positionBuffer, vertexCount: vertices.length / 2 };
};

const drawScene = (gl, programInfo, buffers, positions = { x: 0, y: 0 }) => {
  gl.clearColor(1, 1, 1, 1);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  // Effacer le canevas avant que nous ne commencions à dessiner dessus.
  gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);

  // Créer une matrice de perspective, une matrice spéciale qui est utilisée pour
  // simuler la distorsion de la perspective dans une caméra.
  // Notre champ de vision est de 45 degrés, avec un rapport largeur/hauteur qui
  // correspond à la taille d'affichage du canvas ;
  // et nous voulons seulement voir les objets situés entre 0,1 unité et 100 unités
  // à partir de la caméra.
  const fieldOfView = (45 * Math.PI) / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 1;
  const zFar = 1000;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js a toujours comme premier argument la destination
  // où stocker le résultat.
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // Définir la position de dessin comme étant le point "origine", qui est
  // le centre de la scène.
  const modelViewMatrix = mat4.create();

  // Commencer maintenant à déplacer la position de dessin un peu vers là où
  // nous voulons commencer à dessiner le carré.
  mat4.translate(modelViewMatrix, modelViewMatrix, [
    positions.x,
    positions.y,
    -30.0,
  ]);

  // Indiquer à WebGL comment extraire les positions à partir du tampon des
  // positions pour les mettre dans l'attribut vertexPosition.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // Indiquer à WebGL d'utiliser notre programme pour dessiner.
  gl.useProgram(programInfo.program);

  // Définir les uniformes du shader.
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );

  {
    const offset = 0;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, buffers.vertexCount);
  }
};

module.exports = {
  initContext,
  initShaderProgram,
  getProgramInfo,
  initBuffer,
  drawScene,
  resizeCanvasToDisplaySize,
  getMouseCoords,
};
