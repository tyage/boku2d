window.Boku2D = (function() {

if (!Array.indexOf) {
	Array.prototype.indexOf = function(o) {
		for(var i in this) {
			if(this[i] == o) {
				return i;
			}
		}
		return -1;
	}
}

/*
	Recursive Dimensional Clustering
	http://lab.polygonal.de/articles/recursive-dimensional-clustering/
*/
// RDC.SUBDIVISION_THRESHOLD = 4;
// RDC.CONTACT_THRESHOLD = 0.1;
var bruteForce = function (group) {
	for (var i=0,l=group.length; i<l; i++) {
		var g = group[i];
		for (var j=i+1; j<l; j++) {
			collide(g, group[j]);
		}
	}
};
var recursiveClustering = function (group, axis1, axis2) {
	// if (axis1 === -1 || group.length < RDC.SUBDIVISION_THRESHOLD) {
	if (axis1 === -1 || group.length < 4) {
		bruteForce(group);
	} else {
		var boundaries = getOpenCloseBounds(group, axis1);		
		boundaries.sort(function (a, b) {
			return a.pos - b.pos;
		});
		
		var newAxis1 = axis2;
		var newAxis2 = -1;
		var groupSubdivided = false;
		var subgroup = [];
		var count = 0;
		for (var i=0,l = boundaries.length; i<l; i++) {
			var b = boundaries[i];
			if (b.type === 1) {
				count++;
				subgroup.push(b.obj);
			} else {
				count--;
				if (count === 0) {
					if (i !== (l - 1)) {
						groupSubdivided = true;
					}
					
					if (groupSubdivided) {
						if (axis1 === 0) {
							newAxis1 = 1;
						} else if (axis1 === 1) {
							newAxis1 = 0;
						}
					}
					
					recursiveClustering(subgroup, newAxis1, newAxis2);
					subgroup = [];
				}
			}
		}
	}
};
var getOpenCloseBounds = function (group, axis) {
	var l = group.length;
	var boundaries = [];
	
	switch(axis)
	{
		case 0:
			for (var i=0; i<l; i++) {
				var o = group[i];
				var center = o.center.x;
				var size = o.size.x;
				boundaries.push({
					type: 1, 
					// pos: o.center.x - o.size.x + RDC.CONTACT_THRESHOLD,
					pos: center - size + 0.1,
					obj: o
				});
				boundaries.push({
					type: 0, 
					// pos: o.center.x + o.size.x - RDC.CONTACT_THRESHOLD,
					pos: center + size - 0.1,
					obj: o
				});
			}
			break;
		case 1:
			for (var i=0; i<l; i++) {
				var o = group[i];
				var center = o.center.y;
				var size = o.size.y;
				boundaries.push({
					type: 1, 
					// pos: o.center.y - o.size.y + RDC.CONTACT_THRESHOLD,
					pos: center - size + 0.1,
					obj: o
				});
				boundaries.push({
					type: 0, 
					// pos: o.center.y + o.size.y - RDC.CONTACT_THRESHOLD,
					pos: center + size - 0.1,
					obj: o
				});
			}
	}
	return boundaries;
};

/*
	衝突処理
*/
var collide = function(object1, object2) {
	if (!checkContact(object1, object2)) {
		return;
	}
	
	var contacts = object1.contacts;
	var contact = null;
	var c = null;
	for (var i=0,l=contacts.length;i<l;i++) {
		c = contacts[i];
		if (c.manifolds[0].opponent === object2 || 
			c.manifolds[1].opponent === object2) {
			contact = c;
			break;
		}
	}
	
	if (contact) {
		contact.update();
	} else {
		new Contact(object1, object2);
	}
};

/*
	衝突判定
*/
var checkContact = function(object1, object2) {
	return object1._maxPos.x >= object2._minPos.x && 
		object1._minPos.x <= object2._maxPos.x &&
		object1._maxPos.y >= object2._minPos.y && 
		object1._minPos.y <= object2._maxPos.y;
};

/*
	拡張
*/
var extend = function(obj, option) {
	if (!option) {
		return;
	}
	
	/*
	obj = $.extend(true, obj, option);
	*/
	var key;
	for (key in option) {
		if (option.hasOwnProperty(key)) {
			obj[key] = option[key];
		}
	}
};

/*
	ベクトル
*/
var Vec = function(x, y) {
	this.x = x || 0;
	this.y = y || 0;
};
Vec.prototype = {
	copy: function() {
		return new Vec(this.x, this.y);
	},
	add: function(v, y) {
		if (y !== undefined) {
			v = new Vec(v, y);
		}
		
		var x = this.x + v.x,
			y = this.y + v.y;
		return new Vec(x, y);
	},
	subtract: function(v, y) {
		if (y !== undefined) {
			v = new Vec(v, y);
		}
		
		var x = this.x - v.x,
			y = this.y - v.y;
		return new Vec(x, y);
	},
	multiply: function(i) {
		var x = this.x * i,
			y = this.y * i;
		return new Vec(x, y);
	},
	divide: function(i) {
		var x = this.x / i,
			y = this.y / i;
		return new Vec(x, y);
	},
	dot: function(v) {
		return this.x * v.x + this.y * v.y;
	},
	length: function() {
		return Math.sqrt(this.x*this.x + this.y*this.y);
	},
	normalize: function() {
		var length = this.length();
		return this.divide(length);
	}
};

var Event = function() {
	this.events = {};
};
Event.prototype = {
	bind: function(key, func) {
		if (!this.events[key]) {
			this.events[key] = [];
		}
		this.events[key].push(func);
	},
	unbind: function(key, func) {
		var event = this.events[key];
		if (event) {
			var index = event.indexOf(func);
            if (index != -1) {
				event.splice(index, 1);
			}
		}
	},
	trigger: function(key, caller, e) {
		this.events[key].call(caller, e);
	}
};

/*
	衝突点
*/
var Manifold = function(object, opponent, direction) {
	this.object = object;
	this.opponent = opponent;
	this.direction = direction;
	this.normal = new Vec();
};
Manifold.prototype = {
	solve: function() {
		var move = this.object;
		var fixed = this.opponent;
		var friction = Math.sqrt(move.friction * fixed.friction);
		var spring = Math.sqrt(move.elastic * fixed.elastic);
		var damp = Math.sqrt(move.viscosity * fixed.viscosity);
		// var relSpeed = move.speed.subtract(fixed.speed);
		var relSpeed = {
			x: move.speed.x - fixed.speed.x,
			y: move.speed.y - fixed.speed.y
		};
		var diff = {
			x: 0,
			y: 0
		};
		var direction = this.direction;
		var contactsCount = move.contacts.length;
		var normal = this.normal;
		
		if (move.fixed) {
			return false;
		}
		
		// 衝突解決
		// normal = new Vec();
		normal.x = 0;
		normal.y = 0;
		if (direction.x !== 0) {
			diff.x = direction.x < 0 ? 
				move._maxPos.x - fixed._minPos.x : 
				fixed._maxPos.x - move._minPos.x;
			normal.x = spring * diff.x * direction.x - damp * relSpeed.x;
		}
		if (direction.y !== 0) {
			diff.y = direction.y < 0 ? 
				move._maxPos.y - fixed._minPos.y : 
				fixed._maxPos.y - move._minPos.y;
			normal.y = spring * diff.y * direction.y - damp * relSpeed.y;
		}
		move.applyForce({
			x: normal.x / contactsCount,
			y: normal.y / contactsCount
		});
		
		// 摩擦
		var n = normal.length();
		// var force = new Vec(n, n).multiply(friction);
		var force = {
			x: n * friction,
			y: n * friction
		};
		var maxForceX = Math.abs(move.force.x);
		var maxForceY = Math.abs(move.force.y);
		if (force.x > maxForceX) {
			force.x = maxForceX;
		}
		if (force.y > maxForceY) {
			force.y = maxForceY;
		}
		if (direction.y !== 0) {
			if (relSpeed.x > 0) {
				force.x = -force.x;
			}
		} else {
			force.x = 0;
		}
		if (direction.x !== 0) {
			if (relSpeed.y > 0) {
				force.y = -force.y;
			}
		} else {
			force.y = 0;
		}
		move.applyForce(force);
		// !fixed.fixed && fixed.applyForce(force.multiply(-1));
		!fixed.fixed && fixed.applyForce({
			x: force.x * -1,
			y: force.y * -1
		});
	}
};

/*
	衝突
*/
var Contact = function(object1, object2) {
	var direction1 = this._getDirection(object1, object2);
	// direction2 = direction1.multiply(-1);
	var direction2 = new Vec();
	direction2.x = direction1.x * -1;
	direction2.y = direction1.y * -1;
	
	var manifold1 = new Manifold(object1, object2, direction1);
	var manifold2 = new Manifold(object2, object1, direction2);
	this.manifolds = [manifold1, manifold2];
	
	this.world = object1.world;
	this.object1 = object1;
	this.object2 = object2;
	
	object1.contacts.push(this);
	object2.contacts.push(this);
	object1.world.contacts.push(this);
	
	this.update();
	
	var manifolds = this.manifolds;
	for (var i=0,l=manifolds.length;i<l;i++) {
		var manifold = manifolds[i];
		manifold.object.createContact(this, manifold);
	}
};
Contact.prototype = {
	_stepCount: 0,
	update: function() {
		this._stepCount = this.world._stepCount;
		
		var manifolds = this.manifolds;
		for (var i=0,l=manifolds.length;i<l;i++) {
			var manifold = manifolds[i];
			manifold.object.updateContact(this, manifold);
		}
	},
	solve: function() {
		var manifolds = this.manifolds;
		for (var i=0,l=manifolds.length;i<l;i++) {
			var manifold = manifolds[i];
			manifold.object.beforeSolve(this, manifold);
			manifold.solve();
			manifold.object.afterSolve(this, manifold);
		}
	},
	destroy: function() {
		this._removeFromList(this.world.contacts);
		this._removeFromList(this.object1.contacts);
		this._removeFromList(this.object2.contacts);
		
		var manifolds = this.manifolds;
		for (var i=0,l=manifolds.length;i<l;i++) {
			var manifold = manifolds[i];
			manifold.object.destroyContact(this, manifold);
		}
	},
	_removeFromList: function(contacts) {
		var index = contacts.indexOf(this);
		if (index >= 0) {
			delete contacts[index];
			contacts.splice(index, 1);
		}
	},
	_getDirection: function(object1, object2) {
		var direction = new Vec();
		
		// 前回の位置から衝突方向を調べる
		if (object1._maxPrePos.x < object2._minPrePos.x && 
			object1._maxPos.x > object2._minPos.x) {
			// direction = direction.add(-1, 0);
			direction.x += -1;
		}
		if (object1._minPrePos.x > object2._maxPrePos.x && 
			object1._minPos.x < object2._maxPos.x) {
			// direction = direction.add(1, 0);
			direction.x += 1;
		}
		if (object1._maxPrePos.y < object2._minPrePos.y &&
			object1._maxPos.y > object2._minPos.y) {
			// direction = direction.add(0, -1);
			direction.y += -1;
		}
		if (object1._minPrePos.y > object2._maxPrePos.y && 
			object1._minPos.y < object2._maxPos.y) {
			// direction = direction.add(0, 1);
			direction.y += 1;
		}
		
		// 最小分離距離を計る
		if (direction.x === 0 && direction.y === 0) {
			var minDistanse;
			var distanse;
			
			if ((object2._minPos.x <= object1._minPos.x && 
				object1._minPos.x <= object2._maxPos.x) || 
				(object1._minPos.x <= object2._maxPos.x && 
				object2._maxPos.x <= object1._maxPos.x)) {
				// 左衝突
				distanse = object2._maxPos.x - object1._minPos.x;
				if (minDistanse === undefined || distanse < minDistanse) {
					// direction = new Vec(1, 0);
					direction = {
						x: 1,
						y: 0
					};
					minDistanse = distanse;
				}
			}
			if ((object2._minPos.x <= object1._maxPos.x && 
				object1._maxPos.x <= object2._maxPos.x) || 
				(object1._minPos.x <= object2._minPos.x && 
				object2._minPos.x <= object1._maxPos.x)) {
				// 右衝突
				distanse = object1._maxPos.x - object2._minPos.x;
				if (minDistanse === undefined || distanse < minDistanse) {
					// direction = new Vec(-1, 0);
					direction = {
						x: -1,
						y: 0
					};
					minDistanse = distanse;
				}
			}
			if ((object2._minPos.y <= object1._minPos.y && 
				object1._minPos.y <= object2._maxPos.y) || 
				(object1._minPos.y <= object2._maxPos.y && 
				object2._maxPos.y <= object1._maxPos.y)) {
				// 上衝突
				var distanse = object2._maxPos.y - object1._minPos.y;
				if (minDistanse === undefined || distanse < minDistanse) {
					// direction = new Vec(0, 1);
					direction = {
						x: 0,
						y: 1
					};
					minDistanse = distanse;
				}
			}
			if ((object2._minPos.y <= object1._maxPos.y && 
				object1._maxPos.y <= object2._maxPos.y) || 
				(object1._minPos.y <= object2._minPos.y && 
				object2._minPos.y <= object1._maxPos.y)) {
				// 下衝突
				var distanse = object1._maxPos.y - object2._minPos.y;
				if (minDistanse === undefined || distanse < minDistanse) {
					// direction = new Vec(0, -1);
					direction = {
						x: 0,
						y: -1
					};
					minDistanse = distanse;
				}
			}
		}
		
		return direction;
	}
};

var Object = function(option) {
	this.speed = this.speed.copy();
	this.force = this.force.copy();
	this.accel = this.accel.copy();
	this.center = this.center.copy();
	this.preCenter = this.center.copy();
	this.size = this.size.copy();
	this.gravity = this.gravity.copy();
	this.contacts = [];
	
	extend(this, option);
	
	this.init(option);
};
Object.prototype = {
	speed: new Vec(),
	force: new Vec(),
	accel: new Vec(),
	center: new Vec(),
	preCenter: new Vec(),
	size: new Vec(0, 0),
	gravity: new Vec(0, 10),
	weight: 1, // 質量
	elastic: 7, // 反発係数　→　バネ定数 （侵入量が減る）
	viscosity: 3, // 粘性係数　→　ダンパ係数 （速度が落ちる）
	friction: 0.1, // 摩擦係数
	fixed: false,
	contacts: [],
	init: function(option) {},
	beforeStep: function(time) {},
	afterStep: function(time) {},
	createContact: function(contact, manifold) {},
	destroyContact: function(contact, manifold) {},
	updateContact: function(contact, manifold) {},
	beforeSolve: function(contact, manifold) {},
	afterSolve: function(contact, manifold) {},
	_makeCache: function() {
		this._maxPrePos = this.maxPrePos();
		this._minPrePos = this.minPrePos();
		this._maxPos = this.maxPos();
		this._minPos = this.minPos();
	},
	_step: function(time) {
		this.beforeStep(time);
		
		// this.applyForce(this.gravity.multiply(this.weight));
		this.applyForce({
			x: this.gravity.x * this.weight,
			y: this.gravity.y * this.weight
		});
		// this.speed = this.speed.add(this.accel.multiply(time));
		this.speed.x += this.accel.x * time;
		this.speed.y += this.accel.y * time;
		//this.preCenter = this.center.copy();
		this.preCenter.x = this.center.x;
		this.preCenter.y = this.center.y;
		//this.center = this.center.add(this.speed.multiply(time));
		this.center.x += this.speed.x * time;
		this.center.y += this.speed.y * time;
		this._makeCache();
		
		this.afterStep(time);
		
		this.resetForce();
	},
	maxPrePos: function() {
		// return this.preCenter.add(this.size.divide(2));
		return {
			x: this.preCenter.x + this.size.x/2,
			y: this.preCenter.y + this.size.y/2
		};
	},
	minPrePos: function() {
		// return this.preCenter.subtract(this.size.divide(2));
		return {
			x: this.preCenter.x - this.size.x/2,
			y: this.preCenter.y - this.size.y/2
		};
	},
	maxPos: function() {
		// return this.center.add(this.size.divide(2));
		return {
			x: this.center.x + this.size.x/2,
			y: this.center.y + this.size.y/2
		};
	},
	minPos: function() {
		// return this.center.subtract(this.size.divide(2));
		return {
			x: this.center.x - this.size.x/2,
			y: this.center.y - this.size.y/2
		};
	},
	applyForce: function(force) {
		// this.force = this.force.add(force);
		this.force.x += force.x;
		this.force.y += force.y;
		// this.accel = this.accel.add(force.divide(this.weight));
		this.accel.x += force.x/this.weight;
		this.accel.y += force.y/this.weight;
	},
	resetForce: function() {
		// this.accel = new Vec();
		this.accel.x = 0;
		this.accel.y = 0;
	}
};

var World = function(option) {
	this.objects = [];
	this.contacts = [];
	this.size = this.size.copy();
	this._stepCount = 0;
	
	extend(this, option);
	
	this.init(option);
};
World.prototype = {
	size: new Vec(),
	step: function(time) {
		this.beforeStep(time);
		
		this._stepCount++;
		
		// 衝突情報取得
		var objects = this.objects;
		if (objects.length < 100)  {
			bruteForce(objects);
		} else {
			recursiveClustering(objects, 0, 1);
		}
		
		// 衝突処理
		var contacts = this.contacts;
		var stepCount = this._stepCount;
		for (var i=0,l=contacts.length;i<l;i++) {
			var contact = contacts[i];
			if (contact) {
				if (contact._stepCount !== stepCount) {
					contact.destroy();
					i--;
				} else {
					contact.solve();
				}
			}
		}
		
		// 各アイテムの進行
		for (var i=0,l=objects.length;i<l;i++) {
			objects[i]._step(time);
		}
		
		this.afterStep(time);
		
		return this;
	},
	createObject: function(object) {
		object.world = this;
		this.objects.push(object);
		// object.preCenter = object.center.copy()
		object.preCenter.x = object.center.x;
		object.preCenter.y = object.center.y;
		object._makeCache();
	},
	destroyObject: function(object) {
		if (!object) {
			return false;
		}
		
		for (var i=0,l=object.contacts.length;i<l;i++) {
			var contact = object.contacts[i];
			if (contact) {
				contact.destroy();
			}
		}
		
		var objects = this.objects;
		var index = objects.indexOf(object);
		if (index >= 0) {
			delete objects[index];
			objects.splice(index, 1);
		}
	},
	destroy: function() {
		var objects = this.objects;
		for (var i=0,l=objects.length;i<l;i++) {
			this.destroyObject(objects[i]);
		}
	},
	init: function(option) {},
	beforeStep: function(time) {},
	afterStep: function(time) {}
};

return {
	Vec: Vec,
	World: World,
	Object: Object
};

})();