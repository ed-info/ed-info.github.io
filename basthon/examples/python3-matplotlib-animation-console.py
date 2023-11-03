# tiré de https://media.eduscol.education.fr/ftp_eduscol/2019/Ressources/Mathematiques/RA19_Lycee_G_1_MATH_Algorithmique_et_Programmation_activite_10.html
import matplotlib.pyplot as plt
from matplotlib.patches import Circle,RegularPolygon
import matplotlib.animation
from math import cos, sqrt, pi


def archimede(n):
    a = 2*sqrt(2)
    b = 4
    for i in range(n):
        b = (2*a*b)/(a+b)
        a = sqrt(b*a)
    return a,b
    
# nombre d'itérations (on initialise au cas du carré)
N = 4

fig, (ax1, ax2) = plt.subplots(1, 2,figsize=(6, 3))
l= .7
ax1.set_xlim(( -l, l))
ax1.set_ylim((-l, l))
ax2.set_xlim(( 4, 2**(N+1)))
ax2.set_ylim((3.05, 3.35))
approximationsInf = []
approximationsSup = []

cercle = Circle((0, 0), .5, facecolor='none',
                edgecolor=(0, 0, 0), linewidth=2, alpha=0.75)
courbeInf, = ax2.plot([],[],'-o',color="#1e7fcb")
courbeSup, = ax2.plot([],[],'-o',color='orange')
abscisse = []

def init():
    return []

def animate(i):
    abscisse.append(2**(i+2))
    inf,sup = archimede(i)
    approximationsInf.append(inf)
    approximationsSup.append(sup)
    ax1.clear()
    ax1.set_xlim(( -l, l))
    ax1.set_ylim((-l, l))
    ax1.add_patch(cercle)
    long = 0.5/cos(pi/(4*2**i))
    PI = RegularPolygon(numVertices = 4*2**i,xy=(0, 0), radius=.5, orientation=0.79,edgecolor="#1e7fcb", facecolor='none',
                linewidth=2, alpha=0.5)
    PS = RegularPolygon((0, 0), 4*2**i, radius=long, orientation=.79, facecolor='none',
                edgecolor='orange', linewidth=2, alpha=0.5)
    ax1.add_patch(PI)
    ax1.add_patch(PS)
    ax1.set_title('{} côtés'.format(4*2**i),color="#1e7fcb",fontsize=14)
    courbeInf.set_data(abscisse,approximationsInf)
    courbeSup.set_data(abscisse,approximationsSup)
    return PI,

ax2.plot([4,2**(N+1)],[pi,pi],'--',color='green')
ax2.legend(['Polygones intérieurs','Polygones extérieurs','$\pi$'])

ani = matplotlib.animation.FuncAnimation(fig, animate,init_func=init,  frames=N,blit=False,interval=750)

ani.show()