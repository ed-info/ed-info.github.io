// Pt 2021 - MIT-License

let farbeADTBinTree = '#55414b';

Blockly.Blocks['adt_binaerBaum_neu'] = {
  init: function() {
    this.appendValueInput("binBaumVariable")
        .appendField("");
    this.appendDummyInput()
        .appendField("= new binaerBaumKlasse()");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTBinTree);
 this.setTooltip("Ein Binärbaum wird angelegt.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_binaerBaum_neu'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'binBaumVariable', Blockly.JavaScript.ORDER_ATOMIC);
  var binTreeFunction = Blockly.JavaScript.provideFunction_(
    'BinTree',
    ['function ' + Blockly.JavaScript.FUNCTION_NAME_PLACEHOLDER_ +
      '(inhalt) {',
      '  this.inhalt = inhalt;',
      '  this.links = null;',
      '  this.rechts = null;',
      '  this.isLeaf = function() { return (this.links === null && this.rechts === null); };',
      '  this.getLeft = function() { return this.links; };',
      '  this.getRight = function() { return this.rechts; };',
      '  this.setLeft = function(knot) { this.links = knot; };',
      '  this.setRight = function(knot) { this.rechts = knot; };',
      '  this.getItem = function() { return this.inhalt };',
      '  this.setItem = function(val) { this.inhalt = val };',
      '}'
    ]);
  var binaerBaumFunction = Blockly.JavaScript.provideFunction_(
    'binaerBaumKlasse',
    ['function ' + Blockly.JavaScript.FUNCTION_NAME_PLACEHOLDER_ +
      '() {',
      '  this.wurzel = null;',
      '  this.knotenEinfuegen = function(knoten, neuerKnoten) {',
      '    if (neuerKnoten.getItem() < knoten.getItem()) {',
      '      if (knoten.getLeft() === null) { knoten.setLeft(neuerKnoten); }',
      '      else { this.knotenEinfuegen(knoten.getLeft(), neuerKnoten); }',
      '    }',
      '    if (neuerKnoten.getItem() > knoten.getItem()) {',
      '      if (knoten.getRight() === null) { knoten.setRight(neuerKnoten); }',
      '      else { this.knotenEinfuegen(knoten.getRight(), neuerKnoten); }',
      '    }',
      '  };',
      '  this.inhaltEinfuegen = function(inhalt) {',
      '    var neuerKnoten = new BinTree(inhalt);',
      '    if (this.wurzel === null) { this.wurzel = neuerKnoten; }',
      '    else { this.knotenEinfuegen(this.wurzel, neuerKnoten); }',
      '  };',
      '  this.findMinNode = function(knoten) {',
      '    if (knoten.getLeft() === null) return knoten;',
      '    else return this.findMinNode(knoten.getLeft());',
      '  };',  
      '  this.knotenEntfernen = function(knoten, zahl) {',
      '    if (knoten === null) { return null;',
      '    } else if (zahl < knoten.getItem() && knoten.getLeft() != null) {',
      '        knoten.setLeft(this.knotenEntfernen(knoten.getLeft(), zahl));',
      '        return knoten;',
      '    } else if (zahl > knoten.getItem() && knoten.getRight() != null) {',
      '        knoten.setRight(this.knotenEntfernen(knoten.getRight(), zahl));',
      '        return knoten;',
      '    } else if (zahl === knoten.getItem()) {',
      '        if (knoten.getLeft() === null && knoten.getRight() === null) {',
      '          knoten = null; return knoten;',
      '        }',
      '        if (knoten.getLeft() === null && knoten.getRight() != null) {',
      '          knoten = knoten.getRight(); return knoten;',
      '        }',        
      '        if (knoten.getRight() === null && knoten.getLeft() != null) {',
      '          knoten = knoten.getLeft(); return knoten;',
      '        }',
      '        if (knoten.getRight() != null && knoten.getLeft() != null) {',
      '          var bleibtDa = this.findMinNode(knoten.getRight());',
      '          knoten.setItem(bleibtDa.getItem());',
      '          knoten.setRight(this.knotenEntfernen(knoten.getRight(), bleibtDa.getItem()));',
      '          return knoten;',
      '        }',
      '    } else return knoten;',
      '  }',
      '  this.inhaltEntfernen = function(inhalt) {',
      '    this.wurzel = this.knotenEntfernen(this.wurzel, inhalt);',
      '  };',  
      '  this.maxTiefe = function() {',
      '    var tiefeBerechnen = function(knoten) {',
      '      if (knoten === null) return 0;',
      '      return Math.max(1 + tiefeBerechnen(knoten.getLeft()), 1 + tiefeBerechnen(knoten.getRight()));',
      '    }',
      '    return tiefeBerechnen(this.wurzel);',
      '  };', 
      '  this.knotenArrSpeichern = function(knoten, knotenArr) {',
      '    if (knoten == null) return;',
      '    this.knotenArrSpeichern(knoten.getLeft(), knotenArr);',
      '    knotenArr.push(knoten);',
      '    this.knotenArrSpeichern(knoten.getRight(), knotenArr);',
      '  };',
      '  this.bGewichtHelfer = function(knotenArr, start, ende) {',
      '    if (start > ende) return null;',
      '    var mitte = parseInt((start + ende)/2, 10);',
      '    var knoten = knotenArr[mitte];',
      '    knoten.setLeft(this.bGewichtHelfer(knotenArr, start, mitte - 1));',
      '    knoten.setRight(this.bGewichtHelfer(knotenArr, mitte + 1, ende));',
      '    return knoten;',
      '  };',
      '  this.baumGewichten = function(wurzel) {',
      '    var knotenArr = [];',
      '    this.knotenArrSpeichern(wurzel, knotenArr);',
      '    var n = knotenArr.length;',
      '    return this.bGewichtHelfer(knotenArr, 0, n-1);',
      '  };',
      '};',
    ]);    
  var code = value_varName + ' = new ' + binaerBaumFunction + '();\n';  
  return code;
};

Blockly.Blocks['adt_binaerBaum_bDrucker'] = {
  init: function() {
    this.appendValueInput("binBaumVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField("bDrucker()");
    this.appendValueInput("xT")
        .setCheck("Number")
        .appendField("xKoord:");
    this.appendValueInput("yT")
        .setCheck("Number")
        .appendField("yKoord:");
    this.appendValueInput("dX")
        .setCheck("Number")
        .appendField("Breite:");        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);    
    this.setColour(farbeADTBinTree);
 this.setTooltip("Ein Binärbaum wird angelegt.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_binaerBaum_bDrucker'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'binBaumVariable', Blockly.JavaScript.ORDER_ATOMIC);
  var value_xKoord = Blockly.JavaScript.valueToCode(block, 'xT', Blockly.JavaScript.ORDER_ATOMIC);
  var value_yKoord = Blockly.JavaScript.valueToCode(block, 'yT', Blockly.JavaScript.ORDER_ATOMIC);
  var value_breite = Blockly.JavaScript.valueToCode(block, 'dX', Blockly.JavaScript.ORDER_ATOMIC);  
  var binTreeFunction = Blockly.JavaScript.provideFunction_(
    'bDrucker',
    ['function ' + Blockly.JavaScript.FUNCTION_NAME_PLACEHOLDER_ +
      '(asb, xT, yT, level, dX) {',
      '  let yDeltaD = 15;',
      '  let yDL = 0;',
      '  if (asb.rechts != null) {',
      '    yDL = yDeltaD*level;',
      '    p5sketch.push();',
      '      p5sketch.stroke(47, 79, 79, 150);',
      '      p5sketch.strokeWeight(4);',
      '      p5sketch.line(xT, yT, xT+dX, yT+yDL);',
      '    p5sketch.pop();',
      '    bDrucker(asb.rechts, xT+dX, yT+yDL, level+1, dX/2);',
      '  }',
      '  if (asb.links != null) {',
      '    yDL = yDeltaD*level;',
      '    p5sketch.push();',
      '      p5sketch.stroke(112, 128, 144, 150);',
      '      p5sketch.strokeWeight(4);',
      '      p5sketch.line(xT, yT, xT-dX, yT+yDL);',
      '    p5sketch.pop();',
      '    bDrucker(asb.links, xT-dX, yT+yDL, level+1, dX/2);',
      '  }',
      '  p5sketch.fill(255, 255, 255, 150);',
      '  p5sketch.ellipse(xT, yT, 32, 32);',
      '  p5sketch.fill(0);',
      '  p5sketch.textSize(14);',
      '  p5sketch.textAlign(p5sketch.CENTER);',
      '  p5sketch.text(asb.inhalt, xT, yT+6);',
      '}'
    ]);  
  var code = 'bDrucker(' + value_varName + '.wurzel, ' + value_xKoord + ', ' + value_yKoord + ', 1, ' + value_breite + ');\n';  
  return code;
};

Blockly.Blocks['adt_binaerBaum_inhalteinfuegen'] = {
  init: function() {
    this.appendValueInput('binBaumVariable')
        .appendField("");
    this.appendValueInput("neuesElement")
        .appendField(".inhaltEinfuegen(");
    this.appendDummyInput()
        .appendField(")");        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTBinTree);
 this.setTooltip("Fügt in den Baum einen neuen Knoten ein.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_binaerBaum_inhalteinfuegen'] = function(block) {
  var baumVar = Blockly.JavaScript.valueToCode(block, 'binBaumVariable', Blockly.JavaScript.ORDER_ATOMIC);
  var neuesElement = Blockly.JavaScript.valueToCode(block, 'neuesElement', Blockly.JavaScript.ORDER_ATOMIC);
  var code = baumVar + '.inhaltEinfuegen(' + neuesElement + ');\n';
  return code;
};

Blockly.Blocks['adt_binaerBaum_inhaltentfernen'] = {
  init: function() {
    this.appendValueInput('binBaumVariable')
        .appendField("");
    this.appendValueInput("entfElement")
        .appendField(".inhaltEntfernen(");
    this.appendDummyInput()
        .appendField(")");        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTBinTree);
 this.setTooltip("Entfernt aus dem Baum einen Knoten.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_binaerBaum_inhaltentfernen'] = function(block) {
  var baumVar = Blockly.JavaScript.valueToCode(block, 'binBaumVariable', Blockly.JavaScript.ORDER_ATOMIC);
  var entfElement = Blockly.JavaScript.valueToCode(block, 'entfElement', Blockly.JavaScript.ORDER_ATOMIC);
  var code = baumVar + '.inhaltEntfernen(' + entfElement + ');\n';
  return code;
};

Blockly.Blocks['adt_binaerBaum_maxTiefe'] = {
  init: function() {
    this.appendValueInput("binBaumVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField(".maxTiefe(): Ganzzahl");
    this.setInputsInline(true);
    this.setOutput(true, null);        
    this.setColour(farbeADTBinTree);
 this.setTooltip("Die maximale Tiefe des Binärbaums wird ermittelt.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_binaerBaum_maxTiefe'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'binBaumVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = value_varName + '.maxTiefe()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['adt_binaerBaum_gewichten'] = {
  init: function() {
    this.appendValueInput("binBaumVariable")
        .appendField("");
    this.appendDummyInput()
        .appendField(".baumGewichten()");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTBinTree);
 this.setTooltip("Ein Binärbaum wird gewichtet.");
 this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_binaerBaum_gewichten'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'binBaumVariable', Blockly.JavaScript.ORDER_ATOMIC);
  var code = value_varName + '.wurzel = ' + value_varName + '.baumGewichten(' + value_varName + '.wurzel);\n';  
  return code;
};