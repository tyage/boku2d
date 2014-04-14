var objects = [
	{
		type: 'controll',
		center: new Boku2D.Vec(100, 20)
	},
	{
		type: 'block',
		center: new Boku2D.Vec(20, 20)
	},
	{
		type: 'block',
		center: new Boku2D.Vec(20, 120)
	},
	{
		type: 'block',
		center: new Boku2D.Vec(20, 220)
	},
	{
		type: 'block',
		center: new Boku2D.Vec(220, 20)
	},
	{
		type: 'block',
		center: new Boku2D.Vec(220, 120)
	},
	{
		type: 'block',
		center: new Boku2D.Vec(220, 220)
	},
	{
		type: 'floating',
		center: new Boku2D.Vec(50, 50)
	},
	{
		type: 'floating',
		center: new Boku2D.Vec(50, 150)
	},
	{
		type: 'floating',
		center: new Boku2D.Vec(50, 250)
	},
	{
		type: 'floating',
		center: new Boku2D.Vec(250, 50)
	},
	{
		type: 'floating',
		center: new Boku2D.Vec(250, 150)
	},
	{
		type: 'floating',
		center: new Boku2D.Vec(250, 250)
	},
	{
		type: 'fixed',
		center: new Boku2D.Vec(150, 50)
	},
	{
		type: 'fixed',
		center: new Boku2D.Vec(150, 150)
	},
	{
		type: 'fixed',
		center: new Boku2D.Vec(150, 250)
	},
	{
		type: 'fixed',
		center: new Boku2D.Vec(0, 0),
		size: new Boku2D.Vec(600, 1)
	},
	{
		type: 'fixed',
		center: new Boku2D.Vec(0, 300),
		size: new Boku2D.Vec(600, 1)
	},
	{
		type: 'fixed',
		center: new Boku2D.Vec(0, 0),
		size: new Boku2D.Vec(1, 600)
	},
	{
		type: 'fixed',
		center: new Boku2D.Vec(300, 0),
		size: new Boku2D.Vec(1, 600)
	}
];

Boku2D.World.prototype.beforeStep = Boku2D.World.prototype.drawCanvas;

Boku2D.Object.prototype.size = new Boku2D.Vec(20, 20);
Boku2D.Object.prototype.color = 'black';
Boku2D.Object.prototype.gravity = new Boku2D.Vec(0, 5);
Boku2D.Object.prototype.afterStep = function(time) {
	if (!this._color) {
		this._color = this.color || 'black';
	}
	this.color = this.contacts.length > 0 ? "red" : this._color;
	this.drawCanvas();
};

Boku2D.Model.controll.color = 'purple';
Boku2D.Model.floating.color = 'green';
Boku2D.Model.fixed.color = 'blue';
Boku2D.Model.block = {};

$(function () {
	var world = new Boku2D.World();
	world.initCanvas($("#world").get(0));
	
	for (i=0,l=objects.length;i<l;i++) {
		var data = objects[i];
		var object = new Boku2D.Object(
			$.extend(false, Boku2D.Model[data.type], data)
		);
		world.createObject(object);
	}
	
	setInterval(function () {
		world.step(0.1);
	}, 13);
});