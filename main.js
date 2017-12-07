(function() {

	var gridCanvas = {
		col: 2,
		row: 2,
		canvas: [],
		width: 0,
		height: 0
	};
	var optsDraw = {
		lineWidth: 8,
		lineJoin: 'round',
		lineCap: 'round',
		strokeStyle: '#23cae0',
		fillStyle: '#23cae0'
	}

	var offlineCanvas= {};
	var tmpCanvas = {};

	var mouse = {x: 0, y: 0};
	var last_mouse = {x: 0, y: 0};
	
	// Pencil Points
	var ppts = [];

	var FizzyText = function() {
	  this.column = gridCanvas.col;
	  this.row = gridCanvas.row;
	  this.stroke = optsDraw.lineWidth;
	  this.color = optsDraw.strokeStyle;
	  this.clear = function(e){
	  	clearAllCanvas();
	  	return false;
	  }
	};

	function init(){

		setDimensions();
		createOfflineCanvas();
		fillWindowOfCanvas();

		document.getElementById('main').addEventListener("mousedown", onStart, false);
		document.getElementById('main').addEventListener("mousemove", onMove, false);
		document.getElementById('main').addEventListener("mouseup", onEnd, false);

		window.onload = function() {
			var text = new FizzyText();
			var gui = new dat.GUI();
			var columns = gui.add(text, 'column', 2, 10).step(1);
			var row = gui.add(text, 'row', 1, 10).step(1);
			var stroke = gui.add(text, 'stroke', 1, 30).step(1);
			var color = gui.add(text, 'color', ['#23cae0','#ffffff','#526683','#637e9c','#afbcd2','#556898']);
			gui.add(text, 'clear');

			columns.onFinishChange(function(value) {
				gridCanvas.col = value;
				setDimensions();
				fillWindowOfCanvas();
			});
			row.onFinishChange(function(value) {
				gridCanvas.row = value;
				setDimensions();
				fillWindowOfCanvas();
			});
			stroke.onFinishChange(function(value) {
				optsDraw.lineWidth = value;
			});
			color.onFinishChange(function(value) {
				optsDraw.strokeStyle = value;
				optsDraw.fillStyle = value;
			});
		};
	}

	function setDimensions(){
		gridCanvas.width = window.innerWidth / gridCanvas.col;
		gridCanvas.height = window.innerHeight / gridCanvas.row;
	}

	function createOfflineCanvas(){
		offlineCanvas.canvas = document.createElement('canvas');
		offlineCanvas.ctx = offlineCanvas.canvas.getContext("2d");

		tmpCanvas.canvas = document.createElement('canvas');
		tmpCanvas.ctx = tmpCanvas.canvas.getContext("2d");

	}

	function fillWindowOfCanvas(){
		setCanvasDimension(offlineCanvas.canvas);
		setCanvasDimension(tmpCanvas.canvas);
		var point = { x: 0, y: 0};
		var endPoint = { x: window.innerWidth, y: window.innerHeight};
		var tmp_col = 0, tmp_row = 0;
		while( point.y < endPoint.y ){
			
			if(point.x > window.innerWidth){
				point.x = 0;
				point.y = point.y+gridCanvas.height;

				for (var i = tmp_col; i < gridCanvas.canvas[tmp_row].length; i++) {
					gridCanvas.canvas[tmp_row][i].disable = true;
					gridCanvas.canvas[tmp_row][i].canvas.className = 'disable';
				}

				tmp_row++;
				tmp_col = 0;
			}
			
			if(point.y > window.innerHeight){
				return;
			}

			if(gridCanvas.canvas[tmp_row] == undefined){
				gridCanvas.canvas[tmp_row] = [];
			}
			if(gridCanvas.canvas[tmp_row][tmp_col] == undefined){
				var canv = document.createElement('canvas');
				setCanvasDimension(canv);
				setCanvasPosition(canv,tmp_col, tmp_row, point.x, point.y);
				document.getElementById('main').appendChild(canv)
				gridCanvas.canvas[tmp_row][tmp_col] ={
					canvas: canv,
					context: canv.getContext('2d')
				};

				gridCanvas.canvas[tmp_row][tmp_col].disable = false;
				gridCanvas.canvas[tmp_row][tmp_col].canvas.className = '';
			}else{
				setCanvasDimension(gridCanvas.canvas[tmp_row][tmp_col].canvas);
				setCanvasPosition(gridCanvas.canvas[tmp_row][tmp_col].canvas, tmp_col, tmp_row, point.x, point.y);

				gridCanvas.canvas[tmp_row][tmp_col].disable = false;
				gridCanvas.canvas[tmp_row][tmp_col].canvas.className = '';
			}
			tmp_col++;
			point.x = point.x + gridCanvas.width;
		}
		for (var j = tmp_row; j < gridCanvas.canvas.length; j++) {
			for (var i = 0; i < gridCanvas.canvas[j].length; i++) {
				gridCanvas.canvas[j][i].disable = true;
				gridCanvas.canvas[j][i].canvas.className = 'disable';
			}
		}
	}

	function setCanvasDimension(c){
		c.width  = gridCanvas.width;
		c.height = gridCanvas.height; 
		c.style.width  = gridCanvas.width+'px';
		c.style.height =  gridCanvas.height+'px';
	}

	function setCanvasPosition(canv, c, r, x, y){
		canv.style.position = "absolute";
		canv.style.left = x+"px";
		canv.style.top = y+"px";
		if(c % 2){
			if (r % 2) {
				canv.style.transform = "scale(-1,-1)"
			}else{
				canv.style.transform = "scale(-1,1)"
			}
		}else{
			if (r % 2) {
				canv.style.transform = "scale(1,-1)"
			}else{
				canv.style.transform = "scale(1,1)"
			}
		}
	}

	function calculateCoords(x, y){

		var col = parseInt(x / gridCanvas.width);
		var row = parseInt(y / gridCanvas.height);

		if(x > gridCanvas.width){
			x = x%gridCanvas.width;
		}

		if(y > gridCanvas.height){
			y = y%gridCanvas.height;
		}


		if (row % 2) {
			if(col % 2){
				console.log(1,row % 2 , col % 2)
				y =  gridCanvas.height - y;
				x =  gridCanvas.width - x;
			}else{
				console.log(2,row % 2 , col % 2)
				y =  gridCanvas.height - y;
			}
		}else{
			if(col % 2){
				console.log(3)
				x =  gridCanvas.width - x;
			}
		}	

		return{ x:x, y:y }
	}

	var drag = false;

	function onStart(e){
		drag = true;
		mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
		mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
		
		ppts.push(calculateCoords(mouse.x,mouse.y));
		drawOffline();
	}

	function onMove(e){
		if(!drag){
			return;
		}
		mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
		mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
		
		ppts.push(calculateCoords(mouse.x,mouse.y));
		drawOffline();
	}

	function onEnd(e){
		tmpCanvas.ctx.clearRect(0, 0, tmpCanvas.canvas.width, tmpCanvas.canvas.height);
		console.log('gridCanvas.canvas[0][0].canvas',gridCanvas.canvas[0][0].canvas);
		tmpCanvas.ctx.drawImage(gridCanvas.canvas[0][0].canvas, 0, 0);
		//tmpCanvas.ctx.drawImage(offlineCanvas.canvas, 0, 0);
		drag = false;
		ppts = [];
	}

	function drawOffline(){

		if (ppts.length < 3) {
			// var b = ppts[0];
			// offlineCanvas.ctx.beginPath();
			// //ctx.moveTo(b.x, b.y);
			// //ctx.lineTo(b.x+50, b.y+50);
			// offlineCanvas.ctx.lineWidth = optsDraw.lineWidth;
			// offlineCanvas.ctx.lineJoin = optsDraw.lineJoin;
			// offlineCanvas.ctx.lineCap = optsDraw.lineCap;
			// offlineCanvas.ctx.strokeStyle = optsDraw.strokeStyle;
			// offlineCanvas.ctx.fillStyle = optsDraw.fillStyle

			// offlineCanvas.ctx.arc(b.x, b.y, offlineCanvas.ctx.lineWidth / 2, 0, Math.PI * 2, !0);
			// offlineCanvas.ctx.fill();
			// offlineCanvas.ctx.closePath();
			
		}else{
			// Tmp canvas is always cleared up before drawing.
			offlineCanvas.ctx.clearRect(0, 0, offlineCanvas.canvas.width, offlineCanvas.canvas.height);
			
			offlineCanvas.ctx.beginPath();
			offlineCanvas.ctx.lineWidth = optsDraw.lineWidth;
			offlineCanvas.ctx.lineJoin = optsDraw.lineJoin;
			offlineCanvas.ctx.lineCap = optsDraw.lineCap;
			offlineCanvas.ctx.strokeStyle = optsDraw.strokeStyle;
			offlineCanvas.ctx.fillStyle = optsDraw.fillStyle

			offlineCanvas.ctx.moveTo(ppts[0].x, ppts[0].y);
			
			for (var i = 1; i < ppts.length - 2; i++) {
				if(Math.abs(ppts[i].x - ppts[i+1].x )> gridCanvas.width*0.75 || Math.abs(ppts[i].y - ppts[i+1].y )> gridCanvas.height*0.75 ){
					offlineCanvas.ctx.stroke();
					offlineCanvas.ctx.moveTo(ppts[i+1].x, ppts[i+1].y);
				}else if(Math.abs(ppts[i].x - ppts[i-1].x )> gridCanvas.width*0.75 || Math.abs(ppts[i].y - ppts[i-1].y )> gridCanvas.height*0.75 ){
					offlineCanvas.ctx.stroke();
					offlineCanvas.ctx.moveTo(ppts[i+1].x, ppts[i+1].y);
				}else{
					var c = (ppts[i].x + ppts[i + 1].x) / 2;
					var d = (ppts[i].y + ppts[i + 1].y) / 2;
					
					offlineCanvas.ctx.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
				}
			}
			
			// For the last 2 points
			// offlineCanvas.ctx.quadraticCurveTo(
			// 	ppts[i].x,
			// 	ppts[i].y,
			// 	ppts[i + 1].x,
			// 	ppts[i + 1].y
			// );
			offlineCanvas.ctx.stroke();

			console.log('using quadraticCurveTo');

		}

		drawAllCanvas();

	}

	function drawAllCanvas(){
		for (var i = 0; i < gridCanvas.canvas.length; i++) {
			for (var j = 0; j < gridCanvas.canvas[i].length; j++) {
				gridCanvas.canvas[i][j].context.clearRect(0, 0, gridCanvas.canvas[i][j].canvas.width, gridCanvas.canvas[i][j].canvas.height);
				gridCanvas.canvas[i][j].context.drawImage(tmpCanvas.canvas, 0, 0);
				gridCanvas.canvas[i][j].context.drawImage(offlineCanvas.canvas, 0, 0);
			}	
		}
	}

	function clearAllCanvas(){
		offlineCanvas.ctx.clearRect(0, 0, offlineCanvas.canvas.width, offlineCanvas.canvas.height);
		tmpCanvas.ctx.clearRect(0, 0, tmpCanvas.canvas.width, tmpCanvas.canvas.height);
		for (var i = 0; i < gridCanvas.canvas.length; i++) {
			for (var j = 0; j < gridCanvas.canvas[i].length; j++) {
				gridCanvas.canvas[i][j].context.clearRect(0, 0, gridCanvas.canvas[i][j].canvas.width, gridCanvas.canvas[i][j].canvas.height);
			}	
		}
	}

	init();
	
}());
