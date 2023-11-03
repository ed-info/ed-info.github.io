// Pt 2021 - MIT-License

let farbeADTdynArray = '#435560';

Blockly.Blocks['adt_dynArray_neu'] = {
  init: function() {
    this.appendValueInput("dynArrayVariable")
        .appendField("");
    this.appendDummyInput()
        .appendField("= new DynArray()");    
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTdynArray);
 this.setTooltip("Eine leere dynamische Reihung wird angelegt.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_dynArray_neu'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'dynArrayVariable', Blockly.JavaScript.ORDER_ATOMIC);
  var functionName = Blockly.JavaScript.provideFunction_(
    'dynReihungKlasse',
    ['function ' + Blockly.JavaScript.FUNCTION_NAME_PLACEHOLDER_ +
      '() {',
      '  this.inhalt = [];',
      '  this.isEmpty = function() { if (this.inhalt.length == 0) { return true; } else { return false; } };',
      '  this.getItem = function(idx) { return this.inhalt[idx] };',
      '  this.append = function(val) { this.inhalt.push(val) };',
      '  this.insertAt = function(idx, val) { this.inhalt.splice(idx, 0, val) };',
      '  this.setItem = function(idx, val) { this.inhalt[idx] = val };',
      '  this.delete = function(idx) { this.inhalt.splice(idx, 1) };',
      '  this.getLength = function() { return this.inhalt.length };',
      '  this.getDynArray = function() { return this.inhalt.slice(0) };',
      '}'
    ]);
  var code = value_varName + ' = new ' + functionName + '();\n';  
  return code;
};

Blockly.Blocks['adt_dynArray_isEmpty'] = {
  init: function() {
    this.appendValueInput("dynArrayVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField(".isEmpty(): логічне");
    this.setInputsInline(true);
    this.setOutput(true, null);        
    this.setColour(farbeADTdynArray);
 this.setTooltip("Wenn die Reihung kein Element enthält, wird der Wert wahr zurückgegeben, sonst der Wert falsch.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_dynArray_isEmpty'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'dynArrayVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = value_varName + '.isEmpty()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['adt_dynArray_getItem'] = {
  init: function() {
    this.appendValueInput('dynArrayVariable')
        .setCheck('Array')
        .appendField("");
    this.appendValueInput("AT")
        .appendField(".getItem(");
    this.appendDummyInput()
        .appendField("): Inhalt");          
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbeADTdynArray);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_dynArray_getItem'] = function(block) {
  var list = Blockly.JavaScript.valueToCode(block, 'dynArrayVariable', Blockly.JavaScript.ORDER_ATOMIC) || '[]';
  var at = Blockly.JavaScript.valueToCode(block, 'AT', Blockly.JavaScript.ORDER_ATOMIC);
  var code = list + '.getItem(' + at + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['adt_dynArray_append'] = {
  init: function() {
    this.appendValueInput('dynArrayVariable')
        .setCheck('Array')
        .appendField("");
    this.appendValueInput("neuesElement")
        .appendField(".append(");
    this.appendDummyInput()
        .appendField(")");          
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTdynArray);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_dynArray_append'] = function(block) {
  var list = Blockly.JavaScript.valueToCode(block, 'dynArrayVariable', Blockly.JavaScript.ORDER_ATOMIC) || '[]';
  var neuesElement = Blockly.JavaScript.valueToCode(block, 'neuesElement', Blockly.JavaScript.ORDER_ATOMIC);
  var code = list + '.append(' + neuesElement + ');\n';
  return code;
};

Blockly.Blocks['adt_dynArray_insertAt'] = {
  init: function() {
    this.appendValueInput('dynArrayVariable')
        .setCheck('Array')
        .appendField("");
    this.appendValueInput("AT")
        .appendField(".insertAt(");
    this.appendValueInput("neuesElement")
        .appendField(",");
    this.appendDummyInput()
        .appendField(")"); 
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTdynArray);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_dynArray_insertAt'] = function(block) {
  var list = Blockly.JavaScript.valueToCode(block, 'dynArrayVariable', Blockly.JavaScript.ORDER_ATOMIC) || '[]';
  var at = Blockly.JavaScript.valueToCode(block, 'AT', Blockly.JavaScript.ORDER_ATOMIC);
  var neuesElement = Blockly.JavaScript.valueToCode(block, 'neuesElement', Blockly.JavaScript.ORDER_ATOMIC);
  var code = list + '.insertAt(' + at + ', ' + neuesElement + ');\n';
  return code;
};

Blockly.Blocks['adt_dynArray_setItem'] = {
  init: function() {
    this.appendValueInput('dynArrayVariable')
        .setCheck('Array')
        .appendField("");
    this.appendValueInput("AT")
        .appendField(".setItem(");
    this.appendValueInput("neuesElement")
        .appendField(",");
    this.appendDummyInput()
        .appendField(")");         
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTdynArray);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_dynArray_setItem'] = function(block) {
  var list = Blockly.JavaScript.valueToCode(block, 'dynArrayVariable', Blockly.JavaScript.ORDER_ATOMIC) || '[]';
  var at = Blockly.JavaScript.valueToCode(block, 'AT', Blockly.JavaScript.ORDER_ATOMIC);
  var neuesElement = Blockly.JavaScript.valueToCode(block, 'neuesElement', Blockly.JavaScript.ORDER_ATOMIC);
  var code = list + '.setItem(' + at + ', ' + neuesElement + ');\n';
  return code;
};

Blockly.Blocks['adt_dynArray_delete'] = {
  init: function() {
    this.appendValueInput('dynArrayVariable')
        .setCheck('Array')
        .appendField("");
    this.appendValueInput("idx")
        .appendField(".delete(");
    this.appendDummyInput()
        .appendField(")"); 
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTdynArray);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_dynArray_delete'] = function(block) {
  var list = Blockly.JavaScript.valueToCode(block, 'dynArrayVariable', Blockly.JavaScript.ORDER_ATOMIC) || '[]';
  var idx_value = Blockly.JavaScript.valueToCode(block, 'idx', Blockly.JavaScript.ORDER_ATOMIC);
  var code = list + '.delete(' + idx_value + ');\n';
  return code;
};

Blockly.Blocks['adt_dynArray_getLength'] = {
  init: function() {
    this.appendValueInput('dynArrayVariable')
        .setCheck('Array')
        .appendField("");
    this.appendDummyInput()
        .appendField(".getLength(): число");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbeADTdynArray);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_dynArray_getLength'] = function(block) {
  var list = Blockly.JavaScript.valueToCode(block, 'dynArrayVariable', Blockly.JavaScript.ORDER_ATOMIC) || '[]';
  var code = list + '.getLength()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['adt_dynArray_getDynArray'] = {
  init: function() {
    this.appendValueInput("dynArrayVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField(".getDynArray(): вміст");
    this.setInputsInline(true);
    this.setOutput(true, null);        
    this.setColour(farbeADTdynArray);
 this.setTooltip("Der gesamte Inhalt der dynamischen Reihung wird als Array zurückgegeben.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_dynArray_getDynArray'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'dynArrayVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = value_varName + '.getDynArray()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
