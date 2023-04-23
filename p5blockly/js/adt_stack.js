// Pt 2021 - MIT-License

let farbeADTStapel = '#92967D';

Blockly.Blocks['adt_stack_neu'] = {
  init: function() {
    this.appendValueInput("stackVariable")
        .appendField("");
    this.appendDummyInput()
        .appendField(" = new Stack()");        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTStapel);
 this.setTooltip("Ein leerer Stapel wird angelegt.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_stack_neu'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'stackVariable', Blockly.JavaScript.ORDER_ATOMIC);
  var functionName = Blockly.JavaScript.provideFunction_(
    'stapelKlasse',
    ['function ' + Blockly.JavaScript.FUNCTION_NAME_PLACEHOLDER_ +
      '() {',
      '  this.inhalt = [];',
      '  this.isEmpty = function() { if (this.inhalt.length == 0) { return true; } else { return false; } };',
      '  this.top = function() { return this.inhalt[this.inhalt.length-1] };',
      '  this.push = function(val) { this.inhalt.push(val) };',
      '  this.pop = function() { return this.inhalt.pop() };',
      '  this.getStack = function() { return this.inhalt.slice(0) };',
      '}'
    ]);
  var code = value_varName + ' = new ' + functionName + '();\n';
  return code;
};

Blockly.Blocks['adt_stack_isEmpty'] = {
  init: function() {
    this.appendValueInput("stackVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField(".isEmpty(): логічне");
    this.setInputsInline(true);
    this.setOutput(true, null);        
    this.setColour(farbeADTStapel);
 this.setTooltip("Якщо стек не має елемента, повертається значення true, інакше значення false.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_stack_isEmpty'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'stackVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = value_varName + '.isEmpty()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['adt_stack_top'] = {
  init: function() {
    this.appendValueInput("stackVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField(".top(): вміст");
    this.setInputsInline(true);
    this.setOutput(true, null);        
    this.setColour(farbeADTStapel);
 this.setTooltip("Der Inhalt des obersten Elements des Stapels wird zurückgegeben, das Element aber nicht entfernt.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_stack_top'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'stackVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = value_varName + '.top()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['adt_stack_push'] = {
  init: function() {
    this.appendValueInput('VALUE')
        .setCheck('Array')
        .appendField("");
    this.appendValueInput("neuesElement")
        .appendField(".push(");
    this.appendDummyInput()
        .appendField(")");        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTStapel);
 this.setTooltip("Ein neues Element mit dem angegebenen Inhalt wird auf den Stapel gelegt.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_stack_push'] = function(block) {
  var list = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '[]';
  var neuesElement = Blockly.JavaScript.valueToCode(block, 'neuesElement', Blockly.JavaScript.ORDER_ATOMIC);
  var code = list + '.push(' + neuesElement + ');\n';
  return code;
};

Blockly.Blocks['adt_stack_pop'] = {
  init: function() {
    this.appendValueInput("stackVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField(".pop(): вміст");
    this.setInputsInline(true);
    this.setOutput(true, null);        
    this.setColour(farbeADTStapel);
 this.setTooltip("Der Inhalt des obersten Elements wird zurückgegeben und das Element wird entfernt.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_stack_pop'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'stackVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = value_varName + '.pop()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['adt_stack_getStack'] = {
  init: function() {
    this.appendValueInput("stackVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField(".getStack(): вміст");
    this.setInputsInline(true);
    this.setOutput(true, null);        
    this.setColour(farbeADTStapel);
 this.setTooltip("Der gesamte Inhalt des Stapels wird als Array zurückgegeben.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_stack_getStack'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'stackVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = value_varName + '.getStack()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
