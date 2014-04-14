var boku2D = (function () {
	var inArray = function (array, key) {
		for (var i=0,l=array.length;i<l;i++) {
			if (array[i] === key) {
				return true;
			}
		}
		return false;
	};
	var isNumber = function (num) {
		return typeof num === "number";
	};
	
	var init = function (option) {
		if (!option) {
			return;
		}
		
		var key,
			data = (option.nodeType ? jQuery(option).data() : option);
		for (key in data) {
			this[key] = data[key];
		}
	};
	
	var keyPress = {};
	jQuery(document).keydown(function (e) {
		keyPress[e.keyCode] = true;
	})
	jQuery(document).keyup(function (e) {
		keyPress[e.keyCode] = false;
	})
	
	var vec = function (x, y) {
		this.x = (isNumber(x) ? x : parseInt(x)) || 0;
		this.y = (isNumber(y) ? y : parseInt(y)) || 0;
	};
	vec.prototype = {
		copy: function () {
			return new vec(this.x, this.y);
		},
		add: function (v, y) {
			if (y !== undefined) {
				v = new vec(v, y);
			}
			
			var x = this.x + v.x,
				y = this.y + v.y;
			return new vec(x, y);
		},
		subtract: function (v, y) {
			if (y !== undefined) {
				v = new vec(v, y);
			}
			
			var x = this.x - v.x,
				y = this.y - v.y;
			return new vec(x, y);
		},
		multiply: function (i) {
			var x = this.x * i,
				y = this.y * i;
			return new vec(x, y);
		},
		divide: function (i) {
			var x = this.x / i,
				y = this.y / i;
			return new vec(x, y);
		},
		dot: function (v) {
			return this.x * v.x + this.y * v.y;
		},
		length: function () {
			return Math.sqrt(this.x*this.x + this.y*this.y);
		},
		normalize: function () {
			var length = this.length();
			return this.divide(length);
		}
	};
	
	var STIFF = 100;
	var DAMP = 2;
	var contact = function(item, opponent) {
		this.item = item;
		this.opponent = opponent;
		this.normal = new vec();
	};
	contact.prototype = {
		solve: function() {
			if (this.item.fixed) {
				return false;
			}
			
			var move = this.item,
				fixed = this.opponent;
			var diff,
				relSpeed = move.speed.subtract(fixed.speed),
				adj;
			
			if (this.normal.x < 0 && this.normal.y === 0) {
				diff = move.maxPos().x - fixed.minPos().x;
			}
			if (this.normal.x > 0 && this.normal.y === 0) {
				diff = fixed.maxPos().x - move.minPos().x;
			}
			if (this.normal.x === 0 && this.normal.y < 0) {
				diff = move.maxPos().y - fixed.minPos().y;
			}
			if (this.normal.x === 0 && this.normal.y > 0) {
				diff = fixed.maxPos().y - move.minPos().y;
			}
			adj = STIFF * diff - DAMP * relSpeed.dot(this.normal);
			
			move.addSpeed = move.addSpeed.add(this.normal.multiply(adj));
		}
	};
	
	var manifold = function(item1, item2) {
		var normal1 = new vec(),
			normal2 = new vec();
		
		if (item1.maxTmpPos().x <= item2.minTmpPos().x && 
			item1.maxPos().x >= item2.minPos().x) {
			normal1 = new vec(-1, 0);
			normal2 = new vec(1, 0);
		}
		if (item1.minTmpPos().x >= item2.maxTmpPos().x && 
			item1.minPos().x <= item2.maxPos().x) {
			normal1 = new vec(1, 0);
			normal2 = new vec(-1, 0);
		}
		if (item1.maxTmpPos().y <= item2.minTmpPos().y && 
			item1.maxPos().y >= item2.minPos().y) {
			normal1 = new vec(0, -1);
			normal2 = new vec(0, 1);
		}
		if (item1.minTmpPos().y >= item2.maxTmpPos().y && 
			item1.minPos().y <= item2.maxPos().y) {
			normal1 = new vec(0, 1);
			normal2 = new vec(0, -1);
		}
		
		var contact1 = new contact(item1, item2),
			contact2 = new contact(item2, item1);
		contact1.normal = normal1;
		contact2.normal = normal2;
		
		this.contacts = [contact1, contact2];
		this.timeStep = 0;
		this.world = item1.world;
		this.item1 = item1;
		this.item2 = item2;
		this.update();
	};
	manifold.prototype = {
		update: function() {
			this.timeStep = this.world.timeStep;
		},
		solve: function() {
			var list = this.contacts;
			for (var i=0,l=list.length;i<l;i++) {
				list[i].solve();
			}
		},
		delete: function() {
			this._deleteFromList(this.world.manifolds);
			this._deleteFromList(this.item1.manifolds);
			this._deleteFromList(this.item2.manifolds);
		},
		_deleteFromList: function(manifolds) {
			for (var i=0,l=manifolds.length;i<l;i++) {
				if (manifolds[i] == this) {
					manifolds.splice(i, 1);
				}
			}
		}
	};
	
	var collide = function (item1, item2) {
		if (!checkContact(item1, item2)) {
			return;
		}
		
		item1.beforeContact(item2);
		item2.beforeContact(item1);
		
		var list = item1.manifolds,
			mani = null;
		for (var i=0,l=list.length;i<l;i++) {
			var m = list[i];
			if (m.contacts[0].opponent === item2 || m.contacts[1].opponent === item2) {
				mani = m;
				break;
			}
		}
		if (mani) {
			mani.update();
		} else {
			mani = new manifold(item1, item2);
			item1.manifolds.push(mani);
			item2.manifolds.push(mani);
			item1.world.manifolds.push(mani);
		}
		
		mani.solve();
		
		item1.afterContact(item2);
		item2.afterContact(item1);
	};
	var checkContact = function (item1, item2) {
		return item1.maxPos().x > item2.minPos().x && 
			item1.minPos().x < item2.maxPos().x &&
			item1.maxPos().y > item2.minPos().y && 
			item1.minPos().y < item2.maxPos().y;
	};
	
	var itemProto = {
		init: function () {},
		_init: function (option) {
			if (option) {
				init.call(this, option);
				this.size = new vec();
				this.manifolds = [];
				
				if (option.nodeType) {
					var $elem = jQuery(option),
						pos = $elem.position();
					this.elem = option;
					this.size = new vec($elem.width(), $elem.height());
					this.center = (new vec(pos.left, pos.top)).add(this.size.divide(2));
				}
				
				this.centerTmp = this.center.copy();
			}
		},
		_move: function(time) {
			this.center = this.center.add(this.speed.multiply(time));
		},
		_step: function (time) {
			this.beforeStep(time);
			
			this.speed = this.speed.add(this.addSpeed.multiply(time));
			this.addSpeed = new vec();
			
			this.centerTmp = this.center.copy();
			for (var key in this.controll) {
				if (keyPress[key]) {
					this.speed = this.speed.add(this.controll[key].multiply(time));
				}
			}
			this.speed = this.speed.add(this.gravity.multiply(time));
			this._move(time);
			
			this.afterStep(time);

		},
		maxTmpPos: function() {
			return this.centerTmp.add(this.size.divide(2));
		},
		minTmpPos: function() {
			return this.centerTmp.subtract(this.size.divide(2));
		},
		maxPos: function() {
			return this.center.add(this.size.divide(2));
		},
		minPos: function() {
			return this.center.subtract(this.size.divide(2));
		},
		renderDOM: function () {
			if (this.center.x > 700 || this.center.y > 700) {
				return false;
			}
			this.elem.style.left = (this.center.x - this.size.x/2) + "px";
			this.elem.style.top = (this.center.y - this.size.y/2) + "px";
		},
		beforeContact: function (item) {},
		afterContact: function (item) {},
		beforeStep: function (time) {},
		afterStep: function (time) {
			this.manifolds.length ? 
				$(this.elem).addClass('contact') : 
				$(this.elem).removeClass('contact');
			//$(this.elem).text(this.center.x + ',' + this.center.y);
		}
	};
	var itemBase = {
		create: function () {
			var self = this;
			
			var newItem = function (option) {
				self.world.items.push(this);
				this.world = self.world;
				this._init(option);
				this.init(option);
			};
			
			var itemDefault = function () {};
			itemDefault.prototype = this.defaults;
			newItem.prototype = new itemDefault();
			
			jQuery.extend(newItem.prototype, itemProto);
			
			return newItem;
		},
		defaults: {
			speed: new vec(),
			addSpeed: new vec(),
			center: new vec(),
			centerTmp: new vec(),
			gravity: new vec(0, 5),
			size: new vec(0, 0),
			weight: 1, // 質量
			restitution: 0.7, // 反発係数
			friction: 0, // 摩擦係数
			fixed: false,
			controll: {},
			manifolds: []
		},
		world: null
	};
	
	var rdc = new RDC(collide);
	var world = function (option) {
		this.items = [];
		this.size = new vec(0, 0);
		this.timeStep = 0;
		this.manifolds = [];
		
		if (option) {
			init.call(this, option);
			if (option.nodeType) {
				var $elem = jQuery(option);
				this.size = new vec($elem.width(), $elem.height());
			}
		}
		
		this.item.world = this;
	};
	world.prototype = {
		renderDOM: function () {
			for (var i=0,l=this.items.length;i<l;i++) {
				this.items[i].renderDOM();
			}
			
			return this;
		},
		step: function (time, bruteForce) {
			this.timeStep += time;
			
			if (bruteForce) {
				for (var i=0,l=this.items.length;i<l;i++) {
					var item1 = this.items[i];
					for (var j=i+1;j<l;j++) {
						var item2 = this.items[j];
						collide(item1, item2);
					}
				}
			} else {
				rdc.recursiveClustering(this.items, 0, 1);
			}
			
			for (var i=0,l=this.items.length;i<l;i++) {
				var item = this.items[i];
				item._step(time);
			}
			
			var manifolds = this.manifolds;
			for (var i=0,l=manifolds.length;i<l;i++) {
				if (manifolds[i].timeStep !== this.timeStep) {
					manifolds[i].delete();
				}
			}
			
			return this;
		},
		item: itemBase
	};
	
	itemBase.object = itemBase.create();
	
	itemBase.block = itemBase.create();
	itemBase.block.prototype.fixed = true;
	itemBase.block.prototype.gravity = new vec(0, 0);
	
	itemBase.float = itemBase.create();
	itemBase.float.prototype.gravity = new vec(0, 0);
	
	itemBase.controll = itemBase.create();
	itemBase.controll.prototype.controll = {
		37: new vec(-10, 0),
		38: new vec(0, -10),
		39: new vec(10, 0),
		40: new vec(0, 10)
	};
	//itemBase.controll.prototype.gravity = new vec(0, 0);
	
	return {
		vec: vec,
		world: world,
		itemBase: itemBase
	};
})();