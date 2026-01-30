// added functions -------------------------

var toolsVisible = false;
     
			


    let btnRun = document.querySelector("#btn_run");
    function runSketch(event) {
        runit();
    }
    btnRun.addEventListener('click', runSketch);

    function runit() { 
		document.querySelector("#myChart").style.display = "none";
		Sk.canvas = "myChart";
		Sk.p5Sketch = "p5Sketch";
        const cnvs = [...document.querySelectorAll(`[id^="defaultCanvas"]`),];
        cnvs.forEach((cnv) => {
            //cnv.style = "display:none";
            cnv.remove();
        });
    } 


  






