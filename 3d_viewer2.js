//=================================================Global variables
var canvas,gl;
var vertices,indices;

var numVerts = 0;
var isMouseDown = false;
var isMouseDragged = false;
var shouldRotate = true;
var renderMode = 1;

var lastMouseCurrentLocationX, lastMouseCurrentLocationY;
var mouseTravelX, mouseTravelY;
var startTime, endTime;

var tX,tY,tZ,rX,rY;

var tMat,rMatX,rMatY,pMat,sMat,skMat,vMat,mMat;

var fov,aspect,near,far,ang;

var transMat, rotateMatX, rotateMatY, projMat, viewMat, modelMat;

var program;


window.onload = init;






//=================================================Render Function:


function render(){

  gl.enable(gl.DEPTH_TEST);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  gl.viewport(0,0,canvas.width,canvas.height);


  tMat = gl.getUniformLocation(program, "tM");
  gl.uniformMatrix4fv(tMat, false, transMat);

  rMatX = gl.getUniformLocation(program, "rMX");
  gl.uniformMatrix4fv(rMatX, false, rotateMatX);

  rMatY = gl.getUniformLocation(program, "rMY");
  gl.uniformMatrix4fv(rMatY, false, rotateMatY);

  pMat = gl.getUniformLocation(program, "pM");
  gl.uniformMatrix4fv(pMat, false, projMat);

  vMat = gl.getUniformLocation(program, "vM");
  gl.uniformMatrix4fv(vMat, false, viewMat);

  mMat = gl.getUniformLocation(program, "mM");
  gl.uniformMatrix4fv(mMat, false, modelMat);


  if(renderMode === 1){

    gl.drawElements(gl.TRIANGLES, numVerts, gl.UNSIGNED_SHORT,0);

  }

  if(renderMode === 2){

    gl.drawElements(gl.LINE_STRIP, numVerts, gl.UNSIGNED_SHORT,0);

  }

  if(renderMode === 3){

    gl.drawElements(gl.POINTS, numVerts, gl.UNSIGNED_SHORT,0);

  }

  gl.flush();
}






//=====================================================Identity Matrix Generation Function:
function identityMatrix(){
  var out = new Float32Array(16);

  for(var i = 0; i < 16; i++){

    out[i] = 0.0;

  }

  out[0]=1.0;
  out[5]=1.0;
  out[10]=1.0;
  out[15]=1.0;

  return out;
}




//========================================================Mouse event logic functions:

function mouseDown(event){

  startTime = new Date();

  event.preventDefault();

  lastMouseCurrentLocationX = event.clientX;
  lastMouseCurrentLocationY = event.clientY;
  isMouseDown = true;
}


function mouseUp(event){

  isMouseDown = false;

  endTime = new Date();

  var timePassed = endTime - startTime;

  timePassed *= 0.001
  var seconds = Math.round(timePassed);

  //console.log(timePassed);

}


function mouseMove(event){

  mouseTravelX = event.clientX - lastMouseCurrentLocationX;
  mouseTravelY = event.clientY - lastMouseCurrentLocationY;

  if(isMouseDown){

    if(shouldRotate){

      rotateObject();

    } else {

      panObject();
    }

  }
}





//==========================================================Rotation:


function rotateObject(){


    rX += mouseTravelY*0.001;

    rotateMatX[0] = 1.0;
    rotateMatX[5] = Math.cos(rX);
    rotateMatX[6] = Math.sin(rX);
    rotateMatX[9] = -Math.sin(rX);
    rotateMatX[10] = Math.cos(rX);
    rotateMatX[15] = 1.0;


    rY += mouseTravelX*0.001;

    rotateMatY[0] = Math.cos(rY);
    rotateMatY[2] = -Math.sin(rY);
    rotateMatY[5] = 1.0;
    rotateMatY[8] = Math.sin(rY);
    rotateMatY[10] = Math.cos(rY);
    rotateMatY[15] = 1.0;


  render();

}


//=========================================================Translation/Panning

function panObject(){

  tX += mouseTravelX*0.0001;

  tY -= mouseTravelY*0.0001;

  transMat[12] = tX;

  transMat[13] = tY;

  render();

}





//=========================================================Zoom:

function scrollZoom(event){

  event.preventDefault();

  fov += event.deltaY * 0.01;

  ang = Math.tan((fov * 0.5) * Math.PI/180);

  projMat[0]=0.5/ang;
  projMat[5]=0.5*aspect/ang;
  projMat[10]=-(far+near)/(far-near);
  projMat[11]=(-2.0*far*near)/(far-near);
  projMat[14]=-1.0;

  viewMat[14] = -1.5;

  render();
}



//===============================================================Rotate or Pan switching

function switchToPan(){

  shouldRotate=false;

}

function switchToRotate(){

  shouldRotate=true;

}


//=================================================================Rendering Mode Switching:

function switchToSolid(){

  renderMode = 1;

  render();

}

function switchToWire(){

  renderMode = 2;

  render();

}

function switchToVert(){

  renderMode = 3;

  render();

}



//===========================================================Initialization:

function init(){


  canvas = document.getElementById("canvas_1");

  canvas.onmousedown = mouseDown;
  canvas.onmousemove = mouseMove;
  canvas.onmouseup = mouseUp;
  canvas.onwheel = scrollZoom;

  gl = WebGLUtils.setupWebGL(canvas);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT);


  tX = 0.0;
  tY = 0.0;
  tZ= 0.0;

  rX = 0.0;
  rY = 0.0;

  fov=40.00;
  aspect = 1.0;
  near = 0.1;
  far = 100.00;

  renderMode = 1;

  transMat = identityMatrix();
  rotateMatX = identityMatrix();
  rotateMatY = identityMatrix();
  rotateMatZ = identityMatrix();
  projMat = identityMatrix();
  viewMat = identityMatrix();
  modelMat = identityMatrix();

  ang = Math.tan((fov * 0.5) * Math.PI/180);

  projMat[0]=0.5/ang;
  projMat[5]=0.5*aspect/ang;
  projMat[10]=-(far+near)/(far-near);
  projMat[11]=(-2.0*far*near)/(far-near);
  projMat[14]=-1.0;

  viewMat[14] = -1.5;


  var vertexShader = gl.createShader(gl.VERTEX_SHADER);

  gl.shaderSource(vertexShader, [
    'attribute vec3 vPos;',
    'attribute vec3 norm;',
    'uniform mat4 tM;',
    'uniform mat4 rMX;',
    'uniform mat4 rMY;',
    'uniform mat4 pM;',
    'uniform mat4 vM;',
    'uniform mat4 mM;',
    'varying vec3 vertNorm;',
    'varying vec4 fragPos;',

    'void main(){',
        'gl_Position = pM*vM*mM*tM*rMY*rMX*vec4(vPos, 1.0);',
    	'vertNorm = vec3(norm[0], norm[1], norm[2]);',
    	'fragPos = gl_Position;',
    '}',
  ].join('\n'));

  gl.compileShader(vertexShader);



  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);


  //vec3 La = vec3 (0.2, 0.2, 0.2)
  //    'vec3 position_eye = vec3 (0.0, 0.0, 1.0);',
  //'vec3 light_position_world  = vec3 (0.0, 0.0, 2.0);',

  gl.shaderSource(fragmentShader, [
    '#ifdef GL_ES',
    'precision highp float;',
    '#endif',

    'varying vec3 vertNorm;',
    'varying vec4 fragPos;',

    'vec3 position_eye = vec3 (0.0, 0.0, -2.0);',
    'vec3 light_position_world  = vec3 (0.0, 0.0, 2.0);',
    'vec3 Ls = vec3 (1.0, 1.0, 1.0);',
    'vec3 Ld = vec3 (0.7, 0.6, 0.4);',
    'vec3 La = vec3 (0.39, 0.4, 0.41);',


    'vec3 Ks = vec3 (1.0, 1.0, 1.0);',
    'vec3 Kd = vec3 (0.0, 0.5, 1.0);',
    'vec3 Ka = vec3 (1.0, 1.0, 1.0);',
    'float specular_exponent = 10.0;',


    'void main(){',

    	'vec3 Ia = vec3(La * Ka);',

    	'vec3 distance_to_light_eye = light_position_world - position_eye;',
    	'vec3 direction_to_light_eye = normalize (distance_to_light_eye);',
    	'float dot_prod = dot (direction_to_light_eye, vertNorm);',
    	'dot_prod = max (dot_prod, 0.0);',
    	' vec3 Id = Ld * Kd * dot_prod;',
    	'vec3 surface_to_viewer_eye = normalize (-position_eye);',
    	'vec3 half_way_eye = normalize (surface_to_viewer_eye + direction_to_light_eye);',
    	'float dot_prod_specular = max (dot (half_way_eye, vertNorm), 0.0);',
    	'float specular_factor = pow (dot_prod_specular, specular_exponent);',
    	'vec3 Is = Ls * Ks * specular_factor;',
    	'gl_FragColor = vec4(Is + Id + Ia, 1.0);',
    '}',
  ].join('\n'));


  gl.compileShader(fragmentShader);

  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.useProgram(program);
  gl.program = program;

  console.log(gl.getProgramParameter(program, gl.LINK_STATUS));






  //********************************load & process an obj model:

  var verts = [];
	var faces = [];
	var faceNormals = [];
	var vertNormals = [];
	var fileName = "triangulated_cube.obj";

	//scaling variables
	var minMax = [100000000000000000.0, -100000000000000000.0,
		      100000000000000000.0, -100000000000000000.0,
		      100000000000000000.0, -100000000000000000.0];


		//open file
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {


  if (request.readyState === 4 && request.status !== 404) {
	//parse
	var lines = request.responseText.split('\n');  // Break up into lines and store them as array
	//alert(lines);
	lines.push(null); // Append null
	var lIdx = 0;
	while (lines[lIdx] != null){
				 var line = lines[lIdx];
				 var cIdx = 2;
				 //vertex
				 if (line.charAt(0) == 'v' && line.charAt(1) == ' '){
		//parse line
		var count = 0;
		while (cIdx < line.length){
			var start = cIdx;
			while (line.charAt(cIdx) != " " && cIdx < line.length)
						 cIdx++;
			var end = cIdx-1;



			var num = line.substring(start, end);



			var val = Number(num);

			verts[verts.length] = val;
			cIdx++;



			if (val < minMax[2*count + 0])
						 minMax[2*count + 0] = val;
			if (val > minMax[2*count + 1])
						 minMax[2*count + 1] = val;




			count++;
		}

				 }
				 else if (line.charAt(0) == 'f' && line.charAt(1) == ' '){
			while (cIdx < line.length){
				var start = cIdx;
				while (line.charAt(cIdx) != " " && cIdx < line.length)
								cIdx++;
				var end = cIdx;

        //modification:

        var start2 = 0;
        var index2 = 0;

        var temp_line = line.substring(start,end);

        while(temp_line.charAt(index2) != "/" && index2 < temp_line.length) index2++;

        var end2 = index2;


        //end modification:
				//var num = line.substring(start, end);

        var num = temp_line.substring(start2,end2);
        console.log(num);
				var val = Number(num) - 1;
				faces[faces.length] = val;
				cIdx++;
			}

				 }
				 lIdx++;
	}





	var numFaces = faces.length/3;
	//compute face normals
	for (var i = 0; i < numFaces; i++){
		var idx1 = faces[i*3 + 0];
		var idx2 = faces[i*3 + 1];
		var idx3 = faces[i*3 + 2];



		var ux = verts[idx1*3 + 0] - verts[idx2*3 + 0];
		var uy = verts[idx1*3 + 1] - verts[idx2*3 + 1];
		var uz = verts[idx1*3 + 2] - verts[idx2*3 + 2];
		var vx = verts[idx1*3 + 0] - verts[idx3*3 + 0];
		var vy = verts[idx1*3 + 1] - verts[idx3*3 + 1];
		var vz = verts[idx1*3 + 2] - verts[idx3*3 + 2];

		var nx = uy*vz - uz*vy;
		var ny = uz*vx - ux*vz;
		var nz = ux*vy - uy*vx;
		var mag = Math.sqrt(nx*nx + ny*ny + nz*nz);
		var invMag = 1.0/mag;

		faceNormals[3*i + 0] = invMag*nx;
		faceNormals[3*i + 1] = invMag*ny;
		faceNormals[3*i + 2] = invMag*nz;
	}



	//compute vertex normals
	for (var i = 0; i < (verts.length/3); i++){
			var avgX = 0.0;
			var avgY = 0.0;
			var avgZ = 0.0;
			var numF_vert = 0;

			//find all the faces that contain this vertex
			for (var j = 0; j < numFaces; j++){
				var found = 0;
				for (var k = 0; k < 3; k++)
					if (faces[j*3 + k] == i)
						found = 1;
				if (found){
					avgX += faceNormals[j*3 + 0];
					avgY += faceNormals[j*3 + 1];
					avgZ += faceNormals[j*3 + 2];
					numF_vert++;
				}
			}


			avgX /= numF_vert;
			avgY /= numF_vert;
			avgZ /= numF_vert;
			vertNormals[i*3 + 0] = avgX;
			vertNormals[i*3 + 1] = avgY;
			vertNormals[i*3 + 2] = avgZ;
	}

  }
}

request.open('GET', fileName, false); // Create a request to acquire the file
request.send();





	var scale = 0;
	var shifts = [];
	for (var h = 0; h < 3; h++){
	    var scale0 = Math.abs(minMax[2*h+1] - minMax[2*h+0]);
	    if (scale0 > scale)
			scale = scale0;
	    shifts[h] = 0.5*(minMax[2*h+1] + minMax[2*h+0]);
	}
	scale = 1/scale;



	var normVerts = {};
	normVerts = new Float32Array(verts.length);
	for (var i = 0; i < verts.length/3; i++){
		for (var j = 0; j < 3; j++)
			normVerts[3*i+j] = scale*(verts[3*i+j] - shifts[j]);
	}
	numVerts = faces.length;



  var vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normVerts), gl.STATIC_DRAW);
	var vPos = gl.getAttribLocation(program, "vPos");
	gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPos);

	var Index_Buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);

	var normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertNormals), gl.STATIC_DRAW);
	var norm = gl.getAttribLocation(program, "norm");
	gl.vertexAttribPointer(norm, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(norm);


	uFrame = gl.getUniformLocation(program, "uFrame");




  render();


}
