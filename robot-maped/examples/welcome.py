# Ласкаво просимо!
#
# Програма пишеться на Python. Можливості робота дає модуль robot:
#
#     from robot import *
#
# Нижче — як намалювати квадрат:
from robot import *

paintWhite()
for _ in range(4):
    forward(2)
    right()
stopPainting()
