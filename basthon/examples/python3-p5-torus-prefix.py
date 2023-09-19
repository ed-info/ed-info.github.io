import p5

def setup():
  p5.createCanvas(710, 400, p5.WEBGL)

def draw():
  p5.background(238)

  p5.normalMaterial()
  p5.push()
  p5.rotateZ(p5.frameCount * 0.01)
  p5.rotateX(p5.frameCount * 0.01)
  p5.rotateY(p5.frameCount * 0.01)
  p5.torus(120, 40)
  p5.pop()

p5.run()