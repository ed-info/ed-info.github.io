var $builtinmodule = function(name) {
	var mod = {};
// mml player
var play_state = false;
var support = {audioContext: true, onended: false, stopTwice: true, isChrome: true, isSafari: false};
if (!/AppleWebKit\/537\.36/.test(navigator.userAgent)) support.isChrome = false;
if (/AppleWebKit/.test(navigator.userAgent) && !support.isChrome) support.isSafari = true;
if(window.AudioContext)
  audioctx = new window.AudioContext();
else{
  support.audioContext = false;
  audioctx = new (window.webkitAudioContext)();
}
var master = audioctx.createGain();
var masterGain = audioctx.createGain();
masterGain.gain.value = 0.3;
master.connect(masterGain);
// freeverb
var chromeProblem = 0;
var filterProblem = 'unknown';
if (support.isChrome || support.isSafari) chromeProblem = 128/audioctx.sampleRate;

function filterTest() {
  var b = audioctx.createBiquadFilter();
  var Fs = audioctx.sampleRate;
  b.type = 'lowpass';
  b.frequency.value = Fs * 0.25;
  b.Q.value = 20 * Math.log10(0.5);
  var aa = new Float32Array(1);
  var pp = new Float32Array(1);
  b.getFrequencyResponse(new Float32Array([Fs * 0.1]), aa, pp);
  if (Math.abs(aa[0] - 0.9045084) < 1e-5 && Math.abs(pp[0] - -0.6283185) < 1e-5) {
    filterProblem = 'ok';
  }
  if (Math.abs(aa[0] - 1.0508441) < 1e-5 && Math.abs(pp[0] - -0.3484485) < 1e-5) {
    filterProblem = 'no-negative-q';
  }
  if (Math.abs(aa[0] - 1.0556796) < 1e-5 && Math.abs(pp[0] - -0.3355522) < 1e-5) {
    filterProblem = 'old-formula';
  }
  support.filter = filterProblem;
}
filterTest();

function get_pole_for_allpass(x) {
  var xx = x * x;
  return (1 - xx) / (2*xx + 2);
}

function tune_to_b(b0, b1, b2) {
  var no = (b0 - b2) / 1.2;
  var lo_plus_hi = b0 + b2 - 2 * no;
  var lo = (lo_plus_hi + b1) * 0.5;
  var hi = (lo_plus_hi - b1) * 0.5;
  return [lo, hi, no];
}

function tune_to_a(Q) {
  if (Q <= 0) return [0.5, 0.5];
  var alpha = 1 / (2 * Q);
  var no = (1.2 + 2 * alpha) / (4 * alpha);
  var al = -(1.2 - 2 * alpha) / (4 * alpha);
  return [al * (1+alpha), no * (1+alpha)];
}

function makeFirstOrderFilter(ctx, b0, b1, a0, a1) {
  b0 /= a0;
  b1 /= a0;
  a1 /= a0;
  var Fs = ctx.sampleRate;
  var Q0 = Math.log10(filterProblem == 'old-formula' ? 25/24 : 1.2) * 20;

  var q = get_pole_for_allpass(a1);
  var w2 = tune_to_a(q);
  var w1 = tune_to_b(b0, b1 - a1*b0, -a1*b1);

  var biquad1 = ctx.createBiquadFilter();
  biquad1.type = 'lowpass';
  biquad1.frequency.value = Fs * 0.25;
  biquad1.Q.value = Q0;
  var g1 = ctx.createGain();
  g1.gain.value = w1[0];

  var biquad2 = ctx.createBiquadFilter();
  biquad2.type = 'highpass';
  biquad2.frequency.value = Fs * 0.25;
  biquad2.Q.value = Q0;
  var g2 = ctx.createGain();
  g2.gain.value = w1[1];

  var g0 = ctx.createGain();
  g0.gain.value = w1[2];

  var middle = ctx.createGain();
  middle.gain.value = w2[1];

  var biquad3 = ctx.createBiquadFilter();
  biquad3.type = 'allpass';
  biquad3.frequency.value = Fs * 0.25;
  biquad3.Q.value = q;
  var g3 = ctx.createGain();
  g3.gain.value = w2[0] / w2[1];

  var input = ctx.createGain();
  var output = ctx.createGain();
  input.connect(biquad1);
  input.connect(biquad2);
  input.connect(g0);
  biquad1.connect(g1);
  biquad2.connect(g2);
  g1.connect(middle);
  g2.connect(middle);
  g0.connect(middle);

  middle.connect(biquad3);
  middle.connect(output);
  biquad3.connect(g3);
  g3.connect(output);
  return {input: input, output: output};
}

function makeFirstOrderLowpassFilter(ctx, d) {
  var a = 1 - 1 / (2 * Math.PI * d / ctx.sampleRate + 1);
  return makeFirstOrderFilter(ctx, a, 0, 1, a-1);
}
function makeCombFilter(ctx, t, f, d) {
  var input = ctx.createDelay();
  input.delayTime.value = t - chromeProblem;
  var feed = ctx.createGain();
  feed.gain.value = f;
  var damp = makeFirstOrderLowpassFilter(ctx, d);
  input.connect(damp.input);
  damp.output.connect(feed);
  feed.connect(input);
  return {input: input, output: damp.output, feed: feed};
}
function makeAllpassComb(ctx, t, f) {
  var input = ctx.createGain();
  input.gain.value = 1;
  var delay = ctx.createDelay();
  delay.delayTime.value = t - chromeProblem;
  var feedback = ctx.createGain();
  feedback.gain.value = f;
  input.connect(feedback);
  feedback.connect(delay);
  delay.connect(input);
  var feed = ctx.createGain();
  feed.gain.value = -1;
  var delay2 = ctx.createDelay();
  delay2.delayTime.value = t;
  var feedforward = ctx.createGain();
  feedforward.gain.value = 1 + f;
  var out = ctx.createGain();
  input.connect(feed);
  feed.connect(out);

  input.connect(delay2);
  delay2.connect(feedforward);
  feedforward.connect(out);
  return {input: input, output: out, delay: delay};
}
var preDelay = audioctx.createDelay();
preDelay.delayTime.value = 0.15;
var preDelayFeedback = audioctx.createGain();
preDelayFeedback.gain.value = 0.4;
master.connect(preDelayFeedback);
preDelay.connect(preDelayFeedback);
preDelayFeedback.connect(preDelay);
var combChannel = audioctx.createChannelSplitter(2);

var delayT = [1557/44100, 1617/44100, 1491/44100, 1422/44100, 1277/44100, 1356/44100, 1188/44100, 1116/44100];
var filterFreq = [225, 556, 441, 341];
var allpassL = [], allpassR = [];
for (var i = 0; i < 4; i++) {
  allpassL[i] = makeAllpassComb(audioctx, filterFreq[i]/44100, 0.5);
  allpassR[i] = makeAllpassComb(audioctx, (filterFreq[i]-23)/44100, 0.5);
  if (i > 0) {
    allpassL[i-1].output.connect(allpassL[i].input);
    allpassR[i-1].output.connect(allpassR[i].input);
  }
}
combChannel.connect(allpassL[0].input, 0);
combChannel.connect(allpassR[0].input, 1);
for (var i = 0; i < 8; i++) {
  var a = makeCombFilter(audioctx, delayT[i], 0.7 + 0.28*0.8, 0.2*44100);
  preDelayFeedback.connect(a.input);
  a.output.connect(combChannel);
}
var merger = audioctx.createChannelMerger(2);
allpassL[3].output.connect(merger, 0, 0);
allpassR[3].output.connect(merger, 0, 1);
var revOut = audioctx.createGain();
revOut.gain.value = 0.03;
revOut.connect(masterGain);
merger.connect(revOut);
masterGain.connect(audioctx.destination);
var players = new Set();

function genPiano(){
  var len = 44100 * 2;
  var buff = audioctx.createBuffer(2, len + 44100 * 110 / 440, 44100);
  var dat = buff.getChannelData(0);
  var k = 440 / 44100 * Math.PI * 2;
  var s = [];
  var e = 1.2456;
  for(var n=0;n<40;n++){e = e * 2 % (Math.PI * 2); s.push(e);}
  for(var t = 0; t < len; t++){
    var sum = 0;
    for(var n = 1; n < 40; n++){
      sum += Math.sin(k * n * t + s[n]) / n * Math.exp(-(n - 1) * 0 - t*n/len);
    }
    dat[t] = sum * Math.exp(-t / (44100 * 0.5)) * 0.25;
  }
  for (var t = 0; t < 44100 * 110 / 440; t++){
    var sum = 0;
    for(var n = 1; n < 40; n++){
      sum += Math.sin(k * n * t + s[n]) * Math.exp(-(n - 1) * 0.25 - n);
    }
    dat[len + t] = sum * Math.exp(-len / (44100 * 0.5)) * 0.25;
  }
  buff.getChannelData(1).set(dat);
  return buff;
}


var soundBank =
  {
    fPiano: {sample: genPiano(), center: 69, loopStart: 2, loopEnd: 2.25, attack: 0, release: 0.05, release2: 0}    
  };
var fPiano = soundBank.fPiano;

function Player(sequence){
  this.seq = sequence;
  this.nodes = new Set();
  this.stopped = false;
  this.startTime = audioctx.currentTime;
  this.time = 0;
  this.segmentLength = 0.2;
  this.nextFire = 0.0;
  for(var id in this.seq){
    this.seq[id].pos = 0;
  }
}

Player.prototype.playNote = function(pitch,start,end){


  var src = audioctx.createBufferSource();
  var env = audioctx.createGain();
  var env2 = audioctx.createGain();
  play_state = false;
  src.addEventListener('ended', () => {
		play_state = true;// done!
	});
  
  
  src.buffer = fPiano.sample;
  src.playbackRate.value = Math.pow(2, (pitch - fPiano.center) / 12);
  src.loop = true;
  src.loopStart = fPiano.loopStart;
  src.loopEnd = fPiano.loopEnd;
  src.connect(env);
  env.connect(env2);
  env2.connect(master);
  var startTime = this.startTime + start;
  if(src.start)
    src.start(startTime);
  else {
    support.src_start = 'false';
    src.noteOn(startTime);
  }

  var endtime = this.startTime + end;
  env.gain.value = 0;
  env.gain.setValueAtTime(0, startTime);
  env.gain.linearRampToValueAtTime(1, Math.min(startTime + fPiano.attack, endtime));
  env2.gain.setValueAtTime(1, Math.max(startTime, endtime - fPiano.release2));
  env2.gain.linearRampToValueAtTime(0, endtime + fPiano.release);
  if(src.stop)
    src.stop(endtime + fPiano.release);
  else {
    src.noteOff(endtime + fPiano.release);
  }
  this.nodes.add(src);
  // onended doesn't work on Safari
  if(typeof src.onended === 'object'){
    var me = this;
    src.onended = function(){ me.nodes.delete(src); };
    support.onended = true;
  }
  return {env:env, src:src};
};

Player.prototype.nextSegment = function(){
  this.time += this.segmentLength;
  var more = false;
  if(!this.stopped){
    for(var id in this.seq){
      var part = this.seq[id];
      var time = part.time;
      var notes = part.notes;
      var i;
      for(i=part.pos; i<notes.length && time[i]<=this.time; i++){
        var chord = notes[i].chord;
        for(var j=0; j<chord.length; j++){
          this.playNote(chord[j].pitch + 12, time[i], time[chord[j].end]);
        }
      }
      part.pos = i;
      if(part.pos < notes.length){
        more = true;
      }
    }
  }
  if (!support.onended) {
    var nodes = new Set();
    for(var node of this.nodes){
      if(node.playbackState != 3){
        nodes.add(node);
      }
    }
    this.nodes = nodes;
  }
  this.stopped = !more;
};

Player.prototype.start = function () {
  this.startTime = audioctx.currentTime;
  this.nextFire = audioctx.currentTime;
  this.nextSegment();
  function loop(){
    if(this.stopped){
      if(this.nodes.size == 0)
        players.delete(this);
      else {
        setTimeout(loop.bind(this), 100);
      }
    }
    else{
      if(audioctx.currentTime > this.nextFire){
        this.nextFire += this.segmentLength;
        this.nextSegment();
      }
      setTimeout(loop.bind(this), 100);
    }
  }
  setTimeout(loop.bind(this), 100);
};
Player.prototype.stop = function () {
  for(var node of this.nodes){
    try{
      node.stop();
    }
    catch(e){
      node.disconnect();
      support.stopTwice = false;
    }
  }
  this.nodes.clear();
  this.stopped = true;
};

function play_(code){
	console.log(code);	
	console.log(unlocked);
	unlocked=true;
  if(!unlocked) return;
  
  var result = readMusic(code);
  combineTies(result.parts);
  combineTime(result.parts, result.tempo);
  result = result.parts;
  var player = new Player(result);
  players.add(player);
  setTimeout(function () {
    player.start();
    console.log(JSON.stringify(support));
  }, 0);
}

function stop(){
  for(var player of players){
    player.stop();
  }
  players.clear();
}

// for iOS only
var unlocked = false;
function unlock(){
  var src = audioctx.createBufferSource();
  src.buffer = fPiano.sample;
  src.connect(master);
  if (src.noteOn) src.noteOn(0);
  else if (src.start) src.start(0);
  window.removeEventListener('touchend', unlock);
  unlocked = true;
}

function Reader(str){
  this.data = str;
  this.pos = 0;
  this.keyAccidental = [ 0, 0, 0, 0, 0, 0, 0];
  this.keyPitch = [9, 11, 0, 2, 4, 5, 7];
  this.octave = 4;
  this.duration = 4;
  this.volume = 80;
  this.part = 0;
  this.partStates = {};
  this.chord = false;
  this.storedOctave = this.octave;
  this.storedVolume = this.volume;
}

Reader.prototype.next = function(){
  return this.data.charAt(this.pos++);
};

Reader.prototype.atEnd = function(){
  return this.pos >= this.data.length;
};

Reader.prototype.peek = function(){
  return this.data.charAt(this.pos);
};

Reader.prototype.rewind = function(){
  --this.pos;
};

Reader.prototype.nextInt = function(){
  var result = null;
  while (!this.atEnd()){
    var char = this.next();
    if (char >= '0' && char <= '9'){
      result = result*10 + parseInt(char);
    }
    else {
      this.rewind();
      break;
    }
  }
  return result;
};

Reader.prototype.nextFloat = function(){
  var integ = this.nextInt();
  if(integ === null){
    return null;
  }
  if(this.next() !== '.'){
    this.rewind();
    return integ;
  }
  var frac = 0;
  var base = 0.1;
  while (!this.atEnd()){
    var char = this.next();
    if (char >= '0' && char <= '9'){
      frac += parseInt(char) * base;
      base *= 0.1;
    }
    else {
      this.rewind();
      break;
    }
  }
  return integ + frac;
};

Reader.prototype.skipSpace = function(){
  var ch;
  do {
    ch = this.next();
  } while(/^\s$/.test(ch)) ;
  this.rewind();
};

Reader.prototype.nextInstr = function(){
  var ch;
  this.skipSpace();
  ch = this.next();
  var num;
  switch(ch.toUpperCase()){
    case 'C': case 'D': case 'E': case 'F': case 'G':
    case 'A': case 'B':
      return this.readNote(ch.toUpperCase());
    case 'K':
      return this.readKey();
    case ',': case '<':
      return {type: 'octave', octave: --this.octave};
    case "'": case '>':
      return {type: 'octave', octave: ++this.octave};
    case 'O':
      num = this.nextInt();
      if (num === null) num = 4;
      this.octave = num;
      return {type: 'octave', octave: this.octave};
    case 'L':
      num = this.nextInt();
      if(this.chord) return null;
      if (num === null || num < 1) num = 4;
      this.duration = num;
      return {type: 'duration', duration: this.duration};
    case '!':
      return this.readPart();
    case '/':
      if(!this.chord)
        this.switchChord(true);
      return {type: 'chord'};
    case 'P':
      return this.readRest();
    case 'V':
      num = this.nextInt();
      if (num === null) num = 80;
      this.volume = num;
      return {type:'volume', volume: this.volume};
    case 'T':
      num = this.nextFloat();
      if (this.chord) return null;
      if (num === null || num < 20) num = 120;
      return {type: 'tempo', bpm: num};
    case 'N':
      return this.readN();
    default:
      return null;
  }
};

Reader.prototype.readNote = function(pitch){
  var ptc = pitch.charCodeAt(0) - 65;
  var acci;
  var ch = this.next();
  switch(ch){
    case '+': case '#':
      ch = this.next();
      if(ch == '+' || ch == '#'){
        acci = 2;
      }
      else{
        this.rewind();
        acci = 1;
      }
      break;
    case '-':
      ch = this.next();
      if(ch == '-'){
        acci = -2;
      }
      else{
        this.rewind();
        acci = -1;
      }
      break;
    case '@':
      acci = 0;
      break;
    default:
      acci = this.keyAccidental[ptc];
      this.rewind();
  }
  pitch = this.octave * 12 + this.keyPitch[ptc] + acci;

  var duration = this.nextInt();
  if(duration == null){
    duration = this.duration;
  }

  var dots = 0;
  ch = this.next();
  while (ch == '.'){
    dots++;
    ch = this.next();
  }
  this.rewind();

  var volume = this.volume;
  var chord = this.chord;
  if(chord){
    this.switchChord(false);
  }
  else{
    this.storedOctave = this.octave;
    this.storedVolume = this.volume;
  }

  ch = this.next();
  var tied = false;
  if(ch == '~'){
    tied = true;
  }
  else{
    this.rewind();
  }
  return {type: 'note', duration: duration, dots: dots, pitch: pitch,
  chord: chord, tied: tied, volume: volume};
};

Reader.prototype.readN = function(){
  var pitch = this.nextInt();
  if(pitch == null){
    pitch = 0;
  }

  var dots = 0;
  ch = this.next();
  while (ch == '.'){
    dots++;
    ch = this.next();
  }
  this.rewind();

  var volume = this.volume;
  var chord = this.chord;
  if(chord){
    this.switchChord(false);
  }
  else{
    this.storedOctave = this.octave;
    this.storedVolume = this.volume;
  }

  ch = this.next();
  var tied = false;
  if(ch == '~'){
    tied = true;
  }
  else{
    this.rewind();
  }
  return {type: 'note', duration: this.duration, dots: dots, pitch: pitch,
    chord: chord, tied: tied, volume: volume};
};

Reader.prototype.readRest = function(){
  var duration = this.nextInt();
  if(duration == null){
    duration = this.duration;
  }

  var dots = 0;
  ch = this.next();
  while (ch == '.'){
    dots++;
    ch = this.next();
  }
  this.rewind();

  var chord = this.chord;
  if(chord){
    this.switchChord(false);
  }
  else{
    this.storedOctave = this.octave;
    this.storedVolume = this.volume;
  }

  return {type:'rest', duration: duration, dots: dots, chord: chord};
};

Reader.prototype.switchChord = function(){
  this.chord = !this.chord;
  var num = this.octave;
  this.octave = this.storedOctave;
  this.storedOctave = num;
  num = this.volume;
  this.volume = this.storedVolume;
  this.storedVolume = num;
};

Reader.prototype.endChord = function(){
  if(this.chord){
    this.octave = this.storedOctave;
    this.volume = this.storedVolume;
    this.chord = false;
  }
  else{
    this.storedOctave = this.octave;
    this.storedVolume = this.volume;
  }
};

Reader.prototype.readKey = function(){
  var ch = this.next().toUpperCase();
  if(!/[A-G]/.test(ch)){
    return null;
  }
  var key = ch.charCodeAt(0) - 64;
  key = key > 2 ? key - 2 : key + 5;
  var acci = 0;
  ch = this.next();
  switch(ch){
    case '+': case '#':
      acci = 1;
      break;
    case '-':
      acci = -1;
      break;
    default:
      acci = 0;
      this.rewind();
  }
  var keyTable = [
    //       pitch
    //A  B  C  D  E  F  G     key
    [ 0, 0, 0, 0, 0, 0, 0], // C
    [ 0, 0,+1, 0, 0,+1, 0], // D
    [ 0, 0,+1,+1, 0,+1,+1], // E
    [ 0,-1, 0, 0, 0, 0, 0], // F
    [ 0, 0, 0, 0, 0,+1, 0], // G
    [ 0, 0,+1, 0, 0,+1,+1], // A
    [+1, 0,+1,+1, 0,+1,+1]  // B
  ];
  var legal = ["ooo","oox","oox","xoo","oox","oox","oox"];
  if(legal[key-1].charAt(acci+1) == 'x'){
    acci = 0;
    this.rewind();
  }
  if(this.chord) return null;
  for(var i=0;i<7;i++){
    this.keyAccidental[i] = keyTable[key-1][i] + acci;
  }
  return {type: 'key', key: key, accidential: acci};
};

Reader.prototype.readPart = function(){
  this.endChord();
  var num = this.nextInt();
  if(!num) num = 0;
  this.partStates[this.part] = {
    octave: this.octave,
    duration: this.duration,
    volume: this.volume
  };
  var state = this.partStates[num];
  if (state){
    this.octave = state.octave;
    this.duration = state.duration;
    this.volume = state.volume;
  }
  else{
    this.octave = 4;
    this.duration = 4;
    this.volume = 80;
  }
  this.part = num;
  return {type: 'part', part: num};
};

function readMusic(code){
  var read = new Reader(code);
  var part = {id: 0, notes: []};
  var parts = {0: part};
  var note;
  var pitch;
  var pos = 0;
  var tempoChange = [];
  while(!read.atEnd()){
    var instr = read.nextInstr();
    if(instr == null){
      continue; // invalid character or instruction
    }
    if(instr.type == 'note'){
      pitch = {pitch: instr.pitch, tied: instr.tied, volume: instr.volume};
      if(instr.chord){
        note = part.notes[part.notes.length - 1];
        note.chord.push(pitch);
      }
      else{
        var len = 4 / instr.duration;
        if(instr.dots == 1) len *= 1.5;
        if(instr.dots >= 2) len *= 1.75;
        note = {chord: [pitch], len: len, pos: pos};
        pos += len;
        part.notes.push(note);
      }
    }
    else if(instr.type == 'rest'){
      if(!instr.chord){
        var len = 4 / instr.duration;
        if(instr.dots == 1) len *= 1.5;
        if(instr.dots >= 2) len *= 1.75;
        note = {chord: [], len: len, pos: pos};
        pos += len;
        part.notes.push(note);
      }
    }
    else if(instr.type == 'part'){
      var newPart = parts[instr.part];
      if(newPart){
        part = newPart;
        if(part.notes.length > 0){
          note = part.notes[part.notes.length-1];
          pos = note.pos + note.len;
        }
        else {
          pos = 0;
        }
      }
      else{
        part = {id: instr.part, notes: []};
        pos = 0;
        parts[instr.part] = part;
      }
    }
    else if(instr.type == 'tempo'){
      tempoChange.push({pos: pos, bpm: instr.bpm});
    }
  }
  tempoChange.sort(function(a,b){
    a = a.pos;
    b = b.pos;
    return a<b ? -1 : (a>b ? 1 : 0);
  });
  if(tempoChange.length == 0 || tempoChange[0].pos > 0){
    tempoChange.unshift({pos: 0, bpm: 120});
  }
  return {parts: parts, tempo: tempoChange};
}

function combineTies(parts){
  for(var id in parts){
    var part = parts[id];
    var notes = part.notes;
    for(var i=0; i<notes.length; i++){
      var chord = notes[i].chord;
      for(var j=0; j<chord.length; j++){
        if(chord[j].tied){
          var k, m;
          for(k=i+1; k<notes.length; k++){
            var next = notes[k].chord;
            for(m=0; m<next.length; m++){
              if(next[m].pitch == chord[j].pitch){
                break;
              }
            }
            var again = false;
            if (m < next.length){
              if(next[m].tied){
                again = true;
              }
              next[m] = next[next.length-1];
              next.length -= 1;
            }
            else{
              k--;
            }
            if(!again)
              break;
          }
          if(k >= notes.length) k = notes.length-1;
          chord[j].end = k+1;
        }
        else{
          chord[j].end = i+1;
        }
      }
    }
  }
  return parts;
}

function combineTime(parts, tempo){
  var tempoTime = [0];
  var time = 0;
  for(var i=1; i<tempo.length; i++){
    time += (tempo[i].pos - tempo[i-1].pos) * (60/tempo[i-1].bpm);
    tempoTime.push(time);
  }
  for(var id in parts){
    var part = parts[id];
    part.time = [0];
    var i = 0;
    var notes = part.notes;
    for(var j=0; j<notes.length; j++){
      var endPos = notes[j].pos + notes[j].len;
      do {
        i++;
      } while(i < tempo.length && tempo[i].pos < endPos);
      i--;
      part.time.push(tempoTime[i] + (endPos - tempo[i].pos) * (60/tempo[i].bpm));
    }
  }
}

//
	var play = function(melody){
		console.log("arguments.length=",arguments.length);
		console.log("arguments=",arguments);
		  for (let i = 1; i < arguments.length; i++) {
				play_(Sk.ffi.remapToJs(arguments[i]));
		}
		
	}
	
	play.co_kwargs = true;
	mod.play = new Sk.builtin.func(play);
	
	var playing = function() {
		 
			return Sk.ffi.remapToPy(!play_state);
	}
	mod.playing = new Sk.builtin.func(playing);
	
	var stop_playing = function() {
		stop();
	}
	mod.stop_playing = new Sk.builtin.func(stop_playing);	
	
	mod.TWINKLE = Sk.ffi.remapToPy("T100L8\nCCGGAAG4\nFFEEDDC4\nGGFFEED4\nGGFFEED4\nCCGGAAG4\nFFEEDDC4");
	mod.YEE = Sk.ffi.remapToPy("T120L12\nCD6C\nE4E4D6C4D3G6G4DE6D\nF4F4G6A6P\nB4");
	mod.LITTLEBEE =Sk.ffi.remapToPy("T100L8\nGEE4FDD4\nCDEFGGG4\nGEE4FDD4\nCEGGE2\nDDDDDEF4\nEEEEEFG4\nGEE4FDD4\nCEGGC2");			
	return mod;
};
