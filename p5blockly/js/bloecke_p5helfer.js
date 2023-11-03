// Pt 2021 - MIT-License

//Kategorie: p5-Helfer
Blockly.Blocks['moduloframe'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("виконати через кожні")
        .appendField(new Blockly.FieldNumber(0, 1, 10000, 1), "modulonumber")
        .appendField("кадрів:");
    this.appendStatementInput("do")
        .setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Helfer);
 this.setTooltip("Вказівки виконуються лише після певної кількості кадрів.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['moduloframe'] = function(block) {
  var number_modulonumber = block.getFieldValue('modulonumber');
  var statements_do = Blockly.JavaScript.statementToCode(block, 'do');
  var code = 'if (p5sketch.frameCount%' + number_modulonumber + ' == 0) {\n' + statements_do + '};\n';
  return code;
};

Blockly.Blocks['framerate_number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("частота кадрів:")
        .appendField(new Blockly.FieldNumber(0, 0, 100, 1), "framerate");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Helfer);
 this.setTooltip("Legt die Bildwiederholrate fest.");
 this.setHelpUrl("https://p5js.org/reference/#/p5/frameRate");
  }
};

Blockly.JavaScript['framerate_number'] = function(block) {
  var number_framerate = block.getFieldValue('framerate');
  var code = 'p5sketch.frameRate(' + number_framerate + ');\n';
  return code;
};

Blockly.Blocks['p5_random'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("випадкове число: між");
    this.appendValueInput("z1")
        .setCheck("Number");
    this.appendValueInput("z2")
        .setCheck("Number")
        .appendField("та");        
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbep5Helfer);
 this.setTooltip("Liefert eine zufällige Dezimalzahl zwischen den angegebenen Grenzen.");
 this.setHelpUrl("https://p5js.org/reference/#/p5/random");
  }
};

Blockly.JavaScript['p5_random'] = function(block) {
  var value_z1 = Blockly.JavaScript.valueToCode(block, 'z1', Blockly.JavaScript.ORDER_ATOMIC);
  var value_z2 = Blockly.JavaScript.valueToCode(block, 'z2', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'p5sketch.random(' + value_z1 + ', ' + value_z2 + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['p5_noise'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("випадковий шум:");
    this.appendValueInput("input")
        .setCheck(null);
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbep5Helfer);
 this.setTooltip("Liefert eine Noise-Zufallszahl.");
 this.setHelpUrl("https://p5js.org/reference/#/p5/random");
  }
};

Blockly.JavaScript['p5_noise'] = function(block) {
  var value_input = Blockly.JavaScript.valueToCode(block, 'input', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'p5sketch.noise(' + value_input + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['push_pop'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("новий стан малювання");
    this.appendStatementInput("do")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("відновити попередній");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Helfer);
 this.setTooltip("Усі зміни стосуються лише цього блоку");
 this.setHelpUrl("https://p5js.org/reference/#/p5/push");
  }
};

Blockly.JavaScript['push_pop'] = function(block) {
  var statements_do = Blockly.JavaScript.statementToCode(block, 'do');
  var code = 'p5sketch.push();\n' + statements_do + 'p5sketch.pop();\n';
  return code;
};

Blockly.Blocks['translate_var'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("пересунути");
    this.appendValueInput("deltaX")
        .setCheck("Number")
        .appendField("у напрямку x на:");
    this.appendValueInput("deltaY")
        .setCheck("Number")
        .appendField("у напрямку y на:");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Helfer);
 this.setTooltip("Пересуває всі наступні об’єкти на вказану кількість пікселів.");
 this.setHelpUrl("https://p5js.org/reference/#/p5/translate");
  }
};

Blockly.JavaScript['translate_var'] = function(block) {
  var value_deltaX = Blockly.JavaScript.valueToCode(block, 'deltaX', Blockly.JavaScript.ORDER_ATOMIC);
  var value_deltaY = Blockly.JavaScript.valueToCode(block, 'deltaY', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = 'p5sketch.translate(' + value_deltaX + ', ' + value_deltaY + ');\n';
  return code;
};

Blockly.Blocks['rotate_var'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("поворот");
    this.appendValueInput("winkel")
        .setCheck("Number")
        .appendField("на кут:");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Helfer);
 this.setTooltip("Rotiert alle folgenden Objekte um den angegebenen Winkel gegen den Uhrzeigersinn (Gradmaß).");
 this.setHelpUrl("https://p5js.org/reference/#/p5/rotate");
  }
};

Blockly.JavaScript['rotate_var'] = function(block) {
  var value_winkel = Blockly.JavaScript.valueToCode(block, 'winkel', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'p5sketch.rotate(' + value_winkel + ');\n';
  return code;
};

Blockly.Blocks['scale_var'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("масштабувати");
    this.appendValueInput("faktor")
        .setCheck("Number")
        .appendField("у:");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Helfer);
 this.setTooltip("Vergrößert alle folgenden Objekte um den angegebenen Faktor.");
 this.setHelpUrl("https://p5js.org/reference/#/p5/scale");
  }
};

Blockly.JavaScript['scale_var'] = function(block) {
  var value_faktor = Blockly.JavaScript.valueToCode(block, 'faktor', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'p5sketch.scale(' + value_faktor + ');\n';
  return code;
};

Blockly.Blocks['p5_button'] = {
  init: function() {
    this.appendDummyInput()
    this.appendValueInput("buttonVariable")
        .appendField("кнопка: ");    
    this.appendDummyInput()
        .appendField("| напис: ")
        .appendField(new Blockly.FieldTextInput("кнопка1"), "beschriftung")
    this.appendValueInput("xKoord")
        .setCheck("Number")
        .appendField("| x:");
    this.appendValueInput("yKoord")
        .setCheck("Number")
        .appendField("y:");
    this.appendValueInput("breite")
        .setCheck("Number")
        .appendField("| ш:");
    this.appendDummyInput()
        .appendField("| виклик: ")
        .appendField(new Blockly.FieldTextInput("methode1"), "methodenaufruf");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Helfer);
 this.setTooltip("Створити кнопку для виклику методу.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['p5_button'] = function(block) {
  var value_buttonVariable = Blockly.JavaScript.valueToCode(block, 'buttonVariable', Blockly.JavaScript.ORDER_ATOMIC);
  var value_xkoord = Blockly.JavaScript.valueToCode(block, 'xKoord', Blockly.JavaScript.ORDER_ATOMIC);
  var value_ykoord = Blockly.JavaScript.valueToCode(block, 'yKoord', Blockly.JavaScript.ORDER_ATOMIC);
  var value_breite = Blockly.JavaScript.valueToCode(block, 'breite', Blockly.JavaScript.ORDER_ATOMIC);
  var value_methodenaufruf = block.getFieldValue('methodenaufruf');
  var value_beschriftung = block.getFieldValue('beschriftung');  
  var value_canvasvarName = Blockly.JavaScript.valueToCode(block, 'zeichenflaecheVariable', Blockly.JavaScript.ORDER_ATOMIC);   
  var code = value_buttonVariable + ' = p5sketch.createButton("' + value_beschriftung + '");\n' + value_buttonVariable + '.position(' + value_xkoord + ', ' +  value_ykoord + ');\n' + value_buttonVariable + '.size(' + value_breite + ');\n' + value_buttonVariable + '.class(\"btn btn-secondary btn-sm\");\n' + value_buttonVariable + '.mousePressed(' + value_methodenaufruf + ');\n';
  return code;
};
