(function(windowRef) {
	
	function Paddle() {
		this.x = 20;
		this.y = 300;
		
		this.width = 20;
		this.height = 150;
	}
	
	windowRef.Paddle = Paddle;
	
}(window));