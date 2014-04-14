(function() {

InitDOM = function (elem) {
	var key, data = jQuery(elem).data();
	for (key in data) {
		this[key] = data[key];
	}
};

Boku2D.Model.defaults.elem = null;
var afterStep = Boku2D.Model.defaults.afterStep;
Boku2D.Model.defaults.afterStep = function(time) {
	var elem = this.elem;
	if (elem) {
		var pos = this.minPos();
		elem.style.left = pos.x + "px";
		elem.style.top = pos.y + "px";
	}
	afterStep.call(this, time);
};
Boku2D.Model.defaults.initDOM = function(option) {
	var $elem = jQuery(option),
		pos = $elem.position();
		
	InitDOM.call(this, option);
	this.elem = option;
	this.size = new Boku2D.Vec($elem.width(), $elem.height());
	this.center = (new Boku2D.Vec(pos.left, pos.top))
		.add(this.size.divide(2));
};

Boku2D.World.prototype.initDOM = function(option) {
	var $elem = jQuery(option);
	
	InitDOM.call(this, option);
	this.size = new Boku2D.Vec($elem.width(), $elem.height());
};

})();