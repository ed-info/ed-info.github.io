# Випадковий малюнок.
# map: map23.map
from robot import *
import random


def coin():
    """Випадкове True або False."""
    return random.randint(0, 1) == 1


try:
    while True:
        if coin() and (not frontIsObstacle()):
            forward(1)
        else:
            if coin():
                right()
                if frontIsObstacle():
                    left()
                    left()
            else:
                left()
                if frontIsObstacle():
                    right()
                    right()
            forward(1)

        if coin():
            paintWhite()
        else:
            paintBlack()
except CollisionError:
    # Впираємося в стіну — зупиняємося.
    print("Малюнок зупинився: робот впирається в перешкоду.")
