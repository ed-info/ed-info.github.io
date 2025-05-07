from time import sleep

try:
  import tkinter as tk
except:
  exit("SimpleGraphics failed to import the required Tk Interface library.")

__master = None
__canvas = None

__image_references = set()

__closePressed = False

__outline = "black"
__fill = "white"
__width = 1

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

def __init():
  global __canvas
  global __master
  global __background

  __master = tk.Tk()
  __wx = __master.winfo_screenwidth()
  __wy = __master.winfo_screenheight()
  __mw = 810
  __mh = 670
  if __wx < 810:
      __mw = __wx-20
  if __wy < 670:
      __mh = __wy    
  __master.geometry(f"{__mw}x{__mh}")
  __master.title("SimpleGraphics")

  __canvas = tk.Canvas(__master, width=__mw-10, height=__mh-70)
  __canvas.pack()

  setFont("Arial")

  __background = __canvas.create_rectangle(0, 0, getWidth()+1, getHeight()+1, fill=__bgcolor, outline=__bgcolor, tag="__background")

  update()

def doAnimate(func):
    global __loop, __animation
    if not __loop:
        __animation = func
        __loop = True

    __animation()    

    __master.after(__frmTime, lambda : doAnimate(func))

def noAnimate():
    global __loop
    __loop = False
    __master.after_cancel(__canvas)

def isAnimate():
    return __loop

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

def setWindowTitle(t):
  global __master
  __master.wm_title(t)

def __update():
    pass

def update():
    pass

def closed():
  try:
    __master.update()
    return __closePressed
  except:
    return True

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

def mouseX():
  return mousePos()[0]

def mouseY():
  return mousePos()[1]

def setOutline(r, g=None, b=None):
  global __outline
  if g == None and b == None:
    __outline = r
  elif g != None and b != None:
    __outline = "#%02x%02x%02x" % (int(r), int(g), int(b))
  else:
    raise TypeError("setOutline cannot be called with 2 arguments")

def setFill(r, g=None, b=None):
  global __fill
  if g == None and b == None:
    __fill = r
  elif g != None and b != None:
    __fill = "#%02x%02x%02x" % (int(r), int(g), int(b))
  else:
    raise TypeError("setFill cannot be called with 2 arguments")

def setWidth(w=1):
  global __width
  __width = w

def setCapStyle(s):
    pass

def setJoinStyle(s):
    pass

def setArrow(s):
    pass

def setArrowShape(a = 8, b = 10, c = 3):
  global __arrowshape
  __arrowshape = "%d %d %d" % (a, b, c)

def setColor(r, g=None, b=None):
  if g != None and b == None:
    raise TypeError("setColor cannot be called with 2 arguments")
  setFill(r, g, b)
  setOutline(r, g, b)

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

def text(x, y, what, align="c", ang=0):
  try:
    __shape = __canvas.create_text(x + 1, y + 1, text=str(what), fill=__outline, font=(__font, __font_size, __font_modifiers))
    __update()
    return __shape
  except Exception as e:
    if __canvas == None:
      pass;
    else:
      raise e

  finally:
    pass

def setFont(f=None, s=10, modifiers=""):
  global __font
  global __font_count, __font_size, __font_modifiers

  if f == None:
    __font = None
    return True
  else:
    try:

      modifiers = modifiers.lower()

      __font = f
      __font_size = s
      __font_modifiers = modifiers
      __font_count += 1
      return True
    except Exception as e:
      __font = None
      return False

def textWidth(s):
  try:
    return __font.measure(s)
  except:
    return -1

def lineSpace(s=""):
  try:
    return __font.metrics("linespace")
  except:
    return -1

def resize(w, h):
  global __background

  __canvas.config(width=w, height=h)
  __canvas.delete(__background)
  __background = __canvas.create_rectangle(0, 0, w+1, h+1, fill=__bgcolor, outline=__bgcolor, tag="__background")
  __canvas.lower(__background)

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

def clear():
  try:
    __canvas.delete("all")
    __background = __canvas.create_rectangle(0, 0, getWidth(), getHeight(), fill=__bgcolor, outline=__bgcolor, tag="__background")
  except AttributeError:
    pass;

  __image_references.clear()
  __update()

def move(obj, x, y): 
  try:
    x1, y1, x2, y2 = __canvas.bbox(obj)   
    __canvas.move(obj, x-x1, y-y1)    
  except AttributeError:
    pass;

  __update()

def delete(obj):
  try:
    __canvas.delete(obj)   
  except AttributeError:
    pass;

  __update()

def scale(obj, xs, ys):
  try:
    x1, y1, x2, y2 = __canvas.coords(obj)   
    __canvas.scale(obj, x1, y1, xs, ys)    
  except AttributeError:
    pass;

  __update()

def putUp(obj):
  try:
    __canvas.tag_raise(obj)   
  except AttributeError:
    pass;

  __update()

def putDown(obj):
  try:
    __canvas.tag_lower(obj)   
  except AttributeError:
    pass;

  __update()

def itemConfig(obj, **kwargs):
  try:
    __canvas.itemconfig(obj, **kwargs)  
  except AttributeError:
    pass;

  __update()

def checkCollision(obj1, obj2):

    x1_min, y1_min, x1_max, y1_max = __canvas.bbox(obj1)
    x2_min, y2_min, x2_max, y2_max = __canvas.bbox(obj2)

    if (x1_max >= x2_min and  
        x1_min <= x2_max and  
        y1_max >= y2_min and  
        y1_min <= y2_max):    
        return True
    return False

def setAutoUpdate(status):
  global __autoupdate
  __autoupdate = status

def __shutdown():
  tk.mainloop()

def version():
  return "1.0.11"

def createImage(w, h):
  retval = tk.PhotoImage(width=w, height=h)
  return retval

def loadImage(fname):
  retval = tk.PhotoImage(file=fname)
  return retval

def putPixel(img, x, y, r, g, b):
  img.put("#%02x%02x%02x" % (int(r), int(g), int(b)), to=(x,y))

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

__init()
