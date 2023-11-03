import requests

# simple get request
url = "https://requetes.infobrisson.fr/index.html"
response = requests.get(url)
print(response.headers)
print(response.text)

# get request with parameters
url = ("https://requetes.infobrisson.fr/"
       "reponse_formulaire.php"
       "?nom=Lovelace&prenom=Ada&age=36")
response = requests.get(url)
print(response.headers)
print(response.text)

# post request
url = ("https://requetes.infobrisson.fr/"
       "reponse_formulaire.php")
response = requests.post(url,
                         params={"nom": "Lovelace",
                                 "prenom": "Ada",
                                 "age": "36"})
print(response.text)