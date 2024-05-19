var $builtinmodule = function (name) {
    var s = {
	};

	var handlers = {
		"Sk.debug": function(e) {
			debugger;
			var r = PythonIDE.debugHandler(e);
			if(r.then){
				return r;
			}
			return false;
		}
	};
	//var handlers = {};

	var startTime = new Date().getTime();
	var lineCount = 0;
	var width = undefined;
	var height = undefined;
	var startTime = new Date().getTime();
	var btnAssetColor = '#00ff00';

	Sk.globals.dbg = new Sk.builtin.func(function(x) {
		console.log(x, Sk.ffi.remapToJs(x));
	});

	function updateCoordsFromProps(props, size, pos) {		
		props.x = 0;
		props.y = 0;
		if(pos) {
			props.x = pos[0];
			props.y = pos[1];
		}

		if(props.top !== undefined) {
			props.y = props.top;
		}
		if(props.left !== undefined) {
			props.x = props.left;
		}
		if(props.bottom !== undefined) {
			props.y = props.bottom - size.height;
		}
		if(props.right !== undefined) {
			props.x = props.left - size.width;
		}
		if(props.topleft !== undefined) {
			props.x = props.topleft[0];
			props.y = props.topleft[1];
		}
		if(props.bottomleft !== undefined) {
			props.x = props.bottomleft[0];
			props.y = props.bottomleft[1] - size.height;
		}
		if(props.topright !== undefined) {
			props.x = props.topright[0] - size.width;
			props.y = props.topright[1];
		}
		if(props.bottomright !== undefined) {
			props.x = props.bottomright[0] - size.width;
			props.y = props.bottomright[1] - size.height;
		}
		if(props.midtop !== undefined) {
			props.x = props.midtop[0] - size.width / 2;
			props.y = props.midtop[1];
		}
		if(props.midleft !== undefined) {
			props.x = props.midleft[0];
			props.y = props.midleft[1] - size.height / 2;
		}
		if(props.midbottom !== undefined) {
			props.x = props.midbottom[0] - size.width / 2;
			props.y = props.midbottom[1] - size.height;
		}
		if(props.midright !== undefined) {
			props.x = props.midright[0] - size.width;
			props.y = props.midright[1] - size.height / 2;
		}
		if(props.center !== undefined) {
			props.x = props.center[0] - size.width / 2;
			props.y = props.center[1] - size.height / 2;
		}
		if(props.centerx !== undefined) {
			props.x = props.centerx - size.width / 2;
		}
		if(props.centery !== undefined) {
			props.y = props.centery;
		}
	}

	function getColor(c) {
		var rgb = [255,255,255];
		if(tk_colors && typeof(c) == "string") {
			var cName = c.replace(" ", "");
			if(tk_colors[cName]) {
				return tk_colors[cName];	
			}
		} 
		var r = c[0];
		var g = c[1];
		var b = c[2];
		return "rgb(" + r + "," + g + "," + b + ")";
	}

	var canvas = undefined;
	var cx = undefined;

	var assets = {};
	if(PythonIDE.files['assets.json']) {
		assets = JSON.parse(PythonIDE.files['assets.json']);
	}

	var loadedAssets = {};

	var promises = [];
	
	var animations = {};
	
	var animate = function(kwa, object, tween) {
		Sk.builtin.pyCheckArgs("animate", 1, 1);
		args = {};
		var anim = {
			tween: 'linear',
			duration: 1,
			targets: {},
			object: object,
			startTime: (new Date).getTime(),
			progress: 0,
			id: object.id
		};

		if(tween) {
			anim.tween = Sk.ffi.remapToJs(tween);
		}
		
		for(var i = 0; i < kwa.length; i+=2) {
			var key = Sk.ffi.remapToJs(kwa[i]);
			var val = Sk.ffi.remapToJs(kwa[i+1]);
			var targets = {};
			
			switch(key) {
				case 'on_finished':
					val = kwa[i+1];
				case 'tween':
				case 'duration':
					anim[key] = val;
				break;
				case 'pos':
					anim.targets.x = {
						start: Sk.ffi.remapToJs(getActorAttribute(object, Sk.ffi.remapToPy("x"))),
						end: val[0]
					}
					anim.targets.y = {
						start: Sk.ffi.remapToJs(getActorAttribute(object, Sk.ffi.remapToPy("y"))),
						end: val[1]
					}
					anim.id += "_pos";
				break;
				default:
					if(object.attributes[key] !== undefined) {
						anim.targets[key] = {
							start: Sk.ffi.remapToJs(getActorAttribute(object, Sk.ffi.remapToPy(key))),
							end: val
						}
					}
					anim.id += "_" + key;

				break;
			}
		}
		animations[anim.id] = anim;
		//console.log(anim);
		//console.log(animations);
	};
	
	animate.co_kwargs = true;
	
	Sk.globals.animate = new Sk.builtin.func(animate);
	
	function updateRectFromXY(self) {
		var i = loadedAssets[self.attributes.image];
		if(i == undefined) {
			i = {
				width: 0,
				height: 0
			};
		}
		var a = self.attributes;
		a.width = i.width;
		a.height = i.height;

		a.left = a.x;
		a.right = a.x + a.width;
		a.top = a.y;
		a.bottom = a.y + a.height;
		
		self.coords = {
			x1: a.left,
			y1: a.top,
			x2: a.right,
			y2: a.bottom
		}
	}
	
	var updateActorAttribute = function(self, name, value) {
		Sk.builtin.pyCheckArgs("__setattr__", 3, 3);
		name = Sk.ffi.remapToJs(name);
		var a = self.attributes;
		a[name] = Sk.ffi.remapToJs(value);

		switch(name) {
			case 'x':
				a.x = a.x - self.anchorVal.x;
			break;
			case 'y':
				a.y = a.y - self.anchorVal.y;
			break;
			case 'left':
				a.x = a.left;
			break;
			case 'right':
				a.x = a.right - a.width;
			break;
			case 'top':
				a.y = a.top;
			break;
			case 'bottom':
				a.y = a.bottom - a.height;
			break;
			case 'anchor':
				self.anchor = Sk.ffi.remapToJs(value);
				updateAnchor(self);
			break;
			case 'pos':
				var pos = Sk.ffi.remapToJs(value);
				a.x = pos[0] - self.anchorVal.x;
				a.y = pos[1] - self.anchorVal.y;
			break;
			case 'scale':
				a.scale = Sk.ffi.remapToJs(value);
			break;
			default:
			self.others[name] = value;
			break;
		}
		
		updateRectFromXY(self);
	};
	
	var getActorAttribute = function(self, name) {
		Sk.builtin.pyCheckArgs("__getattr__", 2, 2);
		name = Sk.ffi.remapToJs(name);
		if(self.others[name] !== undefined) {
			return self.others[name];
		}
		switch(name) {
			case 'x':
				return Sk.ffi.remapToPy(self.attributes.x + self.anchorVal.x);
			break;
			case 'y':
				return Sk.ffi.remapToPy(self.attributes.y + self.anchorVal.y);
			break;
		}
		if(self.attributes[name] !== undefined) {
			return Sk.ffi.remapToPy(self.attributes[name]);
		}
		switch(name) {
			case 'anchor':
				return new Sk.builtin.tuple(Sk.ffi.remapToPy(self.anchor));
			break;
		}
	}

	var idCount = 0;

	Sk.globals.ZRect = Sk.globals.Rect = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__repr__ = new Sk.builtin.func(function(self) {
			var x = self.coords.x1;
			var y = self.coords.y1;
			var w = self.coords.x2 - self.coords.x1;
			var h = self.coords.y2 - self.coords.y1;
			return Sk.ffi.remapToPy("Rect (x:" + x + " y:" + y + " w:" + w + " h:" + h + ")");
		});

		$loc.__init__ = new Sk.builtin.func(function(self) {
			Sk.builtin.pyCheckArgs("__init__", 2, 5);
			self.coords = {
				x1: 0,
				y1: 0,
				x2: 0,
				y2: 0
			}

			self.attributes = {};
			
			switch(arguments.length) {
				case 2:
					// either a 4-tuple or rect like object
					switch(arguments[1].tp$name) {
						case 'tuple':
							var coords = Sk.ffi.remapToJs(arguments[1]);
							self.coords = {
								x1: coords[0],
								y1: coords[1],
								x2: coords[2] + coords[0],
								y2: coords[3] + coords[1]
							}
						break;
						default:
							var other = arguments[1];
							self.coords = {
								x1: other.coords.x1,
								x2: other.coords.x2,
								y1: other.coords.y1,
								y2: other.coords.y2
							}
					}
				break;

				case 3:
					// pair of 2-tuples
					var topLeft = Sk.ffi.remapToJs(arguments[1]);
					if(topLeft.length == 2) {
						self.coords.x1 = topLeft[0];
						self.coords.y1 = topLeft[1];
					}

					var dims = Sk.ffi.remapToJs(arguments[2]);
					if(dims.length == 2) {
						self.coords.x2 = self.coords.x1 + dims[0];
						self.coords.y2 = self.coords.y1 + dims[1];
					}
				break;

				case 5:
					// individual coordinates
					self.coords.x1 = Sk.ffi.remapToJs(arguments[1]);
					self.coords.y1 = Sk.ffi.remapToJs(arguments[2]);
					self.coords.x2 = self.coords.x1 + Sk.ffi.remapToJs(arguments[3]);
					self.coords.y2 = self.coords.y1 + Sk.ffi.remapToJs(arguments[4]);

				break;
			}
			
		});

		$loc.__getattr__ = new Sk.builtin.func(function(self, name) {
			var jsName = Sk.ffi.remapToJs(name);
			switch(jsName) {
				case 'centerx':
					return Sk.ffi.remapToPy((self.coords.x1 + self.coords.x2) / 2);
				break;

				case 'centery':
					return Sk.ffi.remapToPy((self.coords.y1 + self.coords.y2) / 2);
				break;

				case 'center':
					return new Sk.builtin.tuple(Sk.ffi.remapToPy([(self.coords.x1 + self.coords.x2) / 2, (self.coords.y1 + self.coords.y2) / 2]));
				break;

				case 'top':
					return Sk.ffi.remapToPy(self.coords.y1);
				break;

				case 'left':
					return Sk.ffi.remapToPy(self.coords.x1);
				break;

				case 'right':
					return Sk.ffi.remapToPy(self.coords.x2);
				break;

				case 'bottom':
					return Sk.ffi.remapToPy(self.coords.y2);
				break;

				case 'bottomleft':
					return new Sk.builtin.tuple(Sk.ffi.remapToPy([self.coords.x1, self.coords.y2]));
				break;
				case 'topleft':
					return new Sk.builtin.tuple(Sk.ffi.remapToPy([self.coords.x1, self.coords.y1]));
				break;
				case 'bottomright':
					return new Sk.builtin.tuple(Sk.ffi.remapToPy([self.coords.x2, self.coords.y2]));
				break;
				case 'topright':
					return new Sk.builtin.tuple(Sk.ffi.remapToPy([self.coords.x2, self.coords.y1]));
				break;

				default:
					if(self.attributes[jsName]) {
						return self.attributes[jsName];
					}
				break;
			}
		});

		$loc.__setattr__ = new Sk.builtin.func(function(self, name, value) {
			var jsName = Sk.ffi.remapToJs(name);
			var jsVal = Sk.ffi.remapToJs(value);
			switch(jsName) {
				case 'center':
					var oX = jsVal[0] - ((self.coords.x2 - self.coords.x1) / 2) - self.coords.x1;
					var oY = jsVal[1] - ((self.coords.y2 - self.coords.y1) / 2) - self.coords.y1;
					self.coords.x1 += oX;
					self.coords.x2 += oX;
					self.coords.y1 += oY;
					self.coords.y2 += oY;
				break;

				case 'centerx':
					var oX = jsVal - ((self.coords.x2 - self.coords.x1) / 2) - self.coords.x1;
					self.coords.x1 += oX;
					self.coords.x2 += oX;
				break;

				case 'centery':
					var oY = jsVal - ((self.coords.y2 - self.coords.y1) / 2) - self.coords.y1;
					self.coords.y1 += oY;
					self.coords.y2 += oY;
				break;

				case 'left':
					var w = self.coords.x2 - self.coords.x1;
					self.coords.x1 = jsVal;
					self.coords.x2 = self.coords.x1 + w;
				break;

				case 'right':
					var w = self.coords.x2 - self.coords.x1;
					self.coords.x2 = jsVal;
					self.coords.x1 = self.coords.x2 - w;
				break;

				case 'top':
					var h = self.coords.y2 - self.coords.y1;
					self.coords.y1 = jsVal;
					self.coords.y2 = self.coords.y1 + h;
				break;

				case 'bottom':
					var h = self.coords.y2 - self.coords.y1;
					self.coords.y2 = jsVal;
					self.coords.y1 = self.coords.y2 - h;
				break;


				default:
					self.attributes[jsName] = value;
				/*debugger;
					throw new Sk.builtin.NotImplemented("Rect property " + jsName + " not implemented yet");
				break;*/
			}
		});

		$loc.colliderect = new Sk.builtin.func(function(self) {
			var args = [];
			for(var i = 1; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			var other = Sk.misceval.callsim(Sk.globals.Rect, ...args);
			return Sk.ffi.remapToPy(
            	self.coords.x1 < other.coords.x2 &&
	            self.coords.y1 < other.coords.y2 &&
	            self.coords.x2 > other.coords.x1 &&
	            self.coords.y2 > other.coords.y1
	        );
		});

		$loc.collidelist = new Sk.builtin.func(function(self, others) {
			Sk.builtin.pyCheckArgs("collidelist", 2, 2);
			if(others && others.v && others.v.length) {
				for(var i = 0; i < others.v.length; i++) {
					var other = others.v[i];
					if(self.coords.x1 < other.coords.x2 &&
			            self.coords.y1 < other.coords.y2 &&
			            self.coords.x2 > other.coords.x1 &&
			            self.coords.y2 > other.coords.y1) {
						return Sk.ffi.remapToPy(i);
					}
				}	
			}
			return Sk.ffi.remapToPy(-1);
		});

	}, "Rect", []);

	function unpackKWA(kwa) {
		result = {};
		
		for(var i = 0; i < kwa.length; i+=2) {
			var key = Sk.ffi.remapToJs(kwa[i]);
			var val = Sk.ffi.remapToJs(kwa[i+1]);
			result[key] = val;
		}

		return result;
	}
	
	var Surface = Sk.misceval.buildClass(s, function($gbl, $loc) {

		$loc.blit = new Sk.builtin.func(function(self, source, dest, area, special_flags) {
			Sk.builtin.pyCheckArgs("blit", 3, 5);
			if(self.actor !== undefined) {
				throw new Sk.builtin.NotImplementedError("You can currently only blit to the screen surface");
			}
			
			if(!(source && source.actor && source.actor.attributes && source.actor.attributes.image)) {
				throw new Sk.builtin.TypeError("The source must be a pygame surface");
			}
			var i = loadedAssets[source.actor.attributes.image];

			var coords = Sk.ffi.remapToJs(dest);
			area = Sk.ffi.remapToJs(area);
			if(area && area.length >= 4) {
				cx.drawImage(i.image, area[0], area[1], area[2], area[3], coords[0], coords[1], area[2], area[3]);
			} else {
				cx.drawImage(i.image, coords[0], coords[1]);
			}
			


		});
		
		$loc.__init__ = new Sk.builtin.func(function(self, actor) {
			self.actor = actor;
		});
	});


	Sk.globals.Actor = Sk.misceval.buildClass(s, function($gbl, $loc) {
		
		$loc.distance_to = new Sk.builtin.func(function(self, target){
			Sk.builtin.pyCheckArgs("distance_to", 2, 2);

			var pos = Sk.ffi.remapToJs(target);
			var tx = 0;
			var ty = 0;
			if(pos) {
				tx = pos[0];
				ty = pos[1];
			} else {
				tx = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("x")));
				ty = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("y")));
			}
			
			var myx = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("x")));
			var myy = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("y")));
			
			var dx = tx - myx
			var dy = myy - ty
			return Sk.ffi.remapToPy(Math.sqrt(dx * dx + dy * dy));
		});
		
		$loc.angle_to = new Sk.builtin.func(function(self, target) {
			Sk.builtin.pyCheckArgs("angle_to", 2, 2);

			var pos = Sk.ffi.remapToJs(target);
			var tx = 0;
			var ty = 0;
			if(pos) {
				tx = pos[0];
				ty = pos[1];
			} else {
				tx = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("x")));
				ty = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("y")));
			}
			
			var myx = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("x")));
			var myy = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("y")));
			
			var dx = tx - myx
			var dy = myy - ty
			return Sk.ffi.remapToPy(Math.atan2(dy, dx) * 180 / Math.PI);
			
		});
		

		$loc.collidepoint = new Sk.builtin.func(function(self, pos) {
			Sk.builtin.pyCheckArgs("collidepoint", 2, 2);
			var c = Sk.ffi.remapToJs(pos);
			var pt = {
				x: c[0],
				y: c[1]
			}
			return new Sk.builtin.bool(pt.x >= self.attributes.x && pt.x <= self.attributes.right && pt.y >= self.attributes.y && pt.y <= self.attributes.bottom);
		});

		var anchors = {
			x: {
				left: 0.0,
				center: 0.5,
				middle: 0.5,
				right: 1.0
			},
			y: {
				top: 0.0,
				center: 0.5,
				middle: 0.5,
				bottom: 1.0
			}
		}

		function calculateAnchor(value, dim, total) {
			if(typeof value == 'string') {
				try {
					return total * anchors[dim][value];
				} catch (e){
					throw new Sk.builtin.ValueError(value + " is not a valid " + dim + "-anchor name");
				}
			}
			return value;
		}

		function transformAnchor(ax, ay, w, h, angle) {
			var theta = -angle * Math.PI / 180;
			var sinTheta = Math.sin(theta);
			var cosTheta = Math.cos(theta);

			var tw = abs(w * cosTheta) + abs(h * sinTheta);
		    var th = abs(w * sinTheta) + abs(h * cosTheta);

		    var cax = ax - w * 0.5;
		    var cay = ay - h * 0.5;

		    var rax = cax * cosTheta - cay * sinTheta;
		    var ray = cax * sinTheta + cay * cosTheta;

		    return {
		    	x: tw * 0.5 + rax,
		        y: th * 0.5 + ray
		    };

		}

		function updateAnchor(self) {
			var i = loadedAssets[self.attributes.image];
			if(i) {
				self.anchorVal.x = calculateAnchor(self.anchor[0], 'x', i.width);
				self.anchorVal.y = calculateAnchor(self.anchor[1], 'y', i.height);
			}		
		}


		$loc.__getattr__ = new Sk.builtin.func(getActorAttribute);

		$loc.__setattr__ = new Sk.builtin.func(updateActorAttribute);

		var init = function(kwa, self, name, pos) {	
					
			Sk.builtin.pyCheckArgs("__init__", 2, 2);
			self.id = idCount++;

			self.attributes = {
				x: 0,
				y: 0,
				angle: 0,
				scale: 1,
				image: Sk.ffi.remapToJs(name)
			};
			self.others = {};
			self.others._surf = Sk.misceval.callsim(Surface, self);

			self.anchor = ['center', 'center'];
			var args = unpackKWA(kwa);
			if(args.anchor) {
				self.anchor = args.anchor;
			}
			if(pos) {
				pos = Sk.ffi.remapToJs(pos);
			} else {
				if(args.pos) {
					pos = args.pos;
				} else {
					pos = [0,0];
				}
			}
			
			
			self.anchorVal = {x:0, y:0};
			var jsName = Sk.ffi.remapToJs(name);
			if (assets.images) {
				if(!assets.images[jsName]) {
						PythonIDE.showHint("Помилка: зображення '"+ jsName + "' не завантажено!"); btnAssetColor ='#ff0000';					
					}
			else { return PythonIDE.runAsync(function(resolve, reject) {
				
				
				Promise.all(promises).then(function() {
					
					var jsName = Sk.ffi.remapToJs(name);
					if(!loadedAssets[jsName]) {
						var e = new Sk.builtin.KeyError("No image found like '" + jsName + "'. Are you sure the image exists?");
						reject(e);
					}
					var size = {
						width: loadedAssets[self.attributes.image].width,
						height: loadedAssets[self.attributes.image].height
					};

					pos[0] -= calculateAnchor(self.anchor[0], 'x', size.width);
					pos[1] -= calculateAnchor(self.anchor[1], 'y', size.height);
					updateCoordsFromProps(args, size, pos);
					self.attributes.x = args.x;
					self.attributes.y = args.y;
					updateAnchor(self);
		    		updateRectFromXY(self);	
		    		resolve();	
		    	});
			 
			}); } } else { PythonIDE.showHint("Помилка: ресурси Pygame Zero не завантажено!");  btnAssetColor ='#ff0000'; } 
		
			
		}
		init.co_kwargs = true;

		$loc.__init__ = new Sk.builtin.func(init);

		$loc.draw = new Sk.builtin.func(function(self) {
			if(loadedAssets[self.attributes.image]) {
				updateRectFromXY(self);
				var i = loadedAssets[self.attributes.image];
				var a = self.attributes;
				var radians = a.angle * Math.PI / 180;
				cx.save();
				cx.translate(a.x + self.anchorVal.x, a.y + self.anchorVal.y);
				cx.rotate(-radians);
				cx.translate(-a.x - self.anchorVal.x, -a.y - self.anchorVal.y);
				cx.drawImage(i.image, a.x, a.y, a.width*a.scale, a.height*a.scale);
				cx.restore();
			} else {
				//console.log(self.name + " not loaded yet...");
			}
		});
		
		$loc.__repr__ = new Sk.builtin.func(function(self) {

			return Sk.ffi.remapToPy(self.attributes.image + " (x:" + (self.attributes.x + self.anchorVal.x) + "," + (self.attributes.y + self.anchorVal.y) + ")");
		});
	}, 'Actor', [Sk.globals.Rect]);

	var EnumValue = Sk.misceval.buildClass(s, function($gbl, $loc) {
		
		$loc.__init__ = new Sk.builtin.func(function(self, enumName, key, value) {
			self.enumName = enumName;
			self.key = key;
			self.value = value;
		});

		$loc.__str__ = new Sk.builtin.func(function(self) {
			return new Sk.builtin.str(self.enumName + "." + self.key);
		});

		$loc.__getattr__ = new Sk.builtin.func(function(self, a) {
			switch(Sk.ffi.remapToJs(a)) {
				case 'name':
					return Sk.ffi.remapToPy(self.key);
				break;
				case 'value':
					return Sk.ffi.remapToPy(self.value);
				break;
			}
		});

		$loc.__int__ = new Sk.builtin.func(function(self) {
			return Sk.ffi.remapToPy(self.value);
		});

		$loc.__eq__ = new Sk.builtin.func(function(self, other) {
			var cmpTo = Sk.ffi.remapToJs(other);
			if(other.value !== undefined) {
				cmpTo = other.value;
			}
			return Sk.ffi.remapToPy(Sk.ffi.remapToJs(self.value) == cmpTo);
		});

	}, 'enum', []);

	var Enum = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self, name) {
			self.values = {};
			self.name = name;
		});

		$loc.__str__ = new Sk.builtin.func(function(self) {
			return new Sk.builtin.str("enum '" + self.name + "'");
		});
	}, 'Enum', []);

	var keysPressed = {

	}

	function isKeyPressed(key) {
		return new Sk.builtin.bool(keysPressed[key.toLowerCase()] == true);
	}

	var Keyboard = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__getattr__ = new Sk.builtin.func(function(self, name) {
			var key = Sk.ffi.remapToJs(name);
			if(key.match(/__/)) {
				return;
			}
			return isKeyPressed(key);
		});
	}, 'pgzero.keyboard.Keyboard', []);
	Sk.globals.keyboard = Sk.misceval.callsim(Keyboard);
	
	var mouse = Sk.misceval.buildClass(s, function($gbl, $loc) {
		var id = 1;
		function addVal(key, value) {
			if(value == undefined) {
				value = id++;
			}
			$loc[key] = Sk.misceval.callsim(EnumValue, "mouse", key, value);
		}
		addVal('LEFT');
		addVal('MIDDLE');
		addVal('RIGHT');
	}, 'mouse', [Enum]);

	Sk.globals.mouse = Sk.misceval.callsim(mouse, 'mouse');

	var keys = Sk.misceval.buildClass(s, function($gbl, $loc) {

		var values = {
			SPACE: 32,
			RETURN: 13,
			LEFT: 37,
			RIGHT: 39,
			UP: 38,
			DOWN: 40
		}

		for(var key in values) {
			$loc[key] = Sk.misceval.callsim(EnumValue, "keys", key, values[key]);
		}

	}, 'keys', [Enum]);
	Sk.globals.keys = Sk.misceval.callsim(keys, 'keys');

	var SurfacePainter = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.circle = new Sk.builtin.func(function(self, coords, radius, color) {
			Sk.builtin.pyCheckArgs("circle", arguments, 4, 4);

			var args = {
				coords: Sk.ffi.remapToJs(coords),
				radius: Sk.ffi.remapToJs(radius),
				color: Sk.ffi.remapToJs(color)
			} 
			cx.strokeStyle = getColor(args.color);
			cx.beginPath();
			cx.arc(args.coords[0], args.coords[1], args.radius, 0, 2 * Math.PI);
			cx.stroke();

		});

		$loc.rect = new Sk.builtin.func(function(self, rect, color) {
			Sk.builtin.pyCheckArgs("rect", 3, 3);
			var args = {
				x1: rect.coords.x1,
				y1: rect.coords.y1,
				x2: rect.coords.x2,
				y2: rect.coords.y2,
				color: Sk.ffi.remapToJs(color)
			}
			cx.strokeStyle = getColor(args.color);
			cx.beginPath();
			cx.rect(args.x1, args.y1, args.x2 - args.x1, args.y2 - args.y1);
			cx.stroke();
		});

		$loc.filled_rect = new Sk.builtin.func(function(self, rect, color) {
			Sk.builtin.pyCheckArgs("filled_rect", 3, 3);
			var args = {
				x1: rect.coords.x1,
				y1: rect.coords.y1,
				x2: rect.coords.x2,
				y2: rect.coords.y2,
				color: Sk.ffi.remapToJs(color)
			}
			cx.fillStyle = getColor(args.color);
			cx.beginPath();
			cx.rect(args.x1, args.y1, args.x2 - args.x1, args.y2 - args.y1);
			cx.fill();
		});

		$loc.line = new Sk.builtin.func(function(self, start, end, color) {
			Sk.builtin.pyCheckArgs("rect", 3, 3);
			var args = {
				start: Sk.ffi.remapToJs(start),
				end: Sk.ffi.remapToJs(end),
				color: Sk.ffi.remapToJs(color)
			}
			console.log("***** Start:",args.start[0],":",args.start[1])
			cx.strokeStyle = getColor(args.color);
			cx.beginPath();
			cx.moveTo(args.start[0], args.start[1]);
			cx.lineTo(args.end[0], args.end[1]);
			cx.stroke();
		});
		
		$loc.filled_circle = new Sk.builtin.func(function(self, pos, radius, color) {
			Sk.builtin.pyCheckArgs("filled_circle", arguments, 4, 4);
			
			var args = {
				coords: Sk.ffi.remapToJs(pos),
				radius: Sk.ffi.remapToJs(radius),
				color: Sk.ffi.remapToJs(color)
			};
			
			cx.fillStyle = getColor(args.color);
			cx.beginPath();
			cx.arc(args.coords[0], args.coords[1], args.radius, 0, 2 * Math.PI);
			cx.closePath();
			cx.fill();
		});

		var text =  function(kwa, self, text, pos) {
			Sk.builtin.pyCheckArgs("text", arguments, 2, 4);
			var jsText = Sk.ffi.remapToJs(text);
			
			//if(jsText.match(/GAME/)) debugger;
			props = unpackKWA(kwa);
			if(props.fontname === undefined) {
				props.fontname = "Arial";
			}
			if(props.fontsize === undefined) {
				props.fontsize = 24;
			}
			if(props.color === undefined) {
				props.color = "#FFF";
			}
			if(props.background) {
				cx.fillStyle = getColor(props.background);
				cx.fillRect(props.x, props.y, size.width, size.height);
			}
			if(props.ocolor === undefined) {
				props.ocolor = "#000";
			}
			if(props.owidth === undefined) {
				props.owidth = 0;
			}
			if(props.align === undefined) {
				props.align = "center";
			}
			cx.fillStyle = getColor(props.color);
			cx.font = props.fontsize + "px " + props.fontname;
			var lines = jsText.split("\n");
			var size = {
				height: cx.measureText("M").width * lines.length,
				width: cx.measureText(lines[0]).width,
				lineWidths: []
			}
			for(var i = 0; i < lines.length; i++) {
				var w = cx.measureText(lines[i]).width;
				size.lineWidths[i] = w;
				if( w > size.width) {
					size.width = w;
				}
			}
			
			updateCoordsFromProps(props, size, Sk.ffi.remapToJs(pos));
			cx.textBaseline = "top";	

			for(var i = 0; i < lines.length; i++) {
				var x = props.x;
				switch(props.align) {
					case 'center':
						x += (size.width - size.lineWidths[i]) / 2;
					break;
					case 'right':
						x += (size.width - size.lineWidths[i]);
					break;
				}
				cx.fillText(lines[i], x, props.y + i * size.height);

				if(props.owidth) {
					cx.strokeStyle = getColor(props.ocolor);
					cx.strokeText(lines[i], x, props.y + (i * size.height / lines.length));
				}	
			}
			
		};

		text.co_kwargs = true;
		$loc.text = new Sk.builtin.func(text);
	}, 'pgzero.screen.SurfacePainter', []);

	var Clock = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self) {
			self.callbacks = {};
		});

		$loc.schedule_unique = new Sk.builtin.func(function(self, callback, delay) {
			Sk.builtin.pyCheckArgs("schedule_unique", 3, 3);
			if(self.callbacks[callback]) {
				clearTimeout(self.callbacks[callback]);
				delete self.callbacks[callback];
			}
			self.callbacks[callback] = setTimeout(function() {
				delete self.callbacks[callback];
				Sk.misceval.callsimAsync(handlers, callback).then(function success(r) {}, function fail(e) {
					window.onerror(e);
				});
			}, Sk.ffi.remapToJs(delay) * 1000);
		});

		$loc.schedule = new Sk.builtin.func(function(self, callback, delay) {
			Sk.builtin.pyCheckArgs("schedule_unique", 3, 3);
			self.callbacks[callback] = setTimeout(function() {
				delete self.callbacks[callback];
				Sk.misceval.callsimAsync(handlers, callback).then(function success(r) {}, function fail(e) {
					window.onerror(e);
				});
			}, Sk.ffi.remapToJs(delay) * 1000);
		});
		
		$loc.schedule_interval = new Sk.builtin.func(function(self, callback, delay) {
			Sk.builtin.pyCheckArgs("schedule_schedule", 3, 3);
			self.callbacks[callback] = setInterval(function() {
				delete self.callbacks[callback];
				Sk.misceval.callsimAsync(handlers, callback).then(function success(r) {}, function fail(e) {
					window.onerror(e);
				});
			}, Sk.ffi.remapToJs(delay) * 1000);
		});
		
	}, 'pgzero.clock', []);


	Sk.globals.clock = Sk.misceval.callsim(Clock);

	var Sound = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self, name) {
			self.name = Sk.ffi.remapToJs(name);
		});

		$loc.play = new Sk.builtin.func(function(self) {
			if(!assets.sounds[self.name]) {
				throw new Sk.builtin.KeyError("No sound found like '" + jsName + "'. Are you sure the sound exists?");
			}
			assets.sounds[self.name].audio.play();
		});
	});

	var SoundLoader = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__getattr__ = new Sk.builtin.func(function(self, name) {
			var sound = Sk.ffi.remapToJs(name);
			if(assets.sounds && assets.sounds[sound]) {
				return assets.sounds[sound].pySound;
			}
			throw new Sk.builtin.KeyError("No sound found like '" + sound + "'. Are you sure the sound exists?");
		});

	}, 'pgzero.loaders.SoundLoader', []);

	var Screen = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.clear = new Sk.builtin.func(function(self) {
			Sk.builtin.pyCheckArgs("clear", arguments, 1, 1);
			cx.clearRect(0, 0, width, height);
		});
		
		$loc.surface = Sk.misceval.callsim(Surface);

		$loc.blit = new Sk.builtin.func(function(self, image, coords) {
			Sk.builtin.pyCheckArgs("blit", arguments, 3, 3);
			coords = Sk.ffi.remapToJs(coords);
			var jsName = Sk.ffi.remapToJs(image);
			if(!loadedAssets[jsName]) {
				throw new Sk.builtin.KeyError("No image found like '" + jsName + "'. Are you sure the image exists?");
			}
			cx.drawImage(loadedAssets[jsName].image, coords[0], coords[1]);
		});

		$loc.fill = new Sk.builtin.func(function(self, color) {
			Sk.builtin.pyCheckArgs("fill", arguments, 2, 2);

			var rgb = Sk.ffi.remapToJs(color);
			cx.fillStyle = getColor(rgb);
			cx.fillRect(0, 0, width, height);
			
		});

		$loc.draw = Sk.misceval.callsim(SurfacePainter);

	}, 'pgzero.screen.Screen', []);

	

	s.go = new Sk.builtin.func(function() {

		// create globals
		Sk.globals.screen = Sk.misceval.callsim(Screen);

		width = 800;
		if(Sk.globals.WIDTH) {
			width = Sk.ffi.remapToJs(Sk.globals.WIDTH);
		}
		
		height = 600;
		if(Sk.globals.HEIGHT) {
			height = Sk.ffi.remapToJs(Sk.globals.HEIGHT);
		}

		if(Sk.globals.TITLE) {
			var title = PythonIDE.sanitize(Sk.ffi.remapToJs(Sk.globals.TITLE));
			$('#dlg').dialog({title:title});
		}

// ----------------------- 	   
	    PythonIDE.python.output('<div><button style="position:absolute;top:10px;right:10px;background-color:'+btnAssetColor+'" id="btn_PGZAssetManager"><i class="fa fa-file-image-o"></i> Галерея </button></div><style>.asset_img{width:50px;float:left;margin-right:5px;} .asset{display:inline-block;background-color:#FF9;padding:5px;margin:5px;border-radius:10px;border: solid 1px #000;}</style>', true);
	    PythonIDE.python.output('<canvas id="PGZcanvas" width="' + width + '" height="' + height + '"></canvas>', true);	    

	    function getImageData(url, callback) {
		  var xhr = new XMLHttpRequest();
		  xhr.onload = function() {
		    var reader = new FileReader();
		    reader.onloadend = function() {
		      callback(reader.result);
		    }
		    reader.readAsDataURL(xhr.response);
		  };
		  xhr.open('GET', url);
		  xhr.responseType = 'blob';
		  xhr.send();
		}

	    function getAssetManagerHtml(assets, assetType) {
	    	var html = '';
	    	switch(assetType) {
	    		case 'images':
	    			if(assets.images) {
	    				for(var name in assets.images) {							
	    					var image = assets.images[name];
	    					html += '<div class="asset" id="asset_image_' + name + '"><img class="asset_img" src="' + image.src + '">';
	    					html += '<div><b>' + name + '</b></div>';
	    					var src = image.src;
	    					if(src.match(/data:image/)) {
	    						src="base64";
	    					} else {
	    						getImageData(src, function(data) {
	    							
	    						})
	    					};
	    					html += '<button id="btn_asset_delete_image_' + name + '" class="btn_asset"><i class="fa fa-trash"></i></button>'
	    					html += '</div>';
	    				}
	    			}
	    		break;
	    		case 'sounds':
	    			if(assets.sounds) {
	    				for(var name in assets.sounds) {
	    					var sound = assets.sounds[name];
	    					html += '<div class="asset" id="asset_sound_' + name + '"><audio class="asset_snd" controls src="' + sound.src + '"></audio>';
	    					html += '<div><b>' + name + '</b></div>';
	    					html += '<button id="btn_asset_delete_sound_' + name + '" class="btn_asset"><i class="fa fa-trash"></i></button>'
	    					html += '</div>';
	    				}
	    			}
	    		break;
	    	}
	    	return html;
	    }
	    
	    

	    function showAssetManager(reloadAssets) {
	    	$('#PGZAssetManager').remove();
	    	if(PythonIDE.files['assets.json'] && reloadAssets) {
				assets = JSON.parse(PythonIDE.files['assets.json']);
			}
	    	var html = '<div id="PGZAssetManager" title="Галерея ресурсів">У вебверсії Pygame Zero зображення та звуки перед використання необхідно попередньо завантажити до середовища програмування!<br>';
	    		    	
	    	html += '<fieldset id="pgz_assets_images"><legend>Зображення</legend>';
	    	html += '<p>Перед використанням оберіть та завантажте потрібні файли зображень. </p>';
	    	html += '<p>Підтримувані типи: .jpg, .png та .gif. </p><br>';	    	
	    	html +=  '<div>Зображення: <input type="file" id="choose-file" name="choose-file" onchange="getFile()"/><button class="btn_asset" id="btn_asset_add_image">Додати зображення</button></div>';
	    	html += getAssetManagerHtml(assets, 'images');
	    	html += '</fieldset>'

	    	html += '<fieldset id="pgz_assets_sounds"><legend>Звуки</legend>';
	    	html += '<p>Підтримувані типи: .wav, .ogg and .mp3</p>';
	    	html += '<div>Адреса звукового файлу:<input type="text" id="asset_new_sound"><button class="btn_asset" id="btn_asset_add_sound">Додати звук</button></div>';
	    	html += getAssetManagerHtml(assets, 'sounds');
	    	html += '</fieldset>';
	    	html += '<button id="btn_AssetManager_ok" class="btn_asset"><i class="fa fa-check"></i> Гаразд</button>';
	    	html += '<button id="btn_AssetManager_cancel" class="btn_asset"><i class="fa fa-times"></i> Скасувати</button>';
	    	
	    	html += '<div  style="position:absolute;bottom:0;left:0;display:inline-block;">Інформація про використані ресурси (зображення та звуки) зберігається у файлі assets.json.<br><button id="btnAssetSave"> Зберегти ресурси</button>';
	    	html += '<p> Використати ресурси </p><input type="file" id="asset-file" name="asset-file" onchange="loadAsset()"/><button id="btnAssetLoad"> Використати</button></div>';
	    	html += '</div>';
	    	
	    	$('body').append(html);
	    	$('#PGZAssetManager').dialog( {
	    		width: window.innerWidth * .8,
	    		height: window.innerHeight * .8
	    	});
	    	$('#btnAssetSave').button().click(function(e) {			 
			 if(PythonIDE.files['assets.json']) {				
					var blob = new Blob([PythonIDE.files['assets.json']], {type : "text/plain", endings: "transparent"});
					saveAs(blob, 'assets.json');
				}	
			});
			$('#btnAssetLoad').button().click(function(e) {
			 if(PythonIDE.files['assets.json'] && reloadAssets) {
				assets = JSON.parse(PythonIDE.files['assets.json']);
				showAssetManager(false);
				$('#btn_PGZAssetManager').css('background-color','#00ff00');
			 }
			});
	    	$('.btn_asset').button().click(function(e) {
	    		var parts = e.currentTarget.id.split("_");
	    		switch(parts[2]) {
	    			case 'ok':
	    				PythonIDE.files['assets.json'] = JSON.stringify(assets, null, 2);
	    				//PythonIDE.updateFileTabs();
	    			case 'cancel':
	    				$('#PGZAssetManager').dialog("close");
	    			break;
	    			case 'delete':
	    				var name = parts[4];
	    				var type = parts[3];
	    				$('#asset_' + type + '_' + name).remove();
	    				delete assets[type + "s"][name];
	    			break;
	    			case 'add':
		    			if(!assets) {
							assets = {
							};
						}
    					var type = parts[3];
    					if(type == "image") {
    						if(!assets.images) {
    							assets.images = {};
    						}    						
    						var url = document.getElementById("choose-file").files[0].name;
    						var imageData = localStorage.getItem(url)   						
							var name = url.split(".")[0];
							name = name.toLowerCase();
							assets.images[name] = {src:imageData};	
		    				showAssetManager(false);
		    				$('#btn_PGZAssetManager').css('background-color','#00ff00');
    					}
    					if(type == "sound") {
    						if(!assets.sounds) {
    							assets.sounds = {
    							}
    						}
    						var url = $('#asset_new_sound').val();
    						var m = url.match(/\/([A-Z_\-0-9]+)\.(wav|ogg|mp3)/i);
    						if(m) {
								var name = m[1];
	    						assets.sounds[name] = {src:url};	
	    						showAssetManager(false);
    						} else {
    							PythonIDE.showHint("Invalid sound URL");
    						}
    					}
	    			break;
	    		}
	    	});
	    }
	    $('#btn_PGZAssetManager').button().click(function() {showAssetManager(true);});
		document.activeElement.blur();

	    var jqCanvas = $('#PGZcanvas');    
	    canvas = jqCanvas[0];
	    cx = canvas.getContext("2d");

		var lastUpdate = new Date().getTime()
	    function update() {
	    	var tasks = [];
			// process animations
			for(var id in animations) {
				var a = animations[id];
				var now = (new Date).getTime();
				a.progress = (now - a.startTime) / (a.duration * 1000);
				if(a.progress >= 1) {
					a.progress = 1;
					if(a.on_finished) {
						tasks.push(Sk.misceval.callsimAsync(handlers, a.on_finished).then(function success(r) {
						}, function fail(e) {
							window.onerror(e);
						}));
					}
				}
				for(var key in a.targets) {
					var x = a.progress;
					var y = x;
					switch(a.tween) {
						case 'bounce_end':
							y = 1 - Math.abs(Math.cos(3 * Math.PI * x * x) * Math.exp(-3 * x));
						break;
						case 'accelerate':
						break;
						case 'decelerate':
						break;
						case 'accel_decel':
						break;
						case 'start_elastic':
						break;
						case 'end_elastic':
						break;
						case 'bounce_start':
						break;
						case 'bounce_start_end':
						break;
						
					}
					var newVal = ((a.targets[key].end - a.targets[key].start) * y) + a.targets[key].start;
					updateActorAttribute(a.object, Sk.ffi.remapToPy(key), Sk.ffi.remapToPy(newVal));
				}
				if(a.progress ==1 ) {
					delete animations[a.id];
				}
			}
			
	    	if(Sk.globals.update) {
	    		if(Sk.globals.update.func_code.length > 0) {
					var newTime = new Date().getTime();
					var dt = (lastUpdate - newTime) / 1000;
					lastUpdate = newTime;
					lastUpdate = new Date().getTime();
    				tasks.push(Sk.misceval.callsimAsync(handlers, Sk.globals.update, new Sk.ffi.remapToPy(dt)));
    			} else {
    				tasks.push(Sk.misceval.callsimAsync(handlers, Sk.globals.update));
    			}
	    	}

	    	if(Sk.globals.draw) {
	    		Sk.misceval.callsim(Sk.globals.draw);
	    		//tasks.push(Sk.misceval.callsimAsync(handlers, Sk.globals.draw));
	    	}

			var p = Promise.all(tasks).then(function() {
				window.requestAnimationFrame(update);	
				//update();
			}, function(e) {
				PythonIDE.handleError(e);
			}).catch(function(e) {
				PythonIDE.handleError(e);
			}); 
			return p;
			

	    	
	    }

	    // add event handlers
	    if(Sk.globals.on_mouse_down) {
    		jqCanvas.on('mousedown', function(e) {
    			var pos = new Sk.builtin.tuple([Math.round(e.offsetX), Math.round(e.offsetY)]);
    			if(Sk.globals.on_mouse_down.func_code.length > 1) {
    				Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_down, Sk.globals.mouse.LEFT, pos);
    			} else {
    				Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_down, pos);
    			}
    			
    		});
    	}

    	if(Sk.globals.on_mouse_move) {
    		jqCanvas.on('mousemove', function(e) {
    			var pos = new Sk.builtin.tuple([Math.round(e.offsetX), Math.round(e.offsetY)]);
    			Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_move, pos);
    			
    		});	
    	}

    

	    Sk.globals.sounds = Sk.misceval.callsim(SoundLoader);
	    
    	// wait for assets to load
    	Promise.all(promises).then(function() {
    		update();
    	}, function(e) {
    		PythonIDE.handleError(e);
    	}).catch(PythonIDE.handleError);	
    	

    	PythonIDE.keyHandlers.push(function(e) {
    		var key = e.key.replace("Arrow", "").toLowerCase();
    		switch(key) {
    			case " ":
    				key = "space";
    			break;
    			case "enter":
    				key = "return";
    			break;
    		}
		
    		if(e.type == "keydown") {
    			keysPressed[key] = true;
    			if(Sk.globals.on_key_down) {
					var pyKey = Sk.misceval.callsim(EnumValue, "keys", key.toUpperCase(), e.keyCode);
    				if(Sk.globals.on_key_down.func_code.length > 0) {
	    				Sk.misceval.callsimAsync(handlers, Sk.globals.on_key_down, pyKey).then(function success(r) {}, function fail(e) {
							window.onerror(e);
						});
	    			} else {
	    				Sk.misceval.callsimAsync(handlers, Sk.globals.on_key_down).then(function success(r) {}, function fail(e) {
							window.onerror(e);
						});
	    			}
    				
    			}
    		}
    		if(e.type == "keyup") {
    			keysPressed[key] = false;	
    		}
    	});
	
    	

	    return PythonIDE.runAsync(function(resolve, reject) {
	    });
		
	});

	function loadAssets() {
		
		return promises;
	}

	// load assets
    if(assets) {

    	// load sounds
    	if(assets.sounds) {
    		for(var name in assets.sounds) {
    			promises.push(new Promise(function(resolve, reject) {
    				assets.sounds[name].pySound = Sk.misceval.callsim(Sound, Sk.ffi.remapToPy(name));
    				assets.sounds[name].audio = new Audio(assets.sounds[name].src);
    				assets.sounds[name].audio.oncanplaythrough = function() {
    					resolve();	
    				}
    				assets.sounds[name].audio.label = name;
    				assets.sounds[name].audio.onerror = function(e) {
    					PythonIDE.handleError("Could not load sound: " + e.currentTarget.label);
    				}
    				assets.sounds[name].audio.load();
    			}));
    		}
    	}

    	// load images
    	if(assets.images) {
			
		    for(var name in assets.images) {
	    		promises.push(new Promise(function(resolve, reject) {
					var img = new Image;
    				img.name = name;
    				img.addEventListener("load", function(e) {
    					var a = assets.images[img.name];
    					if(!a.width) {
    						a.width = img.width * (a.height / img.height);
    					}
    					if(!a.width) {
    						a.width = img.width;
    					}
    					if(!a.height) {
    						a.height = img.height * (a.width / img.width);
    					}
    					if(!a.height) {
    						a.height = img.height;
    					}
    					loadedAssets[img.name] = {
			    			image: img,
			    			name: img.name,
			    			type: "image",
			    			width: a.width,
			    			height: a.height
			    		};
    					resolve(img.img);
    					
    				}, false);
    				img.addEventListener("error", function(e) {
    					throw new Sk.builtin.Exception("Could not load image " + img.name + ". Images can only be loaded from servers that have enabled CORS - try a different URL");
    					reject("Could not load image " + img.name);
    				});
    				img.src = assets.images[img.name].src;
				}));
	    	}
	    }
    }
    return s;
	
};
