// MartyPy resources are released under a creative commons attribution-non commercial - shareAlike license
// see https://creativecommons.org/licenses/by-nc-sa/4.0/
// Source adapted from https://github.com/robotical/martypy/blob/master/martypy/marty.py
var $builtinmodule = function (name) {
    var s = {
	};


	PythonIDE.python.output('<small>MartyPy support is in alpha development. Click <a href="http://docs.robotical.io/python/martypy/" target="_blank">here</a> for the MartyPy documentation. MartyPy resources are released under a <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">Creative Commons ShareAlike-non-commercial</a> licence and are integrated here with the kind permission of <a href="https://robotical.io/">robotical.io</a>. Marty the Robot and robotical.io are not affiliated with create.withcode.uk</small>', true);
	PythonIDE.python.output('<div id="marty_canvas"></div><style> #marty_canvas,#marty_canvas canvas {background-color:#FFF;width:100%;height:300px}</style>', true);
	var holder = $('#marty_canvas');
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, holder.width()/holder.height(), 0.1, 1000 );

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( holder.width(), holder.height() );
	document.getElementById('marty_canvas').appendChild( renderer.domElement );

	var marty = undefined;

	var loader = new THREE.GLTFLoader();
	var light = new THREE.AmbientLight(0xffffff);
	scene.add(light);
	camera.position.z = 4;

	const SPEED = 0.005;
	var rotateDelta = -SPEED;
	var loaded = false;
	var onload = [];

	var tweens = [];

	function randBetween(min, max) {
		return Math.random() * (max - min) + min;
	}

	function tween(object, property, value, duration) {
		var now = Date.now();
		var t = {
			obj: object,
			prop: property,
			val: {
				init: object[property],
				current: object[property],
				target: value
			},
			duration: {
				startTime: now,
				endTime: now + duration,
				progress: 0
			}
		}
		tweens.push(t);
	}

	loader.load( '/lib/skulpt/martypy/Marty.glb', function ( gltf ) {
		scene.add(gltf.scene);
		loaded = true;
		marty = gltf.scene;
		var callback = onload.pop();
		while(callback) {
			callback();
			callback = onload.pop()
		}
	}, undefined, function ( error ) {
		console.error( error );
	} );	
	

	var animate = function () {
		requestAnimationFrame( animate );
		renderer.render( scene, camera );

		const MIN_ROT = -3.14;
		const MAX_ROT = 0;
		if(marty) {
			marty.rotation.y += rotateDelta;
			if(marty.rotation.y < MIN_ROT) {
				rotateDelta = SPEED;
			}
			if(marty.rotation.y > MAX_ROT) {
				rotateDelta = -SPEED;
			}
		}

		// process tweens
		var now = Date.now();
		if(tweens.length > 0) {
			var newTweens = [];
			while(tweens.length > 0) {
				var t = tweens.pop();	
				if(t.duration.endTime > now) {
					t.duration.progress = (now - t.duration.startTime) / (t.duration.endTime - t.duration.startTime);
					t.val.current = t.duration.progress * (t.val.target - t.val.init) + t.val.init;
					t.obj[t.prop] = t.val.current;
					newTweens.push(t);
				} else {
					t.obj[t.prop] = t.val.target;
				}
			}
			tweens = newTweens;
		}
	};

	animate();

	s.Marty = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		$loc.__init__ = new Sk.builtin.func(function(self) {
			return PythonIDE.runAsync(function(resolve, reject) {
				if(loaded) {
					resolve();
				} else {
					onload.push(resolve);
				}
			});
			
		});

		$loc.hello = new Sk.builtin.func(function(self) {
			sc = marty;
			var lEye = marty.getObjectByName("L_eye");
			var rEye = marty.getObjectByName("R_eye");

			// TODO: zero all joints

			// wiggle eyebrows
			var r = randBetween(-1, 1);
			tween(lEye.rotation, "x", r, 500);
			tween(rEye.rotation, "x", -r, 500);
			
		});

		$loc.SIDE_CODES = Sk.ffi.remapToPy({
			'left'    : 0x00,
	        'right'   : 0x01,
	        'forward' : 0x02,
	        'back'    : 0x03,
	        'auto'    : 0xff
		});

		$loc.STOP_TYPE = Sk.ffi.remapToPy({
			'clear queue'       : 0x00, // clear movement queue only (so finish the current movement)
	        'clear and stop'    : 0x01, // clear movement queue and servo queues (freeze in-place)
	        'clear and disable' : 0x02, // clear everything and disable motors
	        'clear and zero'    : 0x03, // clear everything, and make robot return to zero
	        'pause'             : 0x04, // pause, but keep servo and movequeue intact and motors enabled
	        'pause and disable' : 0x05, // as 4, but disable motors too
		});

		// Enable or disable motors
		$loc.enable_motors = new Sk.builtin.func(function(self, enable=Sk.ffi.remapToPy(true), clear_queue=Sk.ffi.remapToPy(true)) {
			//throw new Sk.builtin.Exception("Not implemented yet");
		});

		// Enable or disable safeties
		$loc.enable_safeties = new Sk.builtin.func(function(self, enable=Sk.ffi.remapToPy(true)) {
			//throw new Sk.builtin.Exception("Not implemented yet");
		});

		// Enable or disable fall protection
		$loc.fall_protection = new Sk.builtin.func(function(self, enable=Sk.ffi.remapToPy(true)) {
			//throw new Sk.builtin.Exception("Not implemented yet");
		});

		// Stop motions
		$loc.stop = new Sk.builtin.func(function(self, stop_type = undefined) {
			throw new Sk.builtin.Exception("Not implemented yet");
		});

		//  Try and find us some Martys!
		$loc.discover = new Sk.builtin.func(function(self) {
			throw new Sk.builtin.Exception("Not implemented yet");
		});

		function defParam(pyVar, defaultValue, min, max) {
			var v = defaultValue;
			if(pyVar !== undefined) {
				v = Sk.ffi.remapToJs(pyVar);
			} 
			if(min !== undefined) {
				if(v < min) 
					v = min;
			}
			if(max !== undefined) {
				if(v > max)
					v = max;
			}
			return v;
		}

		// Move a specific joint to a position
		$loc.move_joint = new Sk.builtin.func(function(self, joint_id, position, move_time) {
			var jsID = defParam(joint_id, 0);
			var jsPos = defParam(position, 0, -128, 127) * 3.14 / 2;
			var jsTime = defParam(move_time, 1000);
			var obj = undefined;
			var axis = "z";
			switch(jsID) {
				case 0: // left hip lean
					obj = marty.getObjectByName("L_thigh");
				break;
				case 1: // left knee twist
					obj = marty.getObjectByName("L_knee");
					axis = "y";
				break;
				case 2: // left knee bend
					obj = marty.getObjectByName("L_shin");
				break;
				case 3: // right hip lean
					obj = marty.getObjectByName("R_thigh");
				break;
				case 4: // right knee twist
					obj = marty.getObjectByName("R_knee");
					axis = "y";
				break;
				case 5: // right knee bend
					obj = marty.getObjectByName("R_shin");
					jsPos *= -1;
				break;
				case 6: // right arm
					obj = marty.getObjectByName("R_arm");
				break;
				case 7: // left arm
					obj = marty.getObjectByName("L_arm");
				break;
				case 8: // eyes
					jsPos *= 2 / 3.14;
					axis = "x";
					obj = marty.getObjectByName("R_eye");
					tween(obj.rotation, axis, jsPos / 128, jsTime)
					jsPos *=-1;
					obj = marty.getObjectByName("L_eye");
				break;
			}
			if(obj) {
				tween(obj.rotation, axis, jsPos / 128, jsTime)
			} else {
				throw new Sk.builtin.Exception("Not implemented yet");	
			}
			
			//
		});

		// Lean over in a direction
		$loc.lean = new Sk.builtin.func(function(self, joint_id, postition, move_time) {
			throw new Sk.builtin.Exception("Not implemented yet");
		});

		// Walking macro
		$loc.walk = new Sk.builtin.func(function(self, 
				num_steps=Sk.ffi.remapToPy(2), 
				start_foot=Sk.ffi.remapToPy('auto'), 
				turn=Sk.ffi.remapToPy(0), 
				step_length=Sk.ffi.remapToPy(40), 
				move_time=Sk.ffi.remapToPy(1500)) {

			throw new Sk.builtin.Exception("Not implemented yet");
		});

		// Move the eyes to an angle
		$loc.eyes = new Sk.builtin.func(function(self, angle, move_time=Sk.ffi.remapToPy(100)) {
			sc = marty;
			var lEye = marty.getObjectByName("L_eye");
			var rEye = marty.getObjectByName("R_eye");
			
			if(angle === undefined) {
				throw new Sk.builtin.Exception("angle not specified");
			}

			var r = defParam(angle, 0, -128, 127) / 128;
			var duration = defParam(move_time, 1000);
			tween(lEye.rotation, "x", r, duration);
			tween(rEye.rotation, "x", -r, duration);
		});

		// Kick with Marty's feet
		$loc.kick = new Sk.builtin.func(function(self, 
				side=Sk.ffi.remapToPy('right'), 
				twist=Sk.ffi.remapToPy(0), 
				move_time=Sk.ffi.remapToPy(2000)) {
			throw new Sk.builtin.Exception("Not implemented yet");
		});

		// Move the arms to a position
		$loc.arms = new Sk.builtin.func(function(self, left_angle, right_angle, move_time) {
			throw new Sk.builtin.Exception("Not implemented yet");
		});

		// Do a small celebration
		$loc.celebrate = new Sk.builtin.func(function(self, move_time=Sk.ffi.remapToPy(4000)) {
			throw new Sk.builtin.Exception("Not implemented yet");
		});

		// Boogy, Marty!
		$loc.circle_dance = new Sk.builtin.func(function(self, 
				side=Sk.ffi.remapToPy('right'), 
				move_time=sk.ffi.remapToPy(1500)) {
			throw new Sk.builtin.Exception("Not implemented yet");
		});

		// Take sidesteps
		$loc.sidestep = new Sk.builtin.func(function(self, 
				steps=Sk.ffi.remapToPy(1), 
				step_length=Sk.ffi.remapToPy(100), 
				move_time=Sk.ffi.remapToPy(2000)) {
			throw new Sk.builtin.Exception("Not implemented yet");
		});

		// Play a tone
		$loc.play_sound = new Sk.builtin.func(function(self, freq_start, freq_end, duration) {
			throw new Sk.builtin.Exception("Not implemented yet");
		});
	}, 'Marty', []);

	return s;
	
};
