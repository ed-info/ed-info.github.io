import numpy as np
from scipy.integrate import odeint
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D


def lorenz(p, t, s=10, r=28, b=2.667):
    '''
    Given:
       p: a point of interest in three dimensional space
       s, r, b: parameters defining the lorenz attractor
    Returns:
       x_dot, y_dot, z_dot: values of the lorenz attractor's partial
           derivatives at the point x, y, z
    '''
    x, y, z = p
    x_dot = s*(y - x)
    y_dot = r*x - y - x*z
    z_dot = x*y - b*z
    return x_dot, y_dot, z_dot

# Times where we compute the solution
num_steps = 10 ** 4
t = np.linspace(0, 100, num_steps)

# Set initial values
p0 = (0., 1., 1.05)

p = odeint(lorenz, p0, t)

# Plot
fig = plt.figure()
ax = plt.axes(projection='3d')


# Make the line multi-coloured by plotting it in segments of length s which
# change in colour across the whole time series.
s = 10
c = np.linspace(0, 1, num_steps)
for i in range(0, num_steps-s, s):
    ax.plot(p[i:i+s+1, 0], p[i:i+s+1, 1], p[i:i+s+1, 2], color=(1,c[i],0), alpha=0.4, lw=0.5)

ax.set_xlabel("X Axis")
ax.set_ylabel("Y Axis")
ax.set_zlabel("Z Axis")

plt.show()
