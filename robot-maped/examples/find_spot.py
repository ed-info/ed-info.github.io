# Пошук білої плями.
# Робот йде вздовж стіни, поки не побачить білу пляму ліворуч, і стає на неї.
# map: map12.map
from robot import *

while True:
    if (not leftIsObstacle()) and leftIsWhite():
        right()
        backward(1)
        break
    else:
        forward(1)
