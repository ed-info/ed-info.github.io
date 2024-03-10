var $builtinmodule = function (name) {
	// clear all previous frames
	$('.tkinter').remove();
	// tkinter module
	
	var idCount = 0;
	var varCount = 0;
	var firstRoot = 0;

	var widgets = [];
	var variables = [];
	var timeouts = [];

	var cleanup = function() {
		for(var i = 0; i < timeouts.length; i++) {
			clearTimeout(timeouts[i]);
		}
	}
    var s = {
	};


	function getColor(c) {
		var cName = c.replace(" ", "")
		if(tk_colors && tk_colors[cName]) {
			return tk_colors[cName];
		}
		return c;
	}
	
	var applyWidgetStyles = function(self) {
		var e = $('#tkinter_' + self.id);
		if(self.props.fg) {
			var fg = Sk.ffi.remapToJs(self.props.fg);
			e.css('color', getColor(fg));
		}

		if(self.props.relief) {
			var relief = Sk.ffi.remapToJs(self.props.relief);
			if(relief == "raised") {
				e.css({
					'border-style':'solid',
					'border-width': '1px',
					'border-color': '#CCC #000 #000 #CCC'
				});
			}
		}
		
		if(self.props.bg) {
			var bg = Sk.ffi.remapToJs(self.props.bg);	
			e.css('background-color', getColor(bg));
		}

		if(self.props.font) {
			var font = Sk.ffi.remapToJs(self.props.font);
			if(typeof(font) == "string") {
				font = ("" + f).split(" "); 
			} 
				
			var fontFamily = font[0];
			var fontWeight = font.includes("bold")?"bold":"normal";
			var fontStyle = font.includes("italic")?"italic":"normal";

			e.css({
				'font-family': fontFamily,
				'font-weight': fontWeight,
				'font-size': font[1] + "pt",
				'font-style': fontStyle
			});
		}
		
		var unit = "px";
		if(self.props.text) {
			unit = "em";
		}
		
		if(self.props.width) {
			var width = Sk.ffi.remapToJs(self.props.width);
			if(unit == "em") {
				width /= 2;
			}
			e.css('width', width + unit);
		}
		
		if(self.props.height) {
			var height = Sk.ffi.remapToJs(self.props.height);
			e.css('height', height + unit);
		}
	}
	
	var configure = function(kwa, self) {
		for(var i = 0; i < kwa.length; i+=2) {
			var key = Sk.ffi.remapToJs(kwa[i]);
			var val = kwa[i+1];
			self.props[key] = val;

			if(key == "state") {
				var disabled = Sk.ffi.remapToJs(self.props.state) == 'disabled';
				$('#tkinter_' + self.id).prop('disabled', disabled);	
			}

			if(key == "text") {
				$('#tkinter_' + self.id).text(PythonIDE.sanitize(Sk.ffi.remapToJs(self.props.text)));
			}
		}
		applyWidgetStyles(self);
	}
	configure.co_kwargs = true;

	s.__name__ = new Sk.builtin.str("tkinter");

	s.END = new Sk.builtin.str("end");

	s.W = new Sk.builtin.str("w");
	s.E = new Sk.builtin.str("e");
	s.N = new Sk.builtin.str("n");
	s.S = new Sk.builtin.str("s");
	s.DISABLED = new Sk.builtin.str("disabled");
	s.NORMAL = new Sk.builtin.str("normal");
	s.YES = new Sk.builtin.int_(1);
	s.NO = new Sk.builtin.int_(0);
	s.BOTH = new Sk.builtin.str("both");
	s.BOTTOM = new Sk.builtin.str("bottom");
	s.TOP = new Sk.builtin.str("top");
	s.RAISED = new Sk.builtin.str("raised");
	s.HORIZONTAL = new Sk.builtin.str("horizontal");
	s.VERTICAL = new Sk.builtin.str("vertical");
	s.SUNKEN = new Sk.builtin.str("sunken");
	s.ALL = new Sk.builtin.str("all");
	s.NW = new Sk.builtin.str("nw");
	s.ARC = new Sk.builtin.str("arc");
	s.CHORD = new Sk.builtin.str("chord");
	s.PIESLICE = new Sk.builtin.str("pieslice");
	
	s.mainloop = new Sk.builtin.func(function() {
		Sk.builtin.pyCheckArgs("mainloop", arguments, 0, 0);
	});


	s.Variable = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self) {
			variables[varCount] = self;
			self.id = varCount++;
		});

		$loc.__str__ = new Sk.builtin.func(function(self) {
			return new Sk.builtin.str("PY_VAR" + self.id);
		});

		$loc.set = new Sk.builtin.func(function(self, value) {
			Sk.builtin.pyCheckArgs("set", arguments, 1, 2);
			self.value = value;
			if(self.updateID !== undefined) {
				if(widgets[self.updateID].update) {
					widgets[self.updateID].update();
				}
			}
		});

		$loc.get = new Sk.builtin.func(function(self) {
			return self.value;
		});
	}, "Variable", []);

	s.StringVar = new Sk.misceval.buildClass(s, function($gbl, $loc) {

	}, "StringVar", [s.Variable]);

	s.IntVar = new Sk.misceval.buildClass(s, function($gbl, $loc) {

	}, "IntVar", [s.Variable]);

	s.BooleanVar = new Sk.misceval.buildClass(s, function($gbl, $loc) {

	}, "BooleanVar", [s.Variable])
	
	s.Event = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var init = function(kwa, self, master) {
			self.props = unpackKWA(kwa);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);
		
		$loc.__setattr = new Sk.builtin.func(function(self, key, value) {
			self.props[Sk.ffi.remapToJs(key)] = value;
		});
		
		$loc.__getattr__ = new Sk.builtin.func(function(self, key) {
			return self.props[Sk.ffi.remapToJs(key)];
		});
		
		$loc.__str__ = new Sk.builtin.func(function(self) {
			return new Sk.builtin.str("Event");
		});
		
	}, "Event", []);

	s.Widget = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		function updateEventHandlers(self) {
			if(self.eventHandlers) {
				if(self.eventHandlers['<Return>']) {
					$('#tkinter_' + self.id).keypress(function(event) {
						var keycode = (event.keyCode ? event.keyCode : event.which);
						if(keycode == 13) {
							Sk.misceval.callsimAsync(null, self.eventHandlers['<Return>'], Sk.builtin.str("test")).then(function success(r) {

							}, function fail(e) {
								window.onerror(e);
							});	
						}
						
					});
				}
				function commonKeyHandler(ev) {
					console.log(ev);
					PythonIDE.keyHandlers.push(function(e) {
						if(e.type != "keydown") {
							return;
						}
						var event = {
							char: e.key
						}
						switch(e.key) {
							case "ArrowUp":
								event.keysym = "Up";
							break;
							case "ArrowDown":
								event.keysym = "Down";
							break;
							case "ArrowLeft":
								event.keysym = "Left";
							break;
							case "ArrowRight":
								event.keysym = "Right";
							break;
							default: 
								event.keysym = e.key;
							break;
						}
						var e = new Sk.builtin.object();
						e.$d = new Sk.ffi.remapToPy(event);
						if(ev.eventDetails) {
							if(event.keysym != ev.eventDetails) {
								return;
							}
						}
						Sk.misceval.callsimAsync(null, ev, e).then(function success(r) {

							}, function fail(e) {
								window.onerror(e);
							});
					});
				}
				if(self.eventHandlers['<Key>']) {
					var ev = self.eventHandlers['<Key>'];
					commonKeyHandler(ev);
				}
				if(self.eventHandlers['<KeyPress>']) {
					var ev = self.eventHandlers['<KeyPress>'];
					commonKeyHandler(ev);
				}
				if(self.eventHandlers['<Button>']) {
					$('#tkinter_' + self.id).click(function() {
						Sk.misceval.callsimAsync(null, self.eventHandlers['<Button>'], Sk.builtin.str("test")).then(function success(r) {

							}, function fail(e) {
								window.onerror(e);
							});
					});
				}

				if(self.eventHandlers['<B1-Motion>']) {
					$('#tkinter_' + self.id).mousemove(function(e) {
						if(e.buttons) {	
							var x = 0, y = 0;
							var element = $(this)[0];
							do {
								x += element.offsetLeft;
								y += element.offsetTop;
							}
							while (element = element.offsetParent);
						
							var pyE = Sk.misceval.callsim(s.Event);
							pyE.props.x = new Sk.builtin.int_(e.pageX - x);
							pyE.props.y = new Sk.builtin.int_(e.pageY - y);
							Sk.misceval.callsimAsync(null, self.eventHandlers['<B1-Motion>'], pyE).then(function success(r) {

							}, function fail(e) {
								window.onerror(e);
							});
						}
					});	
				}

				if(self.eventHandlers['<Motion>']) {
					$('#tkinter_' + self.id).mousemove(function(e) {
						var x = 0, y = 0;
						var element = $(this)[0];
						do {
							x += element.offsetLeft;
							y += element.offsetTop;
						}
						while (element = element.offsetParent);
						y += window.scrollY;
						var pyE = Sk.misceval.callsim(s.Event);
						pyE.props.x = new Sk.builtin.int_(e.pageX - x);
						pyE.props.y = new Sk.builtin.int_(e.pageY - y);
						Sk.misceval.callsimAsync(null, self.eventHandlers['<Motion>'], pyE).then(function success(r) {

						}, function fail(e) {
							window.onerror(e);
						});
					});	
				}
			}
		}
		
		var after = function(kwa, self, delay, callback) {
			var timeout = Sk.ffi.remapToJs(delay);
			var timeoutId = setTimeout(function() {
				Sk.misceval.callsimAsync(null, callback).then(function success(r) {

							}, function fail(e) {
								window.onerror(e);
							});	
			}, timeout);
			timeouts.push(timeoutId);
			
		}
		after.co_kwargs = true;
		$loc.after = new Sk.builtin.func(after);
		
		$loc.__getitem__ = new Sk.builtin.func(function(self, i) {
			return self.props[Sk.ffi.remapToJs(i)];
		});

		$loc.__init__ = new Sk.builtin.func(function(self) {
			self.eventHandlers = {};

			self.updateEventHandlers = updateEventHandlers;
		});

		$loc.update_idletasks = new Sk.builtin.func(function() {

		});

		$loc.configure = new Sk.builtin.func(configure);
		$loc.config = new Sk.builtin.func(configure);

		$loc.winfo_width = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_($('#tkinter_' + self.id).width());
		});

		$loc.winfo_height = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_($('#tkinter_' + self.id).height());
		});

		var commonDisplay = function(kwa, self, parent) {			
			if(self.getHtml) {
				$('#tkinter_' + self.id).remove();
				var html = self.getHtml(self);
				parent.append(html);

				if(self.onShow) {
					self.onShow();
				}
				
				applyWidgetStyles(self);
				var e = $('#tkinter_' + self.id);
				
				if(self.updateEventHandlers) self.updateEventHandlers(self);
				if(self.props.command) {
					e.click(function() {
						Sk.misceval.callsimAsync(null, self.props.command).then(function success(r) {

							}, function fail(e) {
								window.onerror(e);
							});
					});
				}

				if(self.props.validate) {
					switch(Sk.ffi.remapToJs(self.props.validate)) {
						case 'key': 
							$('#tkinter_' + self.id).on("change keyup", function(ev) {
								if(self.props.validatecommand) {
									var args = [];
									for(var i = 1; i < self.props.validatecommand.v.length; i++){
										switch(Sk.ffi.remapToJs(self.props.validatecommand.v[i])) {
											case '%P':
												args = new Sk.builtin.str($('#tkinter_' + self.id).val());
											break;
										}
									}
									Sk.misceval.callsimAsync(null, self.props.validatecommand.v[0], args).then(function success(r) {

							}, function fail(e) {
								window.onerror(e);
							});
								}	
							});
							
							break;
						
					}
				}
			}
		}

		var place = function(kwa, self) {
			commonDisplay(kwa, self, $('#tkinter_' + self.master.id));
			var props = unpackKWA(kwa);
			var x = 0;
			if(props.x) {
				x = Sk.ffi.remapToJs(props.x);
			}
			
			var y = 0; 
			if(props.y) {
				y = Sk.ffi.remapToJs(props.y);
			}

			var width="auto";
			if(props.width) {
				width = Sk.ffi.remapToJs(props.width) + "px";
			}

			var height="auto";
			if(props.height) {
				height = Sk.ffi.remapToJs(props.height) + "px";
			}
			
			$('#tkinter_' + self.id).css({
				'position':'absolute',
				left: x + "px",
				top: y + "px",
				width: width,
				height: height
			});
		};
		place.co_kwargs = true;
		$loc.place = new Sk.builtin.func(place);

		var pack = function(kwa, self) {
			var props = unpackKWA(kwa);
			var parent = $('#tkinter_' + self.master.id);
			if(props.fill) {
				switch(Sk.ffi.remapToJs(props.fill)) {
					case 'both':
						self.props.width = parent.width();
						self.props.height = parent.height();
					break;
				}
			}
			commonDisplay(kwa, self, parent);
			if(!self.master) {
				self.master = firstRoot;
			}

			if(!self.master.props) {
				self.master.props = {};
			}

			if(!self.master.props.width) {
				var e = parent[0];
				if(!e) {
					parent = $('#tkinter_' + firstRoot.id);
					e = parent[0];
				}
								
				parent.dialog('option', {
					width: e.scrollWidth + 5,
					height: e.scrollHeight + 35
				});
			}
		}
		pack.co_kwargs = true;
		$loc.pack = new Sk.builtin.func(pack);

		var grid = function(kwa, self) {
			var props = unpackKWA(kwa);

			if(!props.column) {
				props.column = new Sk.builtin.int_(0);
			}
			if(!props.row) {
				props.row = new Sk.builtin.int_(0);
			}
			if(!self.master){
				self.master = self;
			}

			var parent = $('#tkinter_' + self.master.id);
			var r = Sk.ffi.remapToJs(props.row);
			var c = Sk.ffi.remapToJs(props.column);

			var rowspan = 1;
			var colspan = 1;
			if(props.rowspan) {
				rowspan = Sk.ffi.remapToJs(props.rowspan);
			}
			if(props.columnspan) {
				colspan = Sk.ffi.remapToJs(props.columnspan);
			}

			function plotCell(row, col) {
				if(row > r) {
					if(row < r + rowspan) {
						if(col > c) {
							if(col < c + colspan) {
								return false;
							}
						}
					}
				}
				return true;
			}

			function getColsHtml(row, from, to) {
				var html = '';
				for(var iC = from; iC <= to; iC++) {
					if(plotCell(row, iC)) {
						html += '<td class="tkinter_grid_td" data-col="' + iC + '" data-row="' + row + '"';
						if(rowspan > 1) {
							html += ' rowspan="' + rowspan + '"';
						}
						if(colspan > 1) {
							html += ' colspan="' + colspan + '"';
						}
						html += '>';
						//html += iC + "," + row;
						html += '</td>';
					}
				}
				return html;
			}

			function getRowsHtml(cols, from, to) {
				var html = '';
				for(var iR = from; iR <= to; iR++) {
					html += '<tr class="tkinter_grid_row" data-row="' + iR + '">';
					html += getColsHtml(iR, 0, cols);
					html += '</tr>';
				}
				return html;
			}
			if(!self.master._grid) {
				self.master._grid = {
					rows: r,
					cols: c,
				}
				var html = '<table class="tkinter_grid" width="100%"><tbody>';
				html += getRowsHtml(c, 0, r);
				html += '<tbody></table>';
				parent.append(html);
			} else {
				if(self.master._grid.cols < c) {
					parent.find('td[data-col="' + self.master._grid.cols + '"]').each(function(i, value) {
						var html = getColsHtml(i, self.master._grid.cols + 1, c);
						$(this).after(html);
					});

					self.master._grid.cols = c;
				}
				if(self.master._grid.rows < r) {
					var html = getRowsHtml(self.master._grid.cols, self.master._grid.rows + 1, r);
					parent.find('tr[data-row="' + self.master._grid.rows + '"]').after(html);
					self.master._grid.rows = r;
				}
				
			}

			var place = parent.find('td[data-row="' + r + '"][data-col="' + c + '"]');
			commonDisplay(kwa, self, place);
			if(!self.master.props.width) {
				var e = parent[0];
				
				parent.dialog('option', {
					width: e.scrollWidth + 20,
					height: e.scrollHeight + 50
				});
			}
		}
		grid.co_kwargs = true;
		$loc.grid = new Sk.builtin.func(grid);

		function bind(self, event, command) {
			var e = Sk.ffi.remapToJs(event);
			if(e.indexOf("-") > -1) {
				var parts = e.substr(1, e.length - 2).split("-");
				command.eventDetails = parts[1];
				e = "<" + parts[0] + ">";
			}
			if(!self.eventHandlers) {
				self.eventHandlers = {};
			}
			self.eventHandlers[e] = command;
			self.updateEventHandlers = updateEventHandlers;
			updateEventHandlers(self);
		};

		$loc.bind = new Sk.builtin.func(bind);

		$loc.bind_all = new Sk.builtin.func(bind);

		$loc.__setitem__ = new Sk.builtin.func(function(self, key, value) {
			self.props[Sk.ffi.remapToJs(key)] = value;
		});


	}, 'Widget', []);

	function unpackKWA(kwa) {
		result = {};
		
		for(var i = 0; i < kwa.length; i+=2) {
			var key = Sk.ffi.remapToJs(kwa[i]);
			var val = kwa[i+1];
			result[key] = val;
		}

		return result;
	}

	var commonWidgetConstructor = function(kwa, self, master, getHtml) {
		self.props = unpackKWA(kwa);
		if(!master && firstRoot) {
			master = firstRoot;
		}

		self.master = master;

		widgets[idCount] = self;
		self.id = idCount++;

		self.getHtml = getHtml;
	}

	s.Canvas = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		var getHtml = function(self) {
			var width = 200;
			if(self.props.width) {
				width = Sk.ffi.remapToJs(self.props.width);
			}
			var height = 200;
			if(self.props.height) {
				height = Sk.ffi.remapToJs(self.props.height);
			}

			return '<canvas id="tkinter_' + self.id + '" width="' + width + '" height="' + height + '"></canvas>';
		}

		function commonCanvasElement(self, element) {
			var canvas = document.getElementById('tkinter_' + self.id);
			if(canvas) {
				element.draw(canvas);
			} 

			self.elements.push(element);
			return new Sk.ffi.remapToPy(self.elements.length - 1);
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			self.elements = [];
			self.onShow = function() {
				var canvas = document.getElementById('tkinter_' + self.id);
				if(canvas) {
					const cx = canvas.getContext('2d');
					if(self.props.background) {
						cx.fillStyle = getColor(Sk.ffi.remapToJs(self.props.background));
						cx.fillRect(0, 0, canvas.width, canvas.height);
					} else {
						cx.clearRect(0, 0, canvas.width, canvas.height);	
					}
					for(var i = 0; i < self.elements.length; i++) {
						if(self.elements[i].deleted)
							continue;
						self.elements[i].draw(canvas);
					}
				}
			}
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.bbox = new Sk.builtin.func(function(self, item) {
			var bbox = [0, 0, 0, 0];
			if(item) {
				var e = self.elements[Sk.ffi.remapToJs(item)];
				if(e.coords.x1)
					bbox[0] = new Sk.builtin.int_(e.coords.x1);
				if(e.coords.y1)
					bbox[1] = new Sk.builtin.int_(e.coords.y1);
				if(e.coords.x2)
					bbox[2] = new Sk.builtin.int_(e.coords.x2);
				if(e.coords.y2)
					bbox[3] = new Sk.builtin.int_(e.coords.y2);
			}
			return new Sk.builtin.tuple(bbox);
		});

		$loc.find_withtag = new Sk.builtin.func(function(self, tagname) {
			var tag = Sk.ffi.remapToJs(tagname);
			var matches = [];
			for(var i = 0; i < self.elements.length; i++) {
				if(self.elements[i] && self.elements[i].props && self.elements[i].props.tag && Sk.ffi.remapToJs(self.elements[i].props.tag) == tag && !self.elements[i].deleted) {
					matches.push(Sk.ffi.remapToPy(i));
				}
			}
			return new Sk.builtin.tuple(matches);
		});

		var coords = function(kwa, self, item) {
			var id = Sk.ffi.remapToJs(item);
			var c = [];
			if(self && self.elements && self.elements[id] && !self.elements[id].deleted) {
				c.push(new Sk.builtin.int_(self.elements[id].coords.x1));
				c.push(new Sk.builtin.int_(self.elements[id].coords.y1));
				c.push(new Sk.builtin.int_(self.elements[id].coords.x2));
				c.push(new Sk.builtin.int_(self.elements[id].coords.y2));
			}
			return new Sk.builtin.tuple(c);
		};
		coords.co_kwargs = true;
		$loc.coords = new Sk.builtin.func(coords);

		$loc.move = new Sk.builtin.func(function(self, item, dx, dy){
			var id = Sk.ffi.remapToJs(item);
			if(self && self.elements && self.elements[id] && !self.elements[id].deleted) {
				self.elements[id].coords.x1 += Sk.ffi.remapToJs(dx);
				self.elements[id].coords.y1 += Sk.ffi.remapToJs(dy);
				self.elements[id].coords.x2 += Sk.ffi.remapToJs(dx);
				self.elements[id].coords.y2 += Sk.ffi.remapToJs(dy);
			}
			self.onShow();
		});

		$loc.find_overlapping = new Sk.builtin.func(function(self, x1, y1, x2, y2) {
			var matches = [];
			for(var i = 0; i < self.elements.length; i++) {
				if(self.elements[i] && self.elements[i].coords && !self.elements[i].deleted) {
					var r1 = {
						x1: Sk.ffi.remapToJs(x1),
						y1: Sk.ffi.remapToJs(y1),
						x2: Sk.ffi.remapToJs(x2),
						y2: Sk.ffi.remapToJs(y2)
					}
					var r2 = self.elements[i].coords;
					// r1 is param
					// r2 is e
					if((r1.x2 >= r2.x1) && (r1.x1 <= r2.x2) && (r1.y2 >= r2.y1) && (r1.y1 <= r2.y2)) {
						matches.push(new Sk.builtin.int_(i));
					}
				}
			}
			return new Sk.builtin.tuple(matches);
		});


		$loc.delete_$rw$ = new Sk.builtin.func(function(self, id) {
			if(!id) id = new Sk.builtin.str("all");
			var idName = Sk.ffi.remapToJs(id);
			if(idName == "all") {
				self.elements = [];
			} else {
				var i = Sk.ffi.remapToJs(id);
				self.elements[i].deleted = true;
			}
			self.onShow();
		});
		
		function applyLineStyles(props, cx) {
			
			if(!props.fill) {
				props.fill = new Sk.builtin.str("black");
			}
			cx.fillStyle = getColor(Sk.ffi.remapToJs(props.outline));

			if(!props.outline) {
				props.outline = new Sk.builtin.str("black");
			}
			cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.outline));	

			if(props.width) {
				cx.lineWidth = Sk.ffi.remapToJs(props.width);
			}	
		}

		function applyStyles(props, cx) {
			
			if(!props.fill) {
				props.fill = new Sk.builtin.str("black");
			}
			cx.fillStyle = getColor(Sk.ffi.remapToJs(props.fill));

			if(!props.outline) {
				props.outline = new Sk.builtin.str("black");
			}
			cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.outline));	

			if(props.width) {
				cx.lineWidth = Sk.ffi.remapToJs(props.width);
			}

			if(props.font) {
				var font = Sk.ffi.remapToJs(props.font);
				if(typeof(font) == "string") {
					font = ("" + f).split(" "); 
				} 
				var sFont = "";
				
				if(font.length > 1) {
					sFont = font[1] + "pt "; 
				}
				sFont += font[0];
				cx.font = sFont;
			}

		}

		var create_polygon = function(kwa, self, coords) {
			var jsCoords = Sk.ffi.remapToJs(coords);
			var props = unpackKWA(kwa);
			for(var key in props) {
				self.props[key] = props[key];
			}
			if(typeof(jsCoords) == "number"){
				jsCoords = [];
				var found = false;
				for(var i = 0; i < arguments.length; i++) {
					if(arguments[i] == coords) {
						found = true;
					}
					if(found) {
						jsCoords.push(Sk.ffi.remapToJs(arguments[i]));
					}
				}
			}
			
			return commonCanvasElement(self, {props:props, coords:jsCoords, draw: function(canvas) {
				var cx = canvas.getContext('2d');
				cx.beginPath();
				applyStyles(props, cx);
				cx.moveTo(jsCoords[0], jsCoords[1]);
				for(var i = 2; i < jsCoords.length; i+=2) {
					cx.lineTo(jsCoords[i], jsCoords[i+1]);	
				}
				cx.closePath();
				cx.stroke();
				if(self.props.fill && Sk.ffi.remapToJs(self.props.fill) != '') {
					cx.fill();	
				}
			}});
		}
		create_polygon.co_kwargs = true;
		$loc.create_polygon = new Sk.builtin.func(create_polygon);

		var create_line = function(kwa, self, x1, y1, x2, y2) {
			var coords = {
				x1: Sk.ffi.remapToJs(x1),
				y1: Sk.ffi.remapToJs(y1),
				x2: Sk.ffi.remapToJs(x2),
				y2: Sk.ffi.remapToJs(y2),
			}

			var props = unpackKWA(kwa);

			return commonCanvasElement(self, {props:props, coords:coords, draw: function(canvas) {
				var cx = canvas.getContext('2d');
				cx.beginPath();
				applyLineStyles(props, cx);
				cx.moveTo(coords.x1, coords.y1);
				cx.lineTo(coords.x2, coords.y2);
				cx.stroke();
			}});
		}
		create_line.co_kwargs = true;
		$loc.create_line = new Sk.builtin.func(create_line);

		var create_text = function(kwa, self, x, y) {
			var coords = {
				x1: Sk.ffi.remapToJs(x),
				y1: Sk.ffi.remapToJs(y),
				x2: Sk.ffi.remapToJs(x + 10),
				y2: Sk.ffi.remapToJs(y + 10)
			}

			var props = unpackKWA(kwa);

			return commonCanvasElement(self, {type:"text", props:props, coords:coords, draw: function(canvas) {
				var cx = canvas.getContext('2d');
				var text = "";
				if(props.text) {
					text = ""+Sk.ffi.remapToJs(props.text);
				}
				cx.textAlign = "center";
				applyStyles(props, cx);
				cx.fillText(text, coords.x1, coords.y1);
			}});
		}
		create_text.co_kwargs = true;
		$loc.create_text = new Sk.builtin.func(create_text);

		var create_rectangle = function(kwa, self, x1, y1, x2, y2) {
			var coords = {
				x1: Sk.ffi.remapToJs(x1),
				y1: Sk.ffi.remapToJs(y1),
				x2: Sk.ffi.remapToJs(x2),
				y2: Sk.ffi.remapToJs(y2),
			}

			var props = unpackKWA(kwa);

			return commonCanvasElement(self, {type:"rectangle", props:props, coords:coords, draw: function(canvas) {
				var cx = canvas.getContext('2d');
				applyStyles(props, cx);

				cx.fillRect(coords.x1, coords.y1, coords.x2 - coords.x1, coords.y2 - coords.y1);
				cx.strokeRect(coords.x1, coords.y1, coords.x2 - coords.x1, coords.y2 - coords.y1);	
			}});

		}
		create_rectangle.co_kwargs = true;
		$loc.create_rectangle = new Sk.builtin.func(create_rectangle);

		var create_oval = function(kwa, self, x1, y1, x2, y2) {
			var coords = {
				x1: Sk.ffi.remapToJs(x1),
				y1: Sk.ffi.remapToJs(y1),
				x2: Sk.ffi.remapToJs(x2),
				y2: Sk.ffi.remapToJs(y2),
			}

			var props = unpackKWA(kwa);

			return commonCanvasElement(self, {type: "oval", props:props, coords:coords, draw:function(canvas) {
				var cx = canvas.getContext('2d');
				if(props.fill) {
					cx.fillStyle = getColor(Sk.ffi.remapToJs(props.fill));
				}
				if(props.outline) {
					cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.outline));	
				}
				if(props.width) {
					cx.lineWidth = Sk.ffi.remapToJs(props.width);
				}
				//applyStyles				
				cx.beginPath();
				var w = coords.x2 - coords.x1;
				var h = coords.y2 - coords.y1
				cx.ellipse(coords.x1 + (w/2), coords.y1 + (h/2), w / 2, h/2, 0, 0, 2 * Math.PI);
				if(props.fill) {
					cx.fill();
				}
				cx.stroke();
			}});
		}
		create_oval.co_kwargs = true;
		$loc.create_oval = new Sk.builtin.func(create_oval);

//
		var create_arc = function(kwa, self, x1, y1, x2, y2) {
			var coords = {
				x1: Sk.ffi.remapToJs(x1),
				y1: Sk.ffi.remapToJs(y1),
				x2: Sk.ffi.remapToJs(x2),
				y2: Sk.ffi.remapToJs(y2),
			}

			var props = unpackKWA(kwa);

			return commonCanvasElement(self, {type: "arc", props:props, coords:coords, draw:function(canvas) {
				var cx = canvas.getContext('2d');
				var start = 2*Math.PI-Sk.ffi.remapToJs(props.start)*Math.PI/180;
				var extent = 2*Math.PI-Sk.ffi.remapToJs(props.extent)*Math.PI/180;
				var style = Sk.ffi.remapToJs(props.style);
				console.log("style=",style);
				if(props.fill) {
					cx.fillStyle = getColor(Sk.ffi.remapToJs(props.fill));
				}
				if(props.outline) {
					cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.outline));	
				}
				if(props.width) {
					cx.lineWidth = Sk.ffi.remapToJs(props.width);
				}
				//applyStyles
				cx.beginPath();
				var w = coords.x2 - coords.x1;
				var h = coords.y2 - coords.y1;
				if (style=="pieslice") {
					cx.moveTo(coords.x1 + (w/2), coords.y1 + (h/2));
				}	
				console.log("start=",start)
				console.log("ext=",extent)				
				cx.arc(coords.x1 + (w/2), coords.y1 + (h/2), h/2, start, extent,true);
				if (style=="pieslice") {
					cx.lineTo(coords.x1 + (w/2), coords.y1 + (h/2));
				}
				if(props.fill) {
					cx.fill();
				}
				cx.stroke();
			}});
		}
		create_arc.co_kwargs = true;
		$loc.create_arc = new Sk.builtin.func(create_arc);

//
		var item_config = function(kwa, self, id) {
			var e = self.elements[Sk.ffi.remapToJs(id)];
			var newProps = unpackKWA(kwa);
			for(var prop in newProps) {
				e.props[prop] = newProps[prop];
			}
			self.onShow();
		};

		item_config.co_kwargs = true;
		$loc.itemconfig = new Sk.builtin.func(item_config);
		$loc.itemconfigure = new Sk.builtin.func(item_config);

	}, 'Canvas', [s.Widget]);

	s.Entry = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {
			return '<input type="text" id="tkinter_' + self.id + '">';
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.get = new Sk.builtin.func(function(self) {
			return new Sk.builtin.str($('#tkinter_' + self.id).val());
		});

		$loc.focus = new Sk.builtin.func(function(self) {
			$('#tkinter_' + self.id).focus();
		});

		$loc.focus_set = new Sk.builtin.func(function(self) {
			$('#tkinter_' + self.id).focus();
		});

		$loc.insert = new Sk.builtin.func(function(self, index, string) {
			var i = Sk.ffi.remapToJs(index);
			var v = $('#tkinter_' + self.id).val();
			var s = Sk.ffi.remapToJs(string);
			if(i == "end") {
				$('#tkinter_' + self.id).val(v + s);
			} else {
				var before = v.substr(0, i);
				var after = v.substr(i, v.length - i);
				$('#tkinter_' + self.id).val(before + s + after);
			}
		});

		$loc.delete_$rw$ = new Sk.builtin.func(function(self, first, last) {
			var val = $('#tkinter_' + self.id).val();
			var start = Sk.ffi.remapToJs(first);
			var end = Sk.ffi.remapToJs(last);
			if(end == 'end') {
				end = val.length;
			}
			$('#tkinter_' + self.id).val(val.substr(0, start) + val.substr(end, val.length)).focus();
		});


	}, 'Entry', [s.Widget]);

	s.Scale = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {
			return '<div id="tkinter_' + self.id + '" style="margin:auto;"><div class="ui-slider-handle">0</div></div>';
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			
			var min = 0;
			if(self.props.from_) {
				min = Sk.ffi.remapToJs(self.props.from_);
			}

			var max = 50;
			if(self.props.to) {
				max = Sk.ffi.remapToJs(self.props.to);
			}

			var orientation = "vertical";
			if(self.props.orient) {
				orientation = Sk.ffi.remapToJs(self.props.orient);
			}

			self.onShow = function() {
				var value = 0;
				if(self.props.cursor) {
					value = Sk.ffi.remapToJs(self.props.cursor);
				}
				var handle = $( '#tkinter_' + self.id + " .ui-slider-handle");
				$('#tkinter_' + self.id).slider({
			      create: function() {
			        handle.text( $( this ).slider( "value" ) );
			      },
			      slide: function( event, ui ) {
			        handle.text( ui.value);
			      },
			      min: min,
			      max: max,
			      value: value,
			      orientation: orientation
			    });
			}
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.get = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_($('#tkinter_' + self.id).slider("value"));
		});

		$loc.set = new Sk.builtin.func(function(self, value) {
			var v = Sk.ffi.remapToJs(value);
			$('#tkinter_' + self.id).slider("value", v);
			$( '#tkinter_' + self.id + " .ui-slider-handle").text(v);
			self.props.value = value;
		});

	}, 'Scale', [s.Widget])

	s.Label = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {

			var v = "";
			if(self.props.text) {
				v = Sk.ffi.remapToJs(self.props.text);
			}
			if(self.props.textvariable) {
				v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				self.props.textvariable.updateID = self.id;
			}
			var html = '<div id="tkinter_' + self.id + '">' + PythonIDE.sanitize(v) + '</div>';
			return html;
		}


		var init = function(kwa, self, master) {
			self.update = function() {
				var v = "";
				if(self.props.text) {
					v = Sk.ffi.remapToJs(self.props.text);
				}
				if(self.props.textvariable) {
					v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				}
				$('#tkinter_' + self.id).text(Sk.ffi.remapToJs(v));
			}
			commonWidgetConstructor(kwa, self, master, getHtml);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

	}, 'Label', [s.Widget]);

	s.Button = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {
			var disabled = false;
			if(self.props.state) {
				disabled = Sk.ffi.remapToJs(self.props.state) == 'disabled';	
			}
			
			var html = '<button id="tkinter_' + self.id + '"' + (disabled?' disabled':'') + '>' + PythonIDE.sanitize(Sk.ffi.remapToJs(self.props.text)) + '</button>';
			return html;
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

	}, 'Button', [s.Widget]);

	s.Frame = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self, master) {
			if(!master) {
				master = firstRoot;
			}
			self.master = master;
			self.id = idCount++;
		});

		$loc.__getattr__ = new Sk.builtin.func(function(self, name) {
			switch(Sk.ffi.remapToJs(name)) {
				case 'master':
					return self.master;
				break;
			};
		});

		$loc.mainloop = new Sk.builtin.func(function(self) {

		});



	}, 'Frame', [s.Widget]);

	s.Text = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {
			return '<textarea id="tkinter_' + self.id + '"> </textarea>';
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			if(self.props.width) {
				self.props.width = new Sk.builtin.int_(Sk.ffi.remapToJs(self.props.width) * 20);
			}
			if(self.props.height) {
				self.props.height = new Sk.builtin.int_(Sk.ffi.remapToJs(self.props.height) * 20);
			}
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.get = new Sk.builtin.func(function(self) {
			return new Sk.builtin.str($('#tkinter_' + self.id).val());
		});

		$loc.focus = new Sk.builtin.func(function(self) {
			$('#tkinter_' + self.id).focus();
		});

		$loc.delete_$rw$ = new Sk.builtin.func(function(self, first, last) {
			var val = $('#tkinter_' + self.id).val();
			var start = Sk.ffi.remapToJs(first);
			var end = Sk.ffi.remapToJs(last);
			if(end == 'end') {
				end = val.length;
			}
			$('#tkinter_' + self.id).val(val.substr(0, start) + val.substr(end, val.length)).focus();
		});

		$loc.insert = new Sk.builtin.func(function(self, pos, newVal) {
			var val = $('#tkinter_' + self.id).val();
			var pos = Sk.ffi.remapToJs(pos);
			newVal = Sk.ffi.remapToJs(newVal);
			if(pos == "end") {
				pos = val.length;
			}
			var n = val.substr(0, pos) + newVal + val.substr(pos, val.length - pos);
			$('#tkinter_' + self.id).val(n).focus();
		});
	}, "Text", [s.Widget]);

	s.Toplevel = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self) {
			self.props = {};
			self.id = idCount++;
			if(!firstRoot) firstRoot = self;
			s.lastCreatedWin = self;
			var html = '<div id="tkinter_' + self.id + '" class="tkinter" title="tk"></div>';
			PythonIDE.python.output(html);
			$('#tkinter_' + self.id).dialog({
				width: 150,
				height: 150,
				close: function() {
					if(self.closeMainLoop) {
						self.closeMainLoop();
					}
				}
			}).parent().css({
				position: "fixed",
				'background-color': '#EEE',
				'font-size':'9pt'
			});	
		});

		$loc.destroy = new Sk.builtin.func(function(self) {
			$('#tkinter_' + self.id).remove();
			if(self.closeMainLoop) {
				self.closeMainLoop();
			}
		});
		
		$loc.attributes = new Sk.builtin.func(function(self, key, val) {
		});
		
		
		$loc.configure = new Sk.builtin.func(configure);
		$loc.config = new Sk.builtin.func(configure);

		$loc.title = new Sk.builtin.func(function(self, title) {
			$('#tkinter_' + self.id).dialog('option', 'title', PythonIDE.sanitize(Sk.ffi.remapToJs(title)));
		});

		$loc.quit = new Sk.builtin.func(function(self) {
			if(self.closeMainLoop) {
				self.closeMainLoop();
			}
		});

		$loc.mainloop = new Sk.builtin.func(function(self, pyData) {
			return PythonIDE.runAsync(function(resolve, reject) {
				self.closeMainLoop = function() {
					cleanup();
					resolve();
				}
			});
		});

		$loc.register = new Sk.builtin.func(function(self, func) {
			return func;
		});

		$loc.geometry = new Sk.builtin.func(function(self, geometry) {
			if(geometry) {
				var size = Sk.ffi.remapToJs(geometry).split("x");
				$('#tkinter_' + self.id).dialog('option', {width: size[0], height: size[1]});	
			}
			
		});		
	}, "Toplevel", [s.Widget]);

	s.Tk = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		$loc.update = new Sk.builtin.func(function(self) {

		});

		$loc.update_idletasks = new Sk.builtin.func(function(self) {

		});

		$loc.__init__ = new Sk.builtin.func(function(self) {
			self.props = {};
			self.id = idCount++;
			if(!firstRoot) firstRoot = self;
			s.lastCreatedWin = self;			
			var html = '<div id="tkinter_' + self.id + '" class="tkinter" title="tk"></div>';
			PythonIDE.python.output(html);
			$('#tkinter_' + self.id).dialog({
				
				close: function() {
					if(self.closeMainLoop) {
						self.closeMainLoop();
					}
				}
			}).css({
				padding:'0px'
			}).parent().css({
				position: "fixed",
				'background-color': '#EEE',
				'font-size': '9pt'
			});	
		});

		$loc.winfo_screenwidth = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_(window.screen.width);
		});

		$loc.winfo_screenheight = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_(window.screen.height);
		});

		$loc.destroy = new Sk.builtin.func(function(self) {
			$('#tkinter_' + self.id).remove();
			if(self.closeMainLoop) {
				self.closeMainLoop();
			}
		});
		
		$loc.attributes = new Sk.builtin.func(function(self, key, val) {
		});
		
		
		$loc.configure = new Sk.builtin.func(configure);
		$loc.config = new Sk.builtin.func(configure);

		$loc.title = new Sk.builtin.func(function(self, title) {
			$('#tkinter_' + self.id).dialog('option', 'title', PythonIDE.sanitize(Sk.ffi.remapToJs(title)));
		});

		$loc.quit = new Sk.builtin.func(function(self) {
			if(self.closeMainLoop) {
				self.closeMainLoop();
			}
		});

		$loc.mainloop = new Sk.builtin.func(function(self, pyData) {
			return PythonIDE.runAsync(function(resolve, reject) {
				self.closeMainLoop = function() {
					cleanup();
					resolve();
				}
			});
		});

		$loc.register = new Sk.builtin.func(function(self, func) {
			return func;
		});

		$loc.geometry = new Sk.builtin.func(function(self, geometry) {
			if(geometry) {
				var size = Sk.ffi.remapToJs(geometry).split("x");
				$('#tkinter_' + self.id).dialog('option', {width: size[0], height: size[1]});
			}
		});
		
		
	}, 'Tk', [s.Widget]);

	PythonIDE.python.output('<small>tkinter emulator for Skulpt, by Pete Dring</small><br><br>');

	s.ttk = new Sk.builtin.module();

	var ttk = function(name) {
		var t = {
		};
	// Listbox widget	
		t.Listbox = new Sk.misceval.buildClass(t, function($gbl, $loc) {
			listVals=[]

			var getHtml = function(self) {

				var html = '<select id="tkinter_' + self.id + '"  multiple> ';

				// re-generate Listbox
				for(var i = 0; i < listVals.length; i++) {
						var val =listVals[i];
						html += '<option value="' + val + '"' +  '>' + val + '</option>';
					}
				
				html += '</select>'
		        console.log("created: ",html);
				return html;
			}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			// listvariable props
			//if(self.props.listvariable) {
			//			var vals = Sk.ffi.remapToJs(self.props.listvariable);
			//			for(var i = 0; i < vals.length; i++) {						
			//				listVals.push(vals[i]);
			//				console.log(i," = ",vals[i]);
			//			}
			//			console.log(" LIST = ",listVals);
			//}
			// width, height props
			if(self.props.width) {
				self.props.width = new Sk.builtin.int_(Sk.ffi.remapToJs(self.props.width) * 20);
			}
			if(self.props.height) {
				self.props.height = new Sk.builtin.int_(Sk.ffi.remapToJs(self.props.height) * 20);
				}
			}
			init.co_kwargs = true;
			$loc.__init__ = new Sk.builtin.func(init);

			// .get() option selected
			$loc.get = new Sk.builtin.func(function(self) {
				return new Sk.builtin.str($('#tkinter_' + self.id + ' option:selected').text());
			});
			
			//. delete() 
			$loc.delete_$rw$ = new Sk.builtin.func(function(self, pos) {
			var pos = Sk.ffi.remapToJs(pos)-1;
				console.log("delpos:",pos)
				console.log("listVals.length:",listVals.length)
			if (pos<=listVals.length) {
				listVals.splice(pos,1);
			}
			console.log("del:",listVals)
			});

			// Listbox.insert
			// .insert(END, item)
			// .insert(pos, item)
			$loc.insert = new Sk.builtin.func(function(self, pos, newItem) {
			var pos = Sk.ffi.remapToJs(pos);
			item = Sk.ffi.remapToJs(newItem);
			console.log("*** pos=",pos)
			console.log("*** List: ",listVals)
			listLen = listVals.length
			console.log("*** ListLen=",listLen)	
			if(pos == "end") {	
					listVals.push(item);
					console.log(listVals);
			}
			pos=pos-1
			if (pos<=listVals.length) {
					listVals.splice(pos,0,item);
					console.log(listVals);				
				}
			});

		}, 'Listbox', [s.Widget]);

		t.Combobox = new Sk.misceval.buildClass(t, function($gbl, $loc) {
			var getHtml = function(self) {
				var html = '<select id="tkinter_' + self.id + '">';
				if(self.props.values) {
					var vals = Sk.ffi.remapToJs(self.props.values);
					for(var i = 0; i < vals.length; i++) {
						var val = PythonIDE.sanitize("" + vals[i]);
						var selected = self.props.current && self.props.current == i;
						html += '<option value="' + i + '"' + (selected?' selected':'') + '>' + val + '</option>';
					}
				}
				html += '</select>'
				return html;
			}


			var init = function(kwa, self, master) {
				commonWidgetConstructor(kwa, self, master, getHtml);
			}
			init.co_kwargs = true;
			$loc.__init__ = new Sk.builtin.func(init);

			$loc.current = new Sk.builtin.func(function(self, item) {
				var val = Sk.ffi.remapToJs(item);
				$('#tkinter_' + self.id).val(val);
				self.props.current = val;
			});

			$loc.get = new Sk.builtin.func(function(self) {
				return new Sk.builtin.str($('#tkinter_' + self.id + ' option:selected').text());
			});

		}, 'Combobox', [s.Widget]);

		t.Checkbutton = new Sk.misceval.buildClass(t, function($gbl, $loc) {
			var getHtml = function(self) {
				var label = "";
				if(self.props.text) {
					label = Sk.ffi.remapToJs(self.props.text);
				}

				var checked = false;
				if(self.props.value) {
					checked = true;
				}

				if(self.props.var) {
					checked = Sk.ffi.remapToJs(self.props.var.value);
					self.props.var.updateID = self.id;
				}
				var html = '<div id="tkinter_' + self.id + '"><input type="checkbox"' + (checked?' checked':'') + '>' 
				+ PythonIDE.sanitize(label) + '</div>';
				return html;
			}


			var init = function(kwa, self, master) {
				self.onShow = function() {
					$('#tkinter_' + self.id + ' input').click(function() {
						if(self.props.var) {
							var val = $('#tkinter_' + self.id + ' input').prop('checked');
							self.props.var.value = Sk.ffi.remapToPy(val);
						}
					});
				}

				self.update = function() {
					var v = false;
					if(self.props.value) {
						v = Sk.ffi.remapToJs(self.props.value);
					}
					if(self.props.var) {
						v = Sk.ffi.remapToJs(self.props.var.value);
					}
					$('#tkinter_' + self.id + " input").prop('checked', v);
				}
				commonWidgetConstructor(kwa, self, master, getHtml);
			}
			init.co_kwargs = true;
			$loc.__init__ = new Sk.builtin.func(init);

			$loc.set = new Sk.builtin.func(function(self, value) {
				self.props.value = Sk.ffi.remaptoJs(value);
				$('#tkinter_' + self.id + ' input').prop('checked', value);
			});

		}, 'Checkbutton', [s.Widget]);

		t.Radiobutton = new Sk.misceval.buildClass(t, function($gbl, $loc) {
			var getHtml = function(self) {
				var label = "";
				if(self.props.text) {
					label = Sk.ffi.remapToJs(self.props.text);
				}

				var value = "";
				if(self.props.value) {
					value = "" + Sk.ffi.remapToJs(self.props.value);
				}

				var name="default";
				if(self.props.variable) {
					name="PY_VAR" + self.props.variable.id;
				}

				var html = '<span id="tkinter_' + self.id + '"><input name="' + name + '" type="radio" value="' + PythonIDE.sanitize(value) + '">' 
				+ PythonIDE.sanitize(label) + '</span>';
				return html;
			}


			var init = function(kwa, self, master) {
				self.onShow = function() {
					$('#tkinter_' + self.id + ' input').click(function() {
						if(self.props.variable) {
							var val = $('#tkinter_' + self.id + ' input').val();
							self.props.variable.value = Sk.ffi.remapToPy(val);
						}
					});
				}

				self.update = function() {
					var v = false;
					if(self.props.value) {
						v = Sk.ffi.remapToJs(self.props.value);
					}
					if(self.props.var) {
						v = Sk.ffi.remapToJs(self.props.var.value);
					}
					$('#tkinter_' + self.id + " input").prop('checked', v);
				}
				commonWidgetConstructor(kwa, self, master, getHtml);
			}
			init.co_kwargs = true;
			$loc.__init__ = new Sk.builtin.func(init);

			$loc.set = new Sk.builtin.func(function(self, value) {
				self.props.value = Sk.ffi.remaptoJs(value);
				$('#tkinter_' + self.id + ' input').prop('checked', value);
			});

		}, 'Radiobutton', [s.Widget]);



		return t;
	}
	s.ttk.$d = new ttk("tkinter.ttk");
	Sk.sysmodules.mp$ass_subscript("tkinter.ttk", s.ttk);

	s.messagebox = new Sk.builtin.module();
	var messagebox = function(name) {
		var m = {
		};
		m.showinfo = new Sk.builtin.func(function(title, message) {
			if(!title)title = new Sk.builtin.str("");
			if(!message)message= new Sk.builtin.str("");
			title = PythonIDE.sanitize("" + Sk.ffi.remapToJs(title));
			message = PythonIDE.sanitize("" + Sk.ffi.remapToJs(message));
			return PythonIDE.runAsync(function(resolve, reject) {
				var html = '<div id="tkinter_showinfo" title="' + title + '">' + message
					+ '<button id="btn_tkinter_dlg_ok" class="btn_tkinter_dlg">OK</button></div>';
				PythonIDE.python.output(html);
				$('#tkinter_showinfo').dialog();
				$('.btn_tkinter_dlg').button().click(function(e) {
					var id = e.currentTarget.id.split("_")[3];
					resolve();
					$('#tkinter_showinfo').remove();
				});
			});
		});

		m.askyesno = new Sk.builtin.func(function(title, message) {
			if(!title)title = new Sk.builtin.str("");
			if(!message)message= new Sk.builtin.str("");
			title = PythonIDE.sanitize("" + Sk.ffi.remapToJs(title));
			message = PythonIDE.sanitize("" + Sk.ffi.remapToJs(message));
	
			return PythonIDE.runAsync(function(resolve, reject) {
				
				var html = '<div id="tkinter_askyesno" title="' + title + '">' + message
					+ '<button id="btn_tkinter_dlg_yes" class="btn_tkinter_dlg">Yes</button>'
					+ '<button id="btn_tkinter_dlg_no" class="btn_tkinter_dlg">No</button></div>';
				PythonIDE.python.output(html);
				$('#tkinter_askyesno').dialog();
				$('.btn_tkinter_dlg').button().click(function(e) {
					var id = e.currentTarget.id.split("_")[3];
					resolve(new Sk.builtin.bool(id == "yes"));
					$('#tkinter_askyesno').remove();
				});
				
			});
			
		});
		return m;
	};

	s.messagebox.$d = new messagebox("tkinter.messagebox");
	Sk.sysmodules.mp$ass_subscript("tkinter.messagebox", s.messagebox);

	return s;
	
};
