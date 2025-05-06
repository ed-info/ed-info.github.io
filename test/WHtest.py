import tkinter as tk
from tkinter import ttk

class WidgetDemoApp:
    def __init__(self, master):
        self.master = master
        self.master.title("Вибір віджета")

        # Список підтримуваних віджетів
        self.widgets = {
            "Button": tk.Button,
            "Label": tk.Label,
            "Entry": tk.Entry,
            "Text": tk.Text,
            "Canvas": tk.Canvas,
            "Listbox": tk.Listbox,
            "Spinbox": tk.Spinbox
        }

        # Вибір віджета
        tk.Label(master, text="Виберіть тип віджета:").pack(pady=5)
        self.widget_var = tk.StringVar(value="Button")
        self.widget_menu = ttk.Combobox(master, textvariable=self.widget_var, values=list(self.widgets.keys()), state="readonly")
        self.widget_menu.pack()

        # Поля для введення розмірів
        tk.Label(master, text="Ширина (width):").pack(pady=5)
        self.width_entry = tk.Entry(master)
        self.width_entry.pack()
        self.width_entry.insert(0, "20")
        

        tk.Label(master, text="Висота (height):").pack(pady=5)
        self.height_entry = tk.Entry(master)
        self.height_entry.pack()
        self.height_entry.insert(0, "5")
        

        # Кнопка для демонстрації
        tk.Button(master, text="Показати віджет", command=self.show_widget).pack(pady=10)

    def show_widget(self):
        widget_type = self.widget_var.get()
        width = int(self.width_entry.get())
        height = int(self.height_entry.get())
        print(widget_type )
        # Створюємо нове вікно
        demo_window = tk.Toplevel(self.master)
        demo_window.title(f"Демонстрація: {widget_type}")

        # Отримуємо клас віджета
        WidgetClass = self.widgets[widget_type]
        print(WidgetClass)
        # Створюємо віджет з переданими розмірами
        if widget_type in ["Entry", "Spinbox"]:
            widget = WidgetClass(demo_window, width=width)
        elif widget_type in ["Text", "Listbox"]:
            widget = WidgetClass(demo_window, width=width, height=height)
        elif widget_type == "Canvas":
            widget = WidgetClass(demo_window, width=width*10, height=height*10, bg="lightgray")
        else:  # Button, Label
            widget = WidgetClass(demo_window, text=widget_type, width=width, height=height)

        widget.pack(padx=20, pady=20)

# Запуск програми
if __name__ == "__main__":
    root = tk.Tk()
    root.geometry("400x300")
    app = WidgetDemoApp(root)
    root.mainloop()
