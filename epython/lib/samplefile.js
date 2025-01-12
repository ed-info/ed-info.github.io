// Sample file for local storage filesystem

	  var F = new FileSystem( 'epythonfs' );
      F.mkdir( 'textFiles' );
      F.mkdir( 'images' ); // use pgzrun
      F.write( 'textFiles/Pumpkin.txt',
               '\n'
             + 'Гарбузова родина\n'
             + '-----------------------------\n'
             + '\n'
             + ' Ходить гарбуз по городу\n'
             + ' Питається свого роду:\n'
             + ' — Ой, чи живі, чи здорові\n' 
             + 'Всі родичі гарбузові?');
      F.write( 'textFiles/Quotes.txt',
               'Книги — морська глибина: Хто в них пірне аж до дна, '
             + 'Той, хоч і труду мав досить, дивнії перли виносить. -- Іван Франко' );
      F.write( 'images/Snake.png',
               'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEVHcEwrzzK60uUA1QAAzwAA1gAA0gAAzgC60eS50OQAxQC6/+EAygC60eS00d1l5mW20t+\
               v1dQAzAC50uS50eQAzgCz0twAzwAHzAcUzhQG0AZt0oIGygYAzgC50uUCzAICygILygsBxwEmzSYAzgAAzQAByAG10OEv2S+40OO50eQAzQAAzgAAzgAAyQCy0d0AzACx1NgKywsIyQa20t+2099\
               T31Nx6HFc4Vxw6HCp2Mqt0tW20OQAywAAzgACxgKS3ag52zkAzgAM0AwTzxgAyAAAyQAhyySw1tUFywW60OQAxAABxQEJyAkAzgAw1DBq5moAxQBy6XKo2cc72Du30uFL3k1V3lUXtwBi42Jw5nJa\
               5Fp45nxk6Wi50uQAzQAAxAAAzgAAzgAAzgAAzgAAxQCM06q60OVx2YMAzwBp0YEAzgAazyAAxQAAwwAo0DEhzyEAzgB55X+E45BQ3FVH3Eqc1LwAxQBV31UGyAcUyRQAzQCfrZ9o33AAuQAioSJSd1\
               KZ3LAVzhsEwgQtpQA91z1o3XFf4l9H20cLxQ081zyGr4Ze4l4ZixkDzgNFpkVw53AHyAee27iUPABy6HICxgJm5WZa4VoLyAsDxQNu5XBj4WYAxQBT3lNRyUNO305w6HBgWAFr5msAxQBr5GsmnABz\
               6XNr5muVOwBX31ddYAGT36Yu0i6f27mD5I2r2MtpZQAjyiJyWwJi4WIQwgAAzwAAzgAA0wAA1ABx6XEA0QAAygAA1gAAxwAA1wAA0gAA1QBs52wAxAAAywBp52lk5GQAzQBr52ti5GIAyQBn5mgBww\
               ACvQJl5WUExQQGygIRyRFu6G5g42AX1BcVyxVD3EMN0g1Q3k8l0SVI3UhFigVL3Us93D0z1TMc1Bxb4VtN4E1Z31k41zgMyQtccwAoqQAs0ywOzA4hziEGKga0GADZAgCoViAt2C0TzhMDewNxh3EEk\
               wQAigCura5Y41hhbACmPhW/CwDGBACCkTS5PRewKgO3NxB1pT6NYBMAzwBMWt6TAAABAHRSTlMAATX+/v7+/jg3/jj+NwX+HiBYJTGVCPwqBv4CEOYaGhIVhAv6/mQN/RETe3XZay3CRjX+PUAr9Df6\
               YxghTO9Uk/zNTugf8dtSIzfxx3WyLMT37mkeOvX+/uDl/uX+KDrr3vePitxvN6hAi/LfrPXPXtLext/rJ0J0gvi4/tL+/v6K5TD+8zFfEbsi/vn+o/7VloD+/nqZP62O61SZ7f6szP6x4jv+7K/+/v6\
               fyX7MYP5+/hH+///////////////////+//////////////////////////////////////7////////////////////////////////////////+zJkrZAAABFdJREFUSMeFVgVUG1kUJcmQPzNnQl\
               iSUCBoCbJFWqBoqe7W3ba67u7Curtv1t3ddyZDYBoXYhCsOAsUSmXd9ez/M5Oes2GSvvMjf/678+68d99LEhKkLDPlbN05KZUXlup0JWmyhOOZ/qSyWYCmMcMsjKbpi3V5x/GXlZwFAKYUDMMAWJYTH\
               1CCbq+0tia2wsWaYZQr4yIWGmhAWxT79iWi1cpCANiQHts/twwgQopE0ZSQEzAUxgY0QT6IEmuFlBSsieb3WZmx/POyQIBBKaLNSotFSfNoMkSvjwUoxG67OQAEQxniPx97iFyWHwNwU8vt39sFVsJC\
               r0d++sFwl7R/+iLu0Hd0NCBw6EdQLg1IA9itkAoWqRtfOgwLcEAnDSiF+bGwCtaqsIrLqmBZpcWMleVK+edk0SZFK19jsXDwBTdWVomVSgHKUcmgJf7P4AVI7Ey9hOzmiRUwmeBCXEwmdtKM5AQPTpd\
               ogywhM5gbwsRFH5iksXY3vJoyE7B6kQgIcFgkre63fzHffaBdGrB8hVhaigMRc+x8b+CpKvilQAKQf65DuDHDHHtnJn87vBNtuIUSWZpNuo/V2M3ZOYqBz/D7AOLHnSFViMx1JOdARAqoqu6B1z8YmK\
               C+OvwZ1KCDvGyxtLpXhkg7R9onhnv6X/n1yJG///3rCz/c22+8Qnp4yDbu6pnq6xvfz9sfR/88+k//VN/U+I4b9LEa4sFNRqMx7HH61C6XS32qz2NrNhq33BdnCNz/TG197ZbHNz3sQrZrd219/Wt1E\
               n75i59+fnZhGoysr3m2ZtvG9feMjY29v+PzL2vq3pLoNn352s0rDA6KW1fJj755pH/a5fV6Oz+S5i4rvPT65TlprxZntL25OiHvUQND2Q+Gm6G9vE260Zr4SZX+Rj/DvZSLNAvs7fu9Tl9w9Ln0eFOv\
               7p0Rau0GXkMk9zVMl1Fd9YQ+3hx+t6eFxKAuGM7f0uP0eIKjoc2V8UK8+HMLhYQEi+te6rSFm4Mhf1M8wL3OKooXNUmBIZvNox73+x+I4596Xf0EJaqVGXLCKg9z1Mq5C1JjuGvk8qsOUpFBOehzeoL\
               dBeDO7bi8MUnigbNVBC6/+ltSjNAbbvY4O0MMOHk+gePaOTMAySqcwFVLRiI99M2oL2wbbqMFAC6PRhTBiwRObC2mOL4/u3w2b+egHaIvJwh0JI9ipSF4q74GcGTfSFdxp9pls02jB7rofP4EjwqhES\
               KolmQwbR2DQXXQZevv4GBPX1KB8xGiAdkCAF91LUM7uI7u6e6OUBvklnGeSgQURQlci/OR1zQsxQAGHJSjAP0CZVwgUCVwzYwqaPkIuPyOU3qZyLDpvaVCuD1+2sxKJDXyRwTx5AtDXRlwijG9xbtXq\
               YQUZUtpVpaq0SKAquLjT/aq9+xR7/2weg3KqTY5KZaYkuZotHIVrto+/9OGrQ3VOK6Sz208UR//v0lqUXbyCYIlLyiK1t1/YH/f5OSaD9wAAAAASUVORK5CYII=' );
	
