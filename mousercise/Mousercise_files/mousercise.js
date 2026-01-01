var currentStageIndex = -1;
var currentStage = null;
var stages = [];

disableBackspaceNavigation();

//navigates to the stage specified in the "hash" part of the URL
function gotoStageFromHash() {
	var stageIndex = 0;
	var hash = window.location.hash;
	if (hash){
		stageIndex = parseInt(hash.substring(1));
		if (isNaN(stageIndex)){
			stageIndex = 0;
		}
	}
	gotoStage(stageIndex);
}

//navigates to a specific stage
function gotoStage(stageIndex) {
	if (typeof stageIndex === "string") {
		var id = stageIndex;
		stageIndex = 0;
		for (var i = 0; i < stages.length; i++){
			if (stages[i].element.id == id) {
				stageIndex = i;
				break;
			}
		}
	} else {
		if (stageIndex < 0 || stageIndex > stages.length) {
			stageIndex = 0;
		}
	}

	if (currentStage != null) {
		currentStage.onEnd();
		currentStage.element.style.display = "none";
	}

	var stage = stages[stageIndex];
	stage.element.style.display = "block";
	stage.onLoad();

	//reset the scroll position for those stages where the user has to scroll
	window.scrollTo(0, 0);

	window.location.hash = "#" + stageIndex;
	$("stageSelection").selectedIndex = stageIndex;
	currentStageIndex = stageIndex;
	currentStage = stage;
}

function bodyLoaded() {
	//initialize all of the stages
	var children = $("stages").children;
	for (var i = 0; i < children.length; i++) {
		var child = children[i];

		if (child.tagName != "DIV" || child.id == "") {
			continue;
		}

		child.style.display = "none";

		var stage = (typeof child.methods === "undefined") ? {} : child.methods;
		stage.element = child;

		/*
		 * This method gets a DOM element by its "name" attribute.
		 * This method only searches the child elements of the stage's <div> element.
		 * "name" attributes are used instead of "id" attributes because "id" attributes must be globally unique.
		 */
		stage.getElement = function(name) {
			var element = document.querySelector("#" + this.element.id + " [name='" + name + "']");
			if (!element) {
				return null;
			}

			element.display = function(visible) {
				if (typeof visible === "undefined") {
					return this.style.display == "block";
				}
				var value = visible ? "block" : "none";
				this.style.display = value;
			};
			element.visible = function(visible) {
				if (typeof visible === "undefined") {
					return this.style.visibility == "visible";
				}
				var value = visible ? "visible" : "hidden";
				this.style.visibility = value;
			};
			return element;
		};

		createStub(stage, "onLoad");
		createStub(stage, "onNext");
		createStub(stage, "onEnd");

		stages.push(stage);
	}
	$("stages").display(true);

	//populate the debug navigation dropdown list
	var selection = $("stageSelection");
	for (var i = 0; i < stages.length; i++) {
		selection.options.add(new Option(stages[i].element.id, i));
	}

	//display the debug controls
	$("debug").visible(storage.showDebug());

	//preload the images
	preload(
		function(cur, total){
			$("loading-progress").innerHTML = Math.round(cur / total * 100) + "%";
		},
		function() {
			$("loading").display(false);
			window.onhashchange = gotoStageFromHash;
			gotoStageFromHash();
		}
	);
}

function createStub(object, methodName) {
	if (typeof object[methodName] === "undefined") {
		object[methodName] = function(){};
	}
}

//returns the parent of the <script> element that this function was invoked from.
function scriptParent() {
	var scriptTags = document.getElementsByTagName("script");
	var scriptTag = scriptTags[scriptTags.length - 1];
	return scriptTag.parentNode;
}

/*
 * Assigns Javascript code to the current stage.
 * Must be called inside of the stage's <div> element.
 */
function stageCode(object) {
	var div = scriptParent();
	div.methods = object;
}

//goes to the next stage
function next() {
	var nextStageIndex = currentStageIndex+1;
	if (nextStageIndex >= stages.length) {
		alert("This is the last stage.");
		return;
	}

	var proceed = currentStage.onNext();
	if (proceed === false) {
		return;
	}
	
	gotoStage(nextStageIndex);
}

//goes to the previous stage
function previous() {
	var prevStageIndex = currentStageIndex-1;
	if (prevStageIndex < 0){
		alert("This is the first stage.");
		return;
	}

	gotoStage(prevStageIndex);
}

//restarts the mousercise
function restart() {
	gotoStage(0);

	//refresh the whole page so that each stage gets reset to their initial state
	//do a hard refresh to force all the form fields to reset as well
	location.reload(true);
}

//this object is used to get/set data that is used across multiple pages
var storage = (function(){
	//don't use HTML 5 storage with IE or Edge because it doesn't work when running locally
	//don't use cookie storage with Chrome because it doesn't work when running locally
	var storage = (isIE() || isEdge()) ? docCookies : sessionStorage;
	
	return {
		showDebug: function(value){
			if (typeof value === "undefined"){
				var show = storage.getItem("showDebug");
				return !show ? false : ("true" == show);
			}
			
			storage.setItem("showDebug", value);
		},
		
		startTime: function(value){
			if (typeof value === "undefined"){
				return storage.getItem("startTime");
			}
			storage.setItem("startTime", value);
		},
		
		getItem: function(key){
			return storage.getItem(key);
		},
		
		setItem: function(key, value){
			storage.setItem(key, value);
		}
	};
}());

//toggles the visiblity of the debug menu
function toggleDebug(){
	var show = !storage.showDebug();
	$("debug").visible(show);
	storage.showDebug(show);
}
