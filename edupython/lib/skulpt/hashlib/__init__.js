var $builtinmodule = function (name) {
	var mod = {};

	var data = {
		supported : ['md5', 'sha256', 'sha512']
		};

	mod.algorithms = new Sk.builtin.tuple(Sk.ffi.remapToPy(data.supported));

	mod.algorithms_guaranteed = new Sk.builtin.tuple(Sk.ffi.remapToPy(data.supported));

	mod.algorithms_available = new Sk.builtin.tuple(Sk.ffi.remapToPy(data.supported));

	createHashClass = function(algorithm, digest_size, block_size) {
		return new Sk.misceval.buildClass(mod, function($gbl, $loc) {
			$loc.data = {
				str: ""
			};

			$loc.compute = function() {
				$loc.data.digest = CryptoJS[algorithm]($loc.data.str);
			}


			$loc.__init__ = new Sk.builtin.func(function(self, str) {
				if(str !== undefined) {
					$loc.data.str = str.v;
				}
				$loc.compute();
			});

			$loc.digest_size = Sk.ffi.remapToPy(digest_size);

			$loc.block_size = Sk.ffi.remapToPy(block_size);

			$loc.update = new Sk.builtin.func(function(self, str) {
				$loc.data.str += str.v;
				$loc.compute();
			});

			$loc.digest = new Sk.builtin.func(function(self) {
				return Sk.ffi.remapToPy($loc.data.digest.toString(CryptoJS.enc.Latin1));
			});

			$loc.hexdigest = new Sk.builtin.func(function(self) {
				return Sk.ffi.remapToPy($loc.data.digest.toString(CryptoJS.enc.Hex));
			});

			$loc.copy = new Sk.builtin.func(function(self) {
				var c = Sk.misceval.callsim(mod.md5);
				c.data.str = ""+$loc.data.str;
				c.compute();
				return c;
				/// TODO: doesn't seem to be a separate object - all changes affect all objects?!
			});


		});
	}

	mod.md5 = createHashClass("MD5", 16, 32);

	mod.sha256 = createHashClass("SHA256", 32, 64);

	mod.sha512 = createHashClass("SHA512", 64, 128);
	mod.sha1 = createHashClass("SHA1", 20, 64);
	mod.sha224 = createHashClass("SHA224", 28, 64);
	mod.sha384 = createHashClass("SHA384", 48, 128);

	return mod;
};
