mode_theme("1");
mode_question("1");
mode_sauvegarde("3");
titre_introduction("<font color=\"#ffff00\">Контроль знань з мови програмування Python</font>");
//--------------------------------------------------------
// Tableau d'informations :
// ouvre le tableau :
introduction("<center><table border=\"4\" cellspacing=\"0\" bordercolor=\"#FFFF00\">");
// Nouvelle ligne actualisation :
introduction("<tr><td bgcolor=\"#FFFFFF\"><div align=\"center\" style=\"padding:20px\"><font color=\"#FF0000\"><b>Це версія тестування з закінченням при першій помилці.<br/><br/>Тут ви не вибираєте кількість запитань під час запуску тестування.<br/><br/>Ваше завдання — відповісти на найбільшу кількість послідовних запитань без помилок.<br/><br/><br/>Тесту вання буде припинено після вашої першої помилки з повідомлення про результат.</b></font></div></td></tr>");
// Ferme le tableau :
introduction("</table></center><br />");
//--------------------------------------------------------

introduction("Ці тести <b><font color=\"#FFFF00\">містять більш, ніж 13 500 питань</font></b> згрупованих у різні теми щодо мови програмування Python.<br /><br />");
introduction("Тести розробив Жан-Крістоф Мішель, викладач інженерної справи, Франція.<br /><br />");
introduction("Ви можете повернутися до <a href=\"index.html\" target=\"_top\"><b><font color=\"#FFFF00\">класичної версії тестів</font></b></a><br />");

nombre_questions("9999");
message_debut("Répondez aux questions suivntes");
message_fin("Au plaisir de vous retrouver une prochaine fois !||Au revoir !");
url_quitter("https://pythonguide.rozh2sch.org.ua/");

coef_rep_juste("1");
coef_rep_fausse("-1");
coef_rep_nulle("-1");
note_sur("20");

appreciation("16","20","Дуже добре!||Надзвичайно!||Прекрасна робота!");
appreciation("13","16","Гарна робота!");
appreciation("10","13","Посередні відповіді.");
appreciation("6","10","Ви можете переглянути навчальні матеріали, а потім знову виконати ці вправи.");
appreciation("0","6","Не засмучуйтеся!||Перегляньте навчальний матеріали, перш ніж знову виконувати ці вправи.");
non_termine("Ви залишили вправу, не відповівши на всі питання!");

juste("Правильно");
faux("<font color=\"#ff0000\"><b>ПОМИЛКА - тестування буде закінчено...</b></font>");
abandon("<font color=\"#ff0000\"><b>Ви не відповіли на запитання, тестування закінчено</b></font>");

debut("Припинення тесту на першій помилці - просто дайте відповідь на якомога більше запитань підряд");

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

 
