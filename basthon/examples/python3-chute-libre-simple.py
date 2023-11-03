# Chronophotographie

# tiré de https://eduscol.education.fr/1648/programmes-et-ressources-en-physique-chimie-voie-gt

# Cette activité a pour but d’exploiter une
# chronophotographie de la chute d’une bille.

# Capacité numérique mise en œuvre :
# représenter les positions successives d’un système
# modélisé par un point lors d’une évolution
# unidimensionnelle ou bidimensionnelle à l’aide
# d’un langage de programmation.

import numpy as np
import matplotlib.pyplot as plt

# Sur une chronophotographie (photo imprimée ou
# vidéo ouverte dans un logiciel de pointage),
# on a pointé les positions successives de la balle
# et relevé les positions successives dans le tableau
# ci dessous.

ymes = np.array([-0, -0.7, -1.5, -2.3, -3.5, -4.5, -5.9, -7.7, -8.8,
                 -10.6, -12.3, -14.2, -16.4, -18.5, -21, -23.5])
                 
# Ici, l’expérience dure 0,25 s et correspond à
# 16 points de mesure : il faut donc engendrer 16
# instants entre de 0 à 0,25 s (durée de l’expérience).
# Une base de temps, c’est-à-dire un tableau des
# valeurs de t, peut être construit de manière
# automatique, à l’aide de la fonction `np.linspace`.
# Les trois arguments utilisés sont le début,
# la fin, le nombre de pas.

t = np.linspace(0, 0.25, 16)

# L’ordonnée réelle est enfin calculée à partir
# de l’ordonnée mesurée sur la chronophotographie.
# L’échelle de la photo étant de 2/100, numpy permet
# de multiplier directement toutes valeurs du tableau
# ymes par l’échelle et d’automatiser la conversion.
# Les nouvelles valeurs sont rassemblées dans le
# tableau yreelle. Les fonctions utilisées ensuite
# servent à « personnaliser » le graphe : étiquettes
# pour l’abscisse et pour l’ordonnée, grille, légende
# et titre.

yreelle = ymes * 2/100

plt.figure()

plt.plot(t, yreelle, 'ro', label="y=f(t)")
plt.xlabel("temps")
plt.ylabel("yreelle")
plt.grid()
plt.legend()
plt.title("chute libre")

plt.show()