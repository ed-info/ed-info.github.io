from tkinter import *
# Initialize the Tkinter application
root = Tk()
root.title("Linking to Parent Widget")
root.geometry("720x250")

# StringVar linked to the 'Entry' widget
str_var = Variable(value="Hello")

# Creating an Entry widget and connecting it to the StringVar
entry_widget = Entry(root, textvariable=str_var)
entry_widget.pack()

root.mainloop()