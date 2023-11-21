CodeMirror.defineSimpleMode("pseudocode", {
    start: [
      {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},
      // You can match multiple tokens at once. Note that the captured
      // groups must span the whole string in this case
      {regex: /(function)(\s+)([a-z$][\w$]*)/, token: ["keyword", null, "variable-2"]},
	  {regex: /(?:method|return|if|while|else|loop|until|from|then|output|input|end|to|Math)\b/, token: "keyword"},
      {regex: /функція|вершина|ламана|фігура|контур|товщина|анімація|результат|якщо|поки|інакше|цикл|для|не|від|то|вивести|ввести|кін|безанімації|до|точка|лінія|прямокутник|трикутник|коло|еліпс|фон|колір|чотирикутник|заповнення/, token: "keyword"},
      {regex: /true|false|істина|хиба|null|undefined/, token: "atom"},
      {regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i, token: "number"},
      {regex: /\/\/.*/, token: "comment"},
      {regex: /\/(?:[^\\]|\\.)*?\//, token: "comment"},
      {regex: /\/\*/, token: "comment", next: "comment"},
      {regex: /[-+\/*=<>!]+/, token: "operator"},
      {regex: /[A-ZА-Я$][A-Z0-9_$]*/, token: "variable"},
      {regex: /[a-zа-я$][a-z0-9_$]*/, token: "variable"},
      {regex: /\w+\(.*\)/, token: "variable-2"}
    ],

    comment: [
      {regex: /.*?\*\//, token: "comment", next: "start"},
      {regex: /.*/, token: "comment"}
    ],

    meta: {
      lineComment: "//"
    }
  });
