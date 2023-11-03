from p5 import *

capture = None

def setup():
    global capture
    createCanvas(390, 240)
    capture = createCapture(VIDEO)
    capture.size(320, 240)

def draw():
    background(255)
    image(capture, 0, 0, 320, 240)

run()
