// Tkinter module for Skulpt. Pete Dring, 2018
var $builtinmodule = function (name) {
// clear all previous frames
	$('.tkinter').remove();
// add tkinter style
	var styleTkinter = $('<style>\n.pack_container{display:grid;}\n.pack_item{text-align:center;}\n.NW{grid-column:1;grid-row:1;}\n.N{grid-column:2;grid-row:1;}\n.NE{grid-column:3;grid-row:1;}\n.W{grid-column:1;grid-row:2;}\n.C{grid-column:2;grid-row:2;}\n.E{grid-column:3;grid-row:2;}\n.SW{grid-column:1;grid-row:3;}\n.S{grid-column:2;grid-row:3;}\n.SE{grid-column:3;grid-row:3;}\n.grid_container{display:grid;gap:1px;}\n.grid_item{display:block;\nmargin-left:auto;\nmargin-right:auto;}\nprogress[value]{\n-webkit-appearance:none;\nappearance:none;\nwidth:250px;\nheight:10px;}\ninput[type=range][orient=vertical]{\nappearance:slider-vertical;\nwidth:8px;\nheight:175px;\npadding:05px;}\n.hr{display:block;\nmargin-top:auto;\nmargin-bottom:auto;\nmargin-left:auto;\nmargin-right:auto;\nborder-style:inset;\nborder-width:1px;\nheight:auto;\ntop:auto;\nleft:50%;\nwidth:-moz-available;}\n.vl{width:2px;\nheight:200px;\nmargin:0auto;\ntransform:rotate(180deg);}\n</style>')
	$('html > head').append(styleTkinter);
	
	var idCount = 0;
	var varCount = 0;
	var firstRoot = 0;

	var widgets = [];
	var variables = [];
	var timeouts = [];
	var LW =[];
	var cleanup = function() {
		for(var i = 0; i < timeouts.length; i++) {
			clearTimeout(timeouts[i]);
		}
	}
    var s = {
	};
// Tkinter aliases
	s.__name__ = new Sk.builtin.str("tkinter");
	s.END = new Sk.builtin.str("end");
	s.W = new Sk.builtin.str("w");
	s.E = new Sk.builtin.str("e");
	s.N = new Sk.builtin.str("n");
	s.S = new Sk.builtin.str("s");
	s.NW = new Sk.builtin.str("nw");
	s.NE = new Sk.builtin.str("ne");
	s.SW = new Sk.builtin.str("sw");
	s.SE = new Sk.builtin.str("se");
	s.Y = new Sk.builtin.str("y");
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
	s.LAST = new Sk.builtin.str("last");
	s.FIRST = new Sk.builtin.str("first");
	s.BOTH = new Sk.builtin.str("both");
	s.LEFT = new Sk.builtin.str("left");
	s.CENTER = new Sk.builtin.str("center");
	s.RIGHT = new Sk.builtin.str("right");
	s.SINGLE = new Sk.builtin.str("single");
	s.EXTENDED = new Sk.builtin.str("extended");
	s.INDETERMINATE = new Sk.builtin.str("indeterminate");
	
	function getColor(c) {
		var cName = c.replace(" ", "")
		if(tk_colors && tk_colors[cName]) {
			return tk_colors[cName];
		}
		return c;
	}
// ----------------------------
	var applyWidgetStyles = function(self) {
/* Apply common widget properties:
 * justify
 * padx
 * pady
 * bd
 * fg
 * bg
 * relief
 * font
 * width
 * height
 * text
 */ 		
		var e = $('#tkinter_' + self.id);

		if(self.props.justify) {
			var align = Sk.ffi.remapToJs(self.props.justify);
			e.css('text-align', align);
		}
		
		if(self.props.bd) {
			var bdwidth = Sk.ffi.remapToJs(self.props.bd);
			e.css('border-style','solid');
			e.css('border-width',bdwidth+'px');
		}
		
		if(self.props.foreground) {
			var fg = Sk.ffi.remapToJs(self.props.foreground);
			e.css('color', getColor(fg));
		}
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
		
		if(self.props.padx) {
			var padx = Sk.ffi.remapToJs(self.props.padx)+'px';
			e.css({
					'margin-right':padx,
					'margin-left': padx
				});
		}
		if(self.props.pady) {
			var pady = Sk.ffi.remapToJs(self.props.pady)+'px';
			e.css({
					'margin-top':pady,
					'margin-bottom': pady
				});
		}
		
		if(self.props.background) {
			var bg = Sk.ffi.remapToJs(self.props.background);
			e.css('background-color', getColor(bg));
		}
		if(self.props.bg) {
			var bg = Sk.ffi.remapToJs(self.props.bg);
			e.css('background-color', getColor(bg));
		}

		if(self.props.font) {
			var font = Sk.ffi.remapToJs(self.props.font);

			if(typeof(font) == "string") {
				font = ("" + font).split(" "); 				
			} 
				
			var fontFamily = font[0];
			var fontWeight = font.includes("bold")?"bold":"normal";
			var fontStyle = font.includes("italic")?"italic":"normal";
			
			if (font[1]===0) {
						font[1]=12;
				}

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
			if(!(self.props.justify)) {
				e.css('text-align', 'center');
				}
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
		
		if(self.props.text) {
			if(LW.includes(self.id)) {
					let labelElement = document.getElementById("l_"+self.id);
					labelElement.innerHTML = PythonIDE.sanitize(Sk.ffi.remapToJs(self.props.text));
			} 
			else {
					$('#tkinter_' + self.id).text(PythonIDE.sanitize(Sk.ffi.remapToJs(self.props.text)));
			}
		}
		if(self.props.state) {
				var disabled = Sk.ffi.remapToJs(self.props.state) == 'disabled';
				$('#tkinter_' + self.id).prop('disabled', disabled);	
		}
	}
	
	var configure = function(kwa, self) {
		for(var i = 0; i < kwa.length; i+=2) {
			var key = Sk.ffi.remapToJs(kwa[i]);
			var val = kwa[i+1];
			self.props[key] = val;			
		}
		applyWidgetStyles(self);
	}
	configure.co_kwargs = true;

//------------------------------------------------
	s.mainloop = new Sk.builtin.func(function() {
		Sk.builtin.pyCheckArgs("mainloop", arguments, 0, 0);
	});

// Variable, StringVar, IntVar, BooleanVar

	s.Variable = new Sk.misceval.buildClass(s, function($gbl, $loc) {
// Common Variable class		
		var init = function(kwa, self, master,s) {
			self.props = unpackKWA(kwa);
			self.value = '';
			if (self.props.value){self.value = Sk.ffi.remapToJs(self.props.value);}
			if (s){self.value = Sk.ffi.remapToJs(s);}			
				
			variables[varCount] = self;
			self.id = varCount++;

		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

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
			return  Sk.ffi.remapToPy(self.value);
		});
	}, "Variable", []);
// Value holder for string variables ---------------------------------
	s.StringVar = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		var init = function(kwa, self, master,s) {
			self.props = unpackKWA(kwa);
			self.value = '';
			if (self.props.value){self.value = Sk.ffi.remapToJs(self.props.value);}
			if (s){self.value = Sk.ffi.remapToJs(s);}			
				
			variables[varCount] = self;
			self.id = varCount++;

		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

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
			return  Sk.ffi.remapToPy(self.value);
		});

	}, "StringVar", []);
// Value holder for integer variables -----------------------------
	s.IntVar = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		var init = function(kwa, self, master,s) {
			self.props = unpackKWA(kwa);
		
			self.value = 0;
			if (self.props.value){self.value = Sk.ffi.remapToJs(self.props.value);}
			if (s){self.value = Sk.ffi.remapToJs(s);}
					
			variables[varCount] = self;
			self.id = varCount++;

		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);
		
		$loc.__str__ = new Sk.builtin.func(function(self) {
			
			return new Sk.builtin.int("PY_VAR" + self.id);
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
			return  Sk.ffi.remapToPy(self.value);
		});
	}, "IntVar", []);
// Value holder for float variables------------------------------------
	s.DoubleVar = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		var init = function(kwa, self, master,s) {
			self.props = unpackKWA(kwa);
			self.value = 0.0;
			if (self.props.value){self.value = Sk.ffi.remapToJs(self.props.value);}
			if (s){self.value = Sk.ffi.remapToJs(s);}
					
			variables[varCount] = self;
			self.id = varCount++;

		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);
		$loc.__str__ = new Sk.builtin.func(function(self) {
			return new Sk.builtin.float("PY_VAR" + self.id);
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
			return  Sk.ffi.remapToPy(self.value);
		});
	}, "DoubleVar", []);
// Value holder for boolean variables ---------------------------------
	s.BooleanVar = new Sk.misceval.buildClass(s, function($gbl, $loc) {
	
		var init = function(kwa, self, master,s) {
			self.props = unpackKWA(kwa);
			self.value = '0';
			
			if (self.props.value){self.value = Sk.ffi.remapToJs(self.props.value);}
			if (s){self.value = Sk.ffi.remapToJs(s);}
						
			variables[varCount] = self;
			self.id = varCount++;

		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.__str__ = new Sk.builtin.func(function(self) {
			return new Sk.builtin.str("PY_VAR" + self.id);
		});

		$loc.set = new Sk.builtin.func(function(self, vvalue) {
			Sk.builtin.pyCheckArgs("set", arguments, 1, 2);
			
			value=Sk.ffi.remapToJs(vvalue);
			if (Number.isInteger(value)) {
				if (value!=0) {
					value=1;
				}
			}
			value = ""+value;	
			value=value.toLowerCase();
			console.log('VAL:',value);
			if ((value==='true')||(value==='1')) {
				self.value='1'
			}
		
			if(self.updateID !== undefined) {
				if(widgets[self.updateID].update) {
					widgets[self.updateID].update();
				}
			}
		});

		$loc.get = new Sk.builtin.func(function(self) {
			getvalue = (self.value==='1');
			return Sk.ffi.remapToPy(getvalue); });
	}, "BooleanVar", [])
	
// Event -------------------------------------------------------	
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

function getOffset(elem) { // fix getBoundingClientRect
    if (elem.getBoundingClientRect) {       
        return getOffsetRect(elem)
    } else {       
        return getOffsetSum(elem)
    }
}

function getOffsetSum(elem) {
    var top=0, left=0
    while(elem) {
        top = top + parseInt(elem.offsetTop)
        left = left + parseInt(elem.offsetLeft)
        elem = elem.offsetParent
    }
    return {top: top, left: left}
}

function getOffsetRect(elem) {
    var box = elem.getBoundingClientRect()
    var body = document.body
    var docElem = document.documentElement
    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft
    var clientTop = docElem.clientTop || body.clientTop || 0
    var clientLeft = docElem.clientLeft || body.clientLeft || 0
    var top  = box.top +  scrollTop - clientTop
    var left = box.left + scrollLeft - clientLeft
    return { top: Math.round(top), left: Math.round(left) }
}	
// Common widget class --------------------------------------------
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
					$('#tkinter_' + self.id).mousedown(function(e) {
						if(e.buttons) {
							var x = e.pageX - getOffsetRect(this).left;
							var y = e.pageY - getOffsetRect(this).top;							
							
							var pyE = Sk.misceval.callsim(s.Event);
							pyE.props.x = new Sk.builtin.int_(x);
							pyE.props.y = new Sk.builtin.int_(y);
							Sk.misceval.callsimAsync(null, self.eventHandlers['<Button>'], pyE).then(function success(r) {
							
							}, function fail(e) {
								window.onerror(e);
							});
					    }
					});
				}
				
				if(self.eventHandlers['<Double-Button>']) {
					$('#tkinter_' + self.id).dblclick(function(e) {
						if(e.buttons) {
							var x = e.pageX - getOffsetRect(this).left;
							var y = e.pageY - getOffsetRect(this).top;							
							
							var pyE = Sk.misceval.callsim(s.Event);
							pyE.props.x = new Sk.builtin.int_(x);
							pyE.props.y = new Sk.builtin.int_(y);
							Sk.misceval.callsimAsync(null, self.eventHandlers['<Double-Button>'], pyE).then(function success(r) {
							
							}, function fail(e) {
								window.onerror(e);
							});
					    }
					});
				}

				if(self.eventHandlers['<B1Motion>']) {
					$('#tkinter_' + self.id).mousemove(function(e) {
						
						if(e.buttons) {	
							var x = e.pageX - getOffsetRect(this).left;
							var y = e.pageY - getOffsetRect(this).top;							

							var pyE = Sk.misceval.callsim(s.Event);
							pyE.props.x = new Sk.builtin.int_(x);
							pyE.props.y = new Sk.builtin.int_(y);
							Sk.misceval.callsimAsync(null, self.eventHandlers['<B1Motion>'], pyE).then(function success(r) {

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
		
		$loc.cget = new Sk.builtin.func(function(self, value) { // widget .cget() method
			var p = Sk.ffi.remapToJs(value);
					switch(p) {
							case 'text':
								return new Sk.builtin.str($('#tkinter_' + self.id).text());
							case 'bg':
								if (self.props.bg) {
									return new Sk.builtin.str(self.props.bg);
									}
								else {
									return new Sk.builtin.str($('#tkinter_' + self.id).css("background-color"));
								}	
							case 'fg':
								if (self.props.fg) {
									return new Sk.builtin.str(self.props.fg);
									}
								else {
									return new Sk.builtin.str($('#tkinter_' + self.id).css("color"));
								}
							case 'width':
								return new Sk.builtin.int_($('#tkinter_' + self.id).width());
							case 'height':
								return new Sk.builtin.int_($('#tkinter_' + self.id).height());
							default: 
								return new new Sk.builtin.ValueError("Error: Сan't get object property");
							break;
						}
		});
//--------------		
		var commonDisplay = function(kwa, self, parent) {
			var props = unpackKWA(kwa);
			var side = Sk.ffi.remapToJs(props.side);
			var br = '<div style="line-height:1%;"></br></div>';	
			if 	((side === 'left')||(side === 'right')) {
				br='';
			}	
			if(self.getHtml) {
				$('#tkinter_' + self.id).remove();
				var html = self.getHtml(self);
				if ((side === 'right')||(side === 'bottom')) {
						parent.prepend(br+html);
				}		
				else {
						parent.append(br+html);
				}	
				
				if ((side === 'left')||(side === 'right')) {
						$('#tkinter_' + self.id).css('display','inline');
				}
				
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
// place layout manager ---------------------------------------
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
			//if(props.width) {
				width = Sk.ffi.remapToJs(props.width) + "px";
			//}

			var height="auto";
			//if(props.height) {
				height = Sk.ffi.remapToJs(props.height) + "px";
			//}
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
		
// pack layout manager ----------------------------------------
		var pack = function(kwa, self) {
			var props = unpackKWA(kwa);
			var pid = 'tkinter_' + self.master.id;
			var parent = $('#'+pid);
			var direct = "#N";

			if (!($("#pack_"+pid).length)) {  
				var html = '<div class="pack_container" id = "pack_'+pid+'">\n'; // append pack grid to parent if not exist
				html = html+'<div class="pack_container">\n<div class="pack_item NW" id="NW"></div>\n<div class="pack_item N" id="N"></div>\n<div class="pack_item NE" id="NE"></div>\n<div class="pack_item W" id="W"></div>\n<div class="pack_item C" id="C"></div>\n<div class="pack_item E" id="E"></div>\n<div class="pack_item SW" id="SW"></div>\n<div class="pack_item S" id="S"></div>\n<div class="pack_item SE" id="SE"></div>\n</div></div>'
				parent.append(html); // create grid for pack
			}

			if (props.side) {
				side = Sk.ffi.remapToJs(props.side);
				if (side=='left') {direct="#W";}
				if (side=='top') {direct="#N";}
				if (side=='right') {direct="#E";}
				if (side=='bottom') {direct="#S";}			
			}

			if (props.anchor) {
				anchor=Sk.ffi.remapToJs(props.anchor).toUpperCase();
				if (anchor==='CENTER') { anchor='C';}
				direct='#'+anchor;
			}
			var place = parent.find(direct);  // place for item add
			
			commonDisplay(kwa, self, place);  // add item to grid			
	
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

			}
		}
		pack.co_kwargs = true;
		$loc.pack = new Sk.builtin.func(pack);
// grid layout manager ----------------------------
		var grid = function(kwa, self) {
			var props = unpackKWA(kwa);

			if(!props.column) {
				props.column = new Sk.builtin.int_(1);
			}
			if(!props.row) {
				props.row = new Sk.builtin.int_(1);
			}
			if(!self.master){
				self.master = self;
			}
			var pid = 'tkinter_' + self.master.id;
			var parent = $('#' + pid);       // parent class
			var item_id = 'item_' + self.id; // item id
			var row = Sk.ffi.remapToJs(props.row)+1;
			var col = Sk.ffi.remapToJs(props.column)+1;

			var row_span = 1;
			var col_span = 1;
			if(props.rowspan) {
				row_span = Sk.ffi.remapToJs(props.rowspan);
			}
			if(props.columnspan) {
				col_span = Sk.ffi.remapToJs(props.columnspan);
			}
			if (!($("#grid_"+pid).length)) {  
				var html = '<div class="grid_container" id = "grid_'+pid+'"> </div>'; // append grid to parent if not exist
				parent.append(html);
			}
		    // place item to grid
			grid_col = 'grid-column: '+col+' / span '+col_span+';';
			grid_row = 'grid-row: '+row+' / span '+row_span+';';
			grid_class = '<div class="grid_item" id="'+ item_id+'" style = "';
			grid_class =  grid_class +  grid_col + grid_row +'">';
			$("#grid_"+pid).append(grid_class);
		
			var place = parent.find("#"+item_id);  // place for item add
			commonDisplay(kwa, self, place);	   // add item to grid
			$('#'+item_id).append('</div>');
			if(self.master.props.width) {		   // restore parent window size	
				parent.dialog('option', {
					width: self.master.props.width,
					height:self.master.props.height
				});
			}
		}
		grid.co_kwargs = true;
		$loc.grid = new Sk.builtin.func(grid);

		function bind(self, event, command) {
			var e = Sk.ffi.remapToJs(event);
			if (e==='<B1-Motion>') { e='<B1Motion>'; }
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

		$loc.__setitem__ = new Sk.builtin.func(function(self, key, value) { // Set key item values			
			self.props[Sk.ffi.remapToJs(key)] = value;
			applyWidgetStyles(self); //
		});
		
		$loc.destroy = new Sk.builtin.func(function(self) {
			$('#tkinter_' + self.id).remove();
			if(self.closeMainLoop) {
				self.closeMainLoop();
			}
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
// Canvas -------------------------------------
	s.Canvas = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var canvasBg = '#eeeeee';
		var getHtml = function(self) {
			
			if(self.props.bg) {
				canvasBg = Sk.ffi.remapToJs(self.props.bg);				
			}
			if(self.props.background) {
				canvasBg = Sk.ffi.remapToJs(self.props.background);				
			}					
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
					if (self.props.bg) {
						cx.fillStyle = getColor(Sk.ffi.remapToJs(self.props.bg));
					}	
					if(self.props.background) {
						cx.fillStyle = getColor(Sk.ffi.remapToJs(self.props.background));						
					}
					cx.clearRect(0, 0, canvas.width, canvas.height);	
					
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
		
		function applyStyles(props, cx) {
			
			if(!props.dash) {
				cx.setLineDash([]);
			}
			if(props.fill) {
					cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.fill));
			}	
			if(!props.outline) {
				props.outline = new Sk.builtin.str("black");
			}
			cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.outline));	

			if(props.width) {
					cx.lineWidth = Sk.ffi.remapToJs(props.width);
			}
			else {
					cx.lineWidth = 1
			}
			
			if(props.dash) {
				var dash = Sk.ffi.remapToJs(props.dash);
				cx.setLineDash(dash);
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
// -----------------		
		var create_polygon = function(kwa, self, coords) {
			var jsCoords = Sk.ffi.remapToJs(coords);
			if(self.props.fill){				
				self.props.fill=undefined;				
				}
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
					cx.fillStyle =  Sk.ffi.remapToJs(self.props.fill);
					cx.fill();	
				}
			}});
		}
		create_polygon.co_kwargs = true;
		$loc.create_polygon = new Sk.builtin.func(create_polygon);
		
// -----------------
	
		var create_line = function(kwa, self, coords) {
			var jsCoords = Sk.ffi.remapToJs(coords);
			if(self.props.fill){				
				self.props.fill=undefined;				
			}
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
				function drawArrow(x0,y0,x1,y1) {
					var	headLength = 15;
					// constants
					var deg_in_rad_200=200*Math.PI/180;
					var deg_in_rad_160=160*Math.PI/180;
					// calc the angle of the line
					var dx=x1-x0;
					var dy=y1-y0;
					var angle=Math.atan2(dy,dx);								
					// calc arrowhead points
					var x200=x1+headLength*Math.cos(angle+deg_in_rad_200);
					var y200=y1+headLength*Math.sin(angle+deg_in_rad_200);
					var x160=x1+headLength*Math.cos(angle+deg_in_rad_160);
					var y160=y1+headLength*Math.sin(angle+deg_in_rad_160);					
					cx.beginPath();
					cx.moveTo(x1,y1);
					cx.setLineDash([]);
					cx.lineWidth = 2;
					// draw arrowhead
					cx.lineTo(x200,y200);
					cx.lineTo(x160,y160);
					cx.lineTo(x1,y1);
					cx.closePath();
					cx.stroke();
					cx.fill()					
				}
				var cx = canvas.getContext('2d');
				cx.beginPath();
				applyStyles(props, cx);
				if(props.fill) {
					cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.fill));
					cx.fillStyle   = getColor(Sk.ffi.remapToJs(props.fill)); }
				else {
					cx.strokeStyle = 'black';
					cx.fillStyle   = 'black';
				}	
				cx.moveTo(jsCoords[0], jsCoords[1]);
				for(var i = 2; i < jsCoords.length; i+=2) {
					cx.lineTo(jsCoords[i], jsCoords[i+1]);					
				}
				cx.stroke();			
				// arrow head
				if (props.arrow) {
					arrw=Sk.ffi.remapToJs(props.arrow);
					var l = jsCoords.length;												
					if ((arrw=="last")||(arrw=="both")) {
							drawArrow(jsCoords[l-4],jsCoords[l-3],jsCoords[l-2],jsCoords[l-1])
					}		
					if ((arrw=="first")||(arrw=="both")) {
							drawArrow(jsCoords[2],jsCoords[3],jsCoords[0],jsCoords[1])
					}
				}				 
			}});			
		}
		create_line.co_kwargs = true;
		$loc.create_line = new Sk.builtin.func(create_line);		
//------------------

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
				var angle = 0;
				if(props.text) {
					text = ""+Sk.ffi.remapToJs(props.text);
				}
				cx.textAlign = "center";
				applyStyles(props, cx);
				if(props.fill) {
					cx.fillStyle = getColor(Sk.ffi.remapToJs(props.fill));
				}
				if(props.angle) {
					angle= Sk.ffi.remapToJs(props.angle);
				}
				cx.save();
				cx.translate(coords.x1+6,coords.y1+6);
				cx.rotate(-angle*(Math.PI/180));
				cx.fillText(text, 0, 0);
				cx.restore();
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
				if(props.fill) {
					cx.fillStyle = getColor(Sk.ffi.remapToJs(props.fill));
				}
				if(props.outline) {
					cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.outline));	
				}
				if(props.width) {
					cx.lineWidth = Sk.ffi.remapToJs(props.width);
				}
				if(props.fill) {
								cx.fillRect(coords.x1, coords.y1, coords.x2 - coords.x1, coords.y2 - coords.y1);
							   }
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
				applyStyles(props, cx);
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
				if(!props.style) {
					style="pieslice"
				} 
				
				applyStyles(props, cx);
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
			
				cx.ellipse(coords.x1 + (w/2), coords.y1 + (h/2),  w / 2, h/2, 0, start, start+extent, true);
				if (style=="pieslice") {
					cx.lineTo(coords.x1 + (w/2), coords.y1 + (h/2));
				}
				if(props.fill) {
					cx.fill();
				}
				if (style=="chord") {
					cx.closePath();
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
// Entry +++ -----------------------------------------------------
	s.Entry = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {
			var v = "";
			if(self.props.textvariable) {
					var v = v + Sk.ffi.remapToJs(self.props.textvariable.value);
					self.props.textvariable.updateID = self.id;
			}
			return '<input type="text" id="tkinter_' + self.id + '" style="text-align:right"; value="'+v+'">';
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
 	
			self.update = function() {				
				if(self.props.textvariable) {
					var v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);					
				}
				$('#tkinter_' + self.id).val(Sk.ffi.remapToJs(v));				 
			}
			self.onShow = function() {								
				$("input").change(function(){					
						if(self.props.textvariable) {
								self.props.textvariable.value = Sk.ffi.remapToPy($('#tkinter_' + self.id).val())
						}
				})
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
// Scale +++ -----------------------------------------------------
	s.Scale = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var sliderValue;
		var slider;

		var getHtml = function(self) {
	
			var min = 0;
			if(self.props.from_) {
				min = Sk.ffi.remapToJs(self.props.from_);
			}
			var max = 100;
			if(self.props.to) {
				max = Sk.ffi.remapToJs(self.props.to);
			}
			var orientation = "vertical";
			if(self.props.orient) {
				orientation = Sk.ffi.remapToJs(self.props.orient);
			}
			var value = 50;			
			if(self.props.variable) {
						if (self.props.variable.value === "undefined") {
								self.props.variable.value = Sk.ffi.remapToPy(0)
								}						
						var value = Sk.ffi.remapToJs(self.props.variable.value);
						self.props.variable.updateID = self.id; 
			}
			
			html='<input id="slider_'+self.id + '" type = "range" min="'+min+'" max="'+max+'" value="'+value+'" step="1" orient="'+orientation+'" />'
			return '<div id="tkinter_' + self.id + '" style="margin:auto;"><span id="slider_'+self.id +'_Value"></span><div style="line-height:1%;"></br></div>'+html;
		}
				
		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			
			self.onShow = function() {
				var value = 0;
				if(self.props.cursor) {
					value = Sk.ffi.remapToJs(self.props.cursor);
				}   
					
				sliderValue = document.getElementById('slider_'+self.id +'_Value');
				slider = document.getElementById('slider_'+ self.id);
				sliderValue.innerHTML = slider.value;
			
				slider.oninput =function(){
						sliderValue.innerHTML = slider.value;
						if(self.props.variable) {
								self.props.variable.value = Sk.ffi.remapToPy(slider.value)
						}
				}
		    }		
						  
			self.update = function() {		
					if(self.props.variable) {
						var v = Sk.ffi.remapToJs(self.props.variable.value);								
						$('#slider_'+self.id).val(v);
						sliderValue.innerHTML = v;
					}	
			}
		}		
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.get = new Sk.builtin.func(function(self) {			
					sliderValue =$('#slider_'+self.id).val();
			return sliderValue
		});

		$loc.set = new Sk.builtin.func(function(self, value) {
			var v = ""+Sk.ffi.remapToJs(value);
			$('#slider_'+self.id).val(v);			
			sliderValue.innerHTML = v;
		});
	}, 'Scale', [s.Widget])
// Message +++------------------------------------------------------
	s.Message = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {

			var v = "";			
			if(self.props.text) {
				v = Sk.ffi.remapToJs(self.props.text);
			}
			if (!self.props.width) {
					self.props.width = 20;
			}				
			if(self.props.textvariable) {
				v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				self.props.textvariable.updateID = self.id;
			}
			var html = '<div id="tkinter_' + self.id + '" style="word-wrap:break-word;text-align:center;" >' + PythonIDE.sanitize(v) + '</div>';
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
				self.props.text = v;
				
					if (self.props.width===1) {						
						self.props.width = v.length+1;
					}
					$('#tkinter_' + self.id).css('width', Sk.ffi.remapToJs(self.props.width) + 'em');
			}
			commonWidgetConstructor(kwa, self, master, getHtml);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);
	}, 'Message', [s.Widget]);	
// Label +++------------------------------------------------------
	s.Label = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {

			var v = "";			
			if(self.props.text) {
				v = Sk.ffi.remapToJs(self.props.text);
			}
			if (!self.props.width) {
					self.props.width = v.length+1;
			}				
			if(self.props.textvariable) {
				v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				self.props.textvariable.updateID = self.id;
			}
			var html = '<div id="tkinter_' + self.id + '" style="margin-left:0em;display: inline;">' + PythonIDE.sanitize(v) + '</div>';
			return html;
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			self.update = function() {
				var v = "";
				if(self.props.text) {
					v = Sk.ffi.remapToJs(self.props.text);
				}
				if(self.props.textvariable) {
					v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);					
				}
				$('#tkinter_' + self.id).text(Sk.ffi.remapToJs(v));
				self.props.text = v;
				
					if (self.props.width===1) {						
						self.props.width = v.length+1;
					}
					$('#tkinter_' + self.id).css('width', Sk.ffi.remapToJs(self.props.width) + 'em');
			}			
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

	}, 'Label', [s.Widget]);
// Button +++------------------------------------------------------
	s.Button = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		
		var getHtml = function(self) {
			
			var disabled = false;
			if(self.props.state) {
				disabled = Sk.ffi.remapToJs(self.props.state) == 'disabled';
			}
			var v = "";
			if(self.props.text) {
					v = Sk.ffi.remapToJs(self.props.text);
			}			
			if(self.props.textvariable) {
				v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				self.props.textvariable.updateID = self.id;
			}
			if(v==="") { 
					v="\u2000\u2000"; // blank button
			}
			var html = '<button id="tkinter_' + self.id + '"' + (disabled?' disabled':'') + '>'+v+'</button>';
			return html;
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			self.update = function() {
				var v = "";
				if(self.props.text) {
					v = Sk.ffi.remapToJs(self.props.text);
				}			
				if(self.props.textvariable) {
					v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				}
				if(v==="") { 
					v="\u2000\u2000"; // blank button
				}
				$('#tkinter_' + self.id).text(Sk.ffi.remapToJs(v));					
					if (self.props.width===1) {						
						self.props.width = v.length+1;
					}
					$('#tkinter_' + self.id).css('width', Sk.ffi.remapToJs(self.props.width) + 'em');
			}	
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);
	}, 'Button', [s.Widget]);
	
// Checkbutton +++---------------------------------------------------------
		s.Checkbutton = new Sk.misceval.buildClass(s, function($gbl, $loc) {

			var getHtml = function(self) {
				self.props.justify = 'left';
				self.onval  = 1;				
				self.offval = 0;								
				if(self.props.onvalue) {
					self.onval = Sk.ffi.remapToJs(self.props.onvalue);					
				}
				if(self.props.offvalue) {
					self.offval = Sk.ffi.remapToJs(self.props.offvalue);
				}
				var label = "";
				if(self.props.text) {
					label = Sk.ffi.remapToJs(self.props.text);
				}
				if(self.props.textvariable) {
					label = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
					self.props.textvariable.updateID = self.id;
				}
				var checked = false;				
				if (self.props.variable) {
					self.props.variable.updateID = self.id; 					
					v = Sk.ffi.remapToJs(self.props.variable.value);					
					if (v ==='') {						
						self.props.variable.value = Sk.ffi.remapToPy(self.offval);
						v = self.offval;						
					}					
					if (v === self.onval) {
						checked = true;									
					}
				}
				var html = '<div id="tkinter_' + self.id + '"><input type="checkbox"' + (checked?' checked':'') + '>' + '<label id="l_'+ self.id +'" for="tkinter_' + self.id +'">' + PythonIDE.sanitize(label) + '</label></div>';
				return html;
			}

			var init = function(kwa, self, master) {
				
				self.onShow = function() {						
					
					$('#item_' + self.id).css({'margin-left':'0'});					
									
					$('#tkinter_' + self.id + ' :checkbox').change(function()  {
						var v = Sk.ffi.remapToJs($('#tkinter_' + self.id + " input").prop('checked'));	
						if (self.props.variable) {				
							if(v) {
								self.props.variable.value = Sk.ffi.remapToPy(self.onval);
							} else {self.props.variable.value = Sk.ffi.remapToPy(self.offval)}
						}								
					});
				}

				self.update = function() {	
									 
					var checked = false;
					if(self.props.variable) {											
						checked = (Sk.ffi.remapToJs(self.props.variable.value)===self.onval);																		
					}
					$('#tkinter_' + self.id + " input").prop('checked', checked);
					if(self.props.textvariable) {
						v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
						$('#l_' + self.id).text(Sk.ffi.remapToJs(v));							
					}								
				}
				
				commonWidgetConstructor(kwa, self, master, getHtml);			
				LW.push(self.id);
			}
			init.co_kwargs = true;
			$loc.__init__ = new Sk.builtin.func(init);
			
		}, 'Checkbutton', [s.Widget]);		
		
// Radiobutton -------------------------------------------------------------
		s.Radiobutton = new Sk.misceval.buildClass(s, function($gbl, $loc) {
			var getHtml = function(self) {
				self.props.justify='left';
				var label = "";
				if(self.props.text) {
					label = Sk.ffi.remapToJs(self.props.text);
				}
				if(self.props.textvariable) {
					label = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
					self.props.textvariable.updateID = self.id;
				}	
				var value = "";
				if(self.props.value) {
					value = "" + Sk.ffi.remapToJs(self.props.value);
				}

				var name="default";	
				if(self.props.variable) {
					name="PY_VAR" + self.props.variable.id;
				}

				if(self.props.var) {
					self.props.variable=self.props.var					
				}
				
				var checked = false;				
				if(self.props.variable) {
					self.props.variable.updateID = self.id; 
					if (self.props.variable.value === self.props.value.v) {
									checked = true;												 
					}	
				}
				var html = '<div id="tkinter_' + self.id + '"><input name="' + name + '" type="radio" '+ (checked?' checked':'')  + ' value="' + PythonIDE.sanitize(value) + '">' 
				+ '<label id="l_'+ self.id +'" for="tkinter_' + self.id +'">' + PythonIDE.sanitize(label) + '</label></div>';
				return html;
			}

			var init = function(kwa, self, master) {
				
				self.onShow = function() {
					$('#item_' + self.id).css({'margin-left':'0'});					
						
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
					if(self.props.variable) {
						v = Sk.ffi.remapToJs(self.props.variable.value);
					}
					$('#tkinter_' + self.id + " input").prop('checked', v);
					if(self.props.textvariable) {
						v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
						$('#l_' + self.id).text(Sk.ffi.remapToJs(v));							
					}
				}
				commonWidgetConstructor(kwa, self, master, getHtml);
				LW.push(self.id);
			}
			init.co_kwargs = true;
			$loc.__init__ = new Sk.builtin.func(init);

			$loc.set = new Sk.builtin.func(function(self, value) {
				self.props.value = Sk.ffi.remaptoJs(value);
				$('#tkinter_' + self.id + ' input').prop('checked', value);
			});
		}, 'Radiobutton', [s.Widget]);
	
// Listbox widget -------------------------------------------------	
		s.Listbox = new Sk.misceval.buildClass(s, function($gbl, $loc) {	
			function generateUUID() { // generate uuid for list items
				var d = new Date().getTime();
				var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
					var r = Math.random() * 16;
					if(d > 0){
						r = (d + r)%16 | 0;
						d = Math.floor(d/16);
					} else {
						r = (d2 + r)%16 | 0;
						d2 = Math.floor(d2/16);
					}
						return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
				});
			}	
				var empty = true;
		        
		        var getHtml = function(self) {
				var html = '<select id="tkinter_' + self.id + '" multiple>';
				if(self.props.listvariable) {
					var vals = self.props.listvariable.value;
					empty = false;
					for(var i = 0; i < vals.length; i++) {
						var val = PythonIDE.sanitize("" + vals[i]);						
						html += '<option value="' + generateUUID() + '"' +  '>' + val + '</option>';
					}
				}
				html += '</select>'
				return html;
			}

		var init = function(kwa, self, master) {
			
			commonWidgetConstructor(kwa, self, master, getHtml);
			self.props.text='';
			self.props.width = 20;
			self.props.height = 10;
			// width, height props
			if(self.props.width) {
				self.props.width = new Sk.builtin.int_(Sk.ffi.remapToJs(self.props.width)*10);
			}
			if(self.props.height) {
				self.props.height = new Sk.builtin.int_(Sk.ffi.remapToJs(self.props.height)*20);
				}
			}
			init.co_kwargs = true;
			$loc.__init__ = new Sk.builtin.func(init);
			
			$loc.curselection = new Sk.builtin.func(function(self) {
				let selection = $('#tkinter_' + self.id + ' option:selected').text();
				let index=-1;
				do {
					index = index + 1;
					v=$('#tkinter_' + self.id+ '  option:eq('+index+')').text();
				} while (v != selection);	
				
				var selected=[]
				selected.push(index);
				
				return new Sk.builtin.tuple(selected); 
			});

			$loc.get = new Sk.builtin.func(function(self, pos) {
				var pos = Sk.ffi.remapToJs(pos);
				var result= $('#tkinter_' + self.id + '  option:eq('+pos+')').text();
				var items=[]
				items.push(result);
				return new Sk.builtin.tuple(items);
			});

			$loc.delete_$rw$ = new Sk.builtin.func(function(self, pos) {
			var pos = Sk.ffi.remapToJs(pos);
			$('#tkinter_' + self.id+ '  option:eq('+pos+')').remove();			
			});

			$loc.size = new Sk.builtin.func(function(self) {	
									
				var result= $('#tkinter_' + self.id + ' option').length;
				return new Sk.builtin.int_(Sk.ffi.remapToJs(result));
			});
	
			// Listbox.insert
			// .insert(END, item)
			// .insert(pos, item)
			$loc.insert = new Sk.builtin.func(function(self, pos, newItem) {
						
			var pos = Sk.ffi.remapToJs(pos);
			item = Sk.ffi.remapToJs(newItem);

			if ((pos===1)&&(empty)) {
				pos='end';
			}
			if(pos == "end") {
				var data = {
						id: generateUUID(),
						text: item
						};
				var newOption = new Option(data.text, data.id, false, false);
				$('#tkinter_' + self.id).append(newOption).trigger('change');
				empty=false;
			}
			else {	
				pos = pos-2;		
				$('#tkinter_' + self.id+ ' option:eq('+pos+')').after('<option value='+generateUUID()+'>'+item+'</option>');				
				empty=false;
			}	
		
			});
		}, 'Listbox', [s.Widget]);		
// SpinBox ---------------------------------------------------------
	s.Spinbox = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var values =[];
		var getSpinData = function(self) {			
			var v = Sk.ffi.remapToJs($('#spinner_' + self.id).val());			
			var sv;
			if(self.props.values) {
					sv = Sk.builtin.str(values[v-1])
			}
			else {	
					if (Number.isInteger(v)) {
								sv = Sk.builtin.int_(v); 
					}
					else {
								sv = Sk.builtin.float_(v);
					}
			}	
			if(self.props.textvariable) {						
								self.props.textvariable.value = sv																
			}
			return sv;
		}
		var getHtml = function(self) {
			
			var minVal = 0;
			var maxVal = 0;
			var step = 1;
			var val = 0;
						
			if(self.props.to) {					
				minVal = Sk.ffi.remapToJs(self.props.from_);
			}
			if(self.props.to) {
				maxVal = Sk.ffi.remapToJs(self.props.to);
			}
			if(self.props.increment) {		
				step = Sk.ffi.remapToJs(self.props.increment);
			}
			if (maxVal<minVal) {
				 new Sk.builtin.ValueError('Error: "to" should be greater than "from_"');				 
			}
			start$ = 1;
			if(self.props.values) {
					var vals = Sk.ffi.remapToJs(self.props.values);
					for(var i = 0; i < vals.length; i++) {
						var val = PythonIDE.sanitize("" + vals[i]);
						values.push(val);
					}
					minVal = 1;
					maxVal = i+1;
					step =1;
					start$ = values[0];								
			}	
		
			id$=  "id='tkinter_" + self.id + "'";
			from$ = ' min='+minVal;
			to$ = ' max='+maxVal;
			step$ = ' step='+step;
			val$=	 " value=1";
			
			if (self.props.from_) {
				val$ = ' value='+minVal;
				start$ = minVal;				
			}
			
			if(self.props.textvariable) {
				self.props.textvariable.updateID = self.id;
				self.props.textvariable.value = start$;
			}
			
			ss$=from$+to$+step$+val$;			

			sp$ = "<div "+id$+" style='margin:auto;width:160px;text-align:left;'><span id='spin-label_"+ self.id +"' style='z-index: 2;text-align:right;' >"+start$+"</span>"
			
			var html = sp$+"<input type='number' id='spinner_"+ self.id +"' style='width: 140px;position: absolute;color: white;' "+ss$+'></div><br>';
			return html;
		}
	
		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);		
			self.onShow = function() {
				var y = parseInt($('#tkinter_' + self.id).css("top"));
				var x = parseInt($('#tkinter_' + self.id).css("left"));  
				$('#spin-label_' + self.id).css({top: y, left: x, position:'absolute',width: 123});
	
				$("input").change(function(){
						var v = $('#spinner_' + self.id).val();						
						if(self.props.values) {
							$('#spin-label_' + self.id).html(values[v-1]);
						}
						else {
							$('#spin-label_' + self.id).html(v);
						}							
						if(self.props.textvariable) {						
								self.props.textvariable.value = getSpinData(self);															
						}
					});
			}
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);
		
		$loc.get = new Sk.builtin.func(function(self) {
			var v = Sk.ffi.remapToJs(getSpinData(self));																		
			if(self.props.values) {
				return new Sk.builtin.str(v)
			}
			else {	
				if (Number.isInteger(v)) {
					return new Sk.builtin.int_(v); 
				}
				else {
					return new Sk.builtin.float_(v);
				}
			}	
		});
	}, 'Spinbox', [s.Widget]);
// Frame ---------------------------------------------------------
	s.Frame = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {
			var width = 200;
			var height= 100;
			if(self.props.width) {
				width = Sk.ffi.remapToJs(self.props.width);
			}
			else {self.props.width = width}
			
			if(self.props.height) {
				height = Sk.ffi.remapToJs(self.props.height);
			}
			else {self.props.height = height}

			return '<div id="tkinter_' + self.id + '" style="margin:auto;width:' + width + 'px; height:' + height + 'px;"></div>';
		}
		
			var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
								
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);
		
//---------------------------------------

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
// Text ----------------------------------------------------------
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
	
// TopLevel ---------------------------------------------------------
	s.Toplevel = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self) {
			self.props = {};
			self.id = idCount++;
			if(!firstRoot) firstRoot = self;
			s.lastCreatedWin = self;
			var html = '<div id="tkinter_' + self.id + '" class="tkinter" title="Tk"></div>';
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
				'font-size':'12pt'
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
// Tk main class -----------------------------------------------
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
			var html = '<div id="tkinter_' + self.id + '" class="tkinter" title="Tk" ></div>';
			PythonIDE.python.output(html);
			$('#tkinter_' + self.id).dialog({
				width: 300,
				height: 200,
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
				'font-size': '11pt',
				'line-height': '2em'
			});
			self.props.width = 300;
			self.props.height = 200;
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
							
				let txt2 = Sk.ffi.remapToJs(geometry);
				let w = window.innerWidth;
				let h = window.innerHeight; 

				txt2=txt2.replaceAll('x',':');
				txt2=txt2.replaceAll('+',':+');
				txt2=txt2.replaceAll('-',':-');
				const v = txt2.split(':');
				
				if (v.length===4) {  
					x_pos = Number(v[2]);
					y_pos = Number(v[3]);
					if (x_pos<0) {
						x_pos=w+x_pos-v[0];
					}
					if (y_pos<0) {
						y_pos=h+y_pos-v[1];
					}
                      
                  $('#tkinter_' + self.id).dialog({ position: { my: 'left top', at: 'left+'+x_pos+' top+'+y_pos, of:window}, });             
					
                }
						
				$('#tkinter_' + self.id).dialog('option', {width: v[0], height: v[1]});
				self.props.width = v[0];
				self.props.height = v[1];

				$( '#tkinter_' + self.id).dialog( "option", "resizable", false );			
			}
		});
		
	}, 'Tk', [s.Widget]);

	PythonIDE.python.output('<small>tkinter/Skulpt, by Pete Dring, 30042024</small><br><br>');

	s.ttk = new Sk.builtin.module();
	var ttk = function(name) {
		var t = {
		};

// Combobox --------------------------------------------------------------
		t.Combobox = new Sk.misceval.buildClass(t, function($gbl, $loc) {
			var getHtml = function(self) {
				var html = '<select id="tkinter_' + self.id + '">';
				if(self.props.width) {
					self.props.width = new Sk.builtin.int_(Sk.ffi.remapToJs(self.props.width)*10);
				}
				else { 
					self.props.width = 100;
				}
				if(self.props.height) {
					self.props.height = new Sk.builtin.int_(Sk.ffi.remapToJs(self.props.height)*24);
				}
				else {
					self.props.height = 24;	
				}	
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
				
// Separator ---------------------------------------------------------
	t.Separator = new Sk.misceval.buildClass(t, function($gbl, $loc) {
		
		var getHtml = function(self) {
			var or$ = '<hr>';
		/*				
			if(self.props.orient) {
				var orient = Sk.ffi.remapToJs(self.props.orient);
				if (orient==='vertical') {
					or$=' class="vl">';
				}
			}
			*/		
			var html = '<div id="tkinter_' + self.id + '" style="line-height:10%;">'+or$+'</div>';
			return html;
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

	}, 'Separator', [s.Widget]);
	
// Progressbar ---------------------------------------------------------
	t.Progressbar = new Sk.misceval.buildClass(t, function($gbl, $loc) {
		
		var getHtml = function(self) {
			var value=0;
			if(self.props.value) {
					value = Sk.ffi.remapToJs(self.props.value);
			}
			var	maximum=100;	
			if(self.props.maximum) {
					maximum = Sk.ffi.remapToJs(self.props.maximum);					
			}	
			
			if(self.props.variable) {
							if (!self.props.variable.value) {								
								self.props.variable.value = value;
							}		
							if (self.props.variable.value.v != 0) {
								value = Sk.ffi.remapToJs(self.props.variable.value);
								self.props.variable.updateID = self.id; } 
			}

			var html = '<progress id="tkinter_' + self.id + '" height="10px" max="'+maximum+'" value="'+value+'">%</progress>';
			if(self.props.mode) {
				mode = Sk.ffi.remapToJs(self.props.mode);
				if (mode==="indeterminate"){
					html = '<progress id="tkinter_' + self.id + '" ></progress>';
				}
			}	
			return html;
		}
		
		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			self.update = function() {
					var v = 0;					
					if(self.props.variable) {
						if (self.props.variable.value === "undefined") {
								self.props.variable.value = Sk.ffi.remapToPy(0)
								}						
						v = Sk.ffi.remapToJs(self.props.variable.value);
					}
					$('#tkinter_' + self.id).val(v);
				}
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

	}, 'Progressbar', [s.Widget]);

	return t;
	}
	s.ttk.$d = new ttk("tkinter.ttk");
	Sk.sysmodules.mp$ass_subscript("tkinter.ttk", s.ttk);
// message box --------------------------------------------------------
	s.messagebox = new Sk.builtin.module();
	var messagebox = function(name) {
		var m = {
		};
	function msgOutput(title,message,msg) {
			if(!title)title = new Sk.builtin.str("");
			if(!message)message= new Sk.builtin.str("");
			title = PythonIDE.sanitize("" + Sk.ffi.remapToJs(title));
			message = PythonIDE.sanitize("" + Sk.ffi.remapToJs(message));
			return PythonIDE.runAsync(function(resolve, reject) {
				var html = '<div id="tkinter_show'+msg+'" title="' + title + '">' 
				    + '<p><img style="vertical-align:middle" src="./media/'+msg+'.png" width="48" height="48">'
				    +'     '+message
					+ '</p><br><button id="btn_tkinter_dlg_ok" class="btn_tkinter_dlg">OK</button></div>';
				PythonIDE.python.output(html);
				$('#tkinter_show'+msg).dialog();
				$('.btn_tkinter_dlg').button().click(function(e) {
					var id = e.currentTarget.id.split("_")[3];
					resolve();
					$('#tkinter_show'+msg).remove();
			});
		  });	
		}
		m.showinfo = new Sk.builtin.func(function(title, message) {
			msgOutput(title, message,'info');			
		});
		
		m.showwarning = new Sk.builtin.func(function(title, message) {
						msgOutput(title, message,'warning');			
		});
				
		m.showerror = new Sk.builtin.func(function(title, message) {
						msgOutput(title, message,'error');			
		});

		m.askyesno = new Sk.builtin.func(function(title, message) {
			if(!title)title = new Sk.builtin.str("");
			if(!message)message= new Sk.builtin.str("");
			title = PythonIDE.sanitize("" + Sk.ffi.remapToJs(title));
			message = PythonIDE.sanitize("" + Sk.ffi.remapToJs(message));
	
			return PythonIDE.runAsync(function(resolve, reject) {
				
				var html = '<div id="tkinter_askyesno" title="' + title + '">' 
				    + '<p><img style="vertical-align:middle" src="./media/yesno.png" width="48" height="48">'
				    +'     '+ message
					+ '<br><br><button id="btn_tkinter_dlg_yes" class="btn_tkinter_dlg">Yes</button>'
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
