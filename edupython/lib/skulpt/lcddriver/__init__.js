var $builtinmodule = function (name) {
	var mod = {};
	
	mod.lcd = new Sk.misceval.buildClass(mod, function($gbl, $loc) {
	
		$loc.__init__ = new Sk.builtin.func(function(self, cols, rows, dotsize, charmap, auto_linebreaks) {
			self.cp = [0,0];
			self.rows = 2;
			self.cols = 16;
			var html = '<div id="lcddriver"><div class="screen"><table>'
			for(var row = 0; row < self.rows; row++) {		
				html += '<tr id="lcddriver_row_' + row + '">';		
				for(var col = 0; col < self.cols; col++) {
					html += '<td id="lcddriver_char_' + row + '_' + col + '">&nbsp;' + '</td>';
				}
				html += '</tr>';
			}
			html += '</table></div><a class="lcdhelplink" href="https://github.com/the-raspberry-pi-guy/lcd" target="_blank">lcddriver</a></div>';
			html += '<link rel="stylesheet" href="/lib/skulpt/lcddriver/lcd.css">';
			PythonIDE.python.output(html);
		});
		
		$loc.lcd_strobe = new Sk.builtin.func(function(self, data) {
		});
		
		$loc.lcd_write_four_bits = new Sk.builtin.func(function(self, data) {
		});
		
		$loc.lcd_write = new Sk.builtin.func(function(self, cmd, mode){
		});
		
		$loc.lcd_display_string = new Sk.builtin.func(function(self, string, line) {
			if(string === undefined) {
				throw new Sk.builtin.ValueError("You must specity a string to display");
			}
			if(line === undefined) {
				throw new Sk.builtin.ValueError("You must specify a line (e.g. 1 or 2)");
			}
			var chars = Sk.ffi.remapToJs(string).split("");
			self.cp[0] = Sk.ffi.remapToJs(line) - 1;
			self.cp[1] = 0;
			var i = 0;
			for(var i = 0; i < chars.length; i++) {
				$('#lcddriver_char_' + self.cp[0] + '_' + self.cp[1]).text(chars[i]);
				self.cp[1]++;
				if(self.cp[1] > self.cols - 1) {
					self.cp[1] = 0;
					self.cp[0]++;
					if(self.cp[0] > self.rows - 1) {
						self.cp = [0,0];
					}
				}
			}
		});
		
		$loc.lcd_clear = new Sk.builtin.func(function(self){
			for(var row = 0; row < self.rows; row++) {
				for(var col = 0; col < self.cols; col++) {
					$('#lcddriver_char_' + row + '_' + col).html("&nbsp;");
				}
			}
			self.cp = [0,0];
		});
	
	}, "BaseCharLCD", []);
	
	return mod;
};