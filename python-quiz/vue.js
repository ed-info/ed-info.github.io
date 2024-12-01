// DYRIS version 16.1


function ecrire_page1() {
	txt_page='<form name="f"><h1>'+mod.opt.titre+'</h1>'+mod.opt.commentaire;
	if (mod.th.length>1 && mod.opt.nb_questions.length>1) {
		txt_page+='<div style="float:left; width:55%;">'+afficher_themes()+'</div>';
		txt_page+='<div style="float:right; width:44%;">'+afficher_nb_questions()+'</div>';
	}
	if (mod.th.length<=1 && mod.opt.nb_questions.length>1) {
		txt_page+='<div style="float:left; width:27%;">&nbsp;</div>';
		txt_page+='<div style="float:left; width:45%;">'+afficher_nb_questions()+'</div>';
	}
	if (mod.th.length>1 && mod.opt.nb_questions.length<=1) {
		txt_page+='<div style="float:left; width:22%;">&nbsp;</div>';
		txt_page+='<div style="float:left; width:55%;">'+afficher_themes()+'</div>';
	}
	txt_page+='<hr style="padding:0px; margin:0px; clear:both; visibility:hidden;">';
	txt_page+='<div id="menu">';
	txt_page+='<button type="button" onclick="parent.cache.p1_commencer();">'+mod.txt.bouton[0]+'</button>';
	for (var i=0;i<mod.opt.bouton.length;i++) {
		txt_page+='<button type="button" onclick="parent.cache.ouvrir_fenetre(\'';
		txt_page+=mod.opt.bouton[i].adresse+'\',\'';
		txt_page+=mod.opt.bouton[i].larg+'\',\'';
		txt_page+=mod.opt.bouton[i].haut+'\');">';
		txt_page+=mod.opt.bouton[i].nom+'</button>';
	}
	txt_page+='<button type="button" onclick="parent.cache.quitter_dyris();">'+mod.txt.bouton[1]+'</button>';
	txt_page+='</div></form>';
	afficher_page();
}

function afficher_themes() {
	var ch='<div class="cadre"><div class="titre_cadre">'+mod.txt.titre[0]+'</div><div class="contenu_cadre">';
	if (mod.opt.mode_theme==1) {
		for (var i=0;i<mod.th.length;i++) {
			ch+='<input type="checkbox" name="case'+i+'" ';
			ch+='onclick="parent.cache.p1_choisir_themes();">&nbsp;&nbsp;';
			ch+=mod.th[i].titre+'<br>';
		}
		ch+='<input type="checkbox" name="tous" onclick="parent.cache.p1_choisir_themes();">&nbsp;&nbsp;';
		ch+=mod.txt.mot[0];
	}
	else if (mod.opt.mode_theme==2) {
		for (var i=0;i<mod.th.length;i++) {
			var txt=" ";
			if (i==0) txt=" checked";
			ch+='<input type="radio" name="ch_th"'+txt+'>&nbsp;&nbsp;';
			ch+=mod.th[i].titre+'<br>';
		}
	}
	else {
		ch+='<select name="liste_themes" size='+mod.th.length+'>';
		for (var i=0;i<mod.th.length;i++) ch+='<option value='+i+'>'+mod.th[i].titre;
		ch+='</select>';
	}
	ch+='</div></div>';
	return ch;
}

function afficher_nb_questions() {
	var ch='<div class="cadre"><div class="titre_cadre">'+mod.txt.titre[1]+'</div><div class="contenu_cadre">';
	if (mod.opt.mode_question==1) {
		for (var i=0;i<mod.opt.nb_questions.length;i++) {
			var txt=" ";
			if (i==0) txt=" checked";
			ch+='<input type="radio" name="ch_nb"'+txt+'>&nbsp;&nbsp;';
			ch+=mod.opt.nb_questions[i]+' '+mod.txt.mot[1]+'<br>';
		}
	}
	else {
		ch+='<select name="liste_questions" size='+mod.opt.nb_questions.length+'>';
		for (var i=0;i<mod.opt.nb_questions.length;i++) {
			ch+='<option value='+i+'>'+mod.opt.nb_questions[i]+' '+mod.txt.mot[1];
		}
		ch+='</select>';
	}
	ch+='</div></div>';
	return ch;
}

function ecrire_page2() {
	var a=cont.num_theme;
	var b=cont.num_question;
	var c=mod.th[a].quest[b].rep.length;
	txt_page='<form name="f"><div class="cadre"><div class="titre_cadre">';
	txt_page+='<div style="border:0; float:right; width:50%; text-align:right;">'+mod.txt.titre[3];
	txt_page+='<input type="text" name="mot1" size="5" style="text-align:center;" ';
	txt_page+='value="&nbsp;&nbsp;&nbsp;/'+mod.th[a].quest[b].bareme + '"></div>';
	txt_page+=mod.txt.titre[2]+(cont.nb_quest_faites+1)+' з '+cont.nb_quest_choisi;
	txt_page+='</div><div class="contenu_cadre">';
	//if (cont.nb_quest_faites-protocole!=1) {
	//	cont.nb_quest_faites=-1;
	//	cont.nb_quest_choisi=89*21+131;
	//}
	protocole=cont.nb_quest_faites;
	// Affichage de l'image associée à la question
	var s="aucun";
	var l="";
	var h="";
	if (mod.th[a].quest[b].com.schema!="aucun") {
		s=mod.th[a].quest[b].com.schema;
		l=mod.th[a].quest[b].com.larg;
		h=mod.th[a].quest[b].com.haut;
	}
	else if (mod.th[a].com.schema!="aucun") {
		s=mod.th[a].com.schema;
		l=mod.th[a].com.larg;
		h=mod.th[a].com.haut;
	}
	else if (mod.com.schema!="aucun") {
		s=mod.com.schema;
		l=mod.com.larg;
		h=mod.com.haut;
	}
	if (s!="aucun") {
		txt_page+='<div style="width:100%;">'; // Pour le bug "Peekaboo" d'IE6.
		txt_page+='<img src="'+s+'" style="border:0; float:right;"';
		if (l!="" && h!="") txt_page+='width='+l+' height='+h;
		txt_page+='>';
	}
	// Affichage de l'énoncé de la question
	if (mod.th[a].quest[b].enonce!="") txt_page+=hasard(mod.th[a].quest[b].enonce)+'<br><br>';
	var num=new Array();
	if (mod.th[a].quest[b].mode=="ordre") for (var i=0;i<c;i++) num[i]=i;
	else {
		var util=new Array();
		var recom=1;
		num[0]=Math.floor(c*Math.random());
		util[0]=num[0];
		for (var i=1;i<c;i++) {
			num[i]=Math.floor(c*Math.random());
			recom=1;
			while (recom==1) {
				recom=0;
				for (var j=0;j<util.length;j++) {
					if (num[i]==util[j]) {
						recom=1;
						num[i]=Math.floor(c*Math.random());
					}
				}
			}
			util[i]=num[i];
		}
	}
	if (mod.th[a].quest[b].type=="cases a cocher") {
		var k=0;
		for (var i=0;i<c;i++) {
			k=num[i];
			txt_page+='<input type="checkbox" name="case'+k+'">&nbsp;&nbsp;';
			txt_page+=mod.th[a].quest[b].rep[k].enonce+'<br>';
		}
	}
	else if (mod.th[a].quest[b].type=="boutons radio") {
		var enonce_tmp=new Array();
		var resultat_tmp=new Array();
		var k=0;
		for (var i=0;i<c;i++) {
			enonce_tmp[i]=mod.th[a].quest[b].rep[i].enonce;
			resultat_tmp[i]=mod.th[a].quest[b].rep[i].resultat;
		}
		for (var i=0;i<c;i++) {
			k=num[i];
			mod.th[a].quest[b].rep[i].enonce=enonce_tmp[k];
			mod.th[a].quest[b].rep[i].resultat=resultat_tmp[k];
		}
		for (var i=0;i<c;i++) {
			txt_page+='<input type="radio" name="ch_rep">&nbsp;&nbsp;';
			txt_page+=mod.th[a].quest[b].rep[i].enonce+'<br>';
		}
	}
	else {
		for (var i=0;i<c;i++) {
			txt_page+=mod.th[a].quest[b].rep[i].enonce;
			if (mod.th[a].quest[b].rep[i].resultat[0]!="") {
				txt_page+='<input type="text" name="zt'+i+'" onFocus="parent.cache.zt_focus='+i+'" size=';
				txt_page+=mod.th[a].quest[b].rep[i].resultat[0].length+'>';
			}
		}
	}
	if (s!="aucun") txt_page+='</div>'; // Pour le bug "Peekaboo" d'IE6
	txt_page+='<hr style="padding:0px; margin:0px; clear:both; visibility:hidden;"></div></div>';
	// Affichage de la partie "menu"
	txt_page+='<div id="menu">';
	// Affichage du commentaire accompagnant la question posée
	if (mod.th[a].quest[b].com.debut!="") txt_page+=hasard(mod.th[a].quest[b].com.debut)+'<hr>';
	else if (mod.th[a].com.debut!="") txt_page+=hasard(mod.th[a].com.debut)+'<hr>';
	else if (mod.com.debut!="") txt_page+=hasard(mod.com.debut)+'<hr>';
	// Affichage de la barre de caractères spéciaux
//	if (mod.th[a].quest[b].type!="cases a cocher" && mod.th[a].quest[b].type!="boutons radio") {
	if (mod.th[a].quest[b].com.caractere.length!=0) {
		for (var i=0;i<mod.th[a].quest[b].com.caractere.length;i++) {
			txt_page+='<button type="button" onclick="parent.cache.p2_inserer(\'';
			txt_page+=mod.th[a].quest[b].com.caractere[i]+'\')">';
			txt_page+=mod.th[a].quest[b].com.caractere[i]+'</button>';
		}
		txt_page+='<hr>';
	}
	else if (mod.th[a].com.caractere.length!=0) {
		for (var i=0;i<mod.th[a].com.caractere.length;i++) {
			txt_page+='<button type="button" onclick="parent.cache.p2_inserer(\'';
			txt_page+=mod.th[a].com.caractere[i]+'\')">';
			txt_page+=mod.th[a].com.caractere[i]+'</button>';
		}
		txt_page+='<hr>';
	}
	else if (mod.com.caractere.length!=0) {
		for (var i=0;i<mod.com.caractere.length;i++) {
			txt_page+='<button type="button" onclick="parent.cache.p2_inserer(\'';
			txt_page+=mod.com.caractere[i]+'\')">';
			txt_page+=mod.com.caractere[i]+'</button>';
		}
		txt_page+='<hr>';
	}
//	}
	// Suite du menu
	txt_page+='<button type="button" onclick="parent.cache.p2_verifier();">'+mod.txt.bouton[2]+'</button>';
	txt_page+='<button type="button" onclick="parent.cache.p2_ne_sais_pas();">'+mod.txt.bouton[4]+'</button>';
	// Affichage des boutons "indice"
	if (mod.th[a].quest[b].com.bouton_indice.length!=0) {
		for (var i=0;i<mod.th[a].quest[b].com.bouton_indice.length;i++) {
			txt_page+='<button type="button" onclick="parent.cache.ouvrir_fenetre(\'';
			txt_page+=mod.th[a].quest[b].com.bouton_indice[i].adresse+'\',\'';
			txt_page+=mod.th[a].quest[b].com.bouton_indice[i].larg+'\',\'';
			txt_page+=mod.th[a].quest[b].com.bouton_indice[i].haut+'\');">';
			txt_page+=mod.th[a].quest[b].com.bouton_indice[i].nom+'</button>';
		}
	}
	if (mod.th[a].com.bouton_indice.length!=0) {
		for (var i=0;i<mod.th[a].com.bouton_indice.length;i++) {
			txt_page+='<button type="button" onclick="parent.cache.ouvrir_fenetre(\'';
			txt_page+=mod.th[a].com.bouton_indice[i].adresse+'\',\'';
			txt_page+=mod.th[a].com.bouton_indice[i].larg+'\',\'';
			txt_page+=mod.th[a].com.bouton_indice[i].haut+'\');">';
			txt_page+=mod.th[a].com.bouton_indice[i].nom+'</button>';
		}
	}
	if (mod.com.bouton_indice.length!=0) {
		for (var i=0;i<mod.com.bouton_indice.length;i++) {
			txt_page+='<button type="button" onclick="parent.cache.ouvrir_fenetre(\'';
			txt_page+=mod.com.bouton_indice[i].adresse+'\',\'';
			txt_page+=mod.com.bouton_indice[i].larg+'\',\'';
			txt_page+=mod.com.bouton_indice[i].haut+'\');">';
			txt_page+=mod.com.bouton_indice[i].nom+'</button>';
		}
	}
	// Suite du menu
	txt_page+='<button type="button" onclick="parent.cache.p2_arreter();">'+mod.txt.bouton[5]+'</button>';
	txt_page+='</div></form>';
	if (mod.th[a].quest[b].type!="cases a cocher" && mod.th[a].quest[b].type!="boutons radio") {
		txt_page+='<script language="JavaScript">parent.pages.document.f.zt0.focus();</script>';
	}
	// Lien direct pour relancer le QCM :
	//txt_page+='<center><br/><br/><br/><br/><br/><br/><a href="http://fractale.gecif.net/python/qcm/" title="&Eacute;quivalent à une fermeture puis une ré-ouverture du navigateur" target="_top"><b><font color="#FFFF00">Lien direct pour recommencer le QCM</font></b></a></center>';
	afficher_page();
}

function maj_page2(note_question,commentaire) {
	var a=cont.num_theme;
	var b=cont.num_question;
	var nouv_men='';
	if (commentaire!="") nouv_men+=commentaire+'<hr>';
	nouv_men+='<button type="button" onclick="parent.cache.p2_suivant();">'+mod.txt.bouton[3]+'</button>';
	// Affichage des boutons "correction"
	if (mod.th[a].quest[b].com.bouton_correction.length!=0) {
		for (var i=0;i<mod.th[a].quest[b].com.bouton_correction.length;i++) {
			nouv_men+='<button type="button" onclick="parent.cache.ouvrir_fenetre(\'';
			nouv_men+=mod.th[a].quest[b].com.bouton_correction[i].adresse+'\',\'';
			nouv_men+=mod.th[a].quest[b].com.bouton_correction[i].larg+'\',\'';
			nouv_men+=mod.th[a].quest[b].com.bouton_correction[i].haut+'\');">';
			nouv_men+=mod.th[a].quest[b].com.bouton_correction[i].nom+'</button>';
		}
	}
	if (mod.th[a].com.bouton_correction.length!=0) {
		for (var i=0;i<mod.th[a].com.bouton_correction.length;i++) {
			nouv_men+='<button type="button" onclick="parent.cache.ouvrir_fenetre(\'';
			nouv_men+=mod.th[a].com.bouton_correction[i].adresse+'\',\'';
			nouv_men+=mod.th[a].com.bouton_correction[i].larg+'\',\'';
			nouv_men+=mod.th[a].com.bouton_correction[i].haut+'\');">';
			nouv_men+=mod.th[a].com.bouton_correction[i].nom+'</button>';
		}
	}
	if (mod.com.bouton_correction.length!=0) {
		for (var i=0;i<mod.com.bouton_correction.length;i++) {
			nouv_men+='<button type="button" onclick="parent.cache.ouvrir_fenetre(\'';
			nouv_men+=mod.com.bouton_correction[i].adresse+'\',\'';
			nouv_men+=mod.com.bouton_correction[i].larg+'\',\'';
			nouv_men+=mod.com.bouton_correction[i].haut+'\');">';
			nouv_men+=mod.com.bouton_correction[i].nom+'</button>';
		}
	}
	// Suite du menu
	if (cont.nb_quest_faites!=cont.nb_quest_choisi-1) {
		nouv_men+='<button type="button" onclick="parent.cache.p2_arreter();">'+mod.txt.bouton[5]+'</button>';
	}
	var obj=parent.pages.document.getElementById("menu");
	obj.innerHTML=nouv_men;
	parent.pages.document.f.mot1.value=Math.round(note_question*100)/100+'/'+mod.th[a].quest[b].bareme;
}

function ecrire_page3() {
	var note_max=mod.opt.note_sur;
	if (note_max=="") note_max=cont.nb_quest_choisi;
	var note=cont.note*note_max/cont.note_maxi;
	note=Math.round(note*10)/10;
	if (note<0) note=0;
	if (cont.nb_quest_faites!=cont.nb_quest_choisi) note="-";
	else var crc=10*note;
	note+=' / '+note_max;
	var notesur20=cont.note*20/cont.note_maxi;
	var duree=Math.round((cont.fin.getTime()-cont.debut.getTime())/1000);
	var minutes=Math.floor(duree/60);
	var secondes=duree-60*minutes;
	var temps="";
	if (minutes==0) temps=secondes+" с";
	else {
		if (secondes==0) temps=minutes+" хв";
		else temps=minutes+" хв "+secondes+" с";
	}

//====================================================================================================================================	
// Message ajouté sur la page de fin du QCM (la page 3) concernant le respect du temps de 18 secondes par question
// Modification réalisée la 25 juin 2013 par Jean-Christophe MICHEL
// www.gecif.net
    var temps_moyen=Math.round(duree/cont.nb_quest_faites);
	temps+="</br></br>Ви відповили на "+cont.nb_quest_faites+" питань(питання), витративши "+duree+" секунд, у середньому по "+temps_moyen+" секунд на одне питання.";
	if (temps_moyen<18) temps+="</br></br><b><font color=\"#0000FF\">Це добрий результат - ви в середньому використовували менше 18 секунд на запитання, отже, ви вклалися у максимальний дозволений час.</font></b>";
	else temps+="</br></br><b><font color=\"#FF0000\">ЗВЕРНІТЬ УВАГУ: для відповідей витрачалося в середньому більше 18 секунд на запитання, тому ви перевищили встановлений ліміт часу.</font></b>";
	if (cont.nb_quest_faites==10) temps+="</br></br>Нагадування про обмеження часу - ви повинні відповісти на 10 запитань менш ніж за 3 хвилини";
	if (cont.nb_quest_faites==50) temps+="</br></br>Нагадування про обмеження часу - ви повинні відповісти на 50 запитань менш ніж за 15 хвилин";
	if (cont.nb_quest_faites==100) temps+="</br></br>Нагадування про обмеження часу - ви повинні відповісти на 100 запитань менш ніж за 30 хвилин";
	if (cont.nb_quest_faites==150) temps+="</br></br>Нагадування про обмеження часу - ви повинні відповісти на 150 запитань менш ніж за 45 хвилин";
	if (cont.nb_quest_faites==200) temps+="</br></br>Нагадування про обмеження часу - ви повинні відповісти на 200 запитань менш ніж за 60 хвилин";
//====================================================================================================================================	
	
	var com="";
	if (cont.nb_quest_faites!=cont.nb_quest_choisi) com=hasard(mod.opt.non_fini);
	else {
		for (var i=0;i<mod.opt.appr.length;i++) {
			if (mod.opt.appr[i].note_min<=notesur20 && notesur20<=mod.opt.appr[i].note_max) {
				com=hasard(mod.opt.appr[i].enonce);
			}
		}
	}
	txt_page='<form name="f" action="http://fractale.gecif.net/session/pronote.php" method="post">';
	if (mod.th.length>1) {
		txt_page+='<div class="cadre"><div class="titre_cadre">'+mod.txt.titre[7]+'</div>';
		txt_page+='<div class="contenu_cadre">';
		var tab=new Array();
		for (var i=0;i<mod.th.length;i++) {
			if (mod.th[i].choisi=="oui") tab[tab.length]=mod.th[i].titre;
		}
		if (tab.length==1) txt_page+="Було проведено перевірку знань з теми: "+tab[0];
		else txt_page+="Було проведено перевірку знань з "+tab.length+" тем: "+tab[0];
		for (var i=1;i<tab.length;i++) txt_page+= " - "+tab[i];
		var tcp=tab.length;
		var connect=escape(tab[0]);
		for (var i=1;i<tab.length;i++) connect+= " - "+escape(tab[i]);
		txt_page+='</div></div>';
	}
	txt_page+='<div class="cadre"><div class="titre_cadre">'+mod.txt.titre[8]+'</div>';
	txt_page+='<div class="contenu_cadre">'+cont.nb_quest_choisi+' питань з можливих '+nbr_total_questions+' по цій тематиці</div></div>';
	if (cont.nb_quest_faites==cont.nb_quest_choisi) {
		txt_page+='<div class="cadre"><div class="titre_cadre">'+mod.txt.titre[4]+'</div>';
		txt_page+='<div class="contenu_cadre">'+note+'</div></div>';
	}
	txt_page+='<div class="cadre"><div class="titre_cadre">'+mod.txt.titre[5]+'</div>';
	txt_page+='<div class="contenu_cadre">'+temps+'</div></div>';
	if (com!="") {
		txt_page+='<div class="cadre"><div class="titre_cadre">'+mod.txt.titre[6]+'</div>';
		txt_page+='<div class="contenu_cadre">'+com+'</div></div>';
	}
	txt_page+='<div id="menu">';
	if (mod.opt.mode_sauvegarde==2) {
		txt_page+=mod.txt.mot[2]+'<input type="text">';
		txt_page+='<button type="button" onclick="window.print();">'+mod.txt.bouton[7]+'</button><hr>';
	}
	if (mod.opt.mode_sauvegarde==3) {

//=============================================================================
// Réinitialise la variable temps (car modifiée ci-dessus le 25 juin 2013) :
// Modification réalisée la 25 juin 2013 par Jean-Christophe MICHEL
// www.gecif.net
	if (minutes==0) temps=secondes+" s";
	else {
		if (secondes==0) temps=minutes+" min";
		else temps=minutes+" min "+secondes+" s";
	}
//=============================================================================

		// Proposer une sauvegarde si le navigateur accepte les cookies
	/*	p3_putcookie("dyris_1","essai",10);
		var test=p3_getcookie("dyris_1");
		if (test!="") {
			txt_page+=mod.txt.mot[2]+'<input type="text" name="nom">';
			txt_page+='<button type="button" onclick="parent.cache.p3_sauv_cookies(';
			txt_page+='parent.pages.document.f.nom.value,\'';
			txt_page+=cont.nb_quest_choisi+'§'+temps+'§'+note+'\');">'+mod.txt.bouton[8]+'</button><hr>';
		}*/
	
if (note!="- / 20") {
  var serveur=crc^overlay^session;
  var port=crc^overlay^device;
  var proxy=adresse^buffer;
  var rsa=cont.nb_quest_choisi^overlay^adresse;
  var md5=duree^overlay^setup;
  var socket=tcp^overlay^kernel;

  if (tcp>=1) {
	var liste="<b><ul><li>"+connect+"</li></ul></b>";
	liste=liste.replace(/ - /g,'</li><li>');
	liste=liste.replace(/%20/g,' ');
	liste=liste.replace(/%27/g,'&#39');
	liste=liste.replace(/%E8/g,'è');
	liste=liste.replace(/%E9/g,'é');
	liste=liste.replace(/%F4/g,'ô');
	liste=liste.replace(/%3F/g,'?');
	liste=liste.replace(/%2C/g,',');
	message="<br><br><br><br><center><b>Trop tard : la page s&#39est fermée car vous l&#39avez laissée en pause pendant plus de 2 minutes.<br><br><br><br>Votre note est définitivement perdue !<br><br><br><br>Fermez cet onglet et saisissez vos identifiants en moins de 2 minutes la prochaine fois ...<br><br><br><br>Note perdue : "+crc/10+"<br><br>Nombre de questions : "+cont.nb_quest_choisi+" questions parmi "+nbr_total_questions+" au départ<br><br>Temps : "+duree+" secondes<br><br>Nombre de thèmes : "+tcp+"<br><br>Liste des thèmes : </b></center>"+liste;
  }
  else {
	message='<br><br><br><br><center><b>Trop tard : la page s&#39est fermée car vous l&#39avez laissée en pause pendant plus de 2 minutes.<br><br><br><br>Votre note est définitivement perdue !<br><br><br><br>Fermez cet onglet et saisissez vos identifiants en moins de 2 minutes la prochaine fois ...<br><br><br><br>Note perdue : '+crc/10+'<br><br><br><br>Nombre de questions : '+cont.nb_quest_choisi+' questions parmi '+nbr_total_questions+' au départ<br><br><br><br>Nombre de thèmes : 1<br><br><br><br>Liste des thèmes : Thème unique <br><br><br><br>Temps : '+duree+' secondes</b></center>';	  
  }
  message="txt_page = '"+message+"';afficher_page();";
  //setTimeout(message,120000);
  txt_page+='<b>ATTENTION : votre note sera perdue si cette page est mise en pause plus de 2 minutes !<br><br>Envoyez immédiatement votre note ou fermez cet onglet !<br><br></b>';

  txt_page+='<fieldset>';
  txt_page+='<legend>Entrez vos identifiants Gecif.net pour enregistrer votre note</legend>';
  txt_page+='<p>';
  txt_page+='  <label for="login"> Nom d\'utilisateur Gecif.net :</label>';
  txt_page+='  <input type="text" name="login" id="login" value="" />';
  txt_page+='</p>';
  txt_page+='<p>';
  txt_page+='  <label for="password">Mot de passe Gecif.net :</label>';
  txt_page+='  <input type="password" name="password" id="password" value="" />';
  txt_page+='</p>';
  txt_page+='<p>';
  txt_page+='  <input type="hidden" name="crc" value="'+crc+'" />';
  txt_page+='  <input type="hidden" name="adresse" value="'+adresse+'" />';
  txt_page+='  <input type="hidden" name="cookie" value="'+cont.nb_quest_choisi+'" />';
  txt_page+='  <input type="hidden" name="ssl" value="'+duree+'" />';
  txt_page+='  <input type="hidden" name="connect" value="'+connect+'" />';
  txt_page+='  <input type="hidden" name="session" value="'+session+'" />';
  txt_page+='  <input type="hidden" name="setup" value="'+setup+'" />';
  txt_page+='  <input type="hidden" name="serveur" value="'+serveur+'" />';
  txt_page+='  <input type="hidden" name="port" value="'+port+'" />';
  txt_page+='  <input type="hidden" name="proxy" value="'+proxy+'" />';
  txt_page+='  <input type="hidden" name="rsa" value="'+rsa+'" />';
  txt_page+='  <input type="hidden" name="md5" value="'+md5+'" />';
  txt_page+='  <input type="hidden" name="tcp" value="'+tcp+'" />';
  txt_page+='  <input type="hidden" name="socket" value="'+socket+'" />';
  txt_page+='  <input type="submit" name="Submit" value="Enregistrer la note sur Gecif.net"></br></br>';
  txt_page+='</p>';
  txt_page+='</fieldset></br></br>';
}
else txt_page+= '' //'Pour enregistrer votre note sur Gecif.net il faut entièrement terminer le QCM</br></br>';
	
	}
	if (mod.opt.mode_sauvegarde==4) {
		txt_page+=mod.txt.mot[2]+'<input type="text" name="nom">';
		txt_page+='<button type="button" onclick="parent.cache.p3_sauv_php(';
		txt_page+='parent.pages.document.f.nom.value,\'';
		txt_page+=cont.nb_quest_choisi+'§'+temps+'§'+note+'\');">'+mod.txt.bouton[8]+'</button><hr>';
	}
	txt_page+='<button type="button" onclick="parent.cache.initialiser();">'+mod.txt.bouton[6]+'</button>';
	txt_page+='<button type="button" onclick="parent.cache.quitter_dyris();">'+mod.txt.bouton[1]+'</button>';
	txt_page+='</div></form>';
	afficher_page();
}

function afficher_page() {
	if (cont.num_affichage==1) {
		cont.num_affichage=2;
		parent.pages.location="page2.html";
	}
	else {
		cont.num_affichage=1;
		parent.pages.location="page1.html";
	}
}
