function getQueryParams(){
	var qs = location.search
	if (!qs){
		return {};
	}
	
	qs = qs.substring(1); //remove "?"
	
	var params = {};
	var pairs = qs.split("&");
	pairs.forEach(function(pair){
		var split = pair.split("=");
		var name = split[0];
		var value = (split.length == 1) ? "" : split[1];
		params[name] = value;
	});
	return params;
}

/*
Builds a string that contains the browser name and version.
from: http://stackoverflow.com/a/2401861/13379
*/
navigator.sayswho = (function(){
    var userAgent = navigator.userAgent;
    var M = userAgent.match(/(opera|chrome|safari|firefox|msie|edge|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        var temp =  /\brv[ :]+(\d+)/g.exec(userAgent) || [];
        return 'IE ' + (temp[1] || '');
    }

    if(M[1] === 'Chrome'){
        var temp = userAgent.match(/\b(OPR|Edge)\/(\d+)/);
        if(temp != null){
        	return temp.slice(1).join(' ').replace('OPR', 'Opera');
        }
    }

    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    var temp = userAgent.match(/version\/(\d+)/i);
    if(temp != null){
    	M.splice(1, 1, temp[1]);
    }
    return M.join(' ');
})();

/*
Determines whether the browser is IE or not.
*/
function isIE(){
	return navigator.sayswho.indexOf('IE') === 0 || navigator.sayswho.indexOf('MSIE') === 0;
}

/*
Determines whether the browser is Edge or not.
*/
function isEdge(){
	return navigator.sayswho.indexOf('Edge') === 0;
}

/*
In IE, the Backspace key is a keyboard shortcut for the "Back" button (as long as you are not focused inside of a textbox). This function disables this shortcut.
see: https://stackoverflow.com/q/32258403/13379
*/
function disableBackspaceNavigation() {
	window.onkeydown = function(e) {
		if (e.keyCode == 8 && !isTextBox(e.target)) {
			e.preventDefault();
		}
	}
}

/*
Determines if the given object is an HTML textbox (<input type="text" />)
see: https://stackoverflow.com/q/6444968/13379
*/
function isTextBox(element) {
	var tagName = element.tagName.toLowerCase();
	if (tagName !== "input") return false;

	var typeAttr = element.getAttribute('type').toLowerCase();
	return typeAttr === 'text';
}

/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  https://developer.mozilla.org/en-US/docs/DOM/document.cookie
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path], domain)
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/
var docCookies = {
	getItem: function (sKey) {
		return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
	},
	setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
		if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
		var sExpires = "";
		if (vEnd) {
			switch (vEnd.constructor) {
				case Number:
					sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
					break;
				case String:
					sExpires = "; expires=" + vEnd;
					break;
				case Date:
					sExpires = "; expires=" + vEnd.toUTCString();
					break;
			}
		}
		document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
		return true;
	},
	removeItem: function (sKey, sPath, sDomain) {
		if (!sKey || !this.hasItem(sKey)) { return false; }
		document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
		return true;
	},
	hasItem: function (sKey) {
		return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
	},
	keys: /* optional method: you can safely remove it! */ function () {
		var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
		for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
		return aKeys;
	}
};

function getKeyCode(e){
	if (document.layers){
		return e.which;
	}

	if (document.all){
		return event.keyCode;
	}

	return e.keyCode;
}

//add "String.trim()" method for IE
if(typeof String.prototype.trim !== 'function') {
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/g, ''); 
	}
}

//add "Array.forEach()" method for IE
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.com/#x15.4.4.18
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (callback, thisArg) {

    var T, k;

    if (this == null) {
      throw new TypeError(" this is null or not defined");
    }

    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== "function") {
      throw new TypeError(callback + " is not a function");
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (arguments.length > 1) {
      T = thisArg;
    }

    // 6. Let k be 0
    k = 0;

    // 7. Repeat, while k < len
    while (k < len) {

      var kValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[k];

        // ii. Call the Call internal method of callback with T as the this value and
        // argument list containing kValue, k, and O.
        callback.call(T, kValue, k, O);
      }
      // d. Increase k by 1.
      k++;
    }
    // 8. return undefined
  };
}

//gets an element by its "id" attribute
function $(id){
	var element = document.getElementById(id);
	if (!element){
		return null;
	}

	element.display = function(visible){
		if (typeof visible === "undefined"){
			return this.style.display == "block";
		}
		var value = visible ? "block" : "none";
		this.style.display = value;
	};
	element.visible = function(visible){
		if (typeof visible === "undefined"){
			return this.style.visibility == "visible";
		}
		var value = visible ? "visible" : "hidden";
		this.style.visibility = value;
	};
	return element;
}
