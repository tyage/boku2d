(function() {

Boku2D.World.prototype.elem = null;
Boku2D.World.prototype.ctx = null;
Boku2D.World.prototype.initCanvas = function(elem) {
	this.elem = elem;
	this.ctx = elem.getContext('2d');
	this.size = new Boku2D.Vec($(elem).width(), $(elem).height());
};
Boku2D.World.prototype.drawCanvas = function(time) {
	var ctx = this.ctx;
	if (ctx) {
		ctx.clearRect(0, 0, this.size.x, this.size.y);
	}
};

Boku2D.Object.prototype.drawCanvas = function(time) {
	var ctx = this.world.ctx;
	if (ctx) {
		var pos = this._minPos,
			size = this.size;
		
		ctx.fillStyle = this.color;
		ctx.fillRect(pos.x, pos.y, size.x, size.y)
		ctx.stroke();
	}
};

})();