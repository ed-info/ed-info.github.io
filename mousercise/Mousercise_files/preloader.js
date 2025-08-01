function preload(onProgress, onDone){
	var images = ["images/book.gif", "images/btn1-down.gif", "images/btn1-up.gif", "images/btn10-down.gif", "images/btn10-up.gif", "images/btn11-down.gif", "images/btn11-up.gif", "images/btn2-down.gif", "images/btn2-up.gif", "images/btn3-down.gif", "images/btn3-up.gif", "images/btn4-down.gif", "images/btn4-up.gif", "images/btn5-down.gif", "images/btn5-up.gif", "images/btn6-down.gif", "images/btn6-up.gif", "images/btn7-down.gif", "images/btn7-up.gif", "images/btn8-down.gif", "images/btn8-up.gif", "images/btn9-down.gif", "images/btn9-up.gif", "images/bus.gif", "images/butterfly.gif", "images/button-amazon-cart.png", "images/button-ebay-search.png", "images/button-ebay-share.png", "images/button-gmail-send.png", "images/button-linkedin-connect.png", "images/button-meetup-yes.png", "images/button-outlook-new.png", "images/button-twitter-follow.png", "images/button-yahoo-signin.png", "images/cat_fish_bowl.gif", "images/cell_phone.gif", "images/checkmark.gif", "images/checkmark2.gif", "images/coleslaw.jpg", "images/continue.gif", "images/dragblock.gif", "images/dragon.gif", "images/finish-flags.png", "images/firecracker.gif", "images/firecracker2.gif", "images/firecracker3.gif", "images/fries.jpg", "images/green-peppers-overlay.png", "images/kokopelli.gif", "images/lghand.gif", "images/mailman.gif", "images/monster.gif", "images/mouse.png", "images/mushrooms-overlay.png", "images/nickel.gif", "images/onion-rings.jpg", "images/onions-overlay.png", "images/pepperoni-overlay.png", "images/pickles.jpg", "images/pineapples-overlay.png", "images/pizza.png", "images/practice.png", "images/restart.gif", "images/runningmouse.gif", "images/saturnv.jpg", "images/sausage-overlay.png", "images/scuba_diver.gif", "images/shoes.gif", "images/spacer.gif", "images/stop.jpg", "images/student.png", "images/train.gif", "images/us_flag.gif", "images/wrong-face.png"]; //this array is populated by the build.js script

	if (images.length == 0){
		onDone();
		return;
	}

	var downloaded = 0;
	var onImageLoaded = function(){
		downloaded++;
		onProgress(downloaded, images.length);
		if (downloaded == images.length){
			onDone();
		}
	};

	images.forEach(function(image){
		var img = new Image();
		img.onload = onImageLoaded;
		img.src = image;
	});
}
