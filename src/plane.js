import { OctavePerlin } from './perlin.js';

const canvas = document.getElementById('plane');
const gl = canvas.getContext('webgl');
canvas.width = 500;
canvas.height = 500;

let vsSource = `
attribute vec4 aPosition;
attribute vec4 aColor;

varying vec4 vColor;

void main(){
    gl_Position = aPosition;
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
const [positions, colors, index] = getPlaneVertex(200, 200);

const positionAttributeLoation = gl.getAttribLocation(shaderProgram, 'aPosition');
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
gl.vertexAttribPointer(positionAttributeLoation, 2, gl.FLOAT, false, 0, 0);
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

render();

function getPlaneVertex(row, column){
    const positions = [], colors = [], index = [];
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

    for(let i = 0; i <= row; i++){
        for(let j = 0; j <= column; j++){
            let x = 2 * i / row - 1;
            let y = 2 * j / column - 1;

            // position
            positions.push(x, y);

            // color
            let height = pn.get((x + 1) * noiseScale, (y + 1) * noiseScale, noiseScale);
            for(let k = 0; k < 10; k++){
                if(height < boundArray[k]){
                    if(k == 0) colors.push(...colorArray[0]);
                    else colors.push(...lerp(colorArray[k-1], colorArray[k], (height - boundArray[k-1]) / (boundArray[k] - boundArray[k-1])));
                    break;
                }
            }

            // index
            if(i < row && j < column){
                let idx1 = (column + 1) * i + j;
                let idx2 = (column + 1) * i + (j + 1);
                let idx3 = (column + 1) * (i + 1) + j;
                let idx4 = (column + 1) * (i + 1) + (j + 1);
                index.push(idx1, idx2, idx3);
                index.push(idx2, idx3, idx4);
            }
        }
    }
    return [positions, colors, index];
}

// render
function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_INT, 0);
    gl.flush();
}