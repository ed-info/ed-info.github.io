import tkinter as tk
from tkinter import ttk

# Глобальні змінні
text_content = "Hello, Canvas Text!"
font_family = "Arial"
font_size = 12
font_weight = "normal"
font_slant = "roman"
text_color = "black"
anchor = "center"
justify = "left"
width = 0
angle = 0
stipple = ""
offset = "0"

def reset_defaults():
    global text_content, font_family, font_size, font_weight, font_slant
    global text_color, anchor, justify, width, angle, stipple, offset
    
    text_entry.delete(0, tk.END)
    text_entry.insert(0, "Hello, Canvas Text!")
    font_combo.set("Arial")
    size_scale.set(12)
    weight_combo.set("normal")
    slant_combo.set("roman")
    color_combo.set("black")
    anchor_combo.set("center")
    justify_combo.set("left")
    width_scale.set(0)
    angle_scale.set(0)
    stipple_combo.set("")
    offset_combo.set("0")
    
    update_canvas()

def update_canvas():
    # Оновлення глобальних змінних
    global text_content, font_family, font_size, font_weight, font_slant
    global text_color, anchor, justify, width, angle, stipple, offset
    
    text_content = text_entry.get()
    font_family = font_combo.get()
    font_size = int(size_scale.get())
    font_weight = weight_combo.get()
    font_slant = slant_combo.get()
    text_color = color_combo.get()
    anchor = anchor_combo.get()
    justify = justify_combo.get()
    width = int(width_scale.get())
    angle = int(angle_scale.get())
    stipple = stipple_combo.get()
    offset = offset_combo.get()

    # Очищення canvas
    canvas.delete("all")
    
    # Створення фонових ліній для візуалізації anchor
    canvas_width = canvas.winfo_width()
    canvas_height = canvas.winfo_height()
    print(canvas_width,canvas_height)
   
    if canvas_width > 1 and canvas_height > 1:
        # Вертикальна лінія
        canvas.create_line(canvas_width//2, 0, canvas_width//2, canvas_height, fill="lightgray")
        # Горизонтальна лінія
        canvas.create_line(0, canvas_height//2, canvas_width, canvas_height//2, fill="lightgray")
        
        # Точка прив'язки
        canvas.create_oval(canvas_width//2-3, canvas_height//2-3, 
                          canvas_width//2+3, canvas_height//2+3, 
                          fill="red")
     
    # Параметри шрифту
    font_config = (font_family, font_size, font_weight,  font_slant)
    print(font_config)
    # Відображення тексту
    canvas.create_text(
            canvas_width//2, canvas_height//2,
            text = text_content,
            font = font_config,
            fill = text_color,
            anchor= anchor,
            justify = justify,
            width=width,
            angle = angle,
            stipple = stipple,
            #offset=offset
        )
 
    
    # Відображення інформації про параметри
    info_text = f"""
Параметри тексту:
Шрифт: {font_family}, {font_size}pt, {font_weight}, {font_slant}
Колір: {text_color}, Anchor: {anchor}, Justify: {justify}
Ширина: {width if width > 0 else 'auto'}, Кут: {angle}°
Stipple: {stipple if stipple else 'none'}, Offset: {offset}
    """
    
    canvas.create_text(10, 10, text=info_text.strip(), 
                       anchor="nw", fill="darkblue", 
                       font=("Arial", 9), justify =tk.LEFT)

# Створення головного вікна
root = tk.Tk()
root.title("Canvas Text Parameters Tester")
root.geometry("1200x900")


# Фрейм для керування
control_frame = ttk.Frame(root, width=300)
control_frame.grid(column=0, row=0)

# Фрейм для canvas
canvas_frame = ttk.Frame(root)
canvas_frame.grid(column=1, row=0)

# Canvas для відображення тексту
canvas = tk.Canvas(canvas_frame, bg="white", width=700, height=600)
canvas.pack(padx=5, pady=5)

# Елементи керування
# Текст вміст
ttk.Label(control_frame, text="Текст:").pack(anchor=tk.W, pady=(10, 2))
text_entry = ttk.Entry(control_frame, width=30)
#text_entry.insert(0, text_content)
text_entry.pack(pady=(0, 10))

# Шрифт
ttk.Label(control_frame, text="Шрифт:").pack(anchor=tk.W, pady=(5, 2))
font_combo = ttk.Combobox(control_frame, values=["Arial", "Times New Roman", "Courier", "Helvetica", "Verdana"])
font_combo.set(font_family)
font_combo.pack(pady=(0, 5))

# Розмір шрифту
ttk.Label(control_frame, text="Розмір шрифту:").pack(anchor=tk.W, pady=(5, 2))
size_scale = ttk.Scale(control_frame, from_=8, to=72, orient=tk.HORIZONTAL)
size_scale.set(font_size)
size_scale.pack(pady=(0, 5))

# Вага шрифту
ttk.Label(control_frame, text="Вага шрифту:").pack(anchor=tk.W, pady=(5, 2))
weight_combo = ttk.Combobox(control_frame, values=["normal", "bold"])
weight_combo.set(font_weight)
weight_combo.pack(pady=(0, 5))

# Нахил шрифту
ttk.Label(control_frame, text="Нахил шрифту:").pack(anchor=tk.W, pady=(5, 2))
slant_combo = ttk.Combobox(control_frame, values=["roman", "italic"])
slant_combo.set(font_slant)
slant_combo.pack(pady=(0, 5))

# Колір тексту
ttk.Label(control_frame, text="Колір тексту:").pack(anchor=tk.W, pady=(5, 2))
color_combo = ttk.Combobox(control_frame, values=["black", "red", "blue", "green", "purple", "orange"])
color_combo.set(text_color)
color_combo.pack(pady=(0, 5))

# Anchor
ttk.Label(control_frame, text="Anchor:").pack(anchor=tk.W, pady=(5, 2))
anchor_combo = ttk.Combobox(control_frame, values=["n", "ne", "e", "se", "s", "sw", "w", "nw", "center"])
anchor_combo.set(anchor)
anchor_combo.pack(pady=(0, 5))

# Вирівнювання
ttk.Label(control_frame, text="Вирівнювання:").pack(anchor=tk.W, pady=(5, 2))
justify_combo = ttk.Combobox(control_frame, values=["left", "center", "right"])
justify_combo.set(justify)
justify_combo.pack(pady=(0, 5))

# Ширина тексту
ttk.Label(control_frame, text="Ширина тексту (0 - авто):").pack(anchor=tk.W, pady=(5, 2))
width_scale = ttk.Scale(control_frame, from_=0, to=500, orient=tk.HORIZONTAL)
width_scale.set(width)
width_scale.pack(pady=(0, 5))

# Кут повороту
ttk.Label(control_frame, text="Кут повороту (°):").pack(anchor=tk.W, pady=(5, 2))
angle_scale = ttk.Scale(control_frame, from_=0, to=360, orient=tk.HORIZONTAL)
angle_scale.set(angle)
angle_scale.pack(pady=(0, 5))

# Stipple
ttk.Label(control_frame, text="Stipple:").pack(anchor=tk.W, pady=(5, 2))
stipple_combo = ttk.Combobox(control_frame, values=["", "gray12", "gray25", "gray50", "gray75"])
stipple_combo.set(stipple)
stipple_combo.pack(pady=(0, 5))

# Offset
ttk.Label(control_frame, text="Offset (зсув):").pack(anchor=tk.W, pady=(5, 2))
offset_combo = ttk.Combobox(control_frame, values=["0", "1000", "2000", "5000", "10000"])
offset_combo.set(offset)
offset_combo.pack(pady=(0, 10))

# Кнопка оновлення
ttk.Button(control_frame, text="Оновити", command=update_canvas).pack(pady=5)

# Кнопка скидання
ttk.Button(control_frame, text="Скинути до стандартних", command=reset_defaults).pack(pady=5)
reset_defaults()
# Запуск програми
root.mainloop()
