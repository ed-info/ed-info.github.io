import requests
import gzip
import json
import numpy as np
import matplotlib.pyplot as plt

url = ("https://sig.infobrisson.fr/"
       "france.continental-borders.proj.json.gz")
response = requests.get(url)
france = gzip.decompress(response.content).decode()
france = np.asarray(json.loads(france))

plt.gca(aspect='equal')

plt.plot(*france.T)

plt.axis("off")
plt.show()