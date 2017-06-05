var GameController = Object.subClass({
	gCanvasElement: '',
	gDrawingContext: '',
	kBoardWidth: 8,
	kBoardHeight:8,
	kNumPieces: 9,
	kPieceWidth: 50,
	kPieceHeight:50,
	wWin:0,
	bWin:0,
	kPixelWidth:'',
	kPixelHeight: '',
	gCells:'',
	gPieces:'',
	gMoveAreaCells:'',
	gSelectedPiece:'',
	gNumPieces:'',
	turn:'',
	selected:false,
	checkPiece:'',
	myTeam:'',
	socketio: '',
	boardInit:function(){
		this.kPixelWidth = 1 + (this.kBoardWidth * this.kPieceWidth);
		this.kPixelHeight= 1 + (this.kBoardHeight * this.kPieceHeight);

	    this.gCanvasElement = document.getElementById("chess_canvas");
	    this.gCanvasElement.width = this.kPixelWidth;
	    this.gCanvasElement.height = this.kPixelHeight;
	    this.gCanvasElement.addEventListener("click", this.chessOnClick, false);
	    this.gDrawingContext = this.gCanvasElement.getContext("2d");
	    
	    this.cellDataInit();
	    //this.pieceDataInit();
	    this.drawBoard();
	    
	    //this.turn = 'W';
	    //this.viewTurn();
	    
	    this.viewWin();
	},
	cellDataInit: function(){
		var cells = new Array(this.kBoardWidth);
		for(var i=0; i < this.kBoardWidth; i++){
			var rowCell = new Array(this.kBoardHeight);
			for(var j=0; j < this.kBoardHeight; j++){
				var style = 'rgb(255,255,255)';
				if((i+j) % 2 == 1){
					style = 'rgb(150,150,150)';
				}
				rowCell[j] = new Cell(i, j, style);
			}
			cells[i] = rowCell;
		}
		this.gCells = cells;
		this.gMoveAreaCells = new Array();
	},
	drawBoard: function() {
		this.gDrawingContext.clearRect(0, 0, this.kPixelWidth, this.kPixelHeight);

	    this.gDrawingContext.beginPath();
	    
	    /* vertical lines */
	    for (var x = 0; x <= this.kPixelWidth; x += this.kPieceWidth) {
			this.gDrawingContext.moveTo(0.5 + x, 0);
			this.gDrawingContext.lineTo(0.5 + x, this.kPixelHeight);
	    }
	    
	    /* horizontal lines */
	    for (var y = 0; y <= this.kPixelHeight; y += this.kPieceHeight) {
			this.gDrawingContext.moveTo(0, 0.5 + y);
			this.gDrawingContext.lineTo(this.kPixelWidth, 0.5 +  y);
	    }
	    this.gDrawingContext.strokeStyle = "#ccc";
	    this.gDrawingContext.stroke();
	    
	    this.viewRefresh();
	   
	},
	fillBack: function(cell, style){
		if(style != null){
			this.gDrawingContext.fillStyle = style;
			this.gDrawingContext.fillRect(cell.column * this.kPieceWidth + 1, cell.row * this.kPieceHeight + 1,
					this.kPieceWidth - 2, this.kPieceHeight - 2);
		}
	},
	chessOnClick: function(event) {
		if(gameController.turn == gameController.myTeam){
			var clickCol = Math.floor((event.clientX - gameController.gCanvasElement.getBoundingClientRect().left) / gameController.kPieceWidth);
			var clickRow = Math.floor((event.clientY - gameController.gCanvasElement.getBoundingClientRect().top) / gameController.kPieceHeight);
			if(gameController.selected == false){
				var turn = "W";
				if(gameController.turn == "W"){
					turn = "B";
				}
				gameController.viewAtackArea(turn, false);
				gameController.selectCell(clickCol, clickRow);
			}else{
				gameController.movePiece(clickCol, clickRow);
			}
		}
	},
	pieceDataInit: function(){
		var blackData = [
				[0,0,'L'],[1,0,'N'],[2,0,'B'],[3,0,'Q'],[4,0,'K'],[5,0,'B'],[6,0,'N'],[7,0,'L'],
				[0,1,'P'],[1,1,'P'],[2,1,'P'],[3,1,'P'],[4,1,'P'],[5,1,'P'],[6,1,'P'],[7,1,'P']
			];
		var blackPeace =[]
		for(var i=0; i < blackData.length; i++){
			blackPeace[i] = new Piece(blackData[i][0], blackData[i][1], blackData[i][2], 'B');
		}
		
		var whiteData = [
				[0,7,'L'],[1,7,'N'],[2,7,'B'],[3,7,'Q'],[4,7,'K'],[5,7,'B'],[6,7,'N'],[7,7,'L'],
				[0,6,'P'],[1,6,'P'],[2,6,'P'],[3,6,'P'],[4,6,'P'],[5,6,'P'],[6,6,'P'],[7,6,'P']
			];
		var whitePeace =[]
		for(var j=0; j < whiteData.length; j++){
			whitePeace[j] = new Piece(whiteData[j][0], whiteData[j][1], whiteData[j][2], 'W');
		}
		
		this.gPieces = {
			white:whitePeace,
			black:blackPeace
		}
	},
	setTeam: function(team, socketio){
		this.myTeam = team;
		this.socketio = socketio;
	},
	setTurn: function(pieces, turn){
		this.gPieces = pieces;
		this.turn = turn;
		this.viewRefresh();
	},
	drawPieces: function(){
		var whitePiece = this.gPieces.white;
		var blackPiece = this.gPieces.black;
		if(whitePiece === undefined || whitePiece === null){
		}else{
			for(var i=0; i < whitePiece.length; i++){
				this.drawPiece(whitePiece[i]);
			}

			for(var j=0; j < blackPiece.length; j++){
				this.drawPiece(blackPiece[j]);
			}
		}
	},
	drawPiece: function(piece){
		if(piece.live == 1){
			var column = piece.column;
		    var row = piece.row;
		    var x = (column * this.kPieceWidth) + (this.kPieceWidth/2);
		    var y = (row * this.kPieceHeight) + (this.kPieceHeight/2);
		    var radius = (this.kPieceWidth/2) - (this.kPieceWidth/10);
		    this.gDrawingContext.beginPath();
		    
		    //円の描画
		    this.gDrawingContext.arc(x, y, radius, 0, Math.PI*2, false);
		    this.gDrawingContext.closePath();
		    this.gDrawingContext.strokeStyle = "#000";
		    this.gDrawingContext.stroke();
		    if(piece.team == 'B'){
				this.gDrawingContext.fillStyle = "#000";
			}else{
				this.gDrawingContext.fillStyle = "#FFF";
			}
			this.gDrawingContext.fill();
			
			//文字の描画
			this.gDrawingContext.font = "20pt Arial";
			if(piece.team == 'B'){
				this.gDrawingContext.fillStyle = "#FFF";
			}else{
				this.gDrawingContext.fillStyle = "#000";
			}
			this.gDrawingContext.fillText(piece.role, x - 10, y + 10);
		}
	},
	viewTurn: function(){
		//ターン表示
		if(this.turn == 'W'){
			document.getElementById("turn").innerHTML = "WHITE";
		}else if(this.turn == 'B'){
			document.getElementById("turn").innerHTML = "BLACK";
		}else{
			document.getElementById("turn").innerHTML = "Wait";
		}
	},
	viewWin: function(){
	
		document.getElementById("wWin").innerHTML = this.wWin;
		document.getElementById("bWin").innerHTML = this.bWin;
	},
	findPiece: function(col, row){
		var target = target = this.gPieces.white;
		for(var i=0; i < target.length; i++){
			if(target[i].column == col && target[i].row == row && target[i].live == 1){
				return target[i];
			}
		}
		
		target = target = this.gPieces.black;
		for(var i=0; i < target.length; i++){
			if(target[i].column == col && target[i].row == row && target[i].live == 1){
				return target[i];
			}
		}
		
		return null;
	},
	selectCell: function(clickCol, clickRow){
		var targetPiece = this.findPiece(clickCol, clickRow);
		if ( targetPiece === undefined || targetPiece === null) {
		}else{
			if(targetPiece.team == this.turn){
				this.selectPiece(targetPiece, targetPiece.team, false);
			}
		}
	},
	selectPiece: function(piece, team, simulate){
		this.gSelectedPiece = piece;
		this.selected = true;
		var style = 'rgb(255, 45, 0)';
		if(simulate == true){
			style = null
		}
		
		this.fillBack( this.gCells[piece.column][ piece.row], style);
		this.drawPiece(piece);
		eval("this.draw" + piece.role + "Area(piece,team, style);");
	},
	
	drawPArea: function(piece, team, style){
		var row;
		var col = piece.column;
		if(team == 'W'){
			row = piece.row - 1;
		}else{
			row = piece.row + 1;
		}
		if(col < 0 || col > this.kBoardWidth
			|| row < 0 || row > this.kBoardHeight){
			return;
		}
		var destPiece = gameController.findPiece(col, row);
		if ( destPiece === undefined || destPiece === null) {
			this.gMoveAreaCells.push(this.gCells[col][row]);
			this.fillBack( this.gCells[col][row], style);
		}else{
		}
		if(parseInt(col)-1 >= 0){
			this.atackArea(gameController.findPiece(parseInt(col)-1, row, style), team, style);
			eval("this.gCells[col-1][row]." + team + "Atack = 1;");
		}
		if(parseInt(col)+1 < this.kBoardWidth){
			this.atackArea(gameController.findPiece(parseInt(col)+1, row, style), team, style);
			eval("this.gCells[col+1][row]." + team + "Atack = 1;");
		}
		
	},
	drawLArea: function(piece, team, style){
		for(var i=1; (i + parseInt(piece.column)) < this.kBoardWidth; i++){
			if(this.pieceJudge(parseInt(piece.column) + i, piece.row, team, style)){
				break;
			}
		}
		for(var j=1; ( parseInt(piece.column) - j) >= 0; j++){
			if(this.pieceJudge(parseInt(piece.column) - j, piece.row , team, style)){
				break;
			}
		}
		for(var k=1; (parseInt( piece.row) + k) < this.kBoardHeight; k++){
			if(this.pieceJudge(piece.column, parseInt(piece.row) + k, team, style)){
				break;
			}
		}
		for(var l=1; ( parseInt(piece.row) - l) >= 0; l++){
			if(this.pieceJudge(piece.column, parseInt(piece.row) - l, team, style)){
				break;
			}
		}
	},
	drawBArea: function(piece, team, style){
		for(var i=1; (parseInt(piece.column) + i) < this.kBoardWidth && ( parseInt(piece.row) + i) < this.kBoardHeight ; i++){
			if(this.pieceJudge(parseInt(piece.column) + i, parseInt(piece.row) + i, team, style)){
				break;
			}
		}
		for(var j=1; ( parseInt(piece.column) + j) < this.kBoardWidth && (parseInt(piece.row) - j) >= 0 ; j++){
			if(this.pieceJudge(parseInt(piece.column) + j, parseInt(piece.row) - j, team, style)){
				break;
			}
		}
		for(var k=1; (parseInt(piece.column) - k) >= 0 && ( parseInt(piece.row) + k) < this.kBoardHeight ; k++){
			if(this.pieceJudge(parseInt(piece.column) - k, parseInt(piece.row) + k, team, style)){
				break;
			}
		}
		for(var l=1; ( parseInt(piece.column) - l) >= 0 && (parseInt(piece.row) - l) >= 0 ; l++){
			if(this.pieceJudge(parseInt(piece.column) - l, parseInt(piece.row) - l, team, style)){
				break;
			}
		}
		
	},
	drawNArea: function(piece, team, style){
		if((parseInt(piece.column) + 1) < this.kBoardWidth && (parseInt(piece.row) + 2) < this.kBoardHeight){
			this.pieceJudge(parseInt(piece.column) + 1, parseInt(piece.row) + 2 ,team,style);
			
		}
		if((parseInt(piece.column) + 1) < this.kBoardWidth && (parseInt(piece.row) - 2) >= 0){
			this.pieceJudge(parseInt(piece.column) + 1, parseInt(piece.row) - 2 ,team,style);
			
		}
		if((parseInt(piece.column) + 2) < this.kBoardWidth && (parseInt(piece.row) + 1) < this.kBoardHeight){
			this.pieceJudge(parseInt(piece.column) + 2, parseInt(piece.row) + 1 ,team,style);
			
		}
		if((parseInt(piece.column) + 2) < this.kBoardWidth && (parseInt(piece.row) - 1) >= 0){
			this.pieceJudge(parseInt(piece.column) + 2, parseInt(piece.row) - 1 ,team,style);
			
		}
		if((parseInt(piece.column) - 1) >= 0 && (parseInt(piece.row) + 2) < this.kBoardHeight){
			this.pieceJudge(parseInt(piece.column) - 1, parseInt(piece.row) + 2 ,team,style);
			
		}
		if((parseInt(piece.column) - 1) >= 0 && (parseInt(piece.row) - 2) >= 0){
			this.pieceJudge(parseInt(piece.column) - 1, parseInt(piece.row) - 2 ,team,style);
			
		}
		if((parseInt(piece.column) - 2) >= 0 && (parseInt(piece.row) + 1) < this.kBoardHeight){
			this.pieceJudge(parseInt(piece.column) - 2, parseInt(piece.row) + 1 ,team,style);
			
		}
		if((parseInt(piece.column) - 2) >= 0 && (parseInt(piece.row) - 1) >= 0){
			this.pieceJudge(parseInt(piece.column) - 2, parseInt(piece.row) - 1 ,team,style);
		}
	},
	drawQArea: function(piece, team, style){
		this.drawLArea(piece, team, style);
		this.drawBArea(piece, team, style);
	},
	drawKArea: function(piece, team, style){
		var ret = false;
		for(var i= -1; i <= 1; i++){
			for(var j= -1; j <= 1; j++){
				if(i==0 && j==0){
				}else if(this.kBoardWidth > (piece.column + i) && (piece.column + i) >= 0 &&
						this.kBoardHeight > (piece.row + j)  && (piece.row + j) >= 0){
					if(this.gCells[piece.column + i][piece.row + j].BAtack == 0 && team == 'W'){

						this.pieceJudge(parseInt(piece.column) + i, parseInt(piece.row) + j ,team,style);
						var pieceW = this.findPiece(parseInt(piece.column) + i, parseInt(piece.row) + j);
						if(pieceW == null || pieceW.team == 'B'){
							ret = true;

						}
					}else if(this.gCells[piece.column + i][piece.row + j].WAtack == 0 && team == 'B'){

						this.pieceJudge(parseInt(piece.column) + i, parseInt(piece.row) + j ,team,style);
						var pieceB = this.findPiece(parseInt(piece.column) + i, parseInt(piece.row) + j);
						if(pieceB == null || pieceB.team == 'W'){
							ret = true;

						}
					}
				}
			}
		}
		return ret;
	},
	pieceJudge: function(col, row, team, style){
		var ret = false;
		eval("this.gCells[col][row]." + team + "Atack = 1;");

		var destPiece = this.findPiece(col, row);
		if (destPiece === "undefined" || destPiece === null) {
			this.gMoveAreaCells.push(this.gCells[col][ row ]);
			this.fillBack( this.gCells[col][ row], style);
		}else{
			this.atackArea(destPiece, team, style);
			ret = true;
		}
		return ret;
	},
	atackArea: function(destPiece, team, style){
		var ret = false;
		if (destPiece === undefined || destPiece === null) {
		}else{
			if(destPiece.team != team){
				this.gMoveAreaCells.push(this.gCells[destPiece.column][destPiece.row]);
				this.fillBack( this.gCells[destPiece.column][destPiece.row], style);
				this.drawPiece(destPiece);
				ret = true;
			}
		}
		return ret;
	},
	movePiece:function(col, row){
		var piece = this.gSelectedPiece;
		
		var pieceColTemp = this.gSelectedPiece.column.toString();
		var pieceRowTemp = this.gSelectedPiece.row.toString();
		var selectePieceTemp = this.gSelectedPiece;
		var targetCell = this.findFromMoveArea(col, row);
		var check = false;
		if (targetCell === undefined || targetCell === null) {
			this.selected = false;
		}else if(this.gSelectedPiece.column == col && this.gSelectedPiece.row == row){
			this.selected = false;
		}else{
			this.viewRefresh();
			
			if(this.checkMateSimu(selectePieceTemp, col, row)){
				//自分自身のチームのチェック
				alert("checkMate");
			}else{
				var targetPiece = this.findPiece(col, row);
				if ( targetPiece === undefined || targetPiece === null) {
				}else{
					targetPiece.live = 0;
				}
				selectePieceTemp.row = row;
				selectePieceTemp.column = col;
				this.turnChange();
				this.viewRefresh();
				var check = this.atackJudge(this.turn, piece);
				
				var data = {
					pieces: this.gPieces,
					check: check
				}
				this.selected = false;
				this.gMoveAreaCells = new Array();
				this.socketio.emit("pieceMove", data);
				return;
			}

		}
		
		
		this.viewRefresh();
		/*
		if(check){
			alert("CheckMate" + this.turn);
		}
		*/
		return;
	},
	findFromMoveArea: function(col, row){
		var ret = null;
		for(var i=0; i < this.gMoveAreaCells.length; i++){
			if(this.gMoveAreaCells[i].column == col && this.gMoveAreaCells[i].row == row){
				return this.gMoveAreaCells[i];
			}
		}
		return ret;
	},
	turnChange: function(){
		if(this.turn == 'W'){
			this.turn = 'B';
		}else{
			this.turn = 'W';
		}
	},
	viewRefresh: function(){
		this.selected = false;
		this.gMoveAreaCells = new Array();
		//背景の塗りつぶし
	    for (var i = 0; i < this.kBoardWidth; i++) {
	    	for (var j = 0; j < this.kBoardHeight; j++ ) {
	    		this.fillBack( this.gCells[i][j], this.gCells[i][j].style);
	    	}
	    }
	    this.drawPieces();
	    this.viewTurn();
	},
	atackAreaRefresh: function(){
		var wTargetPices = this.gPieces.white;
		var bTargetPices = this.gPieces.black;

		for(var i=0; i< this.kBoardWidth; i++){
			for(var j=0; j< this.kBoardHeight; j++){
				this.gCells[i][j].WAtack = 0;
				this.gCells[i][j].BAtack = 0;
			}
		}
		for(var k=0; k < wTargetPices.length; k++){
			if(wTargetPices[k].live == 1){
				this.selectPiece(wTargetPices[k], wTargetPices[k].team, true);
			}
		}
		for(var l=0; l < wTargetPices.length; l++){
			if(bTargetPices[l].live == 1){
				this.selectPiece(bTargetPices[l], bTargetPices[l].team, true);
			}
		}
		this.gMoveAreaCells = new Array();
		this.gSelectedPiece={};
		this.selected = false;
	},
	viewAtackArea: function(team, show){
		this.atackAreaRefresh();
		var style = 'rgb(0, 191, 255)';
		if(show == false){
			style = null;
		}else if(team == 'B'){
			style = 'rgb(114, 252, 0)';
		}
		for(var i=0; i < this.kBoardWidth; i++){
			for(var j=0; j < this.kBoardHeight; j++){
				if(eval("this.gCells[i][j]." + team + "Atack == 1")){
					this.fillBack( this.gCells[i][j], style);
					/*
					if(team == 'W'){
						this.fillBack( this.gCells[i][j], style);
					}else{
						this.fillBack( this.gCells[i][j], style);
					}
					*/
				}
			}
		}
		this.drawPieces();
	},
	checkMateCheck: function(team){
		var ret = false;
		var pieces = []
		var targetPiece;
		if(team == 'W'){
			pieces = this.gPieces.white;
		}else{
			pieces = this.gPieces.black;
		}
		targetPiece = this.findKing(pieces);
		if(team == 'W'){
			if(this.gCells[targetPiece.column][targetPiece.row].BAtack == 1){
				ret = true;
			}
		}else{
			if(this.gCells[targetPiece.column][targetPiece.row].WAtack == 1){
				ret = true;
			}
		}
		return ret;
	},
	atackJudge: function(team, checkPiece){
		var ret = false;
		if(this.checkMateCheck(this.turn)){
			var targetPieces = this.gPieces.white;
			if(team == 'B'){
				targetPieces = this.gPieces.black;
			}
			var king = this.findKing(targetPieces);
			
			if(this.drawKArea(king, king.team, null)){
				//逃げれる
				return true;
			}else{
				var escapeArea = this.findEscape(king, checkPiece);
				var escapable = false;
				for(var i=0; i < targetPieces.length; i++){
					this.gMoveAreaCells = new Array();
					this.selectPiece(targetPieces[i], team, true);
					for(var j=0; j < escapeArea.length; j++){
						for(var k=0; k < this.gMoveAreaCells.length; k++){
							if(escapeArea[j].column == this.gMoveAreaCells[k].column &&
									escapeArea[j].row == this.gMoveAreaCells[k].row){
									
								if(this.checkMateSimu(targetPieces[i], escapeArea[j].column ,escapeArea[j].row) == false){
									escapable = true;
									return true;
								}
							}
							
						}
					}
				}
				if(escapable == false){
				    /*
					alert("loose" + this.turn);
					if(this.turn == 'W'){
						this.bWin += 1;
					}else{
						this.wWin += 1;
					}
					this.viewWin();
					*/
					this.turn = "S";
					var data = {
						team: this.myTeam,
						pieces: this.gPieces
					}
					this.socketio.emit("win", data);
				}
			}
			//if(this.drawKArea(piece, team, style
		}
		return ret;
	},
	findKing: function(targetPieces){
		var ret = null;
		for(var i=0; i < targetPieces.length; i++){
			if(targetPieces[i].role == 'K'){
				ret = targetPieces[i];
			}
		}
		return ret;
	},
	findEscape: function(king, checkPiece){
		var ret = new Array();
		ret.push(this.gCells[checkPiece.column][checkPiece.row]);
		if(checkPiece.role == 'L' || checkPiece.role == 'B' || checkPiece.role == 'Q'){
			var colAngle = '+';
			var rowAngle = '+';
			if(king.column < checkPiece.column){
				colAngle = '-';
			}else if(king.column == checkPiece.column){
				colAngle = '+0*';
			}
			if(king.row < checkPiece.row){
				rowAngle = '-';
			}else if(king.row == checkPiece.row){
				rowAngle = '+0*';
			}
			
			var i = 1;
			while(true){
				if(colAngle != '+0*'){
					if(eval("checkPiece.column" + colAngle + "i != king.column")){
						eval("ret.push(this.gCells[checkPiece.column" + colAngle + "i][checkPiece.row" + rowAngle + "i])");
					}else{
						break;
					}
				}else{
					if(eval("checkPiece.row" + rowAngle + "i != king.row")){
						eval("ret.push(this.gCells[checkPiece.column" + colAngle + "i][checkPiece.row" + rowAngle + "i])");
					}else{
						break;
					}
				}
				i++;
			}
		}
		return ret;
	},
	checkMateSimu: function(movePiece, col, row){
		var ret = false;
		var pieceColTemp = movePiece.column;
		var pieceRowTemp = movePiece.row;
		
		if(movePiece.live == 0){
			return ret;
		}
		
		var targetPiece = this.findPiece(col, row);
		if ( targetPiece === undefined || targetPiece === null) {
		}else{
			targetPiece.live = 0;
		}
		movePiece.column = col;
		movePiece.row = row;
		this.atackAreaRefresh();
		

		if(this.checkMateCheck(movePiece.team)){
			ret = true;
		}
		movePiece.row = pieceRowTemp
		movePiece.column = pieceColTemp;
			if ( targetPiece === undefined || targetPiece === null) {
		}else{
			targetPiece.live = 1;
		}
		return ret;	
	}
});

var Cell = Object.subClass({
	column:0,
	row:0,
	style:'rgb(150,150,150)',
	WAtack:0,
	BAtack:0,
	init:function(column, row, style){
		this.column = column;
		this.row = row;
		this.style = style;
	}
});

var Piece = Object.subClass({
	column:0,
	row:0,
	role:'',
	live:1,
	team:0,
	init:function(column, row, role, team){
		this.column = column;
	this.row = row;
		this.role = role;
		this.team = team;
	}
});