/* 
 Matplotlib module for Skulpt, use Chart.js
*/

var $builtinmodule = function(name) {
	
	
	var xdata = []; // actually x and y data may contain multiple lines
	var ydata = [];
	var stylestring =[];
	var scatterData =[];
	var xValues = xdata[0];
	var yValues = ydata[0];
	var gridXview = true;
	var gridYview = true;
	var barColors = ["red", "green","blue","orange","brown"];
	var chart_title = "";
	var borderColor ="black"; // chart line color
	var linewidth = 1;      // chart line width
	var charts_type ="line";
	var label ="";
	var marker =false;
	var markerSize = 1;
	var lineDash = [];
	function $chart() {
				this.label = ""; 
				this.data = yValues; 				// дані осі OY
				this.backgroundColor = barColors;	// заповнення маркерів або стовпчиків
				this.borderColor = borderColor;	// колір лінії
				this.borderWidth = linewidth;		// ширина лінії
				this.borderDash = lineDash;		// штрихована лінія
				this.fill = false;				// заповнення під лінією
				this.pointStyle = marker;      	// стиль маркера
				this.pointRadius = markerSize; 	// розмір маркера
				this.tension = 0.0				// згладжування				
				
				}
	const Charts =[];   // data for all charts
	var chartsNum = 0; // num of charts 
	
  var mod = {};
  var chart;
  var canvas;
  var xLabelView = false;
  var xLabel = "";
  var yLabelView = false;
  var yLabel = "";
 
  var CLASS_NDARRAY = "numpy.ndarray"; // maybe make identifier accessible in numpy module
 
  var create_chart = function() {
    /* test if Canvas ist available should be moved to create_chart function */
    if (Sk.canvas === undefined) {
      throw new Sk.builtin.NameError(
        "Can not resolve drawing area. Sk.canvas is undefined!");
    }

    if ($('#' + Sk.canvas).length === 0) {
      throw new Sk.builtin.OperationError("No canvas found (internal error)");
    }

    if (!chart) {
      $('#' + Sk.canvas).empty();
     
      chart = !chart
    }
  };
// ------------------------------------------------------------------
 function unpackKWA(kwa) {
		result = {};

		for(var i = 0; i < kwa.length; i+=2) {
			var key = Sk.ffi.remapToJs(kwa[i]);
			console.log("key=",key);
			var val = kwa[i+1];
			console.log("val=",val);
			result[key] = val;
		}
		return result;
 }
// Style setup ***********************************************
function styleSetup(kwa) {
	function markerStyle(mark){			
		if (!mark) return "circle";
		switch (mark) {
			case '.':
				return false;
			case ',':
				return false;
			case 'o':
				return "circle";
			case 'v':
				return "triangle";
			case '^':
				return "triangle";
			case '<':
				return "triangle";
			case '>':
				return "triangle";
			case '1':
				return "circle";
			case '2':
				return "circle";
			case '3':
				return "circle";
			case '4':
				return "circle";
			case 's':
				return "rect";
			case 'p':
				return "rect";
			case '*':
				return "star";
			case 'h':
				return "rectRounded";
			case 'H':
				return "rectRounded";
			case '+':
				return "cross";
			case 'x':
				return "crossRot";
			case 'D':
				return "rectRot";
			case 'd':
				return "rectRot";
			case '|':
				return "dash";
			case '_':
				return "line";
			default:
				return false;
			}
	}
	
	function lineStyle(dash) {
		if (dash==='-') return [] // draw_solid
		if ((dash==='--')||(dash==='dashed')) return [10,10] // draw_dashed'
		if (dash==='-.') return [2,10,2] //draw_dash_dot
		if ((dash===':')||(dash==='dotted')) return [2,10]  // draw_dotted
		if (dash===' ')  return [] // no draw
    }

	self.props = unpackKWA(kwa);
	console.log("Props=",self.props);
		if (self.props.color) {
		borderColor=Sk.ffi.remapToJs(props.color);
		console.log("color=",borderColor);
		}
	if (self.props.linewidth) {
		linewidth=Sk.ffi.remapToJs(props.linewidth);
		console.log("linewidth=",linewidth);
		}
	if (self.props.marker) {
		markerSize = 5;
		mark=Sk.ffi.remapToJs(props.marker);
		marker = markerStyle(mark);
		console.log("marker=",marker);
		}	
	if (self.props.linestyle) {
		linest=Sk.ffi.remapToJs(props.linestyle);
		lineDash=lineStyle(linest)
		console.log("linestyle=",lineDash); 			
		}
	if (self.props.ls) {
		linest=Sk.ffi.remapToJs(props.ls);
		lineDash=lineStyle(linest)
		console.log("linestyle=",lineDash); 			
		}
	if (self.props.markersize) {
		markerSize=Sk.ffi.remapToJs(props.markersize);
		console.log("markerSize=",markerSize); 			
		}	
	
}
// 
function GetParam(kwa,args) {
	
	styleSetup(kwa);
	kwargs = new Sk.builtins.dict(kwa); // is pretty useless for handling kwargs
    kwargs = Sk.ffi.remapToJs(kwargs); // create a proper dict
	console.log("KWA=",kwa);
	
    var i = 0;
    var xdata_not_ydata_flag = true;
    var slice = new Sk.builtin.slice(0, undefined, 1); // getting complete first dimension of ndarray

    for (i = 0; i < args.length; i++) {
	
      if (args[i] instanceof Sk.builtin.list || Sk.abstr.typeName(args[i]) === CLASS_NDARRAY || Sk.abstr.typeName(args[i])==='range') {
        // special treatment for ndarrays, though we allow basic lists too
        var _unpacked;
        if(Sk.abstr.typeName(args[i]) === CLASS_NDARRAY) {
          // we get the first dimension, no 2-dim data
          _unpacked = Sk.ffi.unwrapn(args[i]);
          var first_dim_size = 0;
          if(_unpacked && _unpacked.shape && _unpacked.shape[0]){
            first_dim_size = _unpacked.shape[0];
          } else {
            throw new Sk.builtin.ValueError('args contain "' + CLASS_NDARRAY + '" without elements or malformed shape.');
          }
          _unpacked = _unpacked.buffer.slice(0, first_dim_size); // buffer array of first dimension
          _unpacked = _unpacked.map(function(x) { return Sk.ffi.remapToJs(x);})
        } else {
          _unpacked = Sk.ffi.remapToJs(args[i]); // basic list
          console.log("unpacked=",_unpacked);
        }

        // unwraps x and y, but no 2-dim-data
        if (xdata_not_ydata_flag) {
          xdata.push(_unpacked);
          xdata_not_ydata_flag = false;
        } else {
          ydata.push(_unpacked);
          xdata_not_ydata_flag = true;
        }
      } else if (Sk.builtin.checkString(args[i])) {
        stylestring.push(Sk.ffi.remapToJs(args[i]));
      } else if (Sk.builtin.checkNumber(args[i])) {
          _unpacked = Sk.ffi.remapToJs(args[i]);
          var tempArray = [];
          tempArray.push(_unpacked);
          /**
           * Why do we need to push an single item array?
           *
           * Each Line is represented as an array of x values and an array of y values
           * so just calling plot with (x, y, fmt) would result in Line2D([x], [y], fmt)
           */
          if (xdata_not_ydata_flag) {
            xdata.push(tempArray);
            xdata_not_ydata_flag = false;
          } else {
            ydata.push(tempArray);
            xdata_not_ydata_flag = true;
          }
      } else {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(args[i]) +
          "' is not supported for *args[" + i + "].");
      }
    }
    
    /* handle special cases
      only supplied y
      only supplied 1 array and stylestring
    */
    if ((args.length === 1) || (args.length === 2 && (xdata.length === 1 &&
      ydata.length === 0))) {
      // only y supplied
      
      xdata.forEach(function(element) {
        ydata.push(element);
      });
      
      xdata[0] = [];
      var ly=ydata[0].length;
      
      for (let i=0;i<ly;i++) {
	  xdata[0].push(i);
	  }
	  
    }
        console.log(">>xData=",xdata[0]); 
    console.log(">>yData=",ydata[0]);
	return
}

// plot **********************************************
  var plot = function(kwa) {
	
//
    Sk.builtin.pyCheckArgs("plotk", arguments, 1, Infinity, true, false);
    args = Array.prototype.slice.call(arguments, 1);
    GetParam(kwa,args);
	
 	charts_type ="line";
 	chart$ = new $chart();
				chart$.label = ""; 
				chart$.data = ydata[chartsNum]; 				// дані осі OY
				chart$.backgroundColor = barColors;	// заповнення маркерів або стовпчиків
				chart$.borderColor = borderColor;	// колір лінії
				chart$.borderWidth = linewidth;		// ширина лінії
				chart$.borderDash = lineDash;		// штрихована лінія
				chart$.fill = false;				// заповнення під лінією
				chart$.pointStyle = marker;      	// стиль маркера
				chart$.pointRadius = markerSize; 	// розмір маркера
				chart$.tension = 0.0;				// згладжування		
		Charts[chartsNum] = chart$;
		chartsNum++;		
	    var result = [];
    return new Sk.builtins.tuple(result);
  };
plot.co_kwargs = true;
mod.plot = new Sk.builtin.func(plot);


// bar  **********************************************
  var bar = function(kwa) {

//
    Sk.builtin.pyCheckArgs("plotk", arguments, 1, Infinity, true, false);
    args = Array.prototype.slice.call(arguments, 1);
    GetParam(kwa,args);
    console.log("bar:");
 //   plot.update(kwargs);
	charts_type ="bar";
 	chart$ = new $chart();
				chart$.label = ""; 
				chart$.data = ydata[chartsNum]; 	// дані осі OY
				chart$.backgroundColor = barColors;	// заповнення маркерів або стовпчиків
				chart$.borderColor = borderColor;	// колір лінії
				chart$.borderWidth = linewidth;		// ширина лінії
				chart$.borderDash = lineDash;		// штрихована лінія
				chart$.fill = false;				// заповнення під лінією
				chart$.pointStyle = marker;      	// стиль маркера
				chart$.pointRadius = markerSize; 	// розмір маркера
				chart$.tension = 0.0;				// згладжування		
		Charts[chartsNum] = chart$;
		chartsNum++;		
    var result = [];
    return new Sk.builtins.tuple(result);
  };
bar.co_kwargs = true;
mod.bar = new Sk.builtin.func(bar);

// barh **********************************************
  var barh = function(kwa) {

//
    Sk.builtin.pyCheckArgs("plotk", arguments, 1, Infinity, true, false);
    args = Array.prototype.slice.call(arguments, 1);
    GetParam(kwa,args);
 //   plot.update(kwargs);
	charts_type ="horizontalBar";
	 	chart$ = new $chart();
				chart$.label = ""; 
				chart$.data = ydata[chartsNum]; 	// дані осі OY
				chart$.backgroundColor = barColors;	// заповнення маркерів або стовпчиків
				chart$.borderColor = borderColor;	// колір лінії
				chart$.borderWidth = linewidth;		// ширина лінії
				chart$.borderDash = lineDash;		// штрихована лінія
				chart$.fill = false;				// заповнення під лінією
				chart$.pointStyle = marker;      	// стиль маркера
				chart$.pointRadius = markerSize; 	// розмір маркера
				chart$.tension = 0.0;				// згладжування		
		Charts[chartsNum] = chart$;
		chartsNum++;	
    var result = [];
    return new Sk.builtins.tuple(result);
  };
barh.co_kwargs = true;
mod.barh = new Sk.builtin.func(barh);

// scatter **********************************************
  var scatter = function(kwa) {
//
   function toScatter(x,y){
		return {x:x,
			y:y}
		}
    Sk.builtin.pyCheckArgs("plotk", arguments, 1, Infinity, true, false);
    args = Array.prototype.slice.call(arguments, 1);
    GetParam(kwa,args);

	for(let i=0;i<ydata[chartsNum].length;i++){
		scatterData[i]=toScatter(xdata[chartsNum][i],ydata[chartsNum][i])
		}

	console.log("scatterData=",scatterData)

	charts_type ="scatter";
	 	chart$ = new $chart();
				chart$.label = ""; 
				chart$.data = scatterData; 	// дані осі OY
				chart$.backgroundColor = barColors;	// заповнення маркерів або стовпчиків
				chart$.borderColor = borderColor;	// колір лінії
				chart$.borderWidth = linewidth;		// ширина лінії
				chart$.borderDash = lineDash;		// штрихована лінія
				chart$.fill = false;				// заповнення під лінією
				chart$.pointStyle = marker;      	// стиль маркера
				chart$.pointRadius = markerSize; 	// розмір маркера
				chart$.tension = 0.0;				// згладжування	
				 	
		Charts[chartsNum] = chart$;
		chartsNum++;	
    var result = [];
    console.log(">>scatterData=",chart$.data);
    
    return new Sk.builtins.tuple(result);
  };
scatter.co_kwargs = true;
mod.scatter = new Sk.builtin.func(scatter);

// pie **********************************************
  var pie = function(kwa) {

//
    Sk.builtin.pyCheckArgs("plotk", arguments, 1, Infinity, true, false);
    args = Array.prototype.slice.call(arguments, 1);
    GetParam(kwa,args);

	charts_type ="pie";
	xLabelView=false;
	yLabelView=false;
	 	chart$ = new $chart();
				chart$.label = ""; 
				chart$.data = ydata[chartsNum]; 	// дані осі OY
				chart$.backgroundColor = barColors;	// заповнення маркерів або стовпчиків
				chart$.borderColor = borderColor;	// колір лінії
				chart$.borderWidth = linewidth;		// ширина лінії
				chart$.borderDash = lineDash;		// штрихована лінія
				chart$.fill = false;				// заповнення під лінією
				chart$.pointStyle = marker;      	// стиль маркера
				chart$.pointRadius = markerSize; 	// розмір маркера
				chart$.tension = 0.0;				// згладжування		
		Charts[chartsNum] = chart$;
		chartsNum++;	
    var result = [];
    return new Sk.builtins.tuple(result);
  };
pie.co_kwargs = true;
mod.pie = new Sk.builtin.func(pie);
   
// Show charts by type ------------------------
mod.show = new Sk.builtin.func(function() {
	
	var xValues = xdata[0];
	
	// JS - Destroy exiting Chart Instance to reuse <canvas> element
	let chartStatus = Chart.getChart("myChart"); // <canvas> id
	if (chartStatus != undefined) {
		chartStatus.destroy();
	}
	//-- End of chart destroy   
	
	var chartCanvas = $('#myChart'); //<canvas> id
	var $div_canvas =  $('#' + Sk.canvas);
    $div_canvas.show();

	var yAxis = true;
	var xAxis = true;
	if (charts_type==="pie"){
		yAxis = false;
		xAxis = false;
	}
	$indexAxis="x";
    var xbz = { 			 display:xAxis,
							 beginAtZero: false,
							 title: {
									display: xLabelView,
									text: xLabel,
									font: { size: 16 } 
									},
							grid: 	{
									display: gridXview,
									drawOnChartArea: true,
									drawTicks: true,
									}			
							}
    var bAzero = false;
    if (charts_type==="hist"){
        bAzero = true;
        charts_type="bar"
    }
	if (charts_type==="horizontalBar"){
		$indexAxis="y";
		charts_type="bar";
	}
	myDataSets = Charts;
	if (charts_type==="scatter"){
			myDataSets = [{
						label: "",
						backgroundColor: barColors,
						data:Charts[0].data
						}]
		}

	new Chart(myChart, {
		type: charts_type,
		data : 
		{
					labels: xdata[0],
					datasets: myDataSets
							
		}, 
		options: 
		{ 
			indexAxis: $indexAxis,
			scales: {
						y: {
							 display:yAxis,
							 beginAtZero: bAzero,
							 title: {
									display: yLabelView,
									text: yLabel,
									font: { size: 16 } 
									},
							grid: 	{
									display: gridYview,
									drawOnChartArea: true,
									drawTicks: true,
									}		
							},
						x: {
							 display:xAxis,
							 beginAtZero: false,
							 title: {
									display: xLabelView,
									text: xLabel,
									font: { size: 16 } 
									},
							grid: 	{
									display: gridXview,
									drawOnChartArea: true,
									drawTicks: true,
									}			
							}	
			}, 
		    responsive: true,
			plugins: {
				legend: {
					display: false,
				},
				title: {
					display: true,
					text: chart_title ,
					font: { size: 16 } 
				}
			},
			layout: {
				padding: 30
			}
		}
	 
	});
	console.log('end show');
 });
// ----------------------------------------------------------
var title_f = function(label, fontdict, loc) {
    Sk.builtin.pyCheckArgs("title", arguments, 1, 3);

    if (!Sk.builtin.checkString(label)) {
      throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(label) +
        "' is not supported for title.");
    }

    var label_unwrap = Sk.ffi.remapToJs(label);
    chart_title=label_unwrap;
	console.log("Title=", label_unwrap) 

    return new Sk.builtin.str(label_unwrap);
  };

  title_f.co_varnames = ['label', 'fontdict', 'loc', ];
  title_f.$defaults = [null, Sk.builtin.none.none$, Sk.builtin.none.none$,
    Sk.builtin.none.none$
  ];
mod.title = new Sk.builtin.func(title_f);
  
// ---------------------------------------------------------------------------
var axis_f = function(label, fontdict, loc) {
    Sk.builtin.pyCheckArgs("axis", arguments, 0, 3);

    // when called without any arguments it should return the current axis limits
    // >>> axis(v)
    // sets the min and max of the x and y axes, with
    // ``v = [xmin, xmax, ymin, ymax]``.::
    //The xmin, xmax, ymin, ymax tuple is returned
    var res;

    return Sk.ffi.remapToPy([]);
  };

  axis_f.co_varnames = ['label', 'fontdict', 'loc', ];
  axis_f.$defaults = [null, Sk.builtin.none.none$, Sk.builtin.none.none$,
    Sk.builtin.none.none$
  ];
mod.axis = new Sk.builtin.func(axis_f);
// --------------------------------------------------------------------
var xlabel_f = function(s, fontdict, loc) {
  
    xLabelView=false;
	console.log("xLabel= ",s.v)
	if (s.v!=""){
		xLabel= s.v;
		xLabelView=true;
	}
	
  };

  xlabel_f.co_varnames = ['s', 'fontdict', 'loc','color', ];
  xlabel_f.$defaults = [null, Sk.builtin.none.none$, Sk.builtin.none.none$,  Sk.builtin.none.none$,
    Sk.builtin.none.none$
  ];
mod.xlabel = new Sk.builtin.func(xlabel_f);



var ylabel_f = function(s, fontdict, loc) {
  
    yLabelView=false;
	console.log("yLabel= ",s.v)
	if (s.v!=""){
		yLabel= s.v;
		yLabelView=true;
	}
  };

  ylabel_f.co_varnames = ['s', 'fontdict', 'loc', 'color',];
  ylabel_f.$defaults = [null, Sk.builtin.none.none$, Sk.builtin.none.none$,  Sk.builtin.none.none$,
    Sk.builtin.none.none$
  ];
mod.ylabel = new Sk.builtin.func(ylabel_f);
// --------------------------------------------
var grid = function(s) {
	console.log("gridXview:",gridXview);
	console.log("gridYview:",gridYview);
	console.log("grid:",s.v);
	console.log("grid<>:",(s.v===0));
 	if (s.v===1){
		gridYview=true;
		gridXview=true;
	}
	if (s.v===0){
		gridYview=false;
		gridXview=false;
	}
  };

  grid.co_varnames = ['s', 'fontdict', 'loc', ];
  grid.$defaults = [null, Sk.builtin.none.none$, Sk.builtin.none.none$,
    Sk.builtin.none.none$
  ];
mod.grid = new Sk.builtin.func(grid);
// Clear the current figure ------------------------------------------------------
  var clf_f = function() {
    // clear all
    chart = null;
 
    if (Sk.canvas !== undefined) {
      $('#' + Sk.canvas).empty();
    }
  };

  mod.clf = new Sk.builtin.func(clf_f);
//


  
  
// ---------------------------------------------------------------------
  /* list of not implemented methods */
  mod.findobj = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "findobj is not yet implemented");
  });
  mod.switch_backend = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "switch_backend is not yet implemented");
  });
  mod.isinteractive = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "isinteractive is not yet implemented");
  });
  mod.ioff = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "ioff is not yet implemented");
  });
  mod.ion = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("ion is not yet implemented");
  });
  mod.pause = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "pause is not yet implemented");
  });
  mod.rc = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("rc is not yet implemented");
  });
  mod.rc_context = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "rc_context is not yet implemented");
  });
  mod.rcdefaults = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "rcdefaults is not yet implemented");
  });
  mod.gci = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("gci is not yet implemented");
  });
  mod.sci = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("sci is not yet implemented");
  });
  mod.xkcd = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "xkcd is not yet implemented");
  });
  mod.figure = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "figure is not yet implemented");
  });
  mod.gcf = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("gcf is not yet implemented");
  });
  mod.get_fignums = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "get_fignums is not yet implemented");
  });
  mod.get_figlabels = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "get_figlabels is not yet implemented");
  });
  mod.get_current_fig_manager = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "get_current_fig_manager is not yet implemented");
  });
  mod.connect = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "connect is not yet implemented");
  });
  mod.disconnect = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "disconnect is not yet implemented");
  });
  mod.close = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "close is not yet implemented");
  });
  mod.savefig = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "savefig is not yet implemented");
  });
  mod.ginput = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "ginput is not yet implemented");
  });
  mod.waitforbuttonpress = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "waitforbuttonpress is not yet implemented");
  });
  mod.figtext = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "figtext is not yet implemented");
  });
  mod.suptitle = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "suptitle is not yet implemented");
  });
  mod.figimage = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "figimage is not yet implemented");
  });
  mod.figlegend = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "figlegend is not yet implemented");
  });
  mod.hold = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "hold is not yet implemented");
  });
  mod.ishold = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "ishold is not yet implemented");
  });
  mod.over = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "over is not yet implemented");
  });
  mod.delaxes = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "delaxes is not yet implemented");
  });
  mod.sca = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("sca is not yet implemented");
  });
  mod.gca = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("gca is not yet implemented");
  });
  mod.subplot = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "subplot is not yet implemented");
  });
  mod.subplots = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "subplots is not yet implemented");
  });
  mod.subplot2grid = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "subplot2grid is not yet implemented");
  });
  mod.twinx = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "twinx is not yet implemented");
  });
  mod.twiny = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "twiny is not yet implemented");
  });
  mod.subplots_adjust = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "subplots_adjust is not yet implemented");
  });
  mod.subplot_tool = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "subplot_tool is not yet implemented");
  });
  mod.tight_layout = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "tight_layout is not yet implemented");
  });
  mod.box = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("box is not yet implemented");
  });
  mod.xlim = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "xlim is not yet implemented");
  });
  mod.ylim = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "ylim is not yet implemented");
  });
  mod.xscale = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "xscale is not yet implemented");
  });
  mod.yscale = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "yscale is not yet implemented");
  });
  mod.xticks = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "xticks is not yet implemented");
  });
  mod.yticks = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "yticks is not yet implemented");
  });
  mod.minorticks_on = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "minorticks_on is not yet implemented");
  });
  mod.minorticks_off = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "minorticks_off is not yet implemented");
  });
  mod.rgrids = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "rgrids is not yet implemented");
  });
  mod.thetagrids = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "thetagrids is not yet implemented");
  });
  mod.plotting = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "plotting is not yet implemented");
  });
  mod.get_plot_commands = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "get_plot_commands is not yet implemented");
  });
  mod.colors = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "colors is not yet implemented");
  });
  mod.colormaps = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "colormaps is not yet implemented");
  });
  mod._setup_pyplot_info_docstrings = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "_setup_pyplot_info_docstrings is not yet implemented");
  });
  mod.colorbar = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "colorbar is not yet implemented");
  });
  mod.clim = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "clim is not yet implemented");
  });
  mod.set_cmap = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "set_cmap is not yet implemented");
  });
  mod.imread = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "imread is not yet implemented");
  });
  mod.imsave = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "imsave is not yet implemented");
  });
  mod.matshow = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "matshow is not yet implemented");
  });
  mod.polar = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "polar is not yet implemented");
  });
  mod.plotfile = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "plotfile is not yet implemented");
  });
  mod._autogen_docstring = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "_autogen_docstring is not yet implemented");
  });
  mod.acorr = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "acorr is not yet implemented");
  });
  mod.arrow = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "arrow is not yet implemented");
  });
  mod.axhline = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "axhline is not yet implemented");
  });
  mod.axhspan = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "axhspan is not yet implemented");
  });
  mod.axvline = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "axvline is not yet implemented");
  });
  mod.axvspan = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "axvspan is not yet implemented");
  });

  mod.broken_barh = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "broken_barh is not yet implemented");
  });
  mod.boxplot = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "boxplot is not yet implemented");
  });
  mod.cohere = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "cohere is not yet implemented");
  });
  mod.clabel = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "clabel is not yet implemented");
  });
  mod.contour = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "contour is not yet implemented");
  });
  mod.contourf = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "contourf is not yet implemented");
  });
  mod.csd = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("csd is not yet implemented");
  });
  mod.errorbar = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "errorbar is not yet implemented");
  });
  mod.eventplot = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "eventplot is not yet implemented");
  });
  mod.fill = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "fill is not yet implemented");
  });
  mod.fill_between = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "fill_between is not yet implemented");
  });
  mod.fill_betweenx = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "fill_betweenx is not yet implemented");
  });
  mod.hexbin = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "hexbin is not yet implemented");
  });
  //
  // hist **********************************************
var hist = function(kwa) {
    Sk.builtin.pyCheckArgs("hist", arguments, 1, Infinity, true, false);
    args = Array.prototype.slice.call(arguments, 1);

    // Отримуємо дані (тільки y, бо це гістограма)
    GetParam(kwa, args);
    console.log("hist input ydata =", ydata[chartsNum]);

    var data = ydata[chartsNum];
    
    // Параметри гістограми: bins (кількість відер)
    let kwargs = Sk.ffi.remapToJs(new Sk.builtins.dict(kwa));
    let bins = kwargs.bins || 10; // за замовчуванням 10
    if (typeof bins !== 'number') {
        bins = Sk.ffi.remapToJs(bins);
    }

    // Обчислення гістограми
    let min = Math.min(...data);
    let max = Math.max(...data);
    let binSize = (max - min) / bins;

    let binEdges = [];
    let counts = new Array(bins).fill(0);

    for (let i = 0; i <= bins; i++) {
        binEdges.push(min + i * binSize);
    }

    data.forEach(val => {
        let index = Math.floor((val - min) / binSize);
        if (index === bins) index = bins - 1; // включаємо max у останній бін
        counts[index]++;
    });

    // Підготовка даних
    let binLabels = [];
    for (let i = 0; i < bins; i++) {
        let left = binEdges[i].toFixed(2);
        let right = binEdges[i + 1].toFixed(2);
        binLabels.push(`${left}–${right}`);
    }

    xdata[chartsNum] = binLabels;
    ydata[chartsNum] = counts;

    charts_type = "hist";
    chart$ = new $chart();
    chart$.label = "Histogram";
    // Уникаємо невидимих стовпців
    let visibleCounts = counts.map(c => (c === 0 ? 0.5 : c));
    chart$.data = visibleCounts;    
    chart$.backgroundColor = barColors;
    chart$.borderColor = borderColor;
    chart$.borderWidth = linewidth;
    chart$.borderDash = lineDash;
    chart$.fill = false;
    chart$.pointStyle = marker;
    chart$.pointRadius = markerSize;
    chart$.tension = 0.0;

    chart$.barPercentage = 1.0;
    chart$.categoryPercentage = 1.0;

    Charts[chartsNum] = chart$;
    chartsNum++;

    var result = [];
    return new Sk.builtins.tuple(result);
};
hist.co_kwargs = true;
mod.hist = new Sk.builtin.func(hist);

  /*
  mod.hist = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "hist is not yet implemented");
  });
  */
  mod.hist2d = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "hist2d is not yet implemented");
  });
  mod.hlines = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "hlines is not yet implemented");
  });
  mod.loglog = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "loglog is not yet implemented");
  });
  mod.magnitude_spectrum = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "magnitude_spectrum is not yet implemented");
  });
  mod.pcolor = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "pcolor is not yet implemented");
  });
  mod.pcolormesh = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "pcolormesh is not yet implemented");
  });
  mod.phase_spectrum = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "phase_spectrum is not yet implemented");
  });

  mod.plot_date = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "plot_date is not yet implemented");
  });
  mod.psd = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("psd is not yet implemented");
  });
  mod.quiver = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "quiver is not yet implemented");
  });
  mod.quiverkey = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "quiverkey is not yet implemented");
  });
  mod.semilogx = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "semilogx is not yet implemented");
  });
  mod.semilogy = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "semilogy is not yet implemented");
  });
  mod.specgram = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "specgram is not yet implemented");
  });
  mod.stackplot = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "stackplot is not yet implemented");
  });
  mod.stem = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "stem is not yet implemented");
  });
  mod.step = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "step is not yet implemented");
  });
  mod.streamplot = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "streamplot is not yet implemented");
  });
  mod.tricontour = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "tricontour is not yet implemented");
  });
  mod.tricontourf = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "tricontourf is not yet implemented");
  });
  mod.tripcolor = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "tripcolor is not yet implemented");
  });
  mod.triplot = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "triplot is not yet implemented");
  });
  mod.vlines = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "vlines is not yet implemented");
  });
  mod.xcorr = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "xcorr is not yet implemented");
  });
  mod.barbs = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "barbs is not yet implemented");
  });
  mod.cla = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("cla is not yet implemented");
  });
  mod.legend = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "legend is not yet implemented");
  });
  mod.table = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "table is not yet implemented");
  });
  mod.text = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "text is not yet implemented");
  });
  mod.annotate = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "annotate is not yet implemented");
  });
  mod.ticklabel_format = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "ticklabel_format is not yet implemented");
  });
  mod.locator_params = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "locator_params is not yet implemented");
  });
  mod.tick_params = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "tick_params is not yet implemented");
  });
  mod.margins = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "margins is not yet implemented");
  });
  mod.autoscale = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "autoscale is not yet implemented");
  });
  mod.autumn = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "autumn is not yet implemented");
  });
  mod.cool = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "cool is not yet implemented");
  });
  mod.copper = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "copper is not yet implemented");
  });
  mod.flag = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "flag is not yet implemented");
  });
  mod.gray = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "gray is not yet implemented");
  });
  mod.hot = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("hot is not yet implemented");
  });
  mod.hsv = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("hsv is not yet implemented");
  });
  mod.jet = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError("jet is not yet implemented");
  });
  mod.pink = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "pink is not yet implemented");
  });
  mod.prism = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "prism is not yet implemented");
  });
  mod.spring = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "spring is not yet implemented");
  });
  mod.summer = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "summer is not yet implemented");
  });
  mod.winter = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "winter is not yet implemented");
  });
  mod.spectral = new Sk.builtin.func(function() {
    throw new Sk.builtin.NotImplementedError(
      "spectral is not yet implemented");
  });

  return mod;
};
