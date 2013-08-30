(function(windowRef) {

	Pong.GAME_WIDTH = 800;
	Pong.GAME_HEIGHT = 600;
	
	Pong.PLAYER_PADDLE_EASE = 0.3;
	Pong.CPU_PADDLE_MIN_EASE = 0.005;
	Pong.CPU_PADDLE_MAX_EASE = 0.13;
	
	//Graphic asset positioning format:- x, y: top-left position to begin sampling from; w, h: width and height of rectangle to sample//
	Pong.BALL_ASSET = { x:80, y:0, w:80, h:80 };
	Pong.PADDLE_ASSET = { x:0, y:0, w:80, h:210 };
	Pong.GRID_ASSET = { x:190, y:0, w:800, h:600 };
	Pong.DIGIT_ASSETS = [
		{ x:7, y:208, w:78, h:78 },		//0
		{ x:7, y:286, w:78, h:78 },		//1
		{ x:7, y:364, w:78, h:78 },		//2
		{ x:7, y:442, w:78, h:78 },		//3
		{ x:7, y:520, w:78, h:78 },		//4
		{ x:87, y:208, w:78, h:78 },	//5
		{ x:87, y:286, w:78, h:78 },	//6
		{ x:87, y:364, w:78, h:78 },	//7
		{ x:87, y:442, w:78, h:78 },	//8
		{ x:87, y:520, w:78, h:78 }		//9
	];
	
	Pong.AUDIO_ASSETS = [
		{ id:"wall", url:"E4.mp3" },
		{ id:"left", url:"D5.mp3" },
		{ id:"right", url:"F5.mp3" },
		{ id:"score", url:"A3.mp3" }
	];
	
	function Pong() {
		this.ball = new Ball();
		this.leftPaddle = new Paddle();
		this.rightPaddle = new Paddle();
		
		this.audioInited = false;
		this.audioLoading = false;
		
		this.leftScore = 0;
		this.rightScore = 0;
		
		this.mouseY = 300;
		
		this.rightPaddle.x = Pong.GAME_WIDTH - 20;
	}
	
	Pong.prototype.audio_set = function(audioObj) {
		this.audio = audioObj;
	}
	
	Pong.prototype.canvas_set = function(canvasRef) {
		this.canvas = canvasRef;
		this.context = this.canvas.getContext("2d");
		
		var thisRef = this;
		
		this.canvas.addEventListener("touchmove", function (evt) {
			thisRef.canvas_touchMove(evt);
		}, false);
		
		this.canvas.addEventListener("mousemove", function (evt) {
			thisRef.canvas_mouseMove(evt);
		}, false);
	}
	
	Pong.prototype.container_set = function(divContainer) {
		this.container = divContainer;
	}
	
	Pong.prototype.visualAssets_set = function(assetsImage) {
		this.assets = assetsImage;
	}
	
	Pong.prototype.canvas_mouseMove = function(evt) {
		if (evt.offsetY) this.mouseY = (evt.offsetY * Pong.GAME_HEIGHT) / parseInt(this.container.style.height, 10);
		else if (evt.pageY) this.mouseY = ((evt.pageY - parseInt(this.container.style.top, 10)) * Pong.GAME_HEIGHT) / parseInt(this.container.style.height, 10);
		
		if (! this.audioInited) this.audio_init();
	}
	
	Pong.prototype.canvas_touchMove = function(evt) {
		this.mouseY = ((evt.targetTouches[0].pageY - parseInt(this.container.style.top, 10)) * Pong.GAME_HEIGHT) / parseInt(this.container.style.height, 10);
		
		if (! this.audioInited) this.audio_init();
	}
	
	Pong.prototype.audio_init = function() {
		if (this.audioLoading) return;
		this.audioContext = null;
		this.useWebAudioApi = true;
		
		if (typeof AudioContext !== "undefined") {
			this.audioContext = new AudioContext();
		} else if (typeof webkitAudioContext !== "undefined") {
			this.audioContext = new webkitAudioContext();
		} else {
			this.useWebAudioApi = false;
		}
		
		if (this.useWebAudioApi) {
			if (this.audioLoading) return;
			buffer = this.audioContext.createBuffer(1, 1, 22050);
			var source = this.audioContext.createBufferSource();
			source.buffer = buffer;
			source.connect(this.audioContext.destination);
			source.noteOn(0);
			
			this.audioLoading = true;
			this.currentLoadingClip = -1;
			this.numAudioClips = Pong.AUDIO_ASSETS.length;
			this.webAudio_loadNext();
			return;
		}
		
		this.audio.wall.play();
		this.audio.wall.pause();
		
		this.audio.left.play();
		this.audio.left.pause();
		
		this.audio.right.play();
		this.audio.right.pause();
		
		this.audio.score.play();
		this.audio.score.pause();
		
		this.audioInited = true;
	}
	
	Pong.prototype.webAudio_loadNext = function() {
		var thisRef = this;							//To allow inline functions to reference the 'class' instance
		var clipRef = thisRef.currentLoadingClip;	//To circumvent clip number from incrementing out of step following audio decode stage
		if (clipRef != -1) {
			this.audioContext.decodeAudioData(Pong.AUDIO_ASSETS[clipRef].request.response, function(incomingBuffer) { Pong.AUDIO_ASSETS[clipRef].buffer = incomingBuffer; });
		}
		
		this.currentLoadingClip ++;
		if (this.currentLoadingClip >= this.numAudioClips) {
			this.audioInited = true;
			return;
		}
		
		Pong.AUDIO_ASSETS[this.currentLoadingClip].request = new XMLHttpRequest();
		Pong.AUDIO_ASSETS[this.currentLoadingClip].request.onload = function () { thisRef.webAudio_loadNext(); };
		Pong.AUDIO_ASSETS[this.currentLoadingClip].request.responseType = "arraybuffer";
		Pong.AUDIO_ASSETS[this.currentLoadingClip].request.open("get", Pong.AUDIO_ASSETS[this.currentLoadingClip].url, true);
		Pong.AUDIO_ASSETS[this.currentLoadingClip].request.send();
	}
	
	Pong.prototype.audio_play = function(clipId) {
		if (! this.audioInited) return;
		
		if (this.useWebAudioApi) {
			var audioObj;
			for (var i = 0; i < this.numAudioClips; i++) {
				if (Pong.AUDIO_ASSETS[i].id == clipId) {
					audioObj = Pong.AUDIO_ASSETS[i];
					break;
				}
			}
			if (! audioObj) return;
			
			var source = this.audioContext.createBufferSource();
			source.buffer = audioObj.buffer;
			source.connect(this.audioContext.destination);
			source.noteOn(0);
			
		} else {
			this.audio[clipId].play();
		}
	}
	
	Pong.prototype.state_update = function() {
		this.ball.position_update();
		
		//Move player paddle//
		this.leftPaddle.y = this.leftPaddle.y + ((this.mouseY - this.leftPaddle.y) * Pong.PLAYER_PADDLE_EASE);
		
		//Move CPU paddle//
		var rightDist = (this.ball.xVel < 0) ? 0.3 * (Pong.GAME_WIDTH - this.ball.x) : Pong.GAME_WIDTH + this.ball.x;
		var cpuEase = this.value_easeExponential(rightDist/(Pong.GAME_WIDTH*2), Pong.CPU_PADDLE_MIN_EASE, (Pong.CPU_PADDLE_MAX_EASE - Pong.CPU_PADDLE_MIN_EASE));
		this.rightPaddle.y = this.rightPaddle.y + ((this.ball.y - this.rightPaddle.y) * cpuEase);
		
		//Top/bottom wall bounces//
		if ((this.ball.y - (this.ball.height * 0.5)) <= 15) {
			this.wall_bounce();
		} else if ((this.ball.y + (this.ball.height * 0.5)) >= (Pong.GAME_HEIGHT-15)) {
			this.wall_bounce();
		} else {
			this.ball.wallBouncedLastStep = false;
		}
		
		var intersectingPaddle = false;
		var setPassedEdge = false;

		//Left paddle//
		if ((this.ball.x - (this.ball.width * 0.5)) <= (this.leftPaddle.x + (this.leftPaddle.width * 0.5))) {		//Past right edge of left paddle
			
			if ( ((this.ball.y + (this.ball.height * 0.5)) >= (this.leftPaddle.y - (this.leftPaddle.height * 0.5))) && ((this.ball.y - (this.ball.height * 0.5)) <= (this.leftPaddle.y + (this.leftPaddle.height * 0.5))) ) {
				intersectingPaddle = true;
			} else {
				setPassedEdge = true;
			}
			
			if (intersectingPaddle) {
				if (this.ball.passedEdge) {
					if ((this.ball.y < this.leftPaddle.y) && (this.ball.yVel > 0)) this.wall_bounce();//this.paddleEdge_bounce("left");
					else if ((this.ball.y > this.leftPaddle.y) && (this.ball.yVel < 0)) this.wall_bounce();//this.paddleEdge_bounce("left");
				} else {
					this.ball.paddle_bounce(this.leftPaddle.y, "left");
					setPassedEdge = false;
					this.audio_play("left");
				}
			}
			
			if (setPassedEdge) this.ball.passedEdge = true;
		}
		
		//Right paddle//
		if ((this.ball.x + (this.ball.width * 0.5)) >= (this.rightPaddle.x - (this.rightPaddle.width * 0.5))) {		//Past left edge of right paddle
			
			if ( ((this.ball.y + (this.ball.height * 0.5)) >= (this.rightPaddle.y - (this.rightPaddle.height * 0.5))) && ((this.ball.y - (this.ball.height * 0.5)) <= (this.rightPaddle.y + (this.rightPaddle.height * 0.5))) ) {
				intersectingPaddle = true;
			} else {
				setPassedEdge = true;
			}
			
			if (intersectingPaddle) {
				if (this.ball.passedEdge) {
					if ((this.ball.y < this.rightPaddle.y) && (this.ball.yVel > 0)) this.wall_bounce();//this.paddleEdge_bounce("right");
					else if ((this.ball.y > this.rightPaddle.y) && (this.ball.yVel < 0)) this.wall_bounce();//this.paddleEdge_bounce("right");
				} else {
					this.ball.paddle_bounce(this.rightPaddle.y, "right");
					setPassedEdge = false;
					this.audio_play("right");
				}
			}
			
			if (setPassedEdge) this.ball.passedEdge = true;
		}
		
		if ((this.ball.x + (this.ball.width * 0.5)) < 0) {
			this.point_score("right");
		} else if ((this.ball.x - (this.ball.width * 0.5)) > Pong.GAME_WIDTH) {
			this.point_score("left");
		}
	}
	
	Pong.prototype.value_easeExponential = function(prop, init, maxDelta) {
		return maxDelta * Math.pow(2, 10 * (prop - 1)) + init;
	};
	
	Pong.prototype.wall_bounce = function() {
		this.ball.wall_bounce();
		this.audio_play("wall");
	}
	
	Pong.prototype.paddleEdge_bounce = function(paddle) {
		this.ball.wall_bounce();
		
		if (paddle == "left") this.audio_play("left");
		else this.audio_play("right");
	}
	
	Pong.prototype.point_score = function(scorer) {
		if (scorer == "left") {
			this.leftScore ++;
		} else {
			this.rightScore ++;
		}
		
		if ((this.leftScore >= 10) || (this.rightScore >= 10)) {
			this.leftScore = 0;
			this.rightScore = 0;
		}
		
		this.ball.position_reset();
		
		this.audio_play("score");
	}
	
	Pong.prototype.state_render = function() {
		if (! this.canvas) {
			console.log("No canvas reference!");
			return;
		}
		
		//Clear canvas//
		this.context.fillStyle = "rgb(20, 20, 20)";
		this.context.fillRect(0, 0, Pong.GAME_WIDTH, Pong.GAME_HEIGHT);
		
		//Draw ball//
		this.asset_draw(Pong.BALL_ASSET, this.ball.x, this.ball.y);
		
		//Draw paddles//
		this.asset_draw(Pong.PADDLE_ASSET, this.leftPaddle.x, this.leftPaddle.y);
		this.asset_draw(Pong.PADDLE_ASSET, this.rightPaddle.x, this.rightPaddle.y);
		
		//Draw score//
		this.asset_draw(Pong.DIGIT_ASSETS[this.leftScore], Pong.GAME_WIDTH * 0.25, 50);
		this.asset_draw(Pong.DIGIT_ASSETS[this.rightScore], Pong.GAME_WIDTH * 0.75, 50);
		
		//Draw grid//
		this.asset_draw(Pong.GRID_ASSET, Pong.GAME_WIDTH * 0.5, Pong.GAME_HEIGHT * 0.5);
	}
	
	Pong.prototype.asset_draw = function(posObj, locX, locY) {
		//Arguments: source image, sample origin X, sample origin Y, sample width, sample height, canvas target X, canvas target Y, target width, target height
		this.context.drawImage(this.assets, posObj.x, posObj.y, posObj.w, posObj.h, locX - (posObj.w * 0.5), locY - (posObj.h * 0.5), posObj.w, posObj.h);
	}
	
	
	windowRef.Pong = Pong;
	
}(window));