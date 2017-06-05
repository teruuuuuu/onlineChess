var fs = require("fs");
var path = require("path");

var server = require("http").createServer(function(req, res){
  console.log("request:" + req.url);
  res.writeHead(200, {"Content-Type":"text/html"});
  
  //console.log("pathExist", path.existsSync("/onlineChess.html"));
  var output = "";
  try {
    fs.statSync("." + req.url);
    console.log("file found")
    output = fs.readFileSync("." + req.url, "utf-8");
  } catch (e) {
    console.log("no file");
  }
  res.end(output);
}).listen(8888);

console.log("server running port 8888");
var io = require("socket.io").listen(server);

var userHash = {};
var userRoomHash = {};
var roomStateHash = {};
var userTeamHash = {};
var roomPieces = {};
var roomTurn = {};
var roomScore = {}

io.sockets.on("connection",  function(socket) {
  console.log("connection connected socket-id" + socket.id);
  socket.join(socket.id);
  socket.on("roomSelect", function(data){
    console.log("roomSelect");
    console.log("roomClient" + io.sockets.manager);
    var name = data.name;
    var room = data.room;
    console.log("name:" + name + "; room" + room);
    if(room.match(/[^0-9]+/)){
      io.sockets.to(socket.id).emit("room", {result:0, msg:"フォーマットエラー"});
      console.log("フォーマットエラー");
      return;
    }
    if(roomStateHash[room] == undefined) roomStateHash[room] = 0;
    console.log("room" + room +" state:" + roomStateHash[room]);
    if(roomStateHash[room]>=2){
      io.sockets.to(socket.id).emit("room", {result:0, msg:"満室です"});
      return;
    }else{
      userHash[socket.id] = name;
      userRoomHash[socket.id] = room;
      if(roomStateHash[room] == null || roomStateHash[room] == 0){
        roomStateHash[room] = 1;
        userTeamHash[socket.id] = 'W';
        roomPieces[room] = piecesInit();
        roomTurn[room] = "S";
        roomScore[room] = new Score();
      }else{
        roomStateHash[room] += 1;
        if(roomStateHash[room] == 2){
          userTeamHash[socket.id] = 'B';
          roomTurn[room] = "W";
        }
      }
     //var html = fs.readFileSync("./socket_game.html", "utf-8");
     
     
     io.sockets.to(socket.id).emit("roomIn", {result:1,
                                msg:"あなたは room" + room + "に入室しました。",
                                team: userTeamHash[socket.id],
                                pieces: pieces,
                                turn: turn,
                                });
    
    }
    socket.join(userRoomHash[socket.id]);
    var pieces = roomPieces[room];
    var turn = roomTurn[room];
    io.sockets.to(userRoomHash[socket.id]).emit("turnChange",
                                  {msg:userHash[socket.id] + "がroom" + userRoomHash[socket.id] + "に入室しました",
                                  pieces: pieces,
                                  turn: turn,
                                  });
  });

  socket.on("connected", function(name){
    console.log("connected");
    var msg = name + "が入室しました";
    userHash[socket.id] = name;
    io.sockets.emit("publish", {value: msg});
  });

  socket.on("publish", function(msg){
    console.log("publish msg:" + msg);
    io.sockets.to(userRoomHash[socket.id]).emit("publish", {value:userHash[socket.id] + ":" +  msg});
  });
  
  socket.on("pieceMove", function(data){
    var turn = userTeamHash[socket.id];
    console.log("pieces move turn:" + turn);
    if(turn == "W"){
      turn = "B";
    }else{
      turn = "W";
    }
    io.sockets.to(userRoomHash[socket.id]).emit("turnChange",
                                  {msg:"",
                                  pieces: data.pieces,
                                  turn: turn,
                                  check: data.check,
                                  });
  });
  
  socket.on("win", function(data){
    var room = userRoomHash[socket.id];
    var score = roomScore[room];
    score.win(data.team);
    io.sockets.to(userRoomHash[socket.id]).emit("gameEnd",
                                  {msg:"",
                                  pieces: data.pieces,
                                  score: score,
                                  });
  });

  socket.on("disconnect", function(){
    console.log("disconnect");
    if(userHash[socket.id]){
      var msg = userHash[socket.id] + "が退出しました";
      io.sockets.to(userRoomHash[socket.id]).emit("publish", {value:msg});
      if(roomStateHash[userRoomHash[socket.id]] != undefined){
        roomStateHash[userRoomHash[socket.id]] -= 1;
      }
      console.log("room" + userRoomHash[socket.id] + "state:" + roomStateHash[userRoomHash[socket.id]]);
      delete userRoomHash[socket.id];
      delete userHash[socket.id];
    }
  });
  
});


Object.subClass = function(properties) {                           //#2
  var _super = this.prototype;

  // Instantiate a base class (but only create the instance,
  // don't run the init constructor)
  initializing = true;                                              //#3
  var proto = new this();                                           //#3
  initializing = false;                                             //#3

  // Copy the properties over onto the new prototype
  for (var name in properties) {                                    //#4
    // Check if we're overwriting an existing function
    proto[name] = typeof properties[name] == "function" &&
                  typeof _super[name] == "function" &&
                  superPattern.test(properties[name]) ?
        (function(name, fn) {                                        //#5
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, properties[name]) :
        properties[name];
  }

  // The dummy class constructor
  function Class() {                                                   //#6
    // All construction is actually done in the init method
    if (!initializing && this.init)
      this.init.apply(this, arguments);
  }

  // Populate our constructed prototype object
  Class.prototype = proto;                                             //#7

  // Enforce the constructor to be what we expect
  Class.constructor = Class;                                           //#8

  // And make this class extendable
  Class.subClass = arguments.callee;                                   //#9

  return Class;
};

var Piece = Object.subClass({
	column:0,
	row:0,
	role:'',
	live:1,
	team:0,
	init:function(column, row, role, team, live){
		this.column = column;
		this.row = row;
		this.role = role;
		this.team = team;
		this.live = live;
	}
});

var Score = Object.subClass({
	wWin:0,
	bWin:0,
	win:function(team){
		if(team == "W"){
		 	this.wWin += 1;
		}else{
		 	this.bWin += 1;
		}
	}
});

function piecesInit(){
	
	var blackData = [
			[0,0,'L'],[1,0,'N'],[2,0,'B'],[3,0,'Q'],[4,0,'K'],[5,0,'B'],[6,0,'N'],[7,0,'L'],
			[0,1,'P'],[1,1,'P'],[2,1,'P'],[3,1,'P'],[4,1,'P'],[5,1,'P'],[6,1,'P'],[7,1,'P']
		];
	/*
	var blackData = [
			[0,1,'P'],[4,0,'K']
		];
	*/
	var blackPeace =[]
	for(var i=0; i<blackData.length; i++){
		blackPeace[i] = new Piece(blackData[i][0], blackData[i][1], blackData[i][2], 'B', 1);
	}
	
	var whiteData = [
			[0,7,'L'],[1,7,'N'],[2,7,'B'],[3,7,'Q'],[4,7,'K'],[5,7,'B'],[6,7,'N'],[7,7,'L'],
			[0,6,'P'],[1,6,'P'],[2,6,'P'],[3,6,'P'],[4,6,'P'],[5,6,'P'],[6,6,'P'],[7,6,'P']
		];
	/*
	var whiteData = [[7,6,'P'],[4,7,'K']
		];
	*/
	var whitePeace =[]
	for(var j=0; j<whiteData.length; j++){
		whitePeace[j] = new Piece(whiteData[j][0], whiteData[j][1], whiteData[j][2], 'W', 1);
	}
	
	var gPieces = {
		white:whitePeace,
		black:blackPeace
	}
	return gPieces;
}

