// Pt 2021 - MIT-License

//Kategorie: Klasse
Blockly.Blocks['klasse_anlegen'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Клас:")
        .appendField(new Blockly.FieldTextInput("class1"), "classname");
    this.appendStatementInput("class_attribute")
        .appendField("Властивості:")    
        .setCheck(null);
    this.appendStatementInput("class_methoden")
        .appendField("Методи:")      
        .setCheck(null);        
    this.setColour(farbeObjekte);
    this.setInputsInline(true);    
    this.setTooltip("Визначити клас.");
    this.setHelpUrl("");
  }  
};

Blockly.JavaScript['klasse_anlegen'] = function(block) {
    var class_name = block.getFieldValue('classname');
    //Attribute
    let statementAttributeTemp = [];
    var define_Attribute_Blocks = block.getInputTargetBlock('class_attribute');
    if(define_Attribute_Blocks)
     do { 
        let tempAttribut = Blockly.JavaScript.blockToCode(define_Attribute_Blocks, true);
        statementAttributeTemp.push(tempAttribut);
      } while (define_Attribute_Blocks = define_Attribute_Blocks.getNextBlock());
    //Methoden
    let statementMethodenTemp = [];
    var define_Methoden_Blocks = block.getInputTargetBlock('class_methoden');
    if(define_Methoden_Blocks)
     do { 
        let tempMethode = Blockly.JavaScript.blockToCode(define_Methoden_Blocks, true);
        statementMethodenTemp.push(tempMethode);
      } while (define_Methoden_Blocks = define_Methoden_Blocks.getNextBlock());
    //Code-Generator
    let codeString = 'class ' + class_name + ' {\n  constructor(';
    for (let i = 0; i < statementAttributeTemp.length; i++) {
        if(i < statementAttributeTemp.length-1) {
            codeString += statementAttributeTemp[i] + ', ';
        } else {
            codeString += statementAttributeTemp[i] + ') {\n';
        }
    }
    for (let i = 0; i < statementAttributeTemp.length; i++) {
      codeString += '    this.' + statementAttributeTemp[i] + ' = ' + statementAttributeTemp[i] + ';\n';
    }
    codeString += '  }\n'
    for (let i = 0; i < statementMethodenTemp.length; i++) {
      codeString += statementMethodenTemp[i] + '\n';
    }    
    codeString += '}\n';
    return codeString;    
};

Blockly.Blocks['klasse_attribut'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Властивість:")
        .appendField(new Blockly.FieldTextInput("attribute1"), "attributname");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeObjekte);
 this.setTooltip("Визначити властивість.");
 this.setHelpUrl("");
  } 
};

Blockly.JavaScript['klasse_attribut'] = function(block) {
  var attribut_name = block.getFieldValue('attributname');
  const code = attribut_name; 
  return code;
};

Blockly.Blocks['klasse_getattribut'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Властивість:")
        .appendField(new Blockly.FieldTextInput("attribute1"), "attribut_name");
    this.setInputsInline(true);        
    this.setOutput(true, null);
    this.setColour(farbeObjekte);
 this.setTooltip("Визначити властивість класу.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['klasse_getattribut'] = function(block) {
  var text_attribut_name = block.getFieldValue('attribut_name');
  let feldName2 = text_attribut_name.replaceAll('\'', '');
  const code = 'this.' + feldName2; 
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['klasse_methode'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Метод:")
        .appendField(new Blockly.FieldTextInput("method1"), "methodename");
    this.appendStatementInput("methode_parameter")
        .appendField("Параметр:")
        .setCheck(null);        
    this.appendStatementInput("methode_anweisungen")
        .appendField("Вказівки:")
        .setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);        
    this.setColour(farbeObjekte);
    this.setTooltip("Визначити метод в класі.");
    this.setHelpUrl("");
  }  
};

Blockly.JavaScript['klasse_methode'] = function(block) {
    var methoden_name = block.getFieldValue('methodename');
    //Parameter
    let statementParameterTemp = [];
    var define_Parameter_Blocks = block.getInputTargetBlock('methode_parameter');
    if(define_Parameter_Blocks)
     do { 
        let tempParameter = Blockly.JavaScript.blockToCode(define_Parameter_Blocks, true);
        statementParameterTemp.push(tempParameter);
      } while (define_Parameter_Blocks = define_Parameter_Blocks.getNextBlock());    
    //Anweisungen
    let statementAnweisungenTemp = [];
    var define_Anweisungen_Blocks = block.getInputTargetBlock('methode_anweisungen');
    if(define_Anweisungen_Blocks)
     do { 
        let tempAnweisung = Blockly.JavaScript.blockToCode(define_Anweisungen_Blocks, true);
        statementAnweisungenTemp.push(tempAnweisung);
      } while (define_Anweisungen_Blocks = define_Anweisungen_Blocks.getNextBlock());
    //Code-Generator
    let codeString = '  ' + methoden_name + '(';
    if(statementParameterTemp.length > 0) {
      for (let i = 0; i < statementParameterTemp.length; i++) {
          if(i < statementParameterTemp.length-1) {
              codeString += statementParameterTemp[i] + ', ';
          } else {
              codeString += statementParameterTemp[i] + ') {\n';
          }
      }
    } else {
      codeString += ') {\n';
    }
    for (let i = 0; i < statementAnweisungenTemp.length; i++) {
      codeString += '    ' + statementAnweisungenTemp[i];
    }
    codeString += '  }';
    return codeString;    
};

Blockly.Blocks['methode_parameter'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Параметр:")
        .appendField(new Blockly.FieldTextInput("parameter1"), "parametername");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeObjekte);
 this.setTooltip("Визначити метод.");
 this.setHelpUrl("");
  } 
};

Blockly.JavaScript['methode_parameter'] = function(block) {
  var parameter_name = block.getFieldValue('parametername');
  const code = parameter_name; 
  return code;
};

Blockly.Blocks['methode_getparameter'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Параметр:")
        .appendField(new Blockly.FieldTextInput("parameter1"), "parameter_name");
    this.setInputsInline(true);        
    this.setOutput(true, null);
    this.setColour(farbeObjekte);
 this.setTooltip("Визначити параметр методу.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['methode_getparameter'] = function(block) {
  var text_parameter_name = block.getFieldValue('parameter_name');
  let feldName2 = text_parameter_name.replaceAll('\'', '');
  const code = feldName2; 
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['objekt_anlegen'] = {
  init: function() {
    this.appendValueInput("objektVariable")
        .appendField("Створити об'єкт:");
    this.appendDummyInput()
        .appendField("з класу:")
        .appendField(new Blockly.FieldTextInput("class1"), "classname");          
    this.appendStatementInput("objekt_parameter")
        .appendField("Дані:")    
        .setCheck(null);        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeObjekte);
 this.setTooltip("Створити об’єкт на основі класу.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['objekt_anlegen'] = function(block) {
    var value_varName = Blockly.JavaScript.valueToCode(block, 'objektVariable', Blockly.JavaScript.ORDER_ATOMIC);
    var class_name = block.getFieldValue('classname');     
    //Parameter
    let statementWerteTemp = [];
    var define_Werte_Blocks = block.getInputTargetBlock('objekt_parameter');
    if(define_Werte_Blocks)
     do { 
        let tempParameter = Blockly.JavaScript.blockToCode(define_Werte_Blocks, true);
        statementWerteTemp.push(tempParameter);
      } while (define_Werte_Blocks = define_Werte_Blocks.getNextBlock());    
    //Code-Generator
    let codeString = value_varName + ' = new ' + class_name + '(';
    for (let i = 0; i < statementWerteTemp.length; i++) {
        if(i < statementWerteTemp.length-1) {
            codeString += statementWerteTemp[i] + ', ';
        } else {
            codeString += statementWerteTemp[i] + ');\n';
        }
    }
    return codeString;    
};

Blockly.Blocks['objekt_methode_aufrufen'] = {
  init: function() {
    this.appendValueInput("objektVariable")
        .appendField("Об'єкт:");
    this.appendDummyInput()
        .appendField("Спосіб виклику:")
        .appendField(new Blockly.FieldTextInput("method1"), "methodename");          
    this.appendStatementInput("objekt_parameter")
        .appendField("Дані:")    
        .setCheck(null);        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeObjekte);
 this.setTooltip("Виклик методу об'єкта.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['objekt_methode_aufrufen'] = function(block) {
    var value_varName = Blockly.JavaScript.valueToCode(block, 'objektVariable', Blockly.JavaScript.ORDER_ATOMIC);
    var methode_name = block.getFieldValue('methodename');     
    //Parameter
    let statementWerteTemp = [];
    var define_Werte_Blocks = block.getInputTargetBlock('objekt_parameter');
    if(define_Werte_Blocks)
     do { 
        let tempParameter = Blockly.JavaScript.blockToCode(define_Werte_Blocks, true);
        statementWerteTemp.push(tempParameter);
      } while (define_Werte_Blocks = define_Werte_Blocks.getNextBlock());    
    //Code-Generator
    let codeString = value_varName + '.' + methode_name + '(';
    if (statementWerteTemp.length > 0) {
      for (let i = 0; i < statementWerteTemp.length; i++) {
          if(i < statementWerteTemp.length-1) {
              codeString += statementWerteTemp[i] + ', ';
          } else {
              codeString += statementWerteTemp[i] + ');\n';
          }
      }
    } else {
      codeString += ');\n'
    }
    return codeString;    
};

Blockly.Blocks['objekt_wert'] = {
  init: function() {
   this.appendValueInput("WERT")
        .setCheck(null)
        .appendField("Дані:");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeObjekte);
 this.setTooltip("Einen Wert übergeben");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['objekt_wert'] = function(block) {
  var value_wert = Blockly.JavaScript.valueToCode(block, 'WERT', Blockly.JavaScript.ORDER_ATOMIC);
  var code = value_wert;
  return code;
};

Blockly.Blocks['attribut_aendern'] = {
  init: function() {
    this.appendValueInput("attribut_name")
        .setCheck(null)
        .appendField("Attribut ändern:");
    this.appendValueInput("attribut_wert")
        .setCheck(null)
        .appendField("=");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeObjekte);
 this.setTooltip("Attribut ändern");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['attribut_aendern'] = function(block) {
  var value_attribut_name = Blockly.JavaScript.valueToCode(block, 'attribut_name', Blockly.JavaScript.ORDER_ATOMIC);
  var value_attribut_wert = Blockly.JavaScript.valueToCode(block, 'attribut_wert', Blockly.JavaScript.ORDER_ATOMIC);
  var code = value_attribut_name + ' = ' + value_attribut_wert + ';\n';
  return code;
};
