# Збираємо всі Energon у ряд.
# map: map25.map
from robot import *

# Робот їде вперед, доки є вільний шлях, збираючи Energon по дорозі.
while True:
    if frontIsEnergon():
        pickUp()
    if frontIsClear():
        forward(1)
    else:
        break
