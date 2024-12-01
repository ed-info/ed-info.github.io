// DYRIS version 16.1


// CLASSE CL_texte

function CL_texte() {
	this.titre=new Array();
	this.bouton=new Array();
	this.fenetre=new Array();
	this.mot=new Array();
}


// CLASSE CL_appreciation

function CL_appreciation(a,b,c) {
	this.note_min=a*1;
	this.note_max=b*1;
	if (b*1<a*1) {
		this.note_min=b*1;
		this.note_max=a*1;
	}
	this.enonce=c;
}


// CLASSE CL_page

function CL_page(nom,adresse,largeur,hauteur) {
	this.nom=nom;
	this.adresse=adresse;
	this.larg=largeur;
	this.haut=hauteur;
}


// CLASSE CL_option

function CL_option() {
	this.mode_theme=1;
	this.mode_question=1;
	this.mode_sauvegarde=1;
	this.titre="";
	this.commentaire="";
	this.nb_questions=new Array();
	this.bouton=new Array();
	this.conseil_debut="";
	this.conseil_fin="";
	this.quitter="";
	this.coef_rep_juste=1;
	this.coef_rep_nulle=0;
	this.coef_rep_fausse=-0.5;
	this.note_sur="";
	this.appr=new Array();
	this.non_fini="";
	this.ajouter_bouton_sup=ajouter_bouton_sup;
	this.ajouter_appr=ajouter_appr;
}
function ajouter_bouton_sup(a,b,c,d) {
	this.bouton[this.bouton.length]=new CL_page(a,b,c,d);
}
function ajouter_appr(a,b,c) {
	this.appr[this.appr.length]=new CL_appreciation(a,b,c);
}


// CLASSE CL_complement

function CL_complement() {
	this.schema="aucun";
	this.larg="";
	this.haut="";
	this.debut="";
	this.juste="";
	this.faux="";
	this.abandon="";
	this.caractere=new Array();
	this.bouton_indice=new Array();
	this.bouton_correction=new Array();
	this.ajouter_schema=ajouter_schema;
	this.ajouter_bouton_indice=ajouter_bouton_indice;
	this.ajouter_bouton_correction=ajouter_bouton_correction;
}
function ajouter_schema(nom,largeur,hauteur) {
	this.schema=nom;
	this.larg=largeur;
	this.haut=hauteur;
}
function ajouter_bouton_indice(a,b,c,d) {
	this.bouton_indice[this.bouton_indice.length]=new CL_page(a,b,c,d);
}
function ajouter_bouton_correction(a,b,c,d) {
	this.bouton_correction[this.bouton_correction.length]=new CL_page(a,b,c,d);
}


//CLASSE CL_reponse

function CL_reponse(txt) {
	var debut=txt.substring(0,3);
	if (debut=="[x]"||debut=="[o]"||debut=="[*]"||debut=="[ ]") {
		this.enonce=txt.substring(4,txt.length);
		if (debut=="[x]"||debut=="[o]"||debut=="[*]") this.resultat="vrai"; else this.resultat="faux";
	}
	else if (debut=="(x)"||debut=="(o)"||debut=="(*)"||debut=="( )") {
		this.enonce=txt.substring(4,txt.length);
		if (debut=="(x)"||debut=="(o)"||debut=="(*)") this.resultat="vrai"; else this.resultat="faux";
	}
	else {
		this.resultat=new Array();
		var pos=txt.indexOf("[");
		if (pos!=-1) {
			this.enonce=txt.substring(0,pos);
			var ch=txt.substring(pos+1,txt.length-1);
			var pos=ch.indexOf("=>");
			if (pos==-1) {
				this.type="zone de texte";
				var pos=ch.indexOf("||");
				if (pos==-1) this.resultat[0]=ch;
				while (pos!=-1) {
					this.resultat[this.resultat.length]=ch.substring(0,pos);
					ch=ch.substring(pos+2,ch.length);
					pos=ch.indexOf("||");
					if (pos==-1) this.resultat[this.resultat.length]=ch;
				}
			}
			else {
				this.type="liste de selection";

// Pour la prochaine version!

			}
		}
		else {
			this.enonce=txt;
			this.resultat[0]="";
		}
	}
	this.repondu="";
}


// CLASSE CL_question

function CL_question(txt) {
	this.com=new CL_complement();
	var pos=txt.indexOf("//");
	if (pos==-1) {
		this.enonce=txt;
		this.bareme=1;
		this.mode="ordre";
	}
	else {
		this.enonce=txt.substring(0,pos);
		var opt=txt.substring(pos+2,txt.length);
		pos=opt.indexOf("a");
		if (pos==-1) {
			if (1*opt>0) this.bareme=1*opt; else this.bareme=1;
			this.mode="ordre";
		}
		else {
			opt=opt.substring(0,pos)+opt.substring(pos+1,opt.length);
			if (1*opt>0) this.bareme=1*opt; else this.bareme=1;
			this.mode="aleatoire";
		}
	}
	this.etat="libre";
	this.rep=new Array();
	this.ajouter_reponse=ajouter_reponse;
}
function ajouter_reponse(txt) {
	var debut=txt.substring(0,3);
	if (debut=="[x]"||debut=="[ ]") {
		this.type="cases a cocher";
		this.rep[this.rep.length]=new CL_reponse(txt);
	}
	else if (debut=="(x)"||debut=="(o)"||debut=="( )") {
		this.type="boutons radio";
		this.rep[this.rep.length]=new CL_reponse(txt);
	}
	else {
		this.type="autre";
		var pos=txt.indexOf("]");
		if (pos==-1) this.rep[this.rep.length]=new CL_reponse(txt+"<br>");
		while (pos!=-1) {
			var ch=txt.substring(0,pos+1);
			this.rep[this.rep.length]=new CL_reponse(ch);
			txt=txt.substring(pos+1,txt.length);
			pos=txt.indexOf("]");
			if (pos==-1) this.rep[this.rep.length]=new CL_reponse(txt+"<br>");
		}
	}
}


// CLASSE CL_theme

function CL_theme(txt) {
	this.com=new CL_complement();
	this.etat="libre";
	this.titre=txt;
	this.choisi="non";
	this.quest=new Array();
	this.ajouter_question=ajouter_question;
}
function ajouter_question(txt) {
	this.quest[this.quest.length]=new CL_question(txt);
}


// CLASSE CL_modele

function CL_modele() {
	this.com=new CL_complement();
	this.txt=new CL_texte();
	this.opt=new CL_option();
	this.th=new Array();
	this.ajouter_theme=ajouter_theme;
}
function ajouter_theme(txt) {
	this.th[this.th.length]=new CL_theme(txt);
}


// CREATION DE L'OBJET ASSOCIE AU MODELE

var mod=new CL_modele();


// FONCTIONS APPELEES PAR LE FICHIER "textes.js"

function titre(txt) {mod.txt.titre[mod.txt.titre.length]=txt;}
function bouton(txt) {mod.txt.bouton[mod.txt.bouton.length]=txt;}
function fenetre(txt) {mod.txt.fenetre[mod.txt.fenetre.length]=txt;}
function mot(txt) {mod.txt.mot[mod.txt.mot.length]=txt;}
function score() {}


// FONCTIONS APPELEES PAR LA PARTIE "OPTIONS" DU FICHIER "donnees.js"

function mode_theme(txt) {mod.opt.mode_theme=txt;}
function mode_question(txt) {mod.opt.mode_question=txt;}
function mode_sauvegarde(txt) {mod.opt.mode_sauvegarde=txt;}
function titre_introduction(txt) {mod.opt.titre+=" "+txt;}
function introduction(txt) {mod.opt.commentaire+=" "+txt;}
function nombre_questions() {for (var i=0;i<arguments.length;i++) mod.opt.nb_questions[i]=arguments[i];}
function bouton_sup() {
	var n=bouton_sup.arguments[0];
	var u=bouton_sup.arguments[1];
	var l=screen.width/1.3;
	var h=screen.height/1.5;
	if (bouton_sup.arguments.length==4) {
		l=bouton_sup.arguments[2];
		h=bouton_sup.arguments[3];
	}
	mod.opt.ajouter_bouton_sup(n,u,l,h);
}
function message_debut(txt) {mod.opt.conseil_debut+=txt;}
function message_fin(txt) {mod.opt.conseil_fin+=txt;}
function url_quitter(txt) {mod.opt.quitter=txt;}
function coef_rep_juste(txt) {mod.opt.coef_rep_juste=txt;}
function coef_rep_fausse(txt) {mod.opt.coef_rep_fausse=txt;}
function coef_rep_nulle(txt) {mod.opt.coef_rep_nulle=txt;}
function note_sur(txt) {mod.opt.note_sur=txt;}
function appreciation(note_min,note_max,txt) {mod.opt.ajouter_appr(note_min,note_max,txt);}
function non_termine(txt) {mod.opt.non_fini=txt;}


// FONCTIONS APPELEES PAR LA PARTIE "QUESTIONNAIRE" DU FICHIER "donnees.js"

function theme(txt) {mod.ajouter_theme(txt);}
function question(txt) {
	txt=traiter_chaine(txt);
	if (mod.th.length==0) mod.ajouter_theme("Theme_non_defini");
	mod.th[mod.th.length-1].ajouter_question(txt);
}
function reponse(txt) {
	txt=traiter_chaine(txt);
	var num_theme=mod.th.length-1;
	var num_question=mod.th[num_theme].quest.length-1;
	mod.th[num_theme].quest[num_question].ajouter_reponse(txt);
}


// FONCTIONS DE COMMUNICATION DU FICHIER "donnees.js"

function schema() {
	var n=schema.arguments[0];
	var l="";
	var h="";
	if (schema.arguments.length==3) {
		l=schema.arguments[1];
		h=schema.arguments[2];
	}
	if (mod.th.length==0) mod.com.ajouter_schema(n,l,h);
	else if (mod.th[mod.th.length-1].quest.length==0) {
		var num_theme=mod.th.length-1;
		mod.th[num_theme].com.ajouter_schema(n,l,h);
	}
	else {
		var num_theme=mod.th.length-1;
		var num_question=mod.th[num_theme].quest.length-1;
		mod.th[num_theme].quest[num_question].com.ajouter_schema(n,l,h);
	}
}
function debut(txt) {
	if (mod.th.length==0) mod.com.debut=txt;
	else if (mod.th[mod.th.length-1].quest.length==0) {
		var num_theme=mod.th.length-1;
		mod.th[num_theme].com.debut=txt;
	}
	else {
		var num_theme=mod.th.length-1;
		var num_question=mod.th[num_theme].quest.length-1;
		mod.th[num_theme].quest[num_question].com.debut=txt;
	}
}
function juste(txt) {
	if (mod.th.length==0) mod.com.juste=txt;
	else if (mod.th[mod.th.length-1].quest.length==0) {
		var num_theme=mod.th.length-1;
		mod.th[num_theme].com.juste=txt;
	}
	else {
		var num_theme=mod.th.length-1;
		var num_question=mod.th[num_theme].quest.length-1;
		mod.th[num_theme].quest[num_question].com.juste=txt;
	}
}
function faux(txt) {
	if (mod.th.length==0) mod.com.faux=txt;
	else if (mod.th[mod.th.length-1].quest.length==0) {
		var num_theme=mod.th.length-1;
		mod.th[num_theme].com.faux=txt;
	}
	else {
		var num_theme=mod.th.length-1;
		var num_question=mod.th[num_theme].quest.length-1;
		mod.th[num_theme].quest[num_question].com.faux=txt;
	}
}
function abandon(txt) {
	if (mod.th.length==0) mod.com.abandon=txt;
	else if (mod.th[mod.th.length-1].quest.length==0) {
		var num_theme=mod.th.length-1;
		mod.th[num_theme].com.abandon=txt;
	}
	else {
		var num_theme=mod.th.length-1;
		var num_question=mod.th[num_theme].quest.length-1;
		mod.th[num_theme].quest[num_question].com.abandon=txt;
	}
}
function caracteres_speciaux() {
	if (mod.th.length==0) {
		for (var i=0;i<arguments.length;i++) mod.com.caractere[i]=arguments[i];
	}
	else if (mod.th[mod.th.length-1].quest.length==0) {
		var num_theme=mod.th.length-1;
		for (var i=0;i<arguments.length;i++) mod.th[num_theme].com.caractere[i]=arguments[i];
	}
	else {
		var num_theme=mod.th.length-1;
		var num_question=mod.th[num_theme].quest.length-1;
		for (var i=0;i<arguments.length;i++) {
			mod.th[num_theme].quest[num_question].com.caractere[i]=arguments[i];
		}
	}
}
function bouton_indice() {
	var n=bouton_indice.arguments[0];
	var u=bouton_indice.arguments[1];
	var l=screen.width/1.3;
	var h=screen.height/1.5;
	if (bouton_indice.arguments.length==4) {
		l=bouton_indice.arguments[2];
		h=bouton_indice.arguments[3];
	}
	if (mod.th.length==0) mod.com.ajouter_bouton_indice(n,u,l,h);
	else if (mod.th[mod.th.length-1].quest.length==0) {
		var num_theme=mod.th.length-1;
		mod.th[num_theme].com.ajouter_bouton_indice(n,u,l,h);
	}
	else {
		var num_theme=mod.th.length-1;
		var num_question=mod.th[num_theme].quest.length-1;
		mod.th[num_theme].quest[num_question].com.ajouter_bouton_indice(n,u,l,h);
	}
}
function bouton_correction() {
	var n=bouton_correction.arguments[0];
	var u=bouton_correction.arguments[1];
	var l=screen.width/1.3;
	var h=screen.height/1.5;
	if (bouton_correction.arguments.length==4) {
		l=bouton_correction.arguments[2];
		h=bouton_correction.arguments[3];
	}
	if (mod.th.length==0) mod.com.ajouter_bouton_correction(n,u,l,h);
	else if (mod.th[mod.th.length-1].quest.length==0) {
		var num_theme=mod.th.length-1;
		mod.th[num_theme].com.ajouter_bouton_correction(n,u,l,h);
	}
	else {
		var num_theme=mod.th.length-1;
		var num_question=mod.th[num_theme].quest.length-1;
		mod.th[num_theme].quest[num_question].com.ajouter_bouton_correction(n,u,l,h);
	}
}


// RACCOURCIS

function quest(txt) {question(txt);}
function rep(txt) {reponse(txt);}
function sch() {
	if (sch.arguments.length==1) schema(sch.arguments[0]);
	else schema(sch.arguments[0],sch.arguments[1],sch.arguments[2]);
}
