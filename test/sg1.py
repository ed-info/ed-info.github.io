from tkinter import *
def draw_spline(canvas, points_array, is_closed, tension=0.5, num_of_segments=12, fill=None, outline=None, width=1):
    if len(points_array) < 2:
        return
    
    points = []
    for i in range(0, len(points_array), 2):
        points.append((points_array[i], points_array[i + 1]))
    
    if is_closed:
        points.append(points[0])
        if len(points) == 3:
            points.append(points[1])
    
    all_points = []  # Тут зберігатимемо всі точки сплайну
    
    plength = len(points)
    
    for i in range(plength - 1):
        p0 = points[i - 1] if i > 0 else (points[-2] if is_closed else points[i])
        p1 = points[i]
        p2 = points[i + 1]
        p3 = points[i + 2] if i < len(points) - 2 else (points[1] if is_closed else points[i + 1])
        
        segment_points = []
        for t in range(num_of_segments + 1):
            t1 = t / num_of_segments
            t2 = t1 * t1
            t3 = t2 * t1
            
            m1 = tension * (p2[0] - p0[0])
            m2 = tension * (p3[0] - p1[0])
            n1 = tension * (p2[1] - p0[1])
            n2 = tension * (p3[1] - p1[1])
            
            x = (2 * t3 - 3 * t2 + 1) * p1[0] + (t3 - 2 * t2 + t1) * m1 + (-2 * t3 + 3 * t2) * p2[0] + (t3 - t2) * m2
            y = (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t1) * n1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * n2
            
            segment_points.append((x, y))
        
        all_points.extend(segment_points)
    
    # Якщо фігура замкнута - заповнюємо
    if is_closed and fill:
        # Створюємо полігон з усіма точками
        canvas.create_polygon(all_points, fill=fill, outline=outline, width=width)
    else:
        # Малюємо тільки лінії
        for j in range(1, len(all_points)):
            canvas.create_line(all_points[j-1][0], all_points[j-1][1], 
                             all_points[j][0], all_points[j][1], 
                             fill=outline if outline else 'black', 
                             width=width)
root = Tk()
canvas = Canvas(root, width=400, height=400)
canvas.pack()

# Замкнута фігура з заповненням
points = [10, 50, 150, 150,200,50]
draw_spline(canvas, points, True, tension=0.5, fill='green', outline='blue', width=2)

# Незамкнута крива (тільки лінії)
points2 = [50, 250, 150, 300, 250, 250, 350, 350]
draw_spline(canvas, points2, False, tension=0.5, outline='red', width=3)

root.mainloop()                                