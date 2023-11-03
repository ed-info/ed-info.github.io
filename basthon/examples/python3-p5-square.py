from p5 import *

x = 100
y = 100


def setup():
    createCanvas(200, 200)


def draw():
    background(0)
    fill(255)
    rect(x, y, 50, 50)


run()
