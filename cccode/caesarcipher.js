window.addEventListener('DOMContentLoaded', function() {
  
  var UserText = document.getElementById('text-to-work');
  var UserSelectStap = document.getElementById('encrypt-step');
  var UserStep = Number(UserSelectStap.value);
  var result = document.getElementById('output');
  var Encrypt = document.getElementById('encrypt-btn');
  var Decrypt = document.getElementById('decrypt-btn');
  var Reset = document.getElementById('btn-reset');
  var TextToWork; 

  var allowChars  =  ['0123456789',
					'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
					'abcdefghijklmmopqrstuvwxyz',
					'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ',
					'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя'];
  var allSets = allowChars.length;

  function ccode(chr,dec,offset){  // dec - true, if decode, false if encode
    var i = 0;
    var coded = "";
 
    while ((i<allSets) && (coded=="")){  
    
      chars = allowChars[i];   
      index = chars.indexOf(chr);
      if (index>-1){ 
        if (dec) {
          cidx = (index - offset) % chars.length; //decode
          if (cidx<0) {cidx =chars.length + cidx}
        } else {
          cidx = (index + offset) % chars.length; // encode
        }
      
          coded = chars[cidx];  
      }
      i++;
    }
    if (coded ==""){
      coded =chr
    }
    console.log(chr,':',coded);
    return coded
  }


  function encode(text) {
    var result = '';
    for (var i = 0; i < text.length; i++) {
      var symbol = ccode(text[i],false,UserStep);      
        result += symbol;
    }
    return result;
  }
  
  function decode(text) {
    var result = '';
    for (var i = 0; i < text.length; i++) {
      var symbol = ccode(text[i],true,UserStep);      
        result += symbol;
    }
    return result;
  }

  
  UserSelectStap.addEventListener('change', function() {
    UserStep = Number(this.value);    
  });


  Encrypt.addEventListener('click', function() {
    TextToWork = UserText.value;
    result.value = encode(TextToWork);
  });
  Decrypt.addEventListener('click', function() {
    TextToWork = UserText.value;
    result.value = decode(TextToWork);
  });
  Reset.addEventListener('click', function() {
    UserText.value = '';
    result.value = '';
  });
  
});
