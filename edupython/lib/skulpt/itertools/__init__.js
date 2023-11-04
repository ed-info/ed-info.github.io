var $builtinmodule = function (name) {
    var s = {
	};
	
	s.cycle = new Sk.builtin.func(function(i) {
		var it = Sk.abstr.iter(i);
		var val = it.tp$iternext();
		return val;
	});
	return s;
	
};