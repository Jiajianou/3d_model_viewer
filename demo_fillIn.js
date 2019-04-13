var canvas;
var gl;

window.onload = init;

var numVerts = 0;
var transMat;
var indices;
var tX;


function render(){
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	transMat[12] = tX;
	var tMat = gl.getUniformLocation(gl.program, "tM");
	gl.uniformMatrix4fv(tMat, false, transMat);

	gl.drawElements(gl.TRIANGLES, numVerts, gl.UNSIGNED_SHORT,0);
}


function shiftX(){
	var pos = document.getElementById("transXSlider").value;
	tX = pos;
	render();
}


function init(){
	canvas = document.getElementById("gl-canvas");

	document.getElementById("transXSlider").value = "0";

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) { alert("WebGL isn't available - interactive cannot run"); }
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	//Load shaders and initalize attribute buffers
	initShaders2(gl, "vertex-shader", "fragment-shader");


	tX = 0.0;
	transMat = new Float32Array(16);
	for (var i = 0; i < 16; i++){
		transMat[i] = 0;
	}

	for (var i = 0; i < 16; i += 5)
		transMat[i] = 1;

	transMat[12] = tX;




	var verts = [];
	var faces = [];
	var faceNormals = [];
	var vertNormals = [];
	var fileName = "dolphins.obj";

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
							var num = line.substring(start, end);
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
	var vPos = gl.getAttribLocation(gl.program, "vPos");
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
	var norm = gl.getAttribLocation(gl.program, "norm");
	gl.vertexAttribPointer(norm, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(norm);


	uFrame = gl.getUniformLocation(gl.program, "uFrame");
	render();

}
