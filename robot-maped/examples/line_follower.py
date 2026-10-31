# Слідохід по білій лінії.
# Робот сам знаходить білий слід і рухається вздовж нього.
# map: map10.map
from robot import *

# Підходимо до початку лінії
right()
forward(8)

# Дивимось, де білий фарб, і робимо крок
while True:
    if frontIsWhite():
        forward(1)
    elif rightIsWhite():
        right()
    elif leftIsWhite():
        left()
    elif frontIsObstacle():
        break
