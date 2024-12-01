mode_theme("1");
mode_question("1");
mode_sauvegarde("3");
titre_introduction("<font color=\"#ffff00\">Контроль знань з мови програмування Python</font>");
introduction("Ці тести <b><font color=\"#FFFF00\">містять більш, ніж 13 500 питань</font></b> згрупованих у різні теми щодо мови програмування Python.<br /><br />");
introduction("Також існує версія тестів <a href=\"index_stop.html\" target=\"_blank\"><b><font color=\"#FFFF00\">із закінченням на першій помилці</font></b></a>.<br /><br />");

//--------------------------------------------------------
// Tableau d'informations :

// ouvre le tableau :
//introduction("<br /><br /><center><table border=\"4\" cellspacing=\"0\" bordercolor=\"#FFFF00\">");

// Nouvelle ligne actualisation :
//introduction("<tr><td bgcolor=\"#FFFFFF\"><div align=\"center\" style=\"padding:20px\"><font color=\"#FF0000\"><b>Rattrapage de l'évaluation le jeudi 05 décembre 2019 :<br /><br />Pour obtenir la dernière version fonctionnelle de ce QCM actualisez<br /><br />complètement cette page en appuyant plusieurs fois sur la touche F5.<br /><br />En sélectionnant les 8 premiers thèmes de l'évaluation vous devez obtenir 9600 questions au départ.</b></font></div></td></tr>");

// Ferme le tableau :
//introduction("</table></center><br />");
//--------------------------------------------------------

//introduction("Rappel des temps à atteindre : 10 questions en 3 minutes, 50 questions en 15 minutes, 100 questions en 30 minutes, 150 questions en 45 minutes, soit 200 questions en 1 heure maximum.<br /><br />");

// message pour le nouveau barème :
//introduction("<br/><center><table border=\"3\" cellspacing=\"0\" bordercolor=\"#FFFF00\"><tr><td bgcolor=\"#FF0000\"><div align=\"center\"><b><font color=\"#FFFFFF\"><br/>&nbsp;&nbsp;&nbsp;&nbsp;Nouveau barème :&nbsp;&nbsp;&nbsp;&nbsp;<br/><br/>0 erreur : 20/20<br/><br/>50 erreurs : 15/20<br/><br/>100 erreurs : 10/20<br/><br/>150 erreurs : 5/20<br/><br/>200 erreurs : 0/20<br/><br/></font></b></div></td></tr></table></center>");

introduction("Тести розробив Жан-Крістоф Мішель, викладач інженерної справи, Франція.<br /><br />");
introduction("")
//introduction("Retrouvez de nombreux autres QCM et cours sur le site <a href=\"http://nsi.gecif.net/\" target=\"_top\"><b><font color=\"#FFFF00\">nsi.gecif.net</font></b></a></br><font color=\"#6F3700\">Tu n'as que ça à faire de chercher des liens cachés ? ? !</font></br>");

nombre_questions("25","50","100","150","200");
message_debut("Répondez aux questions suivntes");
message_fin("Au plaisir de vous retrouver une prochaine fois !||До зустрічі!");
url_quitter("https://pythonguide.rozh2sch.org.ua/");

coef_rep_juste("1");
coef_rep_fausse("0");
coef_rep_nulle("0");
note_sur("20");

appreciation("16","20","Дуже добре!||Надзвичайно!||Прекрасна робота!");
appreciation("13","16","Гарна робота!");
appreciation("10","13","Посередні відповіді.");
appreciation("6","10","Ви можете переглянути навчальні матеріали, а потім знову виконати ці вправи.");
appreciation("0","6","Не засмучуйтеся!||Перегляньте навчальний матеріали, перш ніж знову виконувати ці вправи.");
non_termine("Ви залишили вправу, не відповівши на всі питання!");

juste("Саме так!||Правильно||Добре||Дуже добре||Ідеально!||Чудово!||Та, це правильна відповідь!||Ви не помилились!||Чудова відповідь!||Маєте гарні знання!||Це дуже добре!||Дуже добре: -) ||Ідеально! :-)||Чудово! ;-)||Гарна відповідь! :-)||Це дуже добре :-)");
faux("<font color=\"#ff0000\"><b>Ні, це не так...</b></font>||<font color=\"#ff0000\"><b>Можна краще...</b></font>||<font color=\"#ff0000\"><b>Помилка...</b></font>||<font color=\"#ff00\"><b>Ви помилились...</b></font>||<font color=\"#ff00\"><b>Неправильна відповідь!</b></font>||<font color=\"#ff0000\"><b>Ні, це не так&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:-(</b></font>||<font color=\"#ff0000\"><b>Потрібно краще&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:-(</b></font>||<font color=\"#ff0000\"><b>Помилка&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:-(</b></font>||<font color=\"#ff0000\"><b>Це не так&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:-(</b></font>");
abandon("Спробуйте відповісти наступного разу!||Не засмучуйтеся!||<font color=\"#ff0000\"><b>Зробіть нотатки, щоб наступного разу ви могли відповісти на запитання такого типу</b></font>");

debut("Тестування з мови програмування Python");

function include(fichier)
{
	document.write("<script charset='utf-8' type='text/javascript' src='"+fichier+"'></script>" ); 
}  

include("theme_operateurs.js"); 
include("theme_logique.js"); 
include("theme_condition.js"); 
include("theme_if.js"); 
include("theme_for.js"); 
include("theme_while.js"); 
include("theme_chaine.js"); 
include("theme_chaine_2.js"); 
include("theme_liste.js"); 
include("theme_dictionnaire.js"); 
include("theme_ensemble.js"); 
include("theme_type.js"); 
include("theme_range.js"); 
include("theme_fichier.js");
 
