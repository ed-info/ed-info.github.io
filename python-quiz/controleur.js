// DYRIS version 16.1


// VARIABLES GLOBALES

var txt_page="";
var fen_guide=null;
var timer=null;
var flag=1;
var zt_focus=0;
var session=Math.floor(Math.random()*Math.pow(10,8));
var setup=Math.floor(Math.random()*Math.pow(10,8));
var temps=new Date();
var device=4038;
var buffer=41286;
var kernel=387;
var overlay=Math.pow(2,24);
var protocole=-1;
var nbr_total_questions=0;

// CLASSE CL_controleur

function CL_controleur() {
	this.debut=null;
	this.fin=null;
	this.nb_quest_choisi=0;
	this.nb_quest_faites=0;
	this.num_theme=0;
	this.num_question=0;
	this.num_page="1";
	this.num_affichage=1;
	this.note=0;
	this.note_maxi=0;
}


// CREATION DE L'OBJET ASSOCIE AU CONTROLEUR

var cont=new CL_controleur();


// AVANT DE COMMENCER

function initialiser() {
	adresse=Math.floor((temps.getTime()-1370000000000)/100);
	device+=75620000;
	buffer+=39500000;
	kernel+=41950000;
	cont.nb_quest_faites=0;
	cont.note=0;
	cont.note_maxi=0;
	for (var i=0;i<mod.th.length;i++) {
		mod.th[i].etat="libre";
		for (var j=0;j<mod.th[i].quest.length;j++) mod.th[i].quest[j].etat="libre";
		if (mod.th[i].quest.length==0) mod.th[i].etat="fini";
	}
	ecrire_page1();
	cont.num_page="1";
}

// FONCTIONS APPELEES DEPUIS LA PREMIERE PAGE

function p1_choisir_themes() {
	if (parent.pages.document.f.tous.checked) {
		for (var i=0;i<mod.th.length;i++) parent.pages.document.f.elements["case"+i].checked=true;
	}
}

function p1_commencer() {
	// Vérification du choix des thèmes
	for (var i=0;i<mod.th.length;i++) mod.th[i].choisi="non";
	if (mod.th.length==1) mod.th[0].choisi="oui";
	if (mod.th.length>1) {
		if (mod.opt.mode_theme==1) {
			for (var i=0;i<mod.th.length;i++) {
				if (parent.pages.document.f.elements["case"+i].checked) mod.th[i].choisi="oui";
			}
		}
		else if (mod.opt.mode_theme==2) {
			for (var i=0;i<mod.th.length;i++) {
				if (parent.pages.document.f.ch_th[i].checked) mod.th[i].choisi="oui";
			}
		}
		else {
			var n=parent.pages.document.f.liste_themes.selectedIndex;
			if (n!=-1) mod.th[n].choisi="oui";
		}
	}
	var verif_th="non";
	for (var i=0;i<mod.th.length;i++) { if (mod.th[i].choisi=="oui") verif_th="ok"; }
	if (verif_th=="non") alert(mod.txt.fenetre[0]);
	// Vérification du choix du nombre de questions
	if (verif_th=="ok") {
		var nb_quest_dispo=0;
		for (var i=0;i<mod.th.length;i++) {
			if (mod.th[i].choisi=="oui") nb_quest_dispo+=mod.th[i].quest.length;
		}
		cont.nb_quest_choisi="aucun";
		if (mod.opt.nb_questions.length==0) cont.nb_quest_choisi=nb_quest_dispo;
		if (mod.opt.nb_questions.length==1) cont.nb_quest_choisi=mod.opt.nb_questions[0];
		if (mod.opt.nb_questions.length>1) {
			if (mod.opt.mode_question==1) {
				for (var i=0;i<mod.opt.nb_questions.length;i++) {
					if (parent.pages.document.f.ch_nb[i].checked) {
						cont.nb_quest_choisi=mod.opt.nb_questions[i];
					}
				}
			}
			else {
				var n=parent.pages.document.f.liste_questions.selectedIndex;
				if (n!=-1) cont.nb_quest_choisi=mod.opt.nb_questions[n];
			}
		}
		var verif_quest="non";
		if (cont.nb_quest_choisi!="aucun" && cont.nb_quest_choisi<=nb_quest_dispo) verif_quest="ok";
		if (cont.nb_quest_choisi=="aucun") alert(mod.txt.fenetre[1]);
		// Les 2 boites de dialogue "alert" ci-dessous ont été modifiées le 24 juin 2013 afin d'afficher le nombre de questions au démarrage.
		// Modification faite par Jean-Christophe MICHEL
		// www.gecif.net
		if (cont.nb_quest_choisi>nb_quest_dispo) alert("Vous avez choisi "+cont.nb_quest_choisi+" questions mais il n'y a que "+nb_quest_dispo+" питань обраної теми.\n\nVeuillez sélectionner plus de thèmes ou choisir moins de questions.");
	}
	// Début de l'exercice
	// Si on choisi 10, 50, 100, 150 ou 200 questions, alors le temps est rappelé dans la boite de dialogue au démarage :
	// Ajouté par Jean-Christophe MICHEL le 25 juin 2013
	// www.gecif.net
	nbr_total_questions=nb_quest_dispo;
	if (verif_quest=="ok") {
		if (mod.opt.conseil_debut!="") {
		if (cont.nb_quest_choisi==10) alert("Вам буде запропоновано "+cont.nb_quest_choisi+" запитань, обраних випадковим чином із "+nb_quest_dispo+" питань обраної теми.\n\nПам'ятайте - ви маєте дати відповідь на 10 питань протягом 3 хвилин.\n\nБудьте уважні!");
		else if (cont.nb_quest_choisi==50) alert("Вам буде запропоновано "+cont.nb_quest_choisi+" запитань, обраних випадковим чином із "+nb_quest_dispo+" питань обраної теми.\n\nПам'ятайте - ви маєте дати відповідь на 50 питань протягом 15 хвилин.\n\nБудьте уважні!");
		else if (cont.nb_quest_choisi==100) alert("Вам буде запропоновано "+cont.nb_quest_choisi+" запитанm, обранихі випадковим чином із "+nb_quest_dispo+" питань обраної теми.\n\nПам'ятайте - ви маєте дати відповідь на 100 питань протягом 30 хвилин.\n\nБажаємо успіхів у проходженні тесту!");
		else if (cont.nb_quest_choisi==150) alert("Вам буде запропоновано "+cont.nb_quest_choisi+" запитань, обраних випадковим чином із "+nb_quest_dispo+" питань обраної теми.\n\nПам'ятайте - ви маєте дати відповідь на 150 питань протягом 45 хвилин.\n\nБажаємо успіхів у проходженні тесту!");
		else if (cont.nb_quest_choisi==200) alert("Вам буде запропоновано "+cont.nb_quest_choisi+" запитань, обраних випадковим чином із "+nb_quest_dispo+" питань обраної теми.\n\nПам'ятайте - ви маєте дати відповідь на 200 питань протягом 60 хвилин.\n\nБажаємо успіхів у проходженні тесту!");
		else alert("Вам буде запропоновано "+cont.nb_quest_choisi+" запитань, обраних випадковим чином із "+nb_quest_dispo+" питань обраної теми.\n\nБажаємо успіхів у проходженні тесту!");
		}
		cont.debut=new Date();
		nouvelle_question();
	}
}


// FONCTIONS APPELEES DEPUIS LA DEUXIEME PAGE

function p2_verifier() {
	var a=cont.num_theme;
	var b=cont.num_question;
	var c=mod.th[a].quest[b].rep.length;
	var suite="";
	// Vérification de l'existence d'une réponse apportée par l'élève
	if (mod.th[a].quest[b].type=="cases a cocher") {
		suite="non";
		for (var i=0;i<c;i++) if (parent.pages.document.f.elements["case"+i].checked) suite="oui";
		if (suite=="non") alert(mod.txt.fenetre[3]);
	}
	else if (mod.th[a].quest[b].type=="boutons radio") {
		suite="non";
		for (var i=0;i<c;i++) if (parent.pages.document.f.ch_rep[i].checked) suite="oui";
		if (suite=="non") alert(mod.txt.fenetre[3]);
	}
	else {
		suite="oui";
		for (var i=0;i<c;i++) {
			if (mod.th[a].quest[b].rep[i].resultat[0]!="") {
				if (sup_esp(parent.pages.document.f.elements["zt"+i].value)=="") suite="non";
			}
		}
		if (suite=="non") {
			repondu="non";
			for (var i=0;i<c;i++) if (mod.th[a].quest[b].rep[i].resultat[0]!="") {
				if (sup_esp(parent.pages.document.f.elements["zt"+i].value)!="") repondu="oui";
			}
			if (repondu=="non") alert(mod.txt.fenetre[3]);
			if (repondu=="oui") { if (confirm(mod.txt.fenetre[4])) suite="oui"; }
		}
	}
	if (suite=="oui") {
		// Identification de la réponse et calcul de la note obtenue à la question
		var repondu="juste";
		var note_question=0;
		if (mod.th[a].quest[b].type=="cases a cocher") {
			for (var i=0;i<c;i++) {
				if (parent.pages.document.f.elements["case"+i].checked) {
					if (mod.th[a].quest[b].rep[i].resultat=="faux") repondu="faux";
				}
				else {
					if (mod.th[a].quest[b].rep[i].resultat=="vrai") repondu="faux";
				}
			}
			if (repondu=="juste") {
				note_question=mod.th[a].quest[b].bareme;
			}
			if (repondu=="faux") {
				note_question=mod.opt.coef_rep_fausse*mod.th[a].quest[b].bareme/mod.opt.coef_rep_juste;
			}
		}
		else if (mod.th[a].quest[b].type=="boutons radio") {
			for (var i=0;i<c;i++) {
				if (parent.pages.document.f.ch_rep[i].checked) {
					if (mod.th[a].quest[b].rep[i].resultat=="faux") repondu="faux";
				}
				else {
					if (mod.th[a].quest[b].rep[i].resultat=="vrai") repondu="faux";
				}
			}
			if (repondu=="juste") {
				note_question=mod.th[a].quest[b].bareme;
			}
			if (repondu=="faux") {
				note_question=mod.opt.coef_rep_fausse*mod.th[a].quest[b].bareme/mod.opt.coef_rep_juste;
			}
		}
		else {
			var nb_cases=0;
			for (var i=0;i<c;i++) if (mod.th[a].quest[b].rep[i].resultat[0]!="") nb_cases++;
			var bareme_case=mod.th[a].quest[b].bareme/nb_cases;
			for (var i=0;i<c;i++) {
				if (mod.th[a].quest[b].rep[i].resultat[0]!="") {
					if (sup_esp(parent.pages.document.f.elements["zt"+i].value)=="") {
						case_repondu="rien";
					}
					else {
						case_repondu="faux";
						var repon=parent.pages.document.f.elements["zt"+i].value;
						for (var j=0;j<mod.th[a].quest[b].rep[i].resultat.length;j++) {
							var result=mod.th[a].quest[b].rep[i].resultat[j];
							if (sup_esp(repon)==sup_esp(result)) case_repondu="juste";
						}
					}
					if (case_repondu=="juste") {
						note_question+=bareme_case;
					}
					if (case_repondu=="faux") {
						note_question+=mod.opt.coef_rep_fausse*bareme_case/mod.opt.coef_rep_juste;
						repondu="faux";
						mod.th[a].quest[b].rep[i].repondu="faux";
					}
					if (case_repondu=="rien") {
						note_question+=mod.opt.coef_rep_nulle*bareme_case/mod.opt.coef_rep_juste;
						if (repondu!="faux") repondu="partiel";
						mod.th[a].quest[b].rep[i].repondu="faux";
					}
				}
			}
		}
		// Commentaire sur la réponse apportée par l'élève
		var com="";
		if (repondu=="juste") {
			if (mod.th[a].quest[b].com.juste!="") com=hasard(mod.th[a].quest[b].com.juste);
			else if (mod.th[a].com.juste!="") com=hasard(mod.th[a].com.juste);
			else if (mod.com.juste!="") com=hasard(mod.com.juste);
		}
		if (repondu=="faux") {
			if (mod.th[a].quest[b].com.faux!="") com=hasard(mod.th[a].quest[b].com.faux);
			else if (mod.th[a].com.faux!="") com=hasard(mod.th[a].com.faux);
			else if (mod.com.faux!="") com=hasard(mod.com.faux);
		}
		maj_page2(note_question,com);
		cont.note+=note_question;
		cont.note_maxi+=mod.th[a].quest[b].bareme;
		mod.th[a].quest[b].etat="corrigee";
		cont.nb_quest_faites++;
		cont.num_page="2bis";
		if (repondu=="partiel" || repondu=="faux") p2_clignoter();
		
	}
}

function p2_ne_sais_pas() {
	var a=cont.num_theme;
	var b=cont.num_question;
	var com="";
	if (mod.th[a].quest[b].com.abandon!="") com=hasard(mod.th[a].quest[b].com.abandon);
	else if (mod.th[a].com.abandon!="") com=hasard(mod.th[a].com.abandon);
	else if (mod.com.abandon!="") com=hasard(mod.com.abandon);
	var note_question=mod.opt.coef_rep_nulle*mod.th[a].quest[b].bareme/mod.opt.coef_rep_juste;
	if (mod.th[a].quest[b].type=="autre") {
		var c=mod.th[a].quest[b].rep.length;
		for (var i=0;i<c;i++) mod.th[a].quest[b].rep[i].repondu="faux";
	}
	maj_page2(note_question,com);
	cont.note+=note_question;
	cont.note_maxi+=mod.th[a].quest[b].bareme;
	mod.th[a].quest[b].etat="corrigee";
	cont.nb_quest_faites++;
	cont.num_page="2bis";
	p2_clignoter();
}

function p2_suivant() {
	if (cont.nb_quest_faites==cont.nb_quest_choisi) p2_terminer();
	else nouvelle_question();
}

function p2_arreter() {
	if (cont.nb_quest_faites==cont.nb_quest_choisi) p2_terminer();
	else { if (confirm(mod.txt.fenetre[5])) p2_terminer(); }
}

function p2_terminer() {
	clearTimeout(timer);
	flag=1;
	cont.fin=new Date();
	ecrire_page3();
	cont.num_page="3";
}

function p2_clignoter() {
	var a=cont.num_theme;
	var b=cont.num_question;
	var c=mod.th[a].quest[b].rep.length;
	if (flag==0) {
		if (mod.th[a].quest[b].type=="cases a cocher") {
			for (var i=0;i<c;i++) {
				if (mod.th[a].quest[b].rep[i].resultat=="vrai") {
					parent.pages.document.f.elements["case"+i].checked=true;
				}
			}
		}
		else if (mod.th[a].quest[b].type=="boutons radio") {
			for (var i=0;i<c;i++) {
				if (mod.th[a].quest[b].rep[i].resultat=="vrai") {
					parent.pages.document.f.ch_rep[i].checked=true;
				}
			}
		}
		else {
			for (var i=0;i<c;i++) if (mod.th[a].quest[b].rep[i].resultat[0]!="") {
				parent.pages.document.f.elements["zt"+i].value=mod.th[a].quest[b].rep[i].resultat[0];
			}
		}
		flag=1;
		timer=setTimeout("p2_clignoter()",300);
	}
	else {
		if (mod.th[a].quest[b].type=="cases a cocher") {
			for (var i=0;i<c;i++) parent.pages.document.f.elements["case"+i].checked=false;
		}
		else if (mod.th[a].quest[b].type=="boutons radio") {
			for (var i=0;i<c;i++) parent.pages.document.f.ch_rep[i].checked=false;
		}
		else {
			for (var i=0;i<c;i++) if (mod.th[a].quest[b].rep[i].resultat[0]!="") {
				if (mod.th[a].quest[b].rep[i].repondu=="faux") {
					parent.pages.document.f.elements["zt"+i].value="";
				}
			}
		}
		flag=0;
		timer=setTimeout("p2_clignoter()",100);
	}
}

function p2_inserer(caractere) {
	var input = parent.pages.document.f.elements["zt"+zt_focus];
	input.focus();
	input.value+=caractere;
}


// FONCTIONS APPELEES DEPUIS LA TROISIEME PAGE

function p3_getcookie(nom) {
	var recherche=nom+'=';
	if (document.cookie.length>0) {
		var position=document.cookie.indexOf(recherche);
		if (position!=-1) {
			position=position+recherche.length; // on passe après nom=
			fin=document.cookie.indexOf(';',position); // on cherche la fin (";")
			if (fin==-1) fin=document.cookie.length; // si le ";" n'existe pas, le cookie va jusqu'au bout
			return unescape(document.cookie.substring(position,fin));
		}
		else return '';
	}
	else return '';
}

function p3_putcookie(nom,texte,jours) {
	var datecourante=new Date();
	var expires=new Date();
	expires.setTime(datecourante.getTime()+1000*60*60*24*jours);
	document.cookie=nom+'='+escape(texte)+'; expires='+expires.toGMTString();
}

function p3_sauv_cookies(nom_eleve,mot) {
	// Sauvegarde du nom d'élève et du mot dans le cookie "dyris_2"
	nom_eleve=sup_esp(nom_eleve);
	if (nom_eleve=="") nom_eleve="?";
	var sauv=p3_getcookie("dyris_2");
	sauv+=nom_eleve+"§"+mot+"\n";
	p3_putcookie("dyris_2",sauv,10);
	// Affichage de la page "score.html"
	var l=screen.width/1.3;
	var h=screen.height/1.5;
	ouvrir_fenetre("scores.html",l,h);
	initialiser();
}

function p3_sauv_php(nom_eleve,mot) {
	nom_eleve=sup_esp(nom_eleve);
	if (nom_eleve=="") nom_eleve="?";
	var sauv=nom_eleve+"§"+mot;
	var page_php="scores.php?enr="+sauv;
	var l=screen.width/1.3;
	var h=screen.height/1.5;
	ouvrir_fenetre(page_php,l,h);
	initialiser();
}


// FONCTIONS APPELEES DEPUIS PLUSIEURS DES TROIS PAGES

function nouvelle_question() {
	// Arrêt du clignotement des cases à cocher
	clearTimeout(timer);
	flag=1;
	if (mod.opt.nb_questions.length!=0) {
		// Choix d'un thème disponible pris au hasard
		var a=Math.floor(mod.th.length*Math.random());
		while (mod.th[a].choisi=="non"||mod.th[a].etat=="fini") {
			a=Math.floor(mod.th.length*Math.random());
		}
		cont.num_theme=a;
		// Choix d'une question disponible prise au hasard
		var b=Math.floor(mod.th[a].quest.length*Math.random());
		while (mod.th[a].quest[b].etat!="libre") {
			b=Math.floor(mod.th[a].quest.length*Math.random());
		}
		cont.num_question=b;
	}
	if (mod.opt.nb_questions.length==0) {
		// Choix du 1er thème disponible
		var a=0;
		while (mod.th[a].choisi=="non"||mod.th[a].etat=="fini") a++;
		cont.num_theme=a;
		// Choix de la 1ère question disponible
		var b=0;
		while (mod.th[a].quest[b].etat!="libre") b++;
		cont.num_question=b;
	}
	mod.th[a].quest[b].etat="affichee";
	// Vérification du thème pour savoir s'il est terminé ou non
	mod.th[a].etat="fini";
	for (var i=0;i<mod.th[a].quest.length;i++) {
		if (mod.th[a].quest[i].etat=="libre") mod.th[a].etat="libre";
	}
	ecrire_page2();
	cont.num_page="2";
}

function sup_esp(ent) {
	var test=ent.substring(ent.length-1,ent.length);
	while (test==" ") {
		ent=ent.substring(0,ent.length-1);
		test=ent.substring(ent.length-1,ent.length);
	}
	test=ent.substring(0,1);
	while (test==" ") {
		ent=ent.substring(1,ent.length);
		test=ent.substring(0,1);
	}
	return ent;
}

function ouvrir_fenetre(adresse,largeur,hauteur) {
	if (fen_guide!=null) {if (fen_guide.closed==false) fen_guide.close();}
	var pos_x=(screen.width-largeur)/2;
	var pos_y=(screen.height-hauteur)/2.5;
	var dimensions='width='+largeur+',height='+hauteur+',left='+pos_x+',top='+pos_y;
	var proprietes='menubar=no,toolbar=no,directories=no,location=no,status=no,scrollbars=yes';
	fen_guide=window.open(adresse,'message',dimensions+proprietes);
	fen_guide.focus();
}

function entree_clavier(e) {
	var touche=(window.Event) ? e.which : e.keyCode;
	var keyPressed=String.fromCharCode(touche);
	if (keyPressed=="\r") {
		if (cont.num_page=="2") {
			var a=cont.num_theme;
			var b=cont.num_question;
			if (mod.th[a].quest[b].type!="cases a cocher" && mod.th[a].quest[b].type!="boutons radio") {
				p2_verifier();
			}
		}
		else if (cont.num_page=="2bis") p2_suivant();
	}
}

function traiter_chaine(ch) {
	while (ch.indexOf("<vec>") != -1 ) ch=ch.replace("<vec>","<span class='vec'>");
	while (ch.indexOf("</vec>") != -1 ) ch=ch.replace("</vec>","</span>");
	while (ch.indexOf("<alg>") != -1 ) ch=ch.replace("<alg>","<span class='alg'>");
	while (ch.indexOf("</alg>") != -1 ) ch=ch.replace("</alg>","</span>");
	while (ch.indexOf("<omega>") != -1 ) ch=ch.replace("<omega>","<font size=\"4\" face=\"Times New Roman, Times, serif\">&Omega;</font>");
	while (ch.indexOf("<mu>") != -1 ) ch=ch.replace("<mu>","<img src='mu.png' width='9' height='12' />");
	// <xor> ajouté le 30 septembre 2013
	while (ch.indexOf("<xor>") != -1 ) ch=ch.replace("<xor>","<img src='symbole_du_ou_exclusif.gif' width='24' height='17'/>");
	return ch
}

function hasard(ch) {
	var enonce=ch.split("||");
	var nb=Math.floor(enonce.length*Math.random());
	return enonce[nb];
}

function quitter_dyris() {
	if (fen_guide!=null) {if (fen_guide.closed==false) fen_guide.close();}
	if (mod.opt.conseil_fin!="") alert(hasard(mod.opt.conseil_fin));
	if (mod.opt.quitter=="") window.top.close();
	else window.top.location.href=mod.opt.quitter;
}
