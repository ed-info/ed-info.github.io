from p5 import *

t = 0

def setup():
    createCanvas(600, 600)
    stroke(200, 40, 40)
    strokeWeight(3)
    fill(200, 40, 40)

def draw():
    global t

    background(231, 10)

    xAngle = map(mouseX, 0, width, -4 * PI, 4 * PI, True)
    yAngle = map(mouseY, 0, height, -4 * PI, 4 * PI, True)
    for x in range(0, width, 60):
        for y in range(0, height, 60):

            angle = xAngle * (x / width) + yAngle * (y / height)

            myX = x + 20 * cos(2 * PI * t + angle)
            myY = y + 20 * sin(2 * TWO_PI * t + angle)

            ellipse(myX, myY, 10)

    t = t + 0.01

run()
