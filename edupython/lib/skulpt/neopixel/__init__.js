var $builtinmodule = function (name) {
	

	// speech module


  var mod = {

	};
	
	mod.NeoPixel = new Sk.misceval.buildClass(mod, function($gbl, $loc) {
		var instanceCount = 0;
				
		$loc.__init__ = new Sk.builtin.func(function(self, pin, pixels) {
			self.pin = pin;
			self.pixels = pixels;
			self.data = [];
			self.instance = instanceCount++;
			html = '<div class="neopixel">';
			for(var i = 0; i < Sk.ffi.remapToJs(pixels); i++) {
				self.data.push([0,0,0]);
				html += '<span class="pixel" id="np_' + self.instance + '_' + i + '"></span>';
			}
			html += '</div>';
			html += '<style>.pixel{display:inline-block; margin: 10px; width: 20px; height: 20px; background-color: rgb(0,0,0);}</style>';
			PythonIDE.python.output(html);
		});
		
		$loc.__len__ = new Sk.builtin.func(function(self) {
			return self.pixels;
		});
		
		$loc.__getitem__ = new Sk.builtin.func(function(self, key) {
			return new Sk.builtin.tuple(self.data[Sk.ffi.remapToJs(key)]);
		});
		
		$loc.__setitem__ = new Sk.builtin.func(function(self, key, value) {
			// scale up colours to make brighter
			var colours = Sk.ffi.remapToJs(value);
			var max = colours[0];
			for(var i = 1; i < 3; i ++) {
				if(colours[i] > max) max = colours[i];
			}
			var scaleFactor = 1;
			if(max > 0) {
				scaleFactor = 255 / max;	
			}
			
			for(var i = 0; i < 3; i++) {
				colours[i] = Math.floor(colours[i] * scaleFactor);
			}
			self.data[Sk.ffi.remapToJs(key)] = colours;
		});
		
		$loc.show = new Sk.builtin.func(function(self) {
			for(var i = 0; i < Sk.ffi.remapToJs(self.pixels); i++) {
				$('#np_' + self.instance + '_' + i).css('background-color', 'rgb(' + self.data[i][0] + ',' + self.data[i][1] + ',' + self.data[i][2] + ')');	
			}

			
		});
	}, 'NeoPixel', []);

	
	return mod;

};
