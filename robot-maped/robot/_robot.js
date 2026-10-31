/*
 * _robot.js — міст між Python-модулем `robot` і моделлю світу.
 *
 * Це вбудований модуль Skulpt ($builtinmodule): Python-код
 *
 *     from _robot import call
 *
 * отримує функцію `call`, яка виконує команду над моделлю світу
 * (див. world.js) і повертає результат у Python.
 *
 * Рух виконується по одній клітинці, між клітинками програма
 * призупиняється — так робот рухається на екрані (див. app.js,
 * RM.gate() та RM.commandGate()).
 */

var $builtinmodule = function () {
  "use strict";

  var RM = (typeof window !== "undefined" && window.RMApp) ||
           (typeof globalThis !== "undefined" && globalThis.RMApp);
  if (!RM) throw new Error("Середовище не завантажене: немає window.RMApp");
  RM.createMapWindow();
  // Відкриваємо вікно, якщо воно закрите
  if (RM.app && RM.app.openMap) {
    RM.app.openMap();
  }

  var mod = {};

  /**
   * Спеціальний виняток: робот наштовхнувся на перешкоду.
   * Програма зупиняється, але його можна перехопити:
   *     try:
   *         forward(10)
   *     except robot.CollisionError:
   *         print("впираємося")
   */
  var CollisionError = Sk.abstr.buildNativeClass("CollisionError", {
    constructor: function CollisionError(...args) {
      Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
  });
  mod.CollisionError = CollisionError;

  /**
   * Спеціальний виняток: робот вийшов за межі карти.
   * Програма зупиняється, але його можна перехопити:
   *     try:
   *         forward(10)
   *     except robot.OutOfBoundsError:
   *         print("поза межами")
   */
  var OutOfBoundsError = Sk.abstr.buildNativeClass("OutOfBoundsError", {
    constructor: function OutOfBoundsError(...args) {
      Sk.builtin.Exception.apply(this, args);
    },
    base: Sk.builtin.Exception,
  });
  mod.OutOfBoundsError = OutOfBoundsError;

  function world() {
    var w = RM.getWorld();
    if (!w) throw new Sk.builtin.RuntimeError("Немає завантаженої карти");
    return w;
  }

  function toPy(v) {
    if (v === null || v === undefined) return Sk.builtin.none.none$;
    if (typeof v === "boolean") return v ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
    if (typeof v === "number") return new Sk.builtin.int_(Math.round(v));
    return new Sk.builtin.str(v);
  }

  function toInt(v, def) {
    if (v === undefined || v === null) return def === undefined ? 1 : def;
    var n = Sk.ffi.remapToJs(v);
    n = Math.round(Number(n));
    if (!isFinite(n)) n = 0;
    return n;
  }

  function dirOf(w, which) {
    if (which === "left") return (w.robot.dir + 3) % 4;
    if (which === "right") return (w.robot.dir + 1) % 4;
    return w.robot.dir;
  }

  var DIR_NAMES = ["north", "east", "south", "west"];

  /**
   * Рух на steps клітинок: по клітинці, між клітинками — пауза
   * (RM.gate()), щоб рух було видно на екрані.
   * Наїзд на перешкоду — виняток CollisionError: програма зупиняється.
   */
  function moveSteps(steps, moveOne) {
    if (steps <= 0) return Promise.resolve(0);
    var done = 0;
    function step() {
      if (RM.stopped) throw new Sk.builtin.RuntimeError("Виконання зупинено");
      if (moveOne() === 0) {
        // Робот не зміг просунутися — перешкода або вихід за межі карти.
        var w = world();
        if (w.robot.outOfBounds) {
          throw new OutOfBoundsError("Робот вийшов за межі карти у клітинці (" +
                                     w.robot.x + ", " + w.robot.y + ")");
        }
        throw new CollisionError("Робот наштовхнувся на перешкоду у клітинці (" +
                                 w.robot.x + ", " + w.robot.y + ")");
      }
      done += 1;
      // Пауза після кожної клітинки — рух видно на екрані (раніше пауза
      // була лише між клітинками, тому forward(1) ішов зовсім без паузи).
      return RM.gate().then(function () {
        return done >= steps ? done : step();
      });
    }
    return Promise.resolve().then(step);
  }

  /**
   * Робота лапки: висувається вперед, бере Energon і повертається.
   */
  function withGripper(action) {
    var w = world();
    w.robot.gripper = "reach";
    RM.onRobotCommand("gripper");
    return RM.gripperGate()
      .then(function () {
        if (RM.stopped) throw new Sk.builtin.RuntimeError("Виконання зупинено");
        return action();
      })
      .then(function (result) {
        w.robot.gripper = "rest";
        RM.onRobotCommand("gripper");
        return RM.gripperGate().then(function () { return result; });
      });
  }

  // Назва функції — не «зарезервована» в Skulpt (call, name, length тощо
  // мають спеціальне кодування), тому кликаємо її command.
  mod.command = new Sk.builtin.func(function (op) {
    if (RM.stopped) throw new Sk.builtin.RuntimeError("Виконання зупинено");
    var args = [];
    for (var i = 1; i < arguments.length; i++) {
      args.push(Sk.ffi.remapToJs(arguments[i]));
    }
    var name = Sk.ffi.remapToJs(op);
    var w = world();
    var value;
    var promise = null;

    switch (name) {
      case "forward":
        promise = moveSteps(toInt(args[0]), function () { return w.moveForward(1); });
        break;
      case "backward":
        promise = moveSteps(toInt(args[0]), function () { return w.moveBackward(1); });
        break;
      case "left":
        w.turnLeft();
        break;
      case "right":
        w.turnRight();
        break;
      case "north":
      case "south":
      case "east":
      case "west":
        w.faceTo(RM.DIRS[name.toUpperCase()]);
        promise = moveSteps(toInt(args[0]), function () { return w.moveForward(1); });
        break;

      case "paintWhite":
        w.setPaintMode("w");
        break;
      case "paintBlack":
        w.setPaintMode("b");
        break;
      case "stopPainting":
        w.setPaintMode("off");
        break;
      case "clearPaint":
        value = w.clearPaint();
        break;

      case "pickUp":
        promise = withGripper(function () {
          var ok = w.pickUp();
          if (ok) {
            // Зібрали ще один Energon — збільшуємо лічильник.
            w.collect += 1;
            RM.onCollect(w.collect, w.totalEnergons);
          }
          return ok;
        });
        break;

      case "frontIsObstacle":
      case "frontIsClear":
      case "frontIsEnergon":
      case "frontIsWhite":
      case "frontIsBlack":
      case "leftIsObstacle":
      case "leftIsClear":
      case "leftIsEnergon":
      case "leftIsWhite":
      case "leftIsBlack":
      case "rightIsObstacle":
      case "rightIsClear":
      case "rightIsEnergon":
      case "rightIsWhite":
      case "rightIsBlack": {
        var which = name.slice(0, name.indexOf("Is"));
        var seen = w.lookAt(dirOf(w, which));
        var kind = name.substring(name.indexOf("Is"));
        if (kind === "IsObstacle") value = seen.obstacle;
        else if (kind === "IsClear") value = !seen.obstacle;
        else if (kind === "IsEnergon") value = seen.energon;
        else if (kind === "IsWhite") value = seen.white;
        else if (kind === "IsBlack") value = seen.black;
        break;
      }

      case "position":
        value = new Sk.builtin.tuple([new Sk.builtin.int_(w.robot.x), new Sk.builtin.int_(w.robot.y)]);
        break;
      case "direction":
        value = DIR_NAMES[w.robot.dir];
        break;
      case "EnergonLeft":
        value = w.energons.length;
        break;
      case "collected":
        value = w.collect;
        break;
      case "EnergonTotal":
        value = w.totalEnergons;
        break;
      case "setSpeed":
        value = RM.setSpeed(toInt(args[0], 5));
        break;
      case "getSpeed":
        value = RM.getSpeed();
        break;
      case "skin":
        value = RM.setSkin(args[0] === undefined ? "default" : args[0]);
        break;
      case "isPainted":
        value = w.isPainted(toInt(args[0], 0), toInt(args[1], 0));
        break;

      default:
        throw new Sk.builtin.NameError("Невідома команда робота: " + name);
    }

    RM.onRobotCommand(name);

    if (promise) {
      return Sk.misceval.promiseToSuspension(promise.then(function (steps) {
        return RM.commandGate().then(function () { return toPy(steps); });
      }));
    }
    return toPy(value);
  });

  return mod;
};
