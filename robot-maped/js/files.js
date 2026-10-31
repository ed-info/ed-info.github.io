/*
 * files.js — читання та збереження (.map та .irobo).
 *
 * .map  — текст у кодуванні ASCII/UTF-8.
 * .irobo — UTF-16LE з BOM (так їх пише додаток).
 */

(function (global) {
  "use strict";

  var RM = global.RMApp = global.RMApp || {};

  /** Читає файл як ArrayBuffer (для .irobo потрібні байти). */
  function readFile(file, as) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error); };
      if (as === "buffer") reader.readAsArrayBuffer(file);
      else reader.readAsText(file, "utf-8");
    });
  }

  /** Розпізнає кодування .irobo: UTF-16 (LE або BE) з BOM або звичайний текст. */
  function decodeScript(buffer) {
    var bytes = new Uint8Array(buffer);
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder("utf-16le").decode(bytes.subarray(2));
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder("utf-16be").decode(bytes.subarray(2));
    }
    return new TextDecoder("utf-8").decode(bytes);
  }

  /** Готує .irobo до збереження: UTF-16BE з BOM (як в додатку). */
  function encodeScript(text) {
    var out = [0xfe, 0xff];
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      out.push((code >> 8) & 0xff, code & 0xff);
    }
    return new Uint8Array(out);
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  RM.files = {
    readFile: readFile,
    decodeScript: decodeScript,
    encodeScript: encodeScript,
    download: download,
  };
})(typeof window !== "undefined" ? window : this);
