// Marty the Robot Javascript interface

// USAGE
// instantiate a marty with marty = new Marty(ip, name)

// READING SENSORS
// to minimise network traffic, only sensors that are queried in js will be read from Marty
// to reduce operation lag, each sensor will then be read repeatedly and the value stored in a local cache.
// if the value is not requested within a period of time, the sensor will become idle again
// use get_sensor("sensor") to request sensor data, if a sensor is idle it will return null, and the api will start querying that sensor
// calling get_sensor on a recently read sensor will return the value from cache instantly

// CONTROLLING MARTY
// when the websocket connects to Marty, enable_safeties and lifelike_behaviours will both be enabled
// lifelike_behaviours can be disabled if required, using lifelike_behaviours(false)


// sensor request array
var req = new Object();
(function() {
req["battery"] = new Uint8Array([0x01, 0x01, 0x00]);
  var i=0;
  for (i=0; i<3; i++) {req["acc"+i] = new Uint8Array([0x01, 0x02, i]);}
  for (i=0; i<8; i++) {req["mc"+i] = new Uint8Array([0x01, 0x03, i]);}
  for (i=0; i<8; i++) {req["gpio"+i] = new Uint8Array([0x01, 0x04, i]);}
  for (i=0; i<9; i++) {req["mp"+i] = new Uint8Array([0x01, 0x06, i]);}
  for (i=0; i<9; i++) {req["enabled"+i] = new Uint8Array([0x01, 0x07, i]);}
  req["chatter"] = new Uint8Array([0x01, 0x05, 0x00]);
  req["prox"] = new Uint8Array([0x01, 0x08, 0x00]);
})();
var sensorInt;

function Marty(IP, name){
  this.ip = IP;
  this.name = name;
  var i=0;

  // codes
  this.direction = [];
  this.direction["left"] = 0; this.direction["right"] = 1;
  this.direction["forward"] = 2; this.direction["backward"] = 3;
  this.direction["any"] = 4;

  // SENSORS
  this.sensors = [];
  // battery
  this.sensors["battery"] = new Sensor("battery", "battery");
  // Accelerometer
  this.sensors["acc0"] = new Sensor("acc0", "acc");
  this.sensors["acc1"] = new Sensor("acc1", "acc");
  this.sensors["acc2"] = new Sensor("acc2", "acc");
  // GPIOs
  for (i=0; i<8; i++){
    var sname = "gpio" + i;
    this.sensors[sname] = new Sensor(sname, "gpio");
  }
  // motor current
  for (i=0; i<8; i++){
    var sname = "mc" + i;
    this.sensors[sname] = new Sensor(sname, "motorCurrent");
  }
  // Motor Enabled bools
  for (i=0; i<9; i++){
    var sname = "enabled" + i;
    this.sensors[sname] = new Sensor(sname, "enabled");
  }
  // motor position
  for (i=0; i<9; i++){
    var sname = "mp" + i;
    this.sensors[sname] = new Sensor(sname, "motorPosition");
  }
  this.sensors["chatter"] = new Sensor("chatter", "chatter");
  this.sensors["prox"] = new Sensor("prox", "prox");

  // websocket stuff
  // TODO: generalise to allow other connection types - e.g. i2c for microbit

  this.url = "ws://" + IP + ":81/";

  this.connect = function(){
    this.socket = new WebSocket("ws://" + IP + ":81/");
    this.socket.binaryType = 'arraybuffer';
    this.socket.requests = [];
    this.socket.parent = this;
    this.alive = false;
    // set the number of requests that can be pending before we class the connection as dead and attempt to reconnect
    this.requests_limit = 200;


    this.socket.onmessage = function (event){
      var thisSensor = this.requests[0];
      this.requests.shift();
      this.parent.alive = true;
      var buf;
      switch (this.parent.sensors[thisSensor].type){
        case "chatter":
          var chatter = new Uint8Array(event.data);
          this.parent.sensors[thisSensor].value = String.fromCharCode.apply(null, chatter.slice(4, chatter.length));
          break;
        case "motorPosition":
        case "enabled":
          buf = new Int8Array(event.data);
          this.parent.sensors[thisSensor].value = buf[0];
          break;
        case "gpio":
        default:
          buf = new Float32Array(event.data);
          this.parent.sensors[thisSensor].value = buf[0];
          break;
      }
      this.parent.sensors[thisSensor].lastRead = Date.now();
      //update(thisSensor, buf[0]);

    }

    this.socket.onopen = function () {
      this.parent.enable_safeties();
      //this.parent.lifelike_behaviours(true);
      this.parent.get_firmware_version();
      this.parent.get_sensor("chatter");
      //sensorInt = setInterval(update_sensors, 100);
      if (this.parent.sensorInt){
        clearInterval(this.parent.sensorInt);
      }
      this.parent.sensorInt = setInterval(this.parent.update_sensors, 100, this.parent);
      this.parent.alive=true;
      this.requests = [];
    };

    this.socket.onclose = function(e){
      switch (e.code){
      case 1000:  // CLOSE_NORMAL
        console.log("WebSocket: closed");
        break;
      default:  // Abnormal closure
        this.parent.reconnect(e);
        break;
      }
      this.parent.alive=false;
      clearInterval(this.parent.sensorInt);
    };
  }
  this.connect();

  this.autoReconnectInterval = 1000;
  this.reconnect = function(e){
    if (this.sensorInt){
      clearInterval(this.sensorInt);
    }
    console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`,e);
    var that = this;
    setTimeout(function(){
      console.log("WebSocketClient: reconnecting...");
      that.connect();
    },this.autoReconnectInterval);
  }



  this.update_sensors = function(marty){
  //for (var m in martys){
    for (var s in marty.sensors){
      if (marty.sensors[s].lastRequested + 5000 > Date.now()){
        //console.log("sending request for: " + martys[m].sensors[s].name);
        marty.socket.requests.push(marty.sensors[s].name);
        marty.socket.send(req[marty.sensors[s].name]);
      }
    }
    // check to see if requests are getting responses. If not, connection is probably dead
    if (marty.socket.requests.length > marty.requests_limit){
      console.log('max requests hit. assuming connection dead');
      clearInterval(marty.sensorInt);
      marty.alive = false;
      marty.reconnect('not receiving responses. requests_limit hit');
      
    }
  }


  // Sensor functions
  // request_sensor sends out a socket request to get data for the specified sensor
  // the returned value will be handled by the socket receive function and stored in the sensor array
  this.request_sensor = function(sensorName){
    console.log("sending request for: " + sensorName);
    this.socket.requests.push(sensorName);
    this.socket.send(sensorName);
  }

  // get_sensor will return the value of a sensor, and mark that we are interested in it
  // if the sensor hasn't been read recently, this function will request a read and return null, 
  // and the script calling it should check again shortly 
  this.get_sensor = function(sensorName){
    this.sensors[sensorName].lastRequested = Date.now();
    if (this.sensors[sensorName].lastRead + 200 > Date.now()){
      return this.sensors[sensorName].value;
    } else {
      return null;
    }
  }


  // Command functions
  this.hello = function(mode){
    if (mode === undefined || (mode != 0 && mode != 1)){mode = 0x00;}
    this.socket.send(new Uint8Array([0x02, 0x02, 0x00, 0x00, mode]));
  }

  this.lean = function(dir, amount, move_time){
    if (amount < -100){amount = -100;} else if (amount > 100){amount = 100;}
    var cmd1 = new Uint16Array([move_time]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x05, 0x00, 0x02, this.direction[dir], amount]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    this.socket.send(cmd);
  }

  this.walk = function(steps, turn, move_time, step_length, side){
    if (side === undefined){side = "any";}
    var cmd1 = new Uint16Array([move_time]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x07, 0x00, 0x03, steps, turn]);
    var cmd2 = new Uint8Array([step_length, this.direction[side]]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length + cmd2.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    cmd.set(cmd2, cmd0.length+cmd1a.length);
    this.socket.send(cmd); 
  }

  this.kick = function(side, twist, move_time){
    if (twist < -100){twist = -100;} else if (twist > 100){twist = 100;}
    if (side != "left" && side != "right"){side = "left";}
    var cmd1 = new Uint16Array([move_time]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x05, 0x00, 0x05, this.direction[side], twist]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    this.socket.send(cmd);
  }

  this.celebrate = function(move_time){
    var cmd1 = new Uint16Array([move_time]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x03, 0x00, 0x08]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    this.socket.send(cmd); 
  }

  this.tap_foot = function(side){
    if (side != "left" && side != "right"){side = "left";}
    var cmd = new Uint8Array([0x02, 0x02, 0x00, 0x0A, this.direction[side]]);
    this.socket.send(cmd);
  }

  this.arms = function(r_angle, l_angle, move_time){
    if (r_angle < -127){r_angle = -127;} else if (r_angle > 127){r_angle = 127;}
    if (l_angle < -127){l_angle = -127;} else if (l_angle > 127){l_angle = 127;}
    var cmd1 = new Uint16Array([move_time]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x05, 0x00, 0x0B, r_angle, l_angle]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    this.socket.send(cmd);
  }

  this.sidestep = function(side, num_steps, move_time, step_length){
    if (side != "left" && side != "right"){side = "left";}
    var cmd1 = new Uint16Array([move_time]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x06, 0x00, 0x0E, this.direction[side], num_steps]);
    var cmd2 = new Uint8Array([step_length]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length + cmd2.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    cmd.set(cmd2, cmd0.length+cmd1a.length);
    this.socket.send(cmd); 
  }

  this.stand_straight = function(move_time){
    var cmd1 = new Uint16Array([move_time]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x03, 0x00, 0x0F]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    this.socket.send(cmd); 
  }

  this.play_sound = function(freq_start, freq_end, duration){
    var cmd1 = new Uint16Array([freq_start, freq_end, duration]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x07, 0x00, 0x10]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    this.socket.send(cmd);
  }

  this.stop = function(stop_type){
    this.socket.send(new Uint8Array([0x02, 0x02, 0x00, 0x11, stop_type]));
  }

  this.move_joint = function(jointID, position, move_time){
    if (position < -100){position = -100;} else if (position > 100){position = 100;}
    var cmd1 = new Uint16Array([move_time]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x05, 0x00, 0x12, jointID, position]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    this.socket.send(cmd);
  }

  this.enable_motors = function(enable_mode){
    if (enable_mode === undefined || (enable_mode != 0 && enable_mode != 1)){enable_mode = 0;}
    this.socket.send(new Uint8Array([0x02, 0x04, 0x00, 0x13, 0xFF, 0xFF, enable_mode]));
  }

  this.enable_motor = function(motorID, enable_mode){
    if (enable_mode === undefined || (enable_mode != 0 && enable_mode != 1)){enable_mode = 0;}
    var motorFlag = 1<<motorID;
    this.socket.send(new Uint8Array([0x02, 0x04, 0x00, 0x13, motorFlag&255, motorFlag>>8, enable_mode]));
  }

  this.disable_motors = function(disable_mode){
    if (disable_mode === undefined || (disable_mode != 0 && disable_mode != 1)){disable_mode = 0;}
    this.socket.send(new Uint8Array([0x02, 0x04, 0x00, 0x14, 0xFF, 0xFF, disable_mode]));
  }

  this.fall_protection = function(enabled){
    if (enabled === undefined || (enabled != true && enabled != false)){enabled = true;}
    this.socket.send(new Uint8Array([0x02, 0x02, 0x00, 0x15, enabled]));
  }

  this.motor_protection = function(enabled){
    if (enabled === undefined || (enabled != true && enabled != false)){enabled = true;}
    this.socket.send(new Uint8Array([0x02, 0x02, 0x00, 0x16, enabled]));
  }

  this.low_battery_cutoff = function(enabled){
    if (enabled === undefined || (enabled != true && enabled != false)){enabled = true;}
    this.socket.send(new Uint8Array([0x02, 0x02, 0x00, 0x17, enabled]));    
  }

  this.buzz_prevention = function(enabled){
    if (enabled === undefined || (enabled != true && enabled != false)){enabled = true;}
    this.socket.send(new Uint8Array([0x02, 0x02, 0x00, 0x18, enabled]));    
  }  

  this.set_io_type = function(io_number, io_type){
    this.socket.send(new Uint8Array([0x02, 0x03, 0x00, 0x19, io_number, io_type]));
  }

  this.io_write = function(io_number, value){
    var cmd1 = new Float32Array([value]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x06, 0x00, 0x1A, io_number]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    this.socket.send(cmd);    
  }

  this.i2c_write = function(bytes){
    data = new Uint8Array(bytes);
    var cmd0 = new Uint8Array([0x02, data.length, 0x00, 0x1B]);
    var cmd = new Uint8Array(cmd0.length + data.length);
    cmd.set(cmd0);
    cmd.set(data, cmd0.length);
    this.socket.send(cmd); 
  }

  this.circle_dance = function(side, move_time){
    if (side != "left" && side != "right"){side = "left";}
    var cmd1 = new Uint16Array([move_time]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x04, 0x00, 0x1C, this.direction[side]]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    this.socket.send(cmd);
  }

  this.lifelike_behaviours = function(enabled){
    if (enabled === undefined || (enabled != true && enabled != false)){enabled = true;}
    this.socket.send(new Uint8Array([0x02, 0x02, 0x00, 0x1D, enabled]));    
  }

  this.enable_safeties = function(){
    this.socket.send(new Uint8Array([0x02, 0x01, 0x00, 0x1E]));
  }

  this.set_lean_amount = function(amount){
    amount = min(200, max(0, amount));
    this.socket.send(new Uint8Array([0x02, 0x03, 0x00, 0x1F, 0x00, amount]));
  }

  this.set_servo_mult = function(servo_id, new_mult){
    var cmd1 = new Float32Array([new_mult]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x07, 0x00, 0x1F, 0x05, servo_id]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    console.log(cmd);
    this.socket.send(cmd);    
  }

  this.set_servo_buzz_min = function(servo_id, new_value){
    var cmd1 = new Float32Array([new_value]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x07, 0x00, 0x1F, 0x06, servo_id]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    console.log(cmd);
    this.socket.send(cmd);    
  }

  this.set_servo_buzz_max = function(servo_id, new_value){
    var cmd1 = new Float32Array([new_value]);
    var cmd1a = new Uint8Array(cmd1.buffer);
    var cmd0 = new Uint8Array([0x02, 0x07, 0x00, 0x1F, 0x07, servo_id]);
    var cmd = new Uint8Array(cmd0.length + cmd1a.length);
    cmd.set(cmd0);
    cmd.set(cmd1a, cmd0.length);
    console.log(cmd);
    this.socket.send(cmd);    
  }

  this.get_firmware_version = function(){
    this.socket.send(new Uint8Array([0x02, 0x01, 0x00, 0x20]));
  }

  this.clear_calibration = function(){
    this.socket.send(new Uint8Array([0x02, 0x01, 0x00, 0xFE])); 
  }

  this.save_calibration = function(){
   this.socket.send(new Uint8Array([0x02, 0x01, 0x00, 0xFF]));  
  }  

  // be careful with this function. It will take your Marty off the network and start it broadcasting a setup network again.
  this.reset_wifi = function(){
    this.socket.send(new Uint8Array([0x04, 0xFE, 0xFE]));
  }
}

function Sensor(name, type){
  this.name = name;
  this.type = type;
  this.lastRead = 0;
  this.lastRequested = 0;
  this.value = 0;
}

martys = {}