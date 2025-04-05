#from sys import exit 

from time import sleep

try:
  import tkinter as tk
except:
  exit("SimpleGraphics failed to import the required Tk Interface library.")


# Tcl/Tk master window and canvas
__master = None
__canvas = None

# Maintain a list of image references so that images don't appear when 
# functions end
__image_references = set()

# Has the user clicked on the close button?
__closePressed = False

# The current properties used when drawing shapes on the canvas
__outline = "black"
__fill = "white"
__width = 1
#__capstyle = tk.ROUND
#__joinstyle = tk.ROUND
#__arrow = tk.NONE
__arrowshape = "8 10 3"
__autoupdate = True
__font = None
__font_size = 24
__font_modifiers = ""
__font_count = 0

__background = None
__bgcolor = "#d0d0d0"
__bgcolor = "#d0d0d0"
__loop = False
__frmTime = 50
__animation = None
  
## Create a window containing a canvas and setup a second thread to ensure
#  that it stays up to date.  Setup the handlers needed for keyboard and 
#  mouse input.
def __init():
  global __canvas
  global __master
  global __background

  # Create the window
  __master = tk.Tk()
  __master.geometry("810x670")
  __master.title("SimpleGraphics")
  #__master.protocol("WM_DELETE_WINDOW", __closeClicked)
  __canvas = tk.Canvas(__master, width=800, height=600)
  __canvas.pack()
  '''
  # Setup handlers for mouse and keyboard input
  __master.bind("<Escape>", __closeClicked)
  __master.bind("<Key>", __key)
  __master.bind("<KeyRelease>", __keyRelease)
  __master.bind("<Button-1>", __button1pressed)
  __master.bind("<ButtonRelease-1>", __button1released)
  __master.bind("<Button-2>", __button2pressed)
  __master.bind("<ButtonRelease-2>", __button2released)
  __master.bind("<Button-3>", __button3pressed)
  __master.bind("<ButtonRelease-3>", __button3released)
  __master.bind("<FocusOut>", __focusOut)

  # Ensure that mainloop is called before the program exits 
  register(__shutdown)
  '''
  # Ensure that a valid font has been setup so that fontWidth will work
  setFont("Arial")

  # Create a rectangle to serve as the background for the window.  Note
  # that we cannot simply change the background color of the canvas because
  # the background of the canvas is not saved when saving the canvas to a 
  # file.
  __background = __canvas.create_rectangle(0, 0, getWidth()+1, getHeight()+1, fill=__bgcolor, outline=__bgcolor, tag="__background")

  # Ensure that the graphics window displays promptly
  update()
  #__master.focus_set()
# doAnimate() - animation loop
# Starts the animation loop by repeatedly calling the provided function.
# The loop continues until `noAnimate()` is called.

def doAnimate(func):
    global __loop, __animation
    if not __loop:
        __animation = func
        __loop = True
    
    __animation()    

    __master.after(__frmTime, lambda : doAnimate(func))
     
# noAnimate() - stop animation
# Stops the animation loop by setting the loop flag to False.
# Also cancels any pending animation updates.
def noAnimate():
    global __loop
    __loop = False
    __master.after_cancel(__canvas)

# isAnimate() - True/False
# Returns the current state of the animation loop.
# True if the animation is running, False otherwise.
def isAnimate():
    return __loop
    
# animationTime() - set/get frame time
# Sets or gets the time interval between animation frames.
# If a valid frame time is provided, it updates the interval.
# If the frame time is invalid (<= 0), it stops the animation.
def animationTime(frm_time=None):
    global __frmTime
    if frm_time is not None:
        if frm_time > 0: 
            __frmTime = frm_time            
        else:    
            __frmTime = 0
            noAnimate()
    else:
        return __frmTime      

# Close the window
def close():
  global __closePressed
  global __canvas
  global __master

  __closePressed = True
  try:
    __canvas = None
    __master.destroy()
    __master = None
    unregister(__shutdown)
  except:
    try:
      unregister(__shutdown)
    except:
      pass;

# Set the window title
# @param t the new title for the window
def setWindowTitle(t):
  global __master
  __master.wm_title(t)


## Update the canvas if the programmer has automatic updates turned on
def __update():
    pass


## Force the canvas to update 
def update():
    pass
    #if __canvas != None:
    #__canvas.update()

## Has the user clicked the close button?
#  @return True if the close button has been clicked, False otherwise.
def closed():
  try:
    __master.update()
    return __closePressed
  except:
    return True

## Retrieve the current x and y location of the mouse pointer
#  @return a tuple containing the mouse X location and mouse Y location
def mousePos():
  global __mouseX
  global __mouseY

  try:
    (x, y) = __canvas.winfo_pointerxy()
    x = x - __canvas.winfo_rootx()
    y = y - __canvas.winfo_rooty()
    __mouseX = x
    __mouseY = y
    return (__mouseX, __mouseY)

  except AttributeError:
    return (__mouseX, __mouseY)

## Retrieve the x portion of the mouse cursor's position
#  @return the x position of the mouse cursor
def mouseX():
  return mousePos()[0]

## Retrieve the y portion of the mouse cursor's position
#  @return the y position of the mouse cursor
def mouseY():
  return mousePos()[1]

## Set the outline color
#  @param r the red component of the color, or the color name
#  @param g the green component of the color, or None if a named color is used
#  @param b the blue component of the color, or None if a named color is used
def setOutline(r, g=None, b=None):
  global __outline
  if g == None and b == None:
    __outline = r
  elif g != None and b != None:
    __outline = "#%02x%02x%02x" % (int(r), int(g), int(b))
  else:
    raise TypeError("setOutline cannot be called with 2 arguments")

## Set the fill color
#  @param r the red component of the color, or the color name
#  @param g the green component of the color, or None if a named color is used
#  @param b the blue component of the color, or None if a named color is used
def setFill(r, g=None, b=None):
  global __fill
  if g == None and b == None:
    __fill = r
  elif g != None and b != None:
    __fill = "#%02x%02x%02x" % (int(r), int(g), int(b))
  else:
    raise TypeError("setFill cannot be called with 2 arguments")

## Set the width of lines used when drawing
#  @param w the width of the line in pixels (default is 1)
def setWidth(w=1):
  global __width
  __width = w

## Set the cap style used when lines are drawn (only matters for wide lines for
#  lines and curves).
#  @param s the cap style, which must be tk.BUTT (default), tk.PROJECTING or 
#         tk.ROUND
def setCapStyle(s):
    pass
    #global __capstyle
    #__capstyle = s

## Set the cap style used when lines / shapes are drawn (only matters for wide 
#  lines for lines, curves, blobs and polygons).
#  @param s the join style, which must be tk.ROUND (default), tk.BEVEL or 
#         tk.MITER
def setJoinStyle(s):
    pass
    #global __joinstyle
    #__joinstyle = s

## Set the arrow style used when lines are drawn (only matters for lines
#  and curves).
#  @param s the arrow style, which must be tk.NONE (default), tk.FIRST, 
#         tk.LAST or tk.BOTH
def setArrow(s):
    pass
    #global __arrow
    #__arrow = s

## Set the shape of the arrow head that appears on lines and curves (when
#  the arrow head has been enabled)
#  @param a the distance along the line from the tip of the arrow
#  @param b the distance along the line to the outside edges of the arrow
#  @param c the perpendicular distance from the outside edge of the line to
#         the outside edge of the arrow
def setArrowShape(a = 8, b = 10, c = 3):
  global __arrowshape
  __arrowshape = "%d %d %d" % (a, b, c)

## Set both the fill and outline colors to the same value
#  @param r the red component of the color, or the color name
#  @param g the green component of the color, or None if a named color is used
#  @param b the blue component of the color, or None if a named color is used
def setColor(r, g=None, b=None):
  if g != None and b == None:
    raise TypeError("setColor cannot be called with 2 arguments")
  setFill(r, g, b)
  setOutline(r, g, b)

## Set the background color of the window
#  @param r the red component of the color, or the color name
#  @param g the green component of the color, or None if a named color is used
#  @param b the blue component of the color, or None if a named color is used
def background(r, g=None, b=None):
  global __bgcolor

  try:
    if g == None and b == None:
      bg = r
    elif g != None and b != None:
      bg = "#%02x%02x%02x" % (int(r), int(g), int(b))
    else:
      raise TypeError("background cannot be called with 2 arguments")
    __bgcolor = bg
    __canvas.itemconfig(__background,fill=bg)
    __update()

  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass;

## Draw a line connecting the points provided as a parameter
#  @param the points of the line in the form x1, y1, x2, y2, ... , xn, yn.
#         The parameter can either be a single list or provided as individual
#         parameters.
def line(*pts):
  try:
    if len(pts) == 1:
      new_pts = list(pts[0])
    else:
      new_pts = list(pts)
    for i in range(len(new_pts)):
      new_pts[i] = new_pts[i] + 1
    shape = __canvas.create_line(new_pts, fill=__outline, width=__width)
    __update()
    return shape

  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass;

## Draw a curve connecting the first point to the last point.  The curve is
#  influenced by, but does not necessarily pass through the intermediate 
#  points.  Repeating a coordinate in the points will ensure that the
#  curve passes through it, but will normally result in a discontinuity in 
#  the curve.
#  @param the points of the curve in the form x1, y1, x2, y2, ... , xn, yn.
#         The parameter can either be a single list or provided as individual
#         parameters.
def curve(*pts):
  try:
    if len(pts) == 1:
      new_pts = pts[0]
    else:
      new_pts = list(pts)
    for i in range(len(new_pts)):
      new_pts[i] = new_pts[i] + 1

    shape = __canvas.create_line(new_pts, fill=__outline, width=__width, smooth=True, splinesteps=25)
    __update()
    return shape
  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass;

## Draw a filled curve connecting the first point to the last point.  The 
#  curve is influenced by, but does not necessarily pass through the 
#  intermediate points.  Repeating a coordinate in the points will ensure 
#  that the curve passes through it, but will normally result in a 
#  discontinuity in the curve.
#
#  @param the points of the curve in the form x1, y1, x2, y2, ... , xn, yn.
#         The parameter can either be a single list or provided as individual
#         parameters.

          
def blob(*pts):
  try:
    if len(pts) == 1:
      new_pts = pts[0]
    else:
      new_pts = list(pts)
    for i in range(len(new_pts)):
      new_pts[i] = new_pts[i] + 1
    
    shape = __canvas.create_polygon(new_pts, fill=__fill, outline=__outline, smooth=True, width=__width)
    __update()
    return shape

  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass;

## Draw a rectangle with its upper left corner at (x,y)
#  @param x the x part of the coordinate of the upper left corner
#  @param y the y part of the coordinate of the upper left corner
#  @param w the width of the rectangle
#  @param h the height of the rectangle
def rect(x, y, w, h):
  w = round(w)
  h = round(h)
  try:
    if abs(w) >= 2 and abs(h) >= 2:
      __shape = __canvas.create_rectangle(x + 1, y + 1, x + 1 + w - 1, y + 1 + h - 1, fill=__fill, outline=__outline, width=__width)
      __update()
      return __shape
    elif abs(w) == 1 and abs(h) == 1:
      __shape = line(x, y, x + 1, y)
      __update()
    elif abs(w) == 1:
      __shape = line(x, y, x, y + h)
      __update()
    elif abs(h) == 1:
      __shape = line(x, y, x + w, y)
      __update()
    return __shape
  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass;

## Draw an ellipse
#  @param x the x part of the coordinate of the upper left corner
#  @param y the y part of the coordinate of the upper left corner
#  @param w the width of the ellipse
#  @param h the height of the ellipse
def ellipse(x, y, w, h):
  try:
    __shape = __canvas.create_oval(x + 1, y + 1, x+w, y+h, fill=__fill, outline=__outline, width=__width)
    __update()
    return __shape
  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass

## Draw an circle
#  @param x the set x location of center.
#  @param y the set y location of center.
#  @param d the diameter of the circle

def circle(x, y, d):
  r = d//2
  try:
    __shape = __canvas.create_oval(x + 1 - r, y + 1 - r, x + r, y + r, fill=__fill, outline=__outline, width=__width)
    __update()
    return __shape

  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass

## Place some text on the canvas
#  @param x the x part of the coordinate of the where the text will be placed
#  @param y the y part of the coordinate of the where the text will be placed
#  @param what the string of text to display
#  @param align the alignment to use (by default, center the text at (x,y))
#  @param ang the angle at which the text is drawn
def text(x, y, what, align="c", ang=0):
  try:
    __shape = __canvas.create_text(x + 1, y + 1, text=str(what), anchor=align, fill=__outline, font=__font, angle=ang)
    __update()
    return __shape
  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass

# Set the current font, size and modifiers.  Note that this function call is
# rather slow (at least on Cygwin)
# @param f the name of a font.  For example Times or Arial
# @param the size of the font (larger numbers are bigger)
# @param modifiers for the font such as bold and italic.  Multiple modifiers
#        should be separated by spaces such as "bold italic"
def setFont(f=None, s=10, modifiers=""):
  global __font
  global __font_count, __font_size, __font_modifiers

  if f == None:
    __font = None
    return True
  else:
    try:
      #__font = (f, s, modifiers)
    
      modifiers = modifiers.lower()
      '''
      if "bold" in modifiers:
        w = font.BOLD
      else:
        w = font.NORMAL

      if "italic" in modifiers:
        sl = font.ITALIC
      else:
        sl = font.ROMAN

      if "underline" in modifiers:
        und = True
      else:
        und = False

      if "overstrike" in modifiers:
        ovs = True
      else:
        ovs = False
      '''  
      __font = f
      __font_size = s
      __font_modifiers = modifiers
      __font_count += 1
      return True
    except Exception as e:
      __font = None
      return False

# Determine the width of some text in pixels
# @param s the text to measure
# @return the width required to display s in pixels
def textWidth(s):
  try:
    return __font.measure(s)
  except:
    return -1

# Determine the amount of vertical space between adjacent lines of text
# @param s optional text that can be provided, but doesn't actually influence
#        the value that is returned
# @return the number of pixel that should be used between adjacent lines of text
def lineSpace(s=""):
  try:
    return __font.metrics("linespace")
  except:
    return -1

# Resize the window to a specific size in pixels
# @param w the new window width
# @param h the new window height
def resize(w, h):
  global __background

  __canvas.config(width=w, height=h)
  __canvas.delete(__background)
  __background = __canvas.create_rectangle(0, 0, w+1, h+1, fill=__bgcolor, outline=__bgcolor, tag="__background")
  __canvas.lower(__background)

# Get the width of the window or an image
# @param the image to examine, or None which indates that the width of the
#        window should be returned
# @param the width
def getWidth(what=None):
  if what == None:
    try:
      return int(__canvas['width'])
    except TypeError:
      return -1
  elif type(what) is tk.PhotoImage:
    return what.width()
  else:
    raise TypeError("Could not get the width of the provided object")

# Get the height of the window or an image
# @param the image to examine, or None which indates that the height of the
#        window should be returned
# @param the height
def getHeight(what=None):
  if what == None:
    try:
      return int(__canvas['height'])
    except TypeError:
      return -1
  elif type(what) is tk.PhotoImage:
    return what.height()
  else:
    raise TypeError("Could not get the height of the provided object")

## Create an arc, with the bounding box of the ellipse, start angle (in degrees)
#  and extent of the arc (in degrees).  The starting angle is at 3 o'clock,
#  and angles move counter-clockwise.
#  @param x the x position of the upper left corner of the bounding box
#  @param y the y position of the upper left corner of the bounding box
#  @param w the width of the bounding box
#  @param h the height of the bounding box
#  @param s the starting angle
#  @param e the extent of the arc (*not* the ending angle)
def arc(x, y, w, h, s, e):
  try:
    __shape = __canvas.create_arc(x + 1, y + 1, x+1+w, y+1+h, start=s, extent=e, fill=__fill, outline=__outline, style=tk.ARC, width=__width)
    __update()
    return __shape
  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass

## Create a pie slice, with the bounding box of the ellipse, start angle (in 
#  degrees) and extent of the arc (in degrees).  The starting angle is at 3 
#  o'clock, and angles move counter-clockwise.
#  @param x the x position of the upper left corner of the bounding box
#  @param y the y position of the upper left corner of the bounding box
#  @param w the width of the bounding box
#  @param h the height of the bounding box
#  @param s the starting angle
#  @param e the extent of the arc (*not* the ending angle)
def pieSlice(x, y, w, h, s, e):
  try:
    __shape = __canvas.create_arc(x + 1, y + 1, x+1+w, y+1+h, start=s, extent=e, fill=__fill, outline=__outline, style=tk.PIESLICE, width=__width)
    __update()
    return __shape
  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass

## Draw a filled polygon connecting each point to its neighbors using
#  straight line segments.
#  @param the points of the polygon in the form x1, y1, x2, y2, ... , xn, yn.
def polygon(x1, y1=[], *args):
  try:
    if y1 != []:
      pts = [x1, y1]
      pts.extend(args)
    else:
      pts = list(x1)
      pts.extend(y1)
      pts.extend(args)

    for i in range(len(pts)):
      pts[i] = pts[i] + 1
    __shape = __canvas.create_polygon(pts, fill=__fill, outline=__outline, width=__width,smooth=False)
    __update()
    return __shape
    
  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass

## Remove all drawing objects from the canvas
def clear():
  try:
    __canvas.delete("all")
    __background = __canvas.create_rectangle(0, 0, getWidth(), getHeight(), fill=__bgcolor, outline=__bgcolor, tag="__background")
  except AttributeError:
    pass;

  __image_references.clear()
  __update()

## Move drawing object on the canvas
## Moves the specified object to the new coordinates (x, y).
def move(obj, x, y): 
  try:
    x1, y1, x2, y2 = __canvas.bbox(obj)   
    __canvas.move(obj, x-x1, y-y1)    
  except AttributeError:
    pass;

  __update()

## Delete object from canvas
## Deletes the specified object from the canvas.
def delete(obj):
  try:
    __canvas.delete(obj)   
  except AttributeError:
    pass;

  __update()

## Scale object on the canvas
## Scales the specified object by the given factors (xs, ys).
def scale(obj, xs, ys):
  try:
    x1, y1, x2, y2 = __canvas.coords(obj)   
    __canvas.scale(obj, x1, y1, xs, ys)    
  except AttributeError:
    pass;

  __update()

## Raise object to the top
## Brings the specified object to the top of the drawing order.
def putUp(obj):
  try:
    __canvas.tag_raise(obj)   
  except AttributeError:
    pass;

  __update()

## Lower object to the bottom
## Sends the specified object to the bottom of the drawing order.
def putDown(obj):
  try:
    __canvas.tag_lower(obj)   
  except AttributeError:
    pass;

  __update()

## Configure object properties
## Configures the properties of the specified object using keyword arguments.
def itemConfig(obj, **kwargs):
  try:
    __canvas.itemconfig(obj, **kwargs)  
  except AttributeError:
    pass;

  __update()
  
## Checks if two objects on the Canvas have collided.
## Returns True if the objects intersect, otherwise False.
def checkCollision(obj1, obj2):

    # Get the bounding box coordinates for both objects
    x1_min, y1_min, x1_max, y1_max = __canvas.bbox(obj1)
    x2_min, y2_min, x2_max, y2_max = __canvas.bbox(obj2)

    # Check if the rectangles intersect
    if (x1_max >= x2_min and  # Right edge of obj1 >= Left edge of obj2
        x1_min <= x2_max and  # Left edge of obj1 <= Right edge of obj2
        y1_max >= y2_min and  # Bottom edge of obj1 >= Top edge of obj2
        y1_min <= y2_max):    # Top edge of obj1 <= Bottom edge of obj2
        return True
    return False

## Should the screen be updated automatically after each graphics primitive
#  is drawn?
def setAutoUpdate(status):
  global __autoupdate
  __autoupdate = status

## Shutdown handler that ensures that the program doesn't close inadvertently
def __shutdown():
  tk.mainloop()

## Determine the version of the library
#  @return the version number as a floating point value
def version():
  return "1.0.11"

## Save the current contents of the window as an encapsulated postscript file.
#  @param fname the name of the file that will be written (normally ends with
#         .eps)

def createImage(w, h):
  retval = tk.PhotoImage(width=w, height=h)
  return retval

## Create a new image by loading an image file in .gif or .ppm format
#  @param fname the name of the file to load
#  @return a new image object loaded with the data from the file
def loadImage(fname):
  retval = tk.PhotoImage(file=fname)
  return retval

## Write a pixel into an image
#  @param img the image to modify
#  @param x the x position that will be modified
#  @param y the y position that will be modified
#  @param r the red component of the new pixel color
#  @param g the green component of the new pixel color
#  @param b the blue component of the new pixel color
#  @return (None)
def putPixel(img, x, y, r, g, b):
  img.put("#%02x%02x%02x" % (int(r), int(g), int(b)), to=(x,y))

## Draw the provided image with its upper left corner at position (x, y)
#  @param img the image to display
#  @param x the x position of the upper left corner
#  @param y the y position of the upper left corner
#  @return (None)
def drawImage(img, x, y):
  global __image_references

  try:
    __canvas.create_image(x+1, y+1, image=img, anchor="nw")
    __image_references.add(img)
    __update()

  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass;



# Call the __init function.
__init()


