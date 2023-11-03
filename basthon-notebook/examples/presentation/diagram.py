import matplotlib.pyplot as plt


plt.xkcd()


class Diagram(object):
    """
    """
    def __init__(self, **kwargs):
        figargs = {}
        figsize = kwargs.pop('figsize', None)
        if figsize is not None:
            figargs['figsize'] = figsize
        self._size = kwargs.pop('size', 15)
        self._fig = plt.figure(**figargs)
        self._fig.clf()
        self._ax = self._fig.gca(**kwargs)

    def node(self, x, y, text):
        return self._ax.text(x, y, text, ha="center", va="center", size=self._size,
                             bbox=dict(boxstyle="round4,pad=1", fc="0.9", lw=1.5))

    def between(self, text, nodeA, nodeB, **kwargs):
        rad = kwargs.pop('rad', 0)
        pA, pB = nodeA.get_position(), nodeB.get_position()
        kwargs.setdefault('arrowstyle', "->")
        kwargs.setdefault('connectionstyle', f"arc3,rad={rad}")
        kwargs.setdefault('patchA', nodeA)
        kwargs.setdefault('patchB', nodeB)
        kwargs.setdefault('shrinkA', 5)
        kwargs.setdefault('shrinkB', 5)
        kwargs.setdefault('lw', 1.5)
        self._ax.annotate('', xytext=pA, xy=pB, xycoords='data', textcoords='data', arrowprops=kwargs)
        return self._ax.text((pA[0] + pB[0]) / 2, (pA[1] + pB[1]) / 2 - rad * 0.2,
                             text, ha="center", va="center", size=self._size * 11/15)

    def info(self, x, y, text, to=None, **kwargs):
        rad = kwargs.get('rad', 0)
        patch = self._ax.text(x, y, text, ha="left", va="center", size=self._size * 11/15,
                              bbox=dict(boxstyle="square,pad=0.5", fc="white", lw=1.5))
        if to is not None:
            self._ax.annotate('', xytext=(x, y), xy=to, xycoords='data', textcoords='data',
                              arrowprops=dict(arrowstyle="-", connectionstyle=f"arc3,rad={rad}",
                                              patchA=patch, shrinkA=5, shrinkB=5, lw=1.5))
            return patch

    def show(self):
        plt.axis("off")
        plt.show()
