# Прохід лабіринту.
# Робот завжди може вибратися з лабіринту, якщо йти вздовж однієї зі стін,
# і так він знаходить Energon.
# map: map21.map
from robot import *

while True:
    if rightIsObstacle():
        if frontIsClear():
            forward(1)
        else:
            left()
    else:
        right()
        forward(1)

    if frontIsEnergon():
        pickUp()
        break
