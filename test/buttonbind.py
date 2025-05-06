#Import required libraries
from tkinter import *
from tkinter import ttk
#Create an instance of tkinter frame
win= Tk()
#Define the geometry of the window
win.geometry("750x250+100+150")
#Define a function
def handler(e):
   top= Toplevel(win)
   top.geometry("600x200")
   Label(top, text= "Hey There!", font= ('Helvetica 15 bold')).pack(pady=30)

#Define a Label in Main window
Label(win, text= "Double Click to Open the Popup",font=('Helvetica 15 underline')).pack(pady=30)

#Create a Button
#ttk.Button(win, text= "Click", command=handler).pack(pady=20)

#Bind the Double Click with the Handler
win.bind('<Double-Button>', handler)
win.mainloop()