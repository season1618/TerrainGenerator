import { OctavePerlin } from './perlin.js';

const canvas = document.getElementById('torus');
const gl = canvas.getContext('webgl');
canvas.width = 500;
canvas.height = 500;

let vsSource = `
attribute vec4 aPosition;
attribute vec4 aColor;

uniform mat4 uRotateMatrix;

varying vec4 vColor;

void main(){
    gl_Position = uRotateMatrix * aPosition;
    vColor = aColor;
}
`;

const fsSource = `
precision lowp float;

varying vec4 vColor;

void main(){
	gl_FragColor = vColor;
}
`;

// setup
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vsSource);
gl.compileShader(vertexShader);
if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the vertex shader: ' + gl.getShaderInfoLog(vertexShader));
    gl.deleteShader(vertexShader);
}

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fsSource);
gl.compileShader(fragmentShader);
if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the fragment shader: ' + gl.getShaderInfoLog(fragmentShader));
    gl.deleteShader(fragmentShader);
}

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

// vertex
const [positions, colors, index] = getTorusVertex(400, 200);

const positionAttributeLoation = gl.getAttribLocation(shaderProgram, 'aPosition');
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
gl.vertexAttribPointer(positionAttributeLoation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionAttributeLoation);

const colorAttributeLocation = gl.getAttribLocation(shaderProgram, 'aColor');
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(colorAttributeLocation);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int32Array(index), gl.STATIC_DRAW);

const rotateMatrixLocation = gl.getUniformLocation(shaderProgram, 'uRotateMatrix');

gl.getExtension('OES_element_index_uint');
gl.enable(gl.DEPTH_TEST);
gl.useProgram(shaderProgram);
gl.clearColor(0, 0, 0, 1);

let theta = 0;
render();

function getTorusVertex(row, column){
    const positions = [], colors = [], index = [];
    const radiusMajor = 0.7, radiusMinor = 1 - radiusMajor;
    const pn = new OctavePerlin(10);
    const noiseScale = 3;
    const boundArray = [-0.05, 0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 1.0];
    const colorArray = [[0.2, 0.2, 0.6], [0.2, 0.7, 0.8], [0.9, 0.7, 0.6], [0.2, 0.5, 0.3], [0.2, 0.6, 0.4], [0.2, 0.7, 0.2], [0.25, 0.8, 0.1], [0.25, 0.7, 0.1], [0.25, 0.6, 0.1], [0.25, 0.5, 0.1]];

    function lerp(a, b, t){
        let v = [0, 0, 0];
        for(let i = 0; i < 3; i++){
            v[i] = a[i] + (b[i] - a[i]) * t;
        }
        return v;
    }

    for(let i = 0; i < row; i++){
        for(let j = 0; j < column; j++){
            let u = 2 * Math.PI * i / row;
            let v = 2 * Math.PI * j / column;

            let x = (radiusMajor + radiusMinor * Math.cos(v)) * Math.cos(u);
            let y = (radiusMajor + radiusMinor * Math.cos(v)) * Math.sin(u);
            let z = radiusMinor * Math.sin(v);

            // position
            positions.push(x, y, z);

            // color
            let height = pn.get((x + 1) * noiseScale, (y + 1) * noiseScale, (z + 1) * noiseScale);
            for(let k = 0; k < 10; k++){
                if(height < boundArray[k]){
                    if(k == 0) colors.push(...colorArray[0]);
                    else colors.push(...lerp(colorArray[k-1], colorArray[k], (height - boundArray[k-1]) / (boundArray[k] - boundArray[k-1])));
                    break;
                }
            }

            // index
            let idx1 = column * i + j;
            let idx2 = column * i + (j + 1) % column;
            let idx3 = column * ((i + row - 1) % row) + j;
            let idx4 = column * ((i + 1) % row) + (j + 1) % column;
            index.push(idx1, idx2, idx3);
            index.push(idx1, idx2, idx4);
        }
    }
    return [positions, colors, index];
}

// render
function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);

    const rotateMatrix = mat4.create();
    mat4.rotate(rotateMatrix, rotateMatrix, Math.PI/4, [1, 0, 0]);
    mat4.rotate(rotateMatrix, rotateMatrix, theta, [0, 0, 1]);
    
    gl.uniformMatrix4fv(rotateMatrixLocation, false, rotateMatrix);

    theta += 0.01;
    theta %= 2 * Math.PI;

    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_INT, 0);
    gl.flush();

    requestAnimationFrame(render);
}