// TODO: work through https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
var $builtinmodule = function(name) {
	var mod = {};
	var header = document.getElementById('headerOut');

	function loadScript(url, module, done) {
		var script = document.createElement("script");
		if(done) script.addEventListener("load", done);
		script.src = url;
		if(module) {
			script.type = "module";
		}	
		header.appendChild(script);
	}

	function setupPhysics() {
		collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();
		physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
		physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
		tmpTrans = new Ammo.btTransform();
	}
	
	var onLoaded = undefined;
	var rigidBodies = [];
	var tmpTrans;
	var physicsWorld;
	var collisionConfiguration;
	var dispatcher, overlappingPairCache, solver;
	loadScript("/lib/skulpt/py3d/lib3d.js", true, function(e) {
		PythonIDE.py3d.init();
		if(onLoaded) {
			onLoaded();
			onLoaded = true;
		}
	});

	mod.add_cube = new Sk.builtin.func(function(position, size, colour) {
		position = Sk.ffi.remapToJs(position);
		size = Sk.ffi.remapToJs(size);
		colour = Sk.ffi.remapToJs(colour);
		let mesh = new PythonIDE.THREE.Mesh(new PythonIDE.THREE.BoxBufferGeometry(), new PythonIDE.THREE.MeshPhongMaterial({color: colour}));

		mesh.position.set(position[0], position[1], position[2]);
		mesh.scale.set(size[0], size[1], size[2]);

		mesh.castShadow = true;
		mesh.receiveShadow = true;

		PythonIDE.py3d.scene.add(mesh);
		var pyOb3d = Sk.misceval.callsim(Object3D, mesh);
		return pyOb3d;
	});

	mod.get_camera = new Sk.builtin.func(function() {
		return Sk.misceval.callsim(Object3D, PythonIDE.py3d.camera);
	});

	function update(timeStamp) {
		var deltaTime = timeStamp - mod._lastUpdate;
		if(mod._lastUpdate == 0) {
			deltaTime = 0;
		}
		if(mod._physics && physicsWorld) {
			physicsWorld.stepSimulation(deltaTime/5000, 10);
			for(var i = 0; i < rigidBodies.length; i++) {
				let objThree = rigidBodies[ i ];
				let objAmmo = objThree.userData.physicsBody;
				let ms = objAmmo.getMotionState();
				if ( ms ) {
					ms.getWorldTransform( tmpTrans );
					let p = tmpTrans.getOrigin();
					let q = tmpTrans.getRotation();
					objThree.position.set( p.x(), p.y(), p.z() );
					objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
				}
			}					
		}
		Sk.misceval.callsim(mod._mainLoop, Sk.ffi.remapToPy(deltaTime));
		mod._lastUpdate = timeStamp;
		if(mod.keepRunning) {
			requestAnimationFrame(update);
		}
	}

	var on = function(event, handler) {
		event = "" + Sk.ffi.remapToJs(event);
		switch(event.toLowerCase()) {
			case 'update':
				mod._mainLoop = handler;
				mod._lastUpdate = 0;
				mod.keepRunning = true;
				if(mod._mainLoop) {				
					requestAnimationFrame(update);
				}
				break;
			default:
				throw new Sk.Exception(event + " event not recognised");
		}
	};
	on.co_varnames = ["event", "handler"];
	mod.on = new Sk.builtin.func(on);
	
	var set_background = function(color) {
		color = Sk.ffi.remapToJs(color);
		if(color.length == 3) {
			PythonIDE.py3d.scene.background = new PythonIDE.THREE.Color('rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')');
		} else {
			PythonIDE.py3d.scene.background = new PythonIDE.THREE.Color(color);
		}
	}
	set_background.co_varnames = ["color"];
	
	mod.set_background = new Sk.builtin.func(set_background);

	mod.init = new Sk.builtin.func(function(physics) {
		$('#consoleOut').css('max-height','3em');
		var loadPromises = [];
		physics = Sk.ffi.remapToJs(physics);
		if(physics) {
			var p = new Promise((resolve, reject) => {
				loadScript("/lib/skulpt/py3d/ammo.js", false, function(e) {
					Ammo().then(function() {
						setupPhysics();
						resolve();
					});
				});
			});
			loadPromises.push(p);
			mod._physics = true;
		}
		var html = '<button id="py3d_stop">Stop</button>';
		PythonIDE.python.output(html, true);
		$('#py3d_stop').click(function() {
			$('#py3d_stop').remove();
			mod.keepRunning = false;
		});
		
		return PythonIDE.runAsync(function(resolve, reject) {
			function waitForAll() {
				Promise.all(loadPromises).then(resolve);
			}
			if(onLoaded) {
				waitForAll()
			} else {
				onLoaded = waitForAll;
			}
		});	
	});

	var Object3D =  new Sk.misceval.buildClass(mod, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self, THREEObj) {
			self._obj = THREEObj;
		});

		var move = function(self, position) {
			position = Sk.ffi.remapToJs(position);
			if(position.length !=3) {
				throw new Sk.builtin.ValueError("position must be a Vector3");
			}
			self._obj.position.x = position[0];
			self._obj.position.y = position[1];
			self._obj.position.z = position[2];
			self._obj.lookAt(new PythonIDE.THREE.Vector3(position[0], position[1], position[2]));
			self._obj.updateProjectionMatrix();
		}
		move.co_varnames = ['position'];
		$loc.move = new Sk.builtin.func(move);

		var look_at = function(self, position) {
			position = Sk.ffi.remapToJs(position);
			if(position.length !=3) {
				throw new Sk.builtin.ValueError("position must be a Vector3");
			}
			self._obj.lookAt(new PythonIDE.THREE.Vector3(position[0], position[1], position[2]));
			self._obj.updateProjectionMatrix();
		}
		look_at.co_varnames = ['position'];
		$loc.look_at = new Sk.builtin.func(look_at);


		$loc.__setattr__ = new Sk.builtin.func(function(self, name, val) {
			name = Sk.ffi.remapToJs(name);
			val = Sk.ffi.remapToJs(val);
			switch(name) {
				case 'x':
					self._obj.position.x = val;
					break;
				case 'y':
					self._obj.position.y = val;
					break;
				case 'z':
					self._obj.position.z = val;
					break;
			}
		});

		$loc.__getattr__ = new Sk.builtin.func(function(self, name) {
			var jsName = Sk.ffi.remapToJs(name);
			switch(jsName) {
				case 'x':
					return Sk.ffi.remapToPy(self._obj.position.x);
					break;
				case 'y':
					return Sk.ffi.remapToPy(self._obj.position.y);
					break;
				case 'z':
					return Sk.ffi.remapToPy(self._obj.position.z);
					break;
			}
		});

		$loc.scale = new Sk.builtin.func(function(self, scale) {
			scale = Sk.ffi.remapToJs(scale);
			if(typeof scale == "number") {
				scale = [scale, scale, scale];
			}
			
			if(scale.length == 3) {
				self._obj.scale.x = scale[0];
				self._obj.scale.y = scale[1];
				self._obj.scale.z = scale[2];
			} 
			else {
				throw new Sk.builtin.Exception("Scale expects a single value or a list of 3 values");
			}
		});

		$loc.rotate_x = new Sk.builtin.func(function(self, degrees) {
			degrees = Sk.ffi.remapToJs(degrees);
			if(typeof degrees == "number") {
				self._obj.rotateX(PythonIDE.THREE.Math.degToRad(degrees));
			} else {
				throw new Sk.builtin.Exception("rotate_x angle expected in degrees");
			}
		});

		$loc.rotate_y = new Sk.builtin.func(function(self, degrees) {
			degrees = Sk.ffi.remapToJs(degrees);
			if(typeof degrees == "number") {
				self._obj.rotateY(PythonIDE.THREE.Math.degToRad(degrees));
			} else {
				throw new Sk.builtin.Exception("rotate_y angle expected in degrees");
			}
		});

		$loc.rotate_z = new Sk.builtin.func(function(self, degrees) {
			degrees = Sk.ffi.remapToJs(degrees);
			if(typeof degrees == "number") {
				self._obj.rotateZ(PythonIDE.THREE.Math.degToRad(degrees));
			} else {
				throw new Sk.builtin.Exception("rotate_z angle expected in degrees");
			}
		});

		$loc.apply_force = new Sk.builtin.func(function(self, force, relative_pos) {
			force = Sk.ffi.remapToJs(force);
			if(force.length != 3) {
				throw new Sk.builtin.ValueError("force must be a vector of 3 values (in world space)");
			}
			relative_pos = Sk.ffi.remapToJs(relative_pos);
			if(relative_pos.length != 3) {
				throw new Sk.builtin.ValueError("relative_pos must be a vector of 3 values (in local coordinates)");
			}
			if(!mod._physics) {
				throw new Sk.builtin.Exception("Physics must be enabled first");
			}
			if(self._obj.userData.physicsBody) {
				try {
				self._obj.userData.physicsBody.applyForce(
					new Ammo.btVector3(force[0], force[1], force[2]), 
					new Ammo.btVector3(relative_pos[0], relative_pos[1], relative_pos[2]));
				} catch (e) {
					console.error(e);
				}
			}
			
		});

		$loc.set_mass = new Sk.builtin.func(function(self, mass) {
			if(!mod._physics) {
				throw new Sk.builtin.Exception("Physics must be enabled first");
			}
			mass = Sk.ffi.remapToJs(mass);
			let quat = {x: 0, y: 0, z: 0, w: 1};
			let transform = new Ammo.btTransform();
			var box = new PythonIDE.THREE.BoxHelper(self._obj, 0xFF);
			box.geometry.computeBoundingBox();
			var size = new PythonIDE.THREE.Vector3();
			box.geometry.boundingBox.getSize(size);
			
			transform.setIdentity();
			transform.setOrigin( new Ammo.btVector3( self._obj.position.x, self._obj.position.y, self._obj.position.z ) );
			transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
			let motionState = new Ammo.btDefaultMotionState( transform );
			var colShape  = new Ammo.btBoxShape(new Ammo.btVector3(size.x/2, size.y/2, size.z/2));
			var compoundShape = new Ammo.btCompoundShape();
			var localTrans = new Ammo.btTransform();
			localTrans.setIdentity();
			localTrans.setOrigin(new Ammo.btVector3(size.x/2, size.y/2, size.z/2));
			compoundShape.addChildShape(localTrans, colShape);
			
			colShape.setMargin( 0.05 );

			let localInertia = new Ammo.btVector3( 0, 0, 0 );
			colShape.calculateLocalInertia( mass, localInertia );

			let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, compoundShape, localInertia );
			let body = new Ammo.btRigidBody( rbInfo );
			physicsWorld.addRigidBody( body );
			
			self._obj.userData.physicsBody = body;
			rigidBodies.push(self._obj);
		});

	}, "Object3D", []);

	
	mod.Object3D = Object3D;

	mod.find_by_name = new Sk.builtin.func(function(name) {
		name = Sk.ffi.remapToJs(name);
		var jsOb3d = PythonIDE.py3d.scene.getObjectByName(name);
		var pyOb3d = Sk.misceval.callsim(Object3D, jsOb3d);
		return pyOb3d;
	});
	
	mod.load = new Sk.builtin.func(function(filename) {
		PythonIDE.showHint("Loading" + Sk.ffi.remapToJs(filename));
		return PythonIDE.runAsync(function(resolve, reject) {
			PythonIDE.py3d.loader.load(Sk.ffi.remapToJs(filename), function (gltf) {
				PythonIDE.py3d.scene.add(gltf.scene);
				gltf.scene.castShadow = true;
				gltf.scene.receiveShadow = true;
				var pyOb3d = Sk.misceval.callsim(Object3D, gltf.scene);
				resolve(pyOb3d);   		
			}, undefined, function ( error ) {
				reject(error);
			});
		});
	});

	return mod;
};