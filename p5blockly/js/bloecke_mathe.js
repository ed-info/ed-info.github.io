// Pt 2021 - MIT-License

Blockly.Blocks['decToBin'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("dec➜bin:");
    this.appendValueInput("ganzZahl")
        .setCheck("Number");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbeMathe);
 this.setTooltip("Перетворити десяткове число в двійкове.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['decToBin'] = function(block) {
  var value_ganzZahl = Blockly.JavaScript.valueToCode(block, 'ganzZahl', Blockly.JavaScript.ORDER_ATOMIC);
  var code = '(' + value_ganzZahl + ' >>> 0).toString(2)';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['binToDec'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("bin➜dec:");
    this.appendValueInput("binZahl")
        .setCheck("Number");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbeMathe);
 this.setTooltip("Перетворити двійкове число в десяткове.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['binToDec'] = function(block) {
  var value_binZahl = Blockly.JavaScript.valueToCode(block, 'binZahl', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'parseInt(' + value_binZahl + ', 2)';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['decToHex'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("dec➜hex:");
    this.appendValueInput("ganzZahl")
        .setCheck("Number");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbeMathe);
 this.setTooltip("Перетворити десяткове число в шістнадцяткове.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['decToHex'] = function(block) {
  var value_ganzZahl = Blockly.JavaScript.valueToCode(block, 'ganzZahl', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'parseInt(' + value_ganzZahl + ', 10)' + '.toString(16)';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['hexToDec'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("hex➜dec:");
    this.appendValueInput("hexZahl")
        .setCheck("String");    
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbeMathe);
 this.setTooltip("Перетворити шістнадцяткове число в десяткове.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['hexToDec'] = function(block) {
  var value_hexZahl = Blockly.JavaScript.valueToCode(block, 'hexZahl', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'parseInt(' + value_hexZahl + ', 16)';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
