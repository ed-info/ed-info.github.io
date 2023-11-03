import numpy as np
import matplotlib.pyplot as plt

# generate random data-set
x = np.random.rand(100)
y = 3 * x + 2 + np.random.rand(100)

a, b, = np.polyfit(x, y, 1)

# plot
plt.figure()
plt.scatter(x, y, s=10)
plt.plot(x, a * x + b, 'r')
plt.xlabel('x')
plt.ylabel('y')
plt.show()