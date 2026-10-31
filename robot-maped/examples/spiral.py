# Малюємо спіраль, поки не впремемося в стіну.
from robot import *

# Спіраль — чорна
paintBlack()

amount = 1
try:
    while True:
        # Одне плече спіралі
        forward(amount)

        # Готуємо наступне плече
        left()
        amount = amount + 1
except CollisionError:
    # Впираємося в стіну — спиняємося.
    print("Спіраль зупинилася: робот впирається в перешкоду.")
