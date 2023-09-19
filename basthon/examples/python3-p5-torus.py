from p5 import *

def setup():
    createCanvas(710, 400, WEBGL)

def draw():
    background(238)

    normalMaterial()
    push()
    rotateZ(frameCount * 0.01)
    rotateX(frameCount * 0.01)
    rotateY(frameCount * 0.01)
    torus(120, 40)
    pop()

run()