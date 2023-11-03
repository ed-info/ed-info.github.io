from p5 import *

# background image
bg = None

# texture for the particle
particle_texture = None

# variable holding our particle system
ps = None


def preload():
    global bg, particle_texture
    bg = loadImage("examples/basthon.png")
    particle_texture = loadImage("examples/particle_texture.png")


def setup():
    global ps
    # set the canvas size
    createCanvas(640, 360)
    # specific to Basthon, useless for standard p5js (see documentation)
    update_variables()
    # initialize our particle system
    ps = ParticleSystem(0, createVector(width / 2, 0.8 * height),
                        particle_texture)


def draw():
    imageMode(CORNER)
    background(bg)

    dx = map(mouseX, 0, width, -1, 1)
    wind = createVector(dx, 0)

    ps.applyForce(wind)
    ps.run()
    for i in range(3):
        ps.addParticle()

    # Draw an arrow representing the wind force
    drawVector(wind, createVector(width / 2, 10, 0), 200)


def drawVector(v, loc, scale):
    """
    This function draws an arrow showing the direction our "wind" is blowing.
    """
    push()
    arrowsize = 4
    translate(loc.x, loc.y)
    stroke('#366f9e')
    strokeWeight(5)
    rotate(v.heading())

    length = v.mag() * scale
    line(0, 0, length, 0)
    line(length, 0, length - arrowsize, +arrowsize / 2)
    line(length, 0, length - arrowsize, -arrowsize / 2)
    pop()


# ========= PARTICLE SYSTEM ===========


class ParticleSystem(object):
    """
    * A basic particle system class
    * @param num the number of particles
    * @param v the origin of the particle system
    * @param img_ a texture for each particle in the system
    * @constructor
    """
    def __init__(self, num, v, img_):
        self.particles = []
        self.origin = v.copy()  # we make sure to copy the vector value in case we accidentally mutate the original by accident
        self.img = img_
        for i in range(num):
            self.particles.append(Particle(self.origin, self.img))

    def run(self):
        """ This function runs the entire particle system. """
        # loop through and run particles
        for p in self.particles:
            p.run()
        self.particles = [p for p in self.particles if not p.isDead()]

    def applyForce(self, direction):
        """
        * Method to add a force vector to all particles currently in the system
        * @param direction a p5.Vector describing the direction of the force.
        """
        for p in self.particles:
            p.applyForce(direction)

    def addParticle(self):
        """
        * Adds a new particle to the system at the origin of the system and with expr as alias:
        * the originally set texture.
        """
        self.particles.append(Particle(self.origin, self.img))


# ========= PARTICLE  ===========


class Particle(object):
    """ A simple Particle class, renders the particle as an image. """
    def __init__(self, pos, img_):
        self.loc = pos.copy()

        vx = randomGaussian() * 0.3 * 8
        vy = (randomGaussian() * 0.3 - 1.0) * 8

        self.vel = createVector(vx, vy)
        self.acc = createVector()
        self.lifespan = 100.0
        self.texture = img_

    def run(self):
        """ Simulataneously updates and displays a particle. """
        self.update()
        self.render()

    def render(self):
        """ A function to display a particle. """
        imageMode(CENTER)
        tint(255, self.lifespan)
        image(self.texture, self.loc.x, self.loc.y)

    def applyForce(self, f):
        """ A method to apply a force vector to a particle. """
        self.acc.add(f)

    def isDead(self):
        """
        This method checks to see if the particle has reached the end of it's lifespan,
          if it has, return true, otherwise return false.
        """
        return self.lifespan <= 0.0

    def update(self):
        """ This method updates the position of the particle. """
        self.vel.add(self.acc)
        self.loc.add(self.vel)
        self.lifespan -= 2
        self.acc.mult(0)


run(preload=preload)
