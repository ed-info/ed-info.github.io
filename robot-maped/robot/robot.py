"""Модуль ``robot`` — керування роботом у середовищі.

Програма пишеться на Python (виконується рушієм Skulpt), а можливості
робота доступні через цей модуль:

    from robot import *

    paintWhite()
    for i in range(4):
        forward(2)
        right()
    stopPainting()

Або без імпортування «всього»:

    import robot

    robot.forward(2)
    if robot.frontIsClear():
        robot.forward(1)

Усі рухи виконуються в клітинках карти (200px у натуральному розмірі).
Перешкодами вважаються клітинки з літерами A..Z, як у оригінальному
порожні клітинки, клітинка старту та Energon — прохідні.
"""

# Міст до рушія: _call("forward", 2) виконує команду над моделлю світу.
# «command» — назва функції в JS-модулі _robot (не «зарезервована» в Skulpt).
from _robot import command as _call
from _robot import CollisionError
from _robot import OutOfBoundsError

__all__ = [
    "forward", "backward", "left", "right",
    "north", "south", "east", "west",
    "paintWhite", "paintBlack", "stopPainting", "clearPaint",
    "pickUp",
    "frontIsObstacle", "frontIsClear", "frontIsEnergon",
    "frontIsWhite", "frontIsBlack",
    "leftIsObstacle", "leftIsClear", "leftIsEnergon",
    "leftIsWhite", "leftIsBlack",
    "rightIsObstacle", "rightIsClear", "rightIsEnergon",
    "rightIsWhite", "rightIsBlack",
    "position", "direction", "setSpeed", "getSpeed", "skin",
    "EnergonLeft", "isPainted",
    "collected", "EnergonTotal",
    "CollisionError",
    "OutOfBoundsError",
]


# --- рух ------------------------------------------------------------------

def forward(steps=1):
    """Їде вперед на ``steps`` клітинок.

    Якщо попереду перешкода, виникає ``CollisionError`` і програма
    зупиняється (перехопити: ``except robot.CollisionError:``).
    """
    return _call("forward", steps)


def backward(steps=1):
    """Їде назад на ``steps`` клітинок.

    Наїзд на перешкоду — виняток ``CollisionError``.
    """
    return _call("backward", steps)


def left():
    """Повертається на 90° вліво."""
    return _call("left")


def right():
    """Повертається на 90° вправо."""
    return _call("right")


def north(steps=1):
    """Повертається на північ і їде ``steps`` клітинок."""
    return _call("north", steps)


def south(steps=1):
    """Повертається на південь і їде ``steps`` клітинок."""
    return _call("south", steps)


def east(steps=1):
    """Повертається на схід і їде ``steps`` клітинок."""
    return _call("east", steps)


def west(steps=1):
    """Повертається на захід і їде ``steps`` клітинок."""
    return _call("west", steps)


# --- фарбування -----------------------------------------------------------

def paintWhite():
    """Опускає пензель з білою фарбою: robot їде й залишає білу лінію."""
    return _call("paintWhite")


def paintBlack():
    """Опускає пензель з чорною фарбою."""
    return _call("paintBlack")


def stopPainting():
    """Піднімає пензель."""
    return _call("stopPainting")


def clearPaint():
    """Видаляє фарбування у клітинці, де стоїть робот. Повертає True/False."""
    return _call("clearPaint")


# --- Energon ----------------------------------------------------------------

def pickUp():
    """Підбирає Energon, який стоїть перед роботом. Повертає True/False."""
    return _call("pickUp")


# --- зір ------------------------------------------------------------------

def frontIsObstacle():
    """True, якщо перед роботом перешкода."""
    return _call("frontIsObstacle")


def frontIsClear():
    """True, якщо перед роботом вільно."""
    return _call("frontIsClear")


def frontIsEnergon():
    """True, якщо перед роботом Energon."""
    return _call("frontIsEnergon")


def frontIsWhite():
    """True, якщо перед роботом біла фарба."""
    return _call("frontIsWhite")


def frontIsBlack():
    """True, якщо перед роботом чорна фарба."""
    return _call("frontIsBlack")


def leftIsObstacle():
    """True, якщо зліва перешкода."""
    return _call("leftIsObstacle")


def leftIsClear():
    """True, якщо зліва вільно."""
    return _call("leftIsClear")


def leftIsEnergon():
    """True, якщо зліва Energon."""
    return _call("leftIsEnergon")


def leftIsWhite():
    """True, якщо зліва біла фарба."""
    return _call("leftIsWhite")


def leftIsBlack():
    """True, якщо зліва чорна фарба."""
    return _call("leftIsBlack")


def rightIsObstacle():
    """True, якщо справа перешкода."""
    return _call("rightIsObstacle")


def rightIsClear():
    """True, якщо справа вільно."""
    return _call("rightIsClear")


def rightIsEnergon():
    """True, якщо справа Energon."""
    return _call("rightIsEnergon")


def rightIsWhite():
    """True, якщо справа біла фарба."""
    return _call("rightIsWhite")


def rightIsBlack():
    """True, якщо справа чорна фарба."""
    return _call("rightIsBlack")


# --- стан -----------------------------------------------------------------

def position():
    """Повертає кортеж (x, y) — клітинку, де стоїть робот."""
    return _call("position")


def direction():
    """Повертає напрямок робота: 'north', 'east', 'south' або 'west'."""
    return _call("direction")


def setSpeed(v):
    """Встановлює швидкість робота: 0 — найповільніше, 10 — найшвидше.

    Повертає фактично встановлений рівень (0–10).
    """
    return _call("setSpeed", v)


def getSpeed():
    """Повертає поточний рівень швидкості робота (0–10)."""
    return _call("getSpeed")


def skin(name="default"):
    """Перемикає скін карти.

    ``name`` — назва скіну: ``grass``, ``desert``, ``mind``, ``lego``
    або ``default``. Повертає застосовану назву скіну.
    """
    return _call("skin", name)


def EnergonLeft():
    """Повертає кількість Energon, які ще лежать на карті."""
    return _call("EnergonLeft")


def collected():
    """Повертає кількість Energon, які вже зібрав робот.

    Те саме, що змінна ``collect`` у програмі.
    """
    return _call("collected")


def EnergonTotal():
    """Повертає кількість Energon, які були на карті при її завантаженні."""
    return _call("EnergonTotal")


def isPainted(x, y):
    """True, якщо клітинка (x, y) пофарбована."""
    return _call("isPainted", x, y)
