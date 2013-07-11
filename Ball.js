(function(windowRef) {
	
	Ball.START_X = 400;
	Ball.START_Y = 300;
	Ball.INIT_VELOCITY = 4;	//Pixels per frame
	Ball.MAX_VELOCITY = 19;
	Ball.ROTATIONAL_BOOST = Math.PI * 0.15;
	Ball.HALF_PADDLE_HEIGHT = 75;
	Ball.MIN_ANGLE = Math.PI / 10;
	
	function Ball() {
		this.width = 20;
		this.height = 20;
		this.wallBouncedLastStep = false;
		
		this.position_reset();
	}
	
	Ball.prototype.position_reset = function() {
		this.x = Ball.START_X;
		this.y = Ball.START_Y;
		this.passedEdge = false;
		goingRight = Math.random() > 0.5;
		furtherRound = Math.random() > 0.5;
		this.direction = goingRight ? (Math.PI * 0.125) + (Math.random() * Math.PI * 0.25) : (Math.PI * 1.125) + (Math.random() * Math.PI * 0.25);
		this.direction = furtherRound ? this.direction + 0.25 : this.direction;
		
		this.velocity = Ball.INIT_VELOCITY;
		this.xVel = Math.sin(this.direction) * this.velocity;
		this.yVel = -1 * (Math.cos(this.direction) * this.velocity);
	}
	
	Ball.prototype.wall_bounce = function() {
		if (this.wallBouncedLastStep) {
			this.wallBouncedLastStep = false;
			return;
		}
		this.direction = (this.direction * -1) + Math.PI;
		this.xVel = Math.sin(this.direction) * this.velocity;
		this.yVel = -1 * (Math.cos(this.direction) * this.velocity);
		this.wallBouncedLastStep = true;
	}
	
	Ball.prototype.paddle_bounce = function(paddleY, side) {
		if (this.velocity < Ball.MAX_VELOCITY) this.velocity ++;
		
		this.direction += (2 * ((Math.PI * 0.5) - this.direction)) + Math.PI;
		
		var boost = Ball.ROTATIONAL_BOOST * ((paddleY - this.y) / Ball.HALF_PADDLE_HEIGHT);
		this.direction += side == "right" ? boost : (-1 * boost);
		
		this.direction %= Math.PI * 2;
		
		if (side == "left") {
			if ( (this.direction < Ball.MIN_ANGLE) || (this.direction > (Math.PI * 1.5)) ) this.direction = Ball.MIN_ANGLE;
			else if (this.direction > (Math.PI - Ball.MIN_ANGLE)) this.direction = Math.PI - Ball.MIN_ANGLE;
		} else {
			if ( (this.direction < (Math.PI + Ball.MIN_ANGLE)) && (this.direction > (Math.PI * 0.5)) ) this.direction = Math.PI + Ball.MIN_ANGLE;
			else if (this.direction > ((Math.PI * 2) - Ball.MIN_ANGLE) || (this.direction < (Math.PI * 0.5))) this.direction = (Math.PI * 2) - Ball.MIN_ANGLE;
		}
		
		this.xVel = Math.sin(this.direction) * this.velocity;
		this.yVel = -1 * (Math.cos(this.direction) * this.velocity);
	}
	
	Ball.prototype.position_update = function() {
		this.x += this.xVel;
		this.y += this.yVel;
	} 
	
	windowRef.Ball = Ball;
	
}(window));