from tkinter import Tk, colorchooser

root = Tk()
color = colorchooser.askcolor()
print(color)
root.mainloop()