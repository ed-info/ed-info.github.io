// adapted from source: https://github.com/python/cpython/blob/2.7/Lib/colorsys.py
var $builtinmodule = function (name) {
    var s = {
	};

	var ONE_THIRD = 1.0/3.0;
	var ONE_SIXTH = 1.0/6.0;
	var TWO_THIRD = 2.0/3.0;


	// Convert the color from RGB coordinates to YIQ coordinates.
	s.rgb_to_yiq = new Sk.builtin.func(function(r, g, b) {
		Sk.builtin.pyCheckArgs("rgb_to_yiq", 3, 3);
		r = Sk.ffi.remapToJs(r);
		g = Sk.ffi.remapToJs(g);
		b = Sk.ffi.remapToJs(b);
		var y = 0.30*r + 0.59*g + 0.11*b;
	    var i = 0.60*r - 0.28*g - 0.32*b;
	    var q = 0.21*r - 0.52*g + 0.31*b;
	    return new Sk.builtin.tuple(Sk.ffi.remapToPy([y, i, q]));

	});

	// Convert the color from YIQ coordinates to RGB coordinates.
	s.yiq_to_rgb = new Sk.builtin.func(function(y, i, q) {
		Sk.builtin.pyCheckArgs("yiq_to_rgb", 3, 3);
		y = Sk.ffi.remapToJs(y);
		i = Sk.ffi.remapToJs(i);
		q = Sk.ffi.remapToJs(q);
		
		var r = y + 0.948262*i + 0.624013*q;
	    var g = y - 0.276066*i - 0.639810*q;
	    var b = y - 1.105450*i + 1.729860*q;
	    if (r < 0.0)
	        r = 0.0;
	    if (g < 0.0)
	        g = 0.0;
	    if (b < 0.0)
	        b = 0.0;
	    if (r > 1.0)
	        r = 1.0;
	    if (g > 1.0)
	        g = 1.0;
	    if (b > 1.0)
	        b = 1.0;
	    return new Sk.builtin.tuple(Sk.ffi.remapToPy([r, g, b]));
	});

	// Convert the color from RGB coordinates to HLS coordinates.
	s.rgb_to_hls = new Sk.builtin.func(function(r, g, b) {
		Sk.builtin.pyCheckArgs("rgb_to_hls", 3, 3);
		r = Sk.ffi.remapToJs(r);
		g = Sk.ffi.remapToJs(g);
		b = Sk.ffi.remapToJs(b);
		
		var maxc = Math.max(r, g, b);
	    var minc = Math.min(r, g, b);
	    
	    // XXX Can optimize (maxc+minc) and (maxc-minc)
	    var l = (minc+maxc)/2.0;
	    if (minc == maxc)
	    	new Sk.builtin.tuple(Sk.ffi.remapToPy([0, 1, 0]));
	    var s = (maxc-minc) / (2.0-maxc-minc);
	    if (l <= 0.5)
	        s = (maxc-minc) / (maxc+minc);
	        
	    var rc = (maxc-r) / (maxc-minc);
	    var gc = (maxc-g) / (maxc-minc);
	    var bc = (maxc-b) / (maxc-minc);
	    var h;
	    if(r == maxc) {
	        h = bc-gc;
	    }
	    else {
	    	if(g == maxc) {
	    		h = 2.0+rc-bc;
	    	} else {
	    		h = 4.0+gc-rc;	
	    	}
	    }
	    h = (h/6.0) % 1.0;

	    return new Sk.builtin.tuple(Sk.ffi.remapToPy([h, l, s]));
	});

	function _v(m1, m2, hue) {
	    hue = hue % 1.0;
	    if (hue < ONE_SIXTH)
	        return m1 + (m2-m1)*hue*6.0;
	    if (hue < 0.5)
	        return m2;
	    if (hue < TWO_THIRD)
	        return m1 + (m2-m1)*(TWO_THIRD-hue)*6.0;
	    return m1;
	}

	// Convert the color from HLS coordinates to RGB coordinates.
	s.hls_to_rgb = new Sk.builtin.func(function(h, l, s) {
		Sk.builtin.pyCheckArgs("hls_to_rgb", 3, 3);
		h = Sk.ffi.remapToJs(h);
		l = Sk.ffi.remapToJs(l);
		s = Sk.ffi.remapToJs(s);
		
		if (s == 0.0)
	        return new Sk.builtin.tuple(Sk.ffi.remapToPy([1, 1, 1]));
	    var m2;
	    if (l <= 0.5) {
	        m2 = l * (1.0+s);
	    } else {
	        m2 = l+s-(l*s);
	    }
	    var m1 = 2.0*l - m2;

	    return new Sk.builtin.tuple(Sk.ffi.remapToPy([_v(m1, m2, h+ONE_THIRD), _v(m1, m2, h), _v(m1, m2, h-ONE_THIRD)]));
	});

	// Convert the color from RGB coordinates to HSV coordinates.
	s.rgb_to_hsv = new Sk.builtin.func(function(r, g, b) {
		Sk.builtin.pyCheckArgs("rgb_to_hsv", 3, 3);
		r = Sk.ffi.remapToJs(r);
		g = Sk.ffi.remapToJs(g);
		b = Sk.ffi.remapToJs(b);
		
		var maxc = Math.max(r, g, b);
	    var minc = Math.min(r, g, b);
	    var v = maxc;
	    if (minc == maxc)
	        return new Sk.builtin.tuple(Sk.ffi.remapToPy([0, 0, v]));
	    var s = (maxc-minc) / maxc;
	    var rc = (maxc-r) / (maxc-minc);
	    var gc = (maxc-g) / (maxc-minc);
	    var bc = (maxc-b) / (maxc-minc);
	    var h;
	    if (r == maxc) {
	        h = bc-gc;
	    } else {
	    	if (g == maxc){
		        h = 2.0+rc-bc;
	    	} else {
		        h = 4.0+gc-rc;
		    }
	    }
	    
	    h = (h/6.0) % 1.0;

	    return new Sk.builtin.tuple(Sk.ffi.remapToPy([h, s, v]));
	});

	// Convert the color from HSV coordinates to RGB coordinates.
	s.hsv_to_rgb = new Sk.builtin.func(function(h, s, v) {
		Sk.builtin.pyCheckArgs("hsv_to_rgb", 3, 3);
		h = Sk.ffi.remapToJs(h);
		s = Sk.ffi.remapToJs(s);
		v = Sk.ffi.remapToJs(v);
		
		if (s == 0.0)
	        return new Sk.builtin.tuple(Sk.ffi.remapToPy([v, v, v]));
	    var i = Math.round(h*6.0);
	    var f = (h*6.0) - i;
	    var p = v*(1.0 - s);
	    var q = v*(1.0 - s*f);
	    var t = v*(1.0 - s*(1.0-f));
	    i = i%6;
	    if (i == 0)
	    	return new Sk.builtin.tuple(Sk.ffi.remapToPy([v, t, p]));
	    if (i == 1)
	        return new Sk.builtin.tuple(Sk.ffi.remapToPy([q, v, p]));
	    if (i == 2)
	        return new Sk.builtin.tuple(Sk.ffi.remapToPy([p, v, t]));
	    if (i == 3)
	        return new Sk.builtin.tuple(Sk.ffi.remapToPy([p, q, v]));
	    if (i == 4)
	        return new Sk.builtin.tuple(Sk.ffi.remapToPy([t, p, v]));
	    
	    return new Sk.builtin.tuple(Sk.ffi.remapToPy([v, p, q]));
	});


	return s;
	
};