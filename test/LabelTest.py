import tkinter as tk
from tkinter import font
from tkinter import colorchooser

def test_background():
    win = tk.Toplevel()
    win.title("Test Background")
    lbl = tk.Label(win, text="Background Test", bg="white", width=30)
    lbl.pack(pady=10)

    def change_bg():
        color = colorchooser.askcolor()[1]
        if color:
            lbl.config(bg=color)

    tk.Button(win, text="Change Background", command=change_bg).pack()

def test_foreground():
    win = tk.Toplevel()
    win.title("Test Foreground")
    lbl = tk.Label(win, text="Foreground Test", fg="black", width=30)
    lbl.pack(pady=10)

    def change_fg():
        color = colorchooser.askcolor()[1]
        if color:
            lbl.config(fg=color)

    tk.Button(win, text="Change Foreground", command=change_fg).pack()

def test_width_height():
    win = tk.Toplevel()
    win.title("Test Width & Height")
    lbl = tk.Label(win, text="Width & Height", bg="lightgray")
    lbl.pack(pady=10)

    def apply():
        w = int(entry_width.get())
        h = int(entry_height.get())
        lbl.config(width=w, height=h)

    tk.Label(win, text="Width:").pack()
    entry_width = tk.Entry(win)
    entry_width.insert(0, "20")
    entry_width.pack()

    tk.Label(win, text="Height:").pack()
    entry_height = tk.Entry(win)
    entry_height.insert(0, "2")
    entry_height.pack()

    tk.Button(win, text="Apply", command=apply).pack(pady=5)

def test_text():
    win = tk.Toplevel()
    win.title("Test Text")
    lbl = tk.Label(win, text="Old Text", width=30)
    lbl.pack(pady=10)

    entry = tk.Entry(win)
    entry.pack()

    def update_text():
        lbl.config(text=entry.get())

    tk.Button(win, text="Update Text", command=update_text).pack()

def test_font():
    win = tk.Toplevel()
    win.title("Test Font")
    lbl = tk.Label(win, text="Sample Font", font=("Arial", 12), width=30)
    lbl.pack(pady=10)

    tk.Label(win, text="Font Name:").pack()
    font_name = tk.Entry(win)
    font_name.insert(0, "Arial")
    font_name.pack()

    tk.Label(win, text="Font Size:").pack()
    font_size = tk.Entry(win)
    font_size.insert(0, "12")
    font_size.pack()

    def update_font():
        try:
            lbl.config(font=(font_name.get(), int(font_size.get())))
        except:
            pass

    tk.Button(win, text="Update Font", command=update_font).pack()

def main():
    root = tk.Tk()
    root.title("Label Property Tester")

    props = [
        ("Background", test_background),
        ("Foreground", test_foreground),
        ("Width & Height", test_width_height),
        ("Text", test_text),
        ("Font", test_font)
    ]

    for text, cmd in props:
        tk.Button(root, text=text, width=25, command=cmd).pack(pady=2)

    root.mainloop()

if __name__ == "__main__":
    main()
