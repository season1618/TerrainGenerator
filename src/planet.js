import { Perlin3d } from './perlin.js';

const canvas = document.querySelector('canvas');
canvas.width = 500;
canvas.height = 500;
const gl = canvas.getContext('webgl');

const vsSource = `
attribute vec4 aPosition;
attribute vec4 aColor;

uniform mat4 uRotateMatrix;

varying lowp vec4 vColor;

void main(){
    gl_Position = uRotateMatrix * aPosition;
    vColor = aColor;
}
`;

const fsSource = `
varying lowp vec4 vColor;

void main(void){
	gl_FragColor = vColor;
}
`;

// setup
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vsSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fsSource);
gl.compileShader(fragmentShader);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

// attributes
const n = 100;
const positions = new Array(3 * n * n);
const colors = new Array(4 * n * n);
const pn = new Perlin3d(10, 10, 10);
for(let i = 0; i < n; i++){
    for(let j = 0; j < n; j++){
        let theta = Math.PI * i/n;
        let phi = 2 * Math.PI * j/n;
        let radius = 1 + 0.1 * pn.get(5 + 4 * Math.sin(theta) * Math.cos(phi), 5 + 4 * Math.sin(theta) * Math.sin(phi), 5 + 4 * Math.cos(theta));

        positions[3*(n*i + j) + 0] = radius * Math.sin(theta) * Math.cos(phi);
        positions[3*(n*i + j) + 1] = radius * Math.sin(theta) * Math.sin(phi);
        positions[3*(n*i + j) + 2] = radius * Math.cos(theta);

        if(radius > 1){
            colors[4*(n*i + j) + 0] = 0;
            colors[4*(n*i + j) + 1] = 1;
            colors[4*(n*i + j) + 2] = 0;
            colors[4*(n*i + j) + 3] = 1;
        }else{
            colors[4*(n*i + j) + 0] = 0;
            colors[4*(n*i + j) + 1] = 0;
            colors[4*(n*i + j) + 2] = 1;
            colors[4*(n*i + j) + 3] = 1;
        }
    }
}

const positionAttributeLoation = gl.getAttribLocation(shaderProgram, 'aPosition');
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const colorAttributeLocation = gl.getAttribLocation(shaderProgram, 'aColor');
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

// uniform
const rotateMatrixLocation = gl.getUniformLocation(shaderProgram, 'uRotateMatrix');

let theta = 0;
render();

// render
function render(){
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLoation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLoation);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorAttributeLocation);

    const rotateMatrix = mat4.create();
    mat4.rotate(rotateMatrix, rotateMatrix, theta, [0, 0, 1]);
    gl.uniformMatrix4fv(rotateMatrixLocation, false, rotateMatrix);
    theta += 0.05;

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}