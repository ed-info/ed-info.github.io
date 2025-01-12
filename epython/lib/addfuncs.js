// added functions -------------------------
var toolsVisible = false;
        $(function () {
            $('#loading').hide();
            $('#holder').show();
            PythonIDE.init('normal');
});
        
		function loadAsset() {
				
			const file = document.getElementById("asset-file").files[0];
			if (file.name.match(/\.(json)$/)) {				
				const reader = new FileReader();
				reader.addEventListener(
					"load",
					() => {
		
					PythonIDE.files['assets.json'] = reader.result;
					PythonIDE.editor.refresh();	
				},
				false,
				);
				if (file) {
					reader.readAsText(file);
				}
			}
		  else {
					PythonIDE.showHint("Непідтримуваний формат файлу");	
					
			}
				
		}
				
	function getFile() {
		const file = document.getElementById("choose-file").files[0];
		const reader = new FileReader();
		reader.addEventListener(
			"load",
			() => {
		// convert image file to base64 string
			localStorage.setItem(file.name,reader.result);
			},
			false,
		);

		if (file) {
			reader.readAsDataURL(file);
		}
	}

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



$('#btn_PGZ').button().click(function() {
	openFileBrowser();	
	});
  






