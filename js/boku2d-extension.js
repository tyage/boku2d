(function() {

// キー操作
Boku2D.keyPress = {};
jQuery(document).keydown(function (e) {
	Boku2D.keyPress[e.keyCode] = true;
});
jQuery(document).keyup(function (e) {
	Boku2D.keyPress[e.keyCode] = false;
});

Boku2D.Object.prototype.canJump = function() {
	var contacts = this.contacts,
		onGround = false;
	for (var i=0,l=contacts.length;i<l;i++) {
		var contact = contacts[i],
			m0 = contact.manifolds[0],
			m1 = contact.manifolds[1];
		if ((m0.object === this && m0.direction.y < 0) ||
			(m1.object === this && m1.direction.y < 0)) {
			onGround = true;
			break;
		}
	}
	return onGround;
};
Boku2D.Object.prototype.applyControll = function(time) {
	if (this.controll) {
		if (this.jump && Boku2D.keyPress[38] && this.canJump()) {
			this.applyForce(this.jump);
		}
		
		for (var key in this.controll) {
			if (Boku2D.keyPress[key]) {
				var force = this.controll[key];
				this.applyForce(force);
			}
		}
	}
};

// アイテムの型
Boku2D.Model = {
	fixed: {
		fixed: true,
		gravity: new Boku2D.Vec()
	},
	floating: {
		gravity: new Boku2D.Vec()
	},
	controll: {
		controll: {
			37: new Boku2D.Vec(-10, 0),
			39: new Boku2D.Vec(10, 0)
		},
		jump: new Boku2D.Vec(0, -350),
		beforeStep: function(time) {
			this.applyControll(time);
		}
	}
};

})();