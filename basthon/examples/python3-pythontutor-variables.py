from tutor import tutor

x = [1, 2, 3, 'hello', False, None]
y = {'John':100, 'Jane':21, 'Jack':30}
z = set(x)
y['nested'] = x
x[1] = ['aa', 'bb', 'cc']

tutor()
