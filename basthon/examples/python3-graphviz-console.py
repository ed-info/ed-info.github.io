from graphviz import Digraph
import basthon

g = Digraph('G')

g.edge('Hello', 'World')

basthon.display(g)

print(g.source)

# png download (svg is also supported)
g.render(filename='hello_world', format='png', scale=2)
