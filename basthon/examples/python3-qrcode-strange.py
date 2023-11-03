import qrcode
from urllib.parse import quote
import js

script = quote(js.ace.edit("editor").getValue())
url = f"https://console.basthon.fr/?script={script}"

img = qrcode.make(url)

img.show()
