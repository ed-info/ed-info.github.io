import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 1)
y = x ** 2

plt.plot(x, y)
plt.plot(y, x)

plt.show()