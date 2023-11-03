// Pt 2021 - MIT-License

document.getElementById('p5saveDateiname').value = 'BlocklyCode';

document.getElementById('p5Save').onclick = function() {
  try {
    let xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    var xml_text = Blockly.Xml.domToText(xml);
    let link = document.createElement('a');
    link.download = document.getElementById('p5saveDateiname').value + '.p5xml';
    link.href = "data:application/octet-stream;utf-8," + encodeURIComponent(xml_text);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch { }
};

const fileSelector = document.getElementById('p5Dateiwahl');
fileSelector.addEventListener('change', (event) => {
  const fileList = event.target.files;
  let file = fileList[0];
  let reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function (event) {
    Blockly.mainWorkspace.clear();
    var xml = Blockly.Xml.textToDom(event.target.result);
    Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace);   
    document.getElementById('p5Dateiwahl').value = null; 
  };  
});

async function loadTutorial(url) {
  try {
    const response = await fetch(url);
    const data = await response.text();
    $("#divTutorials").html(data);
  } catch (err) { }
}

document.getElementById('backToContent').onclick = function() {
  loadTutorial('tutorials/inhalt.html');
};

async function loadBeispielProgramm(url) {
  try {
    const response = await fetch(url);
    const data = await response.text();
      Blockly.mainWorkspace.clear();
      var xml = Blockly.Xml.textToDom(data);
      Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace); 
      updateP5();
  } catch (err) { }
}
