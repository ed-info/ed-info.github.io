var $builtinmodule = function (name) {
    document.getElementById("gameModal").style.display = "flex";
    var s = {
	};
THECOLORS = {
	aliceblue:"rgb(240,248,255)",antiquewhite:"rgb(250,235,215)",antiquewhite1:"rgb(255,239,219)",antiquewhite2:"rgb(238,223,204)",antiquewhite3:"rgb(205,192,176)",antiquewhite4:"rgb(139,131,120)",aqua:"rgb(0,255,255)",aquamarine:"rgb(127,255,212)",aquamarine1:"rgb(127,255,212)",aquamarine2:"rgb(118,238,198)",aquamarine3:"rgb(102,205,170)",aquamarine4:"rgb(69,139,116)",azure:"rgb(240,255,255)",azure1:"rgb(240,255,255)",azure3:"rgb(193,205,205)",azure2:"rgb(224,238,238)",azure4:"rgb(131,139,139)",beige:"rgb(245,245,220)",bisque:"rgb(255,228,196)",bisque1:"rgb(255,228,196)",bisque2:"rgb(238,213,183)",bisque3:"rgb(205,183,158)",bisque4:"rgb(139,125,107)",black:"rgb(0,0,0)",blanchedalmond:"rgb(255,235,205)",blue:"rgb(0,0,255)",blue1:"rgb(0,0,255)",blue2:"rgb(0,0,238)",blue3:"rgb(0,0,205)",blue4:"rgb(0,0,139)",blueviolet:"rgb(138,43,226)",brown:"rgb(165,42,42)",brown1:"rgb(255,64,64)",brown2:"rgb(238,59,59)",brown3:"rgb(205,51,51)",brown4:"rgb(139,35,35)",burlywood:"rgb(222,184,135)",burlywood1:"rgb(255,211,155)",burlywood2:"rgb(238,197,145)",burlywood3:"rgb(205,170,125)",burlywood4:"rgb(139,115,85)",cadetblue:"rgb(95,158,160)",cadetblue1:"rgb(152,245,255)",cadetblue2:"rgb(142,229,238)",cadetblue3:"rgb(122,197,205)",cadetblue4:"rgb(83,134,139)",chartreuse:"rgb(127,255,0)",chartreuse1:"rgb(127,255,0)",chartreuse2:"rgb(118,238,0)",chartreuse3:"rgb(102,205,0)",chartreuse4:"rgb(69,139,0)",chocolate:"rgb(210,105,30)",chocolate1:"rgb(255,127,36)",chocolate2:"rgb(238,118,33)",chocolate3:"rgb(205,102,29)",chocolate4:"rgb(139,69,19)",coral:"rgb(255,127,80)",coral1:"rgb(255,114,86)",coral2:"rgb(238,106,80)",coral3:"rgb(205,91,69)",coral4:"rgb(139,62,47)",cornflowerblue:"rgb(100,149,237)",cornsilk:"rgb(255,248,220)",cornsilk1:"rgb(255,248,220)",cornsilk2:"rgb(238,232,205)",cornsilk3:"rgb(205,200,177)",cornsilk4:"rgb(139,136,120)",crimson:"rgb(220,20,60)",cyan:"rgb(0,255,255)",cyan1:"rgb(0,255,255)",cyan2:"rgb(0,238,238)",cyan3:"rgb(0,205,205)",cyan4:"rgb(0,139,139)",darkblue:"rgb(0,0,139)",darkcyan:"rgb(0,139,139)",darkgoldenrod:"rgb(184,134,11)",darkgoldenrod1:"rgb(255,185,15)",darkgoldenrod2:"rgb(238,173,14)",darkgoldenrod3:"rgb(205,149,12)",darkgoldenrod4:"rgb(139,101,8)",darkgray:"rgb(169,169,169)",darkgreen:"rgb(0,100,0)",darkgrey:"rgb(169,169,169)",darkkhaki:"rgb(189,183,107)",darkmagenta:"rgb(139,0,139)",darkolivegreen:"rgb(85,107,47)",darkolivegreen1:"rgb(202,255,112)",darkolivegreen2:"rgb(188,238,104)",darkolivegreen3:"rgb(162,205,90)",darkolivegreen4:"rgb(110,139,61)",darkorange:"rgb(255,140,0)",darkorange1:"rgb(255,127,0)",darkorange2:"rgb(238,118,0)",darkorange3:"rgb(205,102,0)",darkorange4:"rgb(139,69,0)",darkorchid:"rgb(153,50,204)",darkorchid1:"rgb(191,62,255)",darkorchid2:"rgb(178,58,238)",darkorchid3:"rgb(154,50,205)",darkorchid4:"rgb(104,34,139)",darkred:"rgb(139,0,0)",darksalmon:"rgb(233,150,122)",darkseagreen:"rgb(143,188,143)",darkseagreen1:"rgb(193,255,193)",darkseagreen2:"rgb(180,238,180)",darkseagreen3:"rgb(155,205,155)",darkseagreen4:"rgb(105,139,105)",darkslateblue:"rgb(72,61,139)",darkslategray:"rgb(47,79,79)",darkslategray1:"rgb(151,255,255)",darkslategray2:"rgb(141,238,238)",darkslategray3:"rgb(121,205,205)",darkslategray4:"rgb(82,139,139)",darkslategrey:"rgb(47,79,79)",darkturquoise:"rgb(0,206,209)",darkviolet:"rgb(148,0,211)",deeppink:"rgb(255,20,147)",deeppink1:"rgb(255,20,147)",deeppink2:"rgb(238,18,137)",deeppink3:"rgb(205,16,118)",deeppink4:"rgb(139,10,80)",deepskyblue:"rgb(0,191,255)",deepskyblue1:"rgb(0,191,255)",deepskyblue2:"rgb(0,178,238)",deepskyblue3:"rgb(0,154,205)",deepskyblue4:"rgb(0,104,139)",dimgray:"rgb(105,105,105)",dimgrey:"rgb(105,105,105)",dodgerblue:"rgb(30,144,255)",dodgerblue1:"rgb(30,144,255)",dodgerblue2:"rgb(28,134,238)",dodgerblue3:"rgb(24,116,205)",dodgerblue4:"rgb(16,78,139)",firebrick:"rgb(178,34,34)",firebrick1:"rgb(255,48,48)",firebrick2:"rgb(238,44,44)",firebrick3:"rgb(205,38,38)",firebrick4:"rgb(139,26,26)",floralwhite:"rgb(255,250,240)",forestgreen:"rgb(34,139,34)",fuchsia:"rgb(255,0,255)",gainsboro:"rgb(220,220,220)",ghostwhite:"rgb(248,248,255)",gold:"rgb(255,215,0)",gold1:"rgb(255,215,0)",gold2:"rgb(238,201,0)",gold3:"rgb(205,173,0)",gold4:"rgb(139,117,0)",goldenrod:"rgb(218,165,32)",goldenrod1:"rgb(255,193,37)",goldenrod2:"rgb(238,180,34)",goldenrod3:"rgb(205,155,29)",goldenrod4:"rgb(139,105,20)",gray:"rgb(190,190,190)",gray0:"rgb(0,0,0)",gray1:"rgb(3,3,3)",gray2:"rgb(5,5,5)",gray3:"rgb(8,8,8)",gray4:"rgb(10,10,10)",gray5:"rgb(13,13,13)",gray6:"rgb(15,15,15)",gray7:"rgb(18,18,18)",gray8:"rgb(20,20,20)",gray9:"rgb(23,23,23)",gray10:"rgb(26,26,26)",gray11:"rgb(28,28,28)",gray12:"rgb(31,31,31)",gray13:"rgb(33,33,33)",gray14:"rgb(36,36,36)",gray15:"rgb(38,38,38)",gray16:"rgb(41,41,41)",gray17:"rgb(43,43,43)",gray18:"rgb(46,46,46)",gray19:"rgb(48,48,48)",gray20:"rgb(51,51,51)",gray21:"rgb(54,54,54)",gray22:"rgb(56,56,56)",gray23:"rgb(59,59,59)",gray24:"rgb(61,61,61)",gray25:"rgb(64,64,64)",gray26:"rgb(66,66,66)",gray27:"rgb(69,69,69)",gray28:"rgb(71,71,71)",gray29:"rgb(74,74,74)",gray30:"rgb(77,77,77)",gray31:"rgb(79,79,79)",gray32:"rgb(82,82,82)",gray33:"rgb(84,84,84)",gray34:"rgb(87,87,87)",gray35:"rgb(89,89,89)",gray36:"rgb(92,92,92)",gray37:"rgb(94,94,94)",gray38:"rgb(97,97,97)",gray39:"rgb(99,99,99)",gray40:"rgb(102,102,102)",gray41:"rgb(105,105,105)",gray42:"rgb(107,107,107)",gray43:"rgb(110,110,110)",gray44:"rgb(112,112,112)",gray45:"rgb(115,115,115)",gray46:"rgb(117,117,117)",gray47:"rgb(120,120,120)",gray48:"rgb(122,122,122)",gray49:"rgb(125,125,125)",gray50:"rgb(127,127,127)",gray51:"rgb(130,130,130)",gray52:"rgb(133,133,133)",gray53:"rgb(135,135,135)",gray54:"rgb(138,138,138)",gray55:"rgb(140,140,140)",gray56:"rgb(143,143,143)",gray57:"rgb(145,145,145)",gray58:"rgb(148,148,148)",gray59:"rgb(150,150,150)",gray60:"rgb(153,153,153)",gray61:"rgb(156,156,156)",gray62:"rgb(158,158,158)",gray63:"rgb(161,161,161)",gray64:"rgb(163,163,163)",gray65:"rgb(166,166,166)",gray66:"rgb(168,168,168)",gray67:"rgb(171,171,171)",gray68:"rgb(173,173,173)",gray69:"rgb(176,176,176)",gray70:"rgb(179,179,179)",gray71:"rgb(181,181,181)",gray72:"rgb(184,184,184)",gray73:"rgb(186,186,186)",gray74:"rgb(189,189,189)",gray75:"rgb(191,191,191)",gray76:"rgb(194,194,194)",gray77:"rgb(196,196,196)",gray78:"rgb(199,199,199)",gray79:"rgb(201,201,201)",gray80:"rgb(204,204,204)",gray81:"rgb(207,207,207)",gray82:"rgb(209,209,209)",gray83:"rgb(212,212,212)",gray84:"rgb(214,214,214)",gray85:"rgb(217,217,217)",gray86:"rgb(219,219,219)",gray87:"rgb(222,222,222)",gray88:"rgb(224,224,224)",gray89:"rgb(227,227,227)",gray90:"rgb(229,229,229)",gray91:"rgb(232,232,232)",gray92:"rgb(235,235,235)",gray93:"rgb(237,237,237)",gray94:"rgb(240,240,240)",gray95:"rgb(242,242,242)",gray96:"rgb(245,245,245)",gray97:"rgb(247,247,247)",gray98:"rgb(250,250,250)",gray99:"rgb(252,252,252)",gray100:"rgb(255,255,255)",green:"rgb(0,255,0)",green1:"rgb(0,255,0)",green2:"rgb(0,238,0)",green3:"rgb(0,205,0)",green4:"rgb(0,139,0)",greenyellow:"rgb(173,255,47)",grey:"rgb(190,190,190)",grey0:"rgb(0,0,0)",grey1:"rgb(3,3,3)",grey2:"rgb(5,5,5)",grey3:"rgb(8,8,8)",grey4:"rgb(10,10,10)",grey5:"rgb(13,13,13)",grey6:"rgb(15,15,15)",grey7:"rgb(18,18,18)",grey8:"rgb(20,20,20)",grey9:"rgb(23,23,23)",grey10:"rgb(26,26,26)",grey11:"rgb(28,28,28)",grey12:"rgb(31,31,31)",grey13:"rgb(33,33,33)",grey14:"rgb(36,36,36)",grey15:"rgb(38,38,38)",grey16:"rgb(41,41,41)",grey17:"rgb(43,43,43)",grey18:"rgb(46,46,46)",grey19:"rgb(48,48,48)",grey20:"rgb(51,51,51)",grey21:"rgb(54,54,54)",grey22:"rgb(56,56,56)",grey23:"rgb(59,59,59)",grey24:"rgb(61,61,61)",grey25:"rgb(64,64,64)",grey26:"rgb(66,66,66)",grey27:"rgb(69,69,69)",grey28:"rgb(71,71,71)",grey29:"rgb(74,74,74)",grey30:"rgb(77,77,77)",grey31:"rgb(79,79,79)",grey32:"rgb(82,82,82)",grey33:"rgb(84,84,84)",grey34:"rgb(87,87,87)",grey35:"rgb(89,89,89)",grey36:"rgb(92,92,92)",grey37:"rgb(94,94,94)",grey38:"rgb(97,97,97)",grey39:"rgb(99,99,99)",grey40:"rgb(102,102,102)",grey41:"rgb(105,105,105)",grey42:"rgb(107,107,107)",grey43:"rgb(110,110,110)",grey44:"rgb(112,112,112)",grey45:"rgb(115,115,115)",grey46:"rgb(117,117,117)",grey47:"rgb(120,120,120)",grey48:"rgb(122,122,122)",grey49:"rgb(125,125,125)",grey50:"rgb(127,127,127)",grey51:"rgb(130,130,130)",grey52:"rgb(133,133,133)",grey53:"rgb(135,135,135)",grey54:"rgb(138,138,138)",grey55:"rgb(140,140,140)",grey56:"rgb(143,143,143)",grey57:"rgb(145,145,145)",grey58:"rgb(148,148,148)",grey59:"rgb(150,150,150)",grey60:"rgb(153,153,153)",grey61:"rgb(156,156,156)",grey62:"rgb(158,158,158)",grey63:"rgb(161,161,161)",grey64:"rgb(163,163,163)",grey65:"rgb(166,166,166)",grey66:"rgb(168,168,168)",grey67:"rgb(171,171,171)",grey68:"rgb(173,173,173)",grey69:"rgb(176,176,176)",grey70:"rgb(179,179,179)",grey71:"rgb(181,181,181)",grey72:"rgb(184,184,184)",grey73:"rgb(186,186,186)",grey74:"rgb(189,189,189)",grey75:"rgb(191,191,191)",grey76:"rgb(194,194,194)",grey77:"rgb(196,196,196)",grey78:"rgb(199,199,199)",grey79:"rgb(201,201,201)",grey80:"rgb(204,204,204)",grey81:"rgb(207,207,207)",grey82:"rgb(209,209,209)",grey83:"rgb(212,212,212)",grey84:"rgb(214,214,214)",grey85:"rgb(217,217,217)",grey86:"rgb(219,219,219)",grey87:"rgb(222,222,222)",grey88:"rgb(224,224,224)",grey89:"rgb(227,227,227)",grey90:"rgb(229,229,229)",grey91:"rgb(232,232,232)",grey92:"rgb(235,235,235)",grey93:"rgb(237,237,237)",grey94:"rgb(240,240,240)",grey95:"rgb(242,242,242)",grey96:"rgb(245,245,245)",grey97:"rgb(247,247,247)",grey98:"rgb(250,250,250)",grey99:"rgb(252,252,252)",grey100:"rgb(255,255,255)",honeydew:"rgb(240,255,240)",honeydew1:"rgb(240,255,240)",honeydew2:"rgb(224,238,224)",honeydew3:"rgb(193,205,193)",honeydew4:"rgb(131,139,131)",hotpink:"rgb(255,105,180)",hotpink1:"rgb(255,110,180)",hotpink2:"rgb(238,106,167)",hotpink3:"rgb(205,96,144)",hotpink4:"rgb(139,58,98)",indianred:"rgb(205,92,92)",indianred1:"rgb(255,106,106)",indianred2:"rgb(238,99,99)",indianred3:"rgb(205,85,85)",indianred4:"rgb(139,58,58)",indigo:"rgb(75,0,130)",ivory:"rgb(255,255,240)",ivory1:"rgb(255,255,240)",ivory2:"rgb(238,238,224)",ivory3:"rgb(205,205,193)",ivory4:"rgb(139,139,131)",khaki:"rgb(240,230,140)",khaki1:"rgb(255,246,143)",khaki2:"rgb(238,230,133)",khaki3:"rgb(205,198,115)",khaki4:"rgb(139,134,78)",lavender:"rgb(230,230,250)",lavenderblush:"rgb(255,240,245)",lavenderblush1:"rgb(255,240,245)",lavenderblush2:"rgb(238,224,229)",lavenderblush3:"rgb(205,193,197)",lavenderblush4:"rgb(139,131,134)",lawngreen:"rgb(124,252,0)",lemonchiffon:"rgb(255,250,205)",lemonchiffon1:"rgb(255,250,205)",lemonchiffon2:"rgb(238,233,191)",lemonchiffon3:"rgb(205,201,165)",lemonchiffon4:"rgb(139,137,112)",lightblue:"rgb(173,216,230)",lightblue1:"rgb(191,239,255)",lightblue2:"rgb(178,223,238)",lightblue3:"rgb(154,192,205)",lightblue4:"rgb(104,131,139)",lightcoral:"rgb(240,128,128)",lightcyan:"rgb(224,255,255)",lightcyan1:"rgb(224,255,255)",lightcyan2:"rgb(209,238,238)",lightcyan3:"rgb(180,205,205)",lightcyan4:"rgb(122,139,139)",lightgoldenrod:"rgb(238,221,130)",lightgoldenrod1:"rgb(255,236,139)",lightgoldenrod2:"rgb(238,220,130)",lightgoldenrod3:"rgb(205,190,112)",lightgoldenrod4:"rgb(139,129,76)",lightgoldenrodyellow:"rgb(250,250,210)",lightgray:"rgb(211,211,211)",lightgreen:"rgb(144,238,144)",lightgrey:"rgb(211,211,211)",lightpink:"rgb(255,182,193)",lightpink1:"rgb(255,174,185)",lightpink2:"rgb(238,162,173)",lightpink3:"rgb(205,140,149)",lightpink4:"rgb(139,95,101)",lightsalmon:"rgb(255,160,122)",lightsalmon1:"rgb(255,160,122)",lightsalmon2:"rgb(238,149,114)",lightsalmon3:"rgb(205,129,98)",lightsalmon4:"rgb(139,87,66)",lightseagreen:"rgb(32,178,170)",lightskyblue:"rgb(135,206,250)",lightskyblue1:"rgb(176,226,255)",lightskyblue2:"rgb(164,211,238)",lightskyblue3:"rgb(141,182,205)",lightskyblue4:"rgb(96,123,139)",lightslateblue:"rgb(132,112,255)",lightslategray:"rgb(119,136,153)",lightslategrey:"rgb(119,136,153)",lightsteelblue:"rgb(176,196,222)",lightsteelblue1:"rgb(202,225,255)",lightsteelblue2:"rgb(188,210,238)",lightsteelblue3:"rgb(162,181,205)",lightsteelblue4:"rgb(110,123,139)",lightyellow:"rgb(255,255,224)",lightyellow1:"rgb(255,255,224)",lightyellow2:"rgb(238,238,209)",lightyellow3:"rgb(205,205,180)",lightyellow4:"rgb(139,139,122)",linen:"rgb(250,240,230)",lime:"rgb(0,255,0)",limegreen:"rgb(50,205,50)",magenta:"rgb(255,0,255)",magenta1:"rgb(255,0,255)",magenta2:"rgb(238,0,238)",magenta3:"rgb(205,0,205)",magenta4:"rgb(139,0,139)",maroon:"rgb(176,48,96)",maroon1:"rgb(255,52,179)",maroon2:"rgb(238,48,167)",maroon3:"rgb(205,41,144)",maroon4:"rgb(139,28,98)",mediumaquamarine:"rgb(102,205,170)",mediumblue:"rgb(0,0,205)",mediumorchid:"rgb(186,85,211)",mediumorchid1:"rgb(224,102,255)",mediumorchid2:"rgb(209,95,238)",mediumorchid3:"rgb(180,82,205)",mediumorchid4:"rgb(122,55,139)",mediumpurple:"rgb(147,112,219)",mediumpurple1:"rgb(171,130,255)",mediumpurple2:"rgb(159,121,238)",mediumpurple3:"rgb(137,104,205)",mediumpurple4:"rgb(93,71,139)",mediumseagreen:"rgb(60,179,113)",mediumslateblue:"rgb(123,104,238)",mediumspringgreen:"rgb(0,250,154)",mediumturquoise:"rgb(72,209,204)",mediumvioletred:"rgb(199,21,133)",midnightblue:"rgb(25,25,112)",mintcream:"rgb(245,255,250)",mistyrose:"rgb(255,228,225)",mistyrose1:"rgb(255,228,225)",mistyrose2:"rgb(238,213,210)",mistyrose3:"rgb(205,183,181)",mistyrose4:"rgb(139,125,123)",moccasin:"rgb(255,228,181)",navajowhite:"rgb(255,222,173)",navajowhite1:"rgb(255,222,173)",navajowhite2:"rgb(238,207,161)",navajowhite3:"rgb(205,179,139)",navajowhite4:"rgb(139,121,94)",navy:"rgb(0,0,128)",navyblue:"rgb(0,0,128)",oldlace:"rgb(253,245,230)",olive:"rgb(128,128,0)",olivedrab:"rgb(107,142,35)",olivedrab1:"rgb(192,255,62)",olivedrab2:"rgb(179,238,58)",olivedrab3:"rgb(154,205,50)",olivedrab4:"rgb(105,139,34)",orange:"rgb(255,165,0)",orange1:"rgb(255,165,0)",orange2:"rgb(238,154,0)",orange3:"rgb(205,133,0)",orange4:"rgb(139,90,0)",orangered:"rgb(255,69,0)",orangered1:"rgb(255,69,0)",orangered2:"rgb(238,64,0)",orangered3:"rgb(205,55,0)",orangered4:"rgb(139,37,0)",orchid:"rgb(218,112,214)",orchid1:"rgb(255,131,250)",orchid2:"rgb(238,122,233)",orchid3:"rgb(205,105,201)",orchid4:"rgb(139,71,137)",palegreen:"rgb(152,251,152)",palegreen1:"rgb(154,255,154)",palegreen2:"rgb(144,238,144)",palegreen3:"rgb(124,205,124)",palegreen4:"rgb(84,139,84)",palegoldenrod:"rgb(238,232,170)",paleturquoise:"rgb(175,238,238)",paleturquoise1:"rgb(187,255,255)",paleturquoise2:"rgb(174,238,238)",paleturquoise3:"rgb(150,205,205)",paleturquoise4:"rgb(102,139,139)",palevioletred:"rgb(219,112,147)",palevioletred1:"rgb(255,130,171)",palevioletred2:"rgb(238,121,159)",palevioletred3:"rgb(205,104,137)",palevioletred4:"rgb(139,71,93)",papayawhip:"rgb(255,239,213)",peachpuff:"rgb(255,218,185)",peachpuff1:"rgb(255,218,185)",peachpuff2:"rgb(238,203,173)",peachpuff3:"rgb(205,175,149)",peachpuff4:"rgb(139,119,101)",peru:"rgb(205,133,63)",pink:"rgb(255,192,203)",pink1:"rgb(255,181,197)",pink2:"rgb(238,169,184)",pink3:"rgb(205,145,158)",pink4:"rgb(139,99,108)",plum:"rgb(221,160,221)",plum1:"rgb(255,187,255)",plum2:"rgb(238,174,238)",plum3:"rgb(205,150,205)",plum4:"rgb(139,102,139)",powderblue:"rgb(176,224,230)",purple:"rgb(160,32,240)",purple1:"rgb(155,48,255)",purple2:"rgb(145,44,238)",purple3:"rgb(125,38,205)",purple4:"rgb(85,26,139)",red:"rgb(255,0,0)",red1:"rgb(255,0,0)",red2:"rgb(238,0,0)",red3:"rgb(205,0,0)",red4:"rgb(139,0,0)",rosybrown:"rgb(188,143,143)",rosybrown1:"rgb(255,193,193)",rosybrown2:"rgb(238,180,180)",rosybrown3:"rgb(205,155,155)",rosybrown4:"rgb(139,105,105)",royalblue:"rgb(65,105,225)",royalblue1:"rgb(72,118,255)",royalblue2:"rgb(67,110,238)",royalblue3:"rgb(58,95,205)",royalblue4:"rgb(39,64,139)",salmon:"rgb(250,128,114)",salmon1:"rgb(255,140,105)",salmon2:"rgb(238,130,98)",salmon3:"rgb(205,112,84)",salmon4:"rgb(139,76,57)",saddlebrown:"rgb(139,69,19)",sandybrown:"rgb(244,164,96)",seagreen:"rgb(46,139,87)",seagreen1:"rgb(84,255,159)",seagreen2:"rgb(78,238,148)",seagreen3:"rgb(67,205,128)",seagreen4:"rgb(46,139,87)",seashell:"rgb(255,245,238)",seashell1:"rgb(255,245,238)",seashell2:"rgb(238,229,222)",seashell3:"rgb(205,197,191)",seashell4:"rgb(139,134,130)",sienna:"rgb(160,82,45)",sienna1:"rgb(255,130,71)",sienna2:"rgb(238,121,66)",sienna3:"rgb(205,104,57)",sienna4:"rgb(139,71,38)",silver:"rgb(192,192,192)",skyblue:"rgb(135,206,235)",skyblue1:"rgb(135,206,255)",skyblue2:"rgb(126,192,238)",skyblue3:"rgb(108,166,205)",skyblue4:"rgb(74,112,139)",slateblue:"rgb(106,90,205)",slateblue1:"rgb(131,111,255)",slateblue2:"rgb(122,103,238)",slateblue3:"rgb(105,89,205)",slateblue4:"rgb(71,60,139)",slategray:"rgb(112,128,144)",slategray1:"rgb(198,226,255)",slategray2:"rgb(185,211,238)",slategray3:"rgb(159,182,205)",slategray4:"rgb(108,123,139)",slategrey:"rgb(112,128,144)",snow:"rgb(255,250,250)",snow1:"rgb(255,250,250)",snow2:"rgb(238,233,233)",snow3:"rgb(205,201,201)",snow4:"rgb(139,137,137)",springgreen:"rgb(0,255,127)",springgreen1:"rgb(0,255,127)",springgreen2:"rgb(0,238,118)",springgreen3:"rgb(0,205,102)",springgreen4:"rgb(0,139,69)",steelblue:"rgb(70,130,180)",steelblue1:"rgb(99,184,255)",steelblue2:"rgb(92,172,238)",steelblue3:"rgb(79,148,205)",steelblue4:"rgb(54,100,139)",tan:"rgb(210,180,140)",tan1:"rgb(255,165,79)",tan2:"rgb(238,154,73)",tan3:"rgb(205,133,63)",tan4:"rgb(139,90,43)",teal:"rgb(0,128,128)",thistle:"rgb(216,191,216)",thistle1:"rgb(255,225,255)",thistle2:"rgb(238,210,238)",thistle3:"rgb(205,181,205)",thistle4:"rgb(139,123,139)",tomato:"rgb(255,99,71)",tomato1:"rgb(255,99,71)",tomato2:"rgb(238,92,66)",tomato3:"rgb(205,79,57)",tomato4:"rgb(139,54,38)",turquoise:"rgb(64,224,208)",turquoise1:"rgb(0,245,255)",turquoise2:"rgb(0,229,238)",turquoise3:"rgb(0,197,205)",turquoise4:"rgb(0,134,139)",violet:"rgb(238,130,238)",violetred:"rgb(208,32,144)",violetred1:"rgb(255,62,150)",violetred2:"rgb(238,58,140)",violetred3:"rgb(205,50,120)",violetred4:"rgb(139,34,82)",wheat:"rgb(245,222,179)",wheat1:"rgb(255,231,186)",wheat2:"rgb(238,216,174)",wheat3:"rgb(205,186,150)",wheat4:"rgb(139,126,102)",white:"rgb(255,255,255)",whitesmoke:"rgb(245,245,245)",yellow:"rgb(255,255,0)",yellow1:"rgb(255,255,0)",yellow2:"rgb(238,238,0)",yellow3:"rgb(205,205,0)",yellow4:"rgb(139,139,0)",yellowgreen:"rgb(154,205,50)"
}
var TWEEN_FUNCTIONS = {
    linear: function(n) { return n; },
    accelerate: function(n) { return n * n; },
    decelerate: function(n) { return -1.0 * n * (n - 2.0); },
    accel_decel: function(n) {
        var p = n * 2;
        if (p < 1) return 0.5 * p * p;
        p -= 1.0;
        return -0.5 * (p * (p - 2.0) - 1.0);
    },
    bounce_end: function(n) {
        if (n < (1.0 / 2.75)) {
            return 7.5625 * n * n;
        } else if (n < (2.0 / 2.75)) {
            n -= (1.5 / 2.75);
            return 7.5625 * n * n + 0.75;
        } else if (n < (2.5 / 2.75)) {
            n -= (2.25 / 2.75);
            return 7.5625 * n * n + 0.9375;
        } else {
            n -= (2.625 / 2.75);
            return 7.5625 * n * n + 0.984375;
        }
    },
    bounce_start: function(n) {
        return 1.0 - TWEEN_FUNCTIONS.bounce_end(1.0 - n);
    },
    bounce_start_end: function(n) {
        var p = n * 2.0;
        if (p < 1.0) {
            return TWEEN_FUNCTIONS.bounce_start(p) * 0.5;
        } else {
            return TWEEN_FUNCTIONS.bounce_end(p - 1.0) * 0.5 + 0.5;
        }
    }
};

var handlers = {
		"Sk.debug": function(e) {
			debugger;
			var r = PythonIDE.debugHandler(e);
			if(r.then){
				return r;
			}
			return false;
		}
	};
	//var handlers = {};
function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

// Переконуємося, що jsfs існує
if (typeof window.jsfs === 'undefined') {
    if (typeof window.FileSystem !== 'undefined') {
        window.jsfs = new window.FileSystem("PGZfs");
    } else {
        throw new Error("FileSystem not available");
    }
}

	var startTime = new Date().getTime();
	var lineCount = 0;
	var width = undefined;
	var height = undefined;
	var startTime = new Date().getTime();


	Sk.globals.dbg = new Sk.builtin.func(function(x) {
		console.log(x, Sk.ffi.remapToJs(x));
	});

	function updateCoordsFromProps(props, size, pos) {		
		props.x = 0;
		props.y = 0;
		if(pos) {
			props.x = pos[0];
			props.y = pos[1];
		}

		if(props.top !== undefined) {
			props.y = props.top;
		}
		if(props.left !== undefined) {
			props.x = props.left;
		}
		if(props.bottom !== undefined) {
			props.y = props.bottom - size.height;
		}
		if(props.right !== undefined) {
			props.x = props.left - size.width;
		}
		if(props.topleft !== undefined) {
			props.x = props.topleft[0];
			props.y = props.topleft[1];
		}
		if(props.bottomleft !== undefined) {
			props.x = props.bottomleft[0];
			props.y = props.bottomleft[1] - size.height;
		}
		if(props.topright !== undefined) {
			props.x = props.topright[0] - size.width;
			props.y = props.topright[1];
		}
		if(props.bottomright !== undefined) {
			props.x = props.bottomright[0] - size.width;
			props.y = props.bottomright[1] - size.height;
		}
		if(props.midtop !== undefined) {
			props.x = props.midtop[0] - size.width / 2;
			props.y = props.midtop[1];
		}
		if(props.midleft !== undefined) {
			props.x = props.midleft[0];
			props.y = props.midleft[1] - size.height / 2;
		}
		if(props.midbottom !== undefined) {
			props.x = props.midbottom[0] - size.width / 2;
			props.y = props.midbottom[1] - size.height;
		}
		if(props.midright !== undefined) {
			props.x = props.midright[0] - size.width;
			props.y = props.midright[1] - size.height / 2;
		}
		if(props.center !== undefined) {
			props.x = props.center[0] - size.width / 2;
			props.y = props.center[1] - size.height / 2;
		}
		if(props.centerx !== undefined) {
			props.x = props.centerx - size.width / 2;
		}
		if(props.centery !== undefined) {
			props.y = props.centery;
		}
	}

	function getColor(c) {
		var rgb = [255,255,255];
		if (c[0]==='#') {
			var r = parseInt(c.slice(1, 3), 16),
				g = parseInt(c.slice(3, 5), 16),
				b = parseInt(c.slice(5, 7), 16);
		return "rgb(" + r + ", " + g + ", " + b + ")";
		}
		if(THECOLORS && typeof(c) == "string") {
			var cName = c.replace(" ", "");
			if(THECOLORS[cName]) {
				return THECOLORS[cName];	
			}
		} 
		var r = c[0];
		var g = c[1];
		var b = c[2];
		return "rgb(" + r + "," + g + "," + b + ")";
	}

	var canvas = undefined;
	var cx = undefined;
    
    var default_assets = '{\
    "images": {\
    "$spaceship": {\
      "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAA5FBMVEVHcEy2WQC2WQA0nv+2WQDpNQa2WQC2WQCCw/+Cw/+2WQD6FwjkOgW2WQDdQQTaQwThPQXwLAa2WQC2WQDyKAe2WQC2WQC2WQD0Jge2WQAAXbYAXbY0nv80nv8AXbY0nv80nv+Cw/80nv80nv80nv80nv80nv+Cw/////80nv80nv////////80nv80nv80nv+Cw/+Cw/80nv+Cw/8QEBAAXbYAOHEAgv80nv+Cw/////9FRUVNJAC2WQCqqqpRqv9lZWX/sm3/fQCGhoZ1dXX/voYgICD/z6L/plH6Fwj+CQnvLgYdKePMAAAANHRSTlMAGRYcDKlnQOi5p/7AJOb6zPnvxe6ggYDnA0k/c2Pd/vwD4CEg4R1M6Ijcmb6V26LrAtrQlxyQZgAABCBJREFUWMPtl3efo0YMhsnd5XLpvffe+zQN2Nhee/eSfP/vk1dlgAGchPs72v1hYPQ+HmmEBjfN/3bFYjnxfnHrv1gu3pFoOM0bAEUV+xD6ck5bIgjyEXzw+LeLuDmEBHGSw5OFQPjulHPCBz1JCCRKGHNocwjvUc/R+xjlo6f3N4ZAvSpzVk5PG0OAnnUBxiQQZiHEK6X3KR8+/zKIlL9YpsKY8MmHPPZova6s9L4O3+P4xWcpBOeYwMvIer5KH3+AwW8CrdWVld4P4dmm+eqjnKJ3DlWYElECrXfOx5T9t5hByGt1ZaUXAbj/nSfk3vV9z3XElYRTACL59OOvj0y5HgIA939KEXrMwHsQYKHXK9xO6edfCmA1hBh+/w3TzwJACoKY5xwAkBFGIgXQIgTKHCwM8+cIBMCJDE4AHAOiEJeUMs1CSKLPXLgkM3Ccg+xx6H3mHDiZAXFxZyGkBSCAkSIDSGZQ5wAAYgCiSCDMAFgtBcT4byFwJgVQEWqAhgBxZ2YACWEFAJ0XABWAhtB1u93ODpMQZCUYgCLRRJp+BGgIUJ5Op67DAYgqBJIsMmEog1XA6Xg8dh0Op3XANIuccz+E4Iv+ctntLpdC8EMI4lE/zk4dAJA1U8DlLu92+e6iAHEJUufsMu8h5qBqF6B/fLzkfHeX8+X4GITgKpeVNuQGCwJgvQCyTAE3R4/VPnbbnvf7c3sbDLCYAf6Kz6KJ0hywzMEcMF0FypmmADwwZRW6rqwC35wAVDPWIq7KoFTlsg6k+gYAF04eJ5DQ8DDY7vdty0MKqCsx8GNI6nNrkgkAl5nO57PUJB7qMH8Wgj7IJE5ZFRVAOh4b14nXLlaeRu1vbMVH3OcA7kfEmyF/aBvU9wNrkOMo5QpA0gdiIu3hUbq67SxmAuC+HrXTkwgKYQ0AwgzAz8k1ADeEEaDPFAN4zvJPBpCYCoDbAZm+ALAV8juFxjDLgUTAbxvsVQBCmADQ8b22tCuAyAB4XQOgUU4B8xwYAF7XACUHpH29MgHMc6AAbyViAF5n06M62ZIR9I3LAKqiSSsyC9E2Z0ybtO4oqEvUjlds6Cxt24qDhjvqsYz6jsTLOBJ0w+YbEEodtIdDKxANxZpmI0nkCUgSm9J07ctZAZ0ADjf7/f7mYIEMTddJMrj+uJKGtm2TN5HN4AanbXEpTVvK1YLibNfDRTQFNJrroo9hDCHEQtD1adYBY2dnfR2CEcbMrwMazEA9nJ8UIr8jOOVH7xaixrU3rW0VDCibpbQQMR/KVjgApiJcHMrpAGiq6hr2ohEwEVXbm/eu3ivrvXAcr+3pB5P9cblX1vfs9N47z4z651940PzDdrs2du+NP18dCK/88dKLW3+avvv6X68NgIcvP/fU5h+3b+3eHC8ebtc3zdty/BuPsx4iKt1EFAAAAABJRU5ErkJggg=="\
    },\
    "$alien": {\
      "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAvCAMAAABkFTxjAAAC9FBMVEVHcEwDDAhcLxmFm4MnLCNdcVoAAgBrdltseWYIDApUZ1Y3RjMPGA1IVERebF0KDAtWYVlDTj1QW0wCCAJib2GNnYovOitQXUxmeFk7QzUIFQUnEQNSUDVNXEwiJB6lsqwtLygrODIrIRU9TD5LVkiCVTCXqZdMJRg4QjcEBQQ/Qjxfc1tfcFOZpJgrNi8gIRkhHBgkNynDwsNMUEVLYVpQWE0yLyceHhgZIBeDmpRBRTYTDQoiLSM/PjcaEA19gG1VYk6Rnpg6Oy8zLTCRnZd7iW6Jj4NRWEkbCgUiMixOWVJ+jWSQlHo4RSxaPxtgeGBddF1peWgoKixPVVFxfXBeSBaKkpxhYVWbnm+4AhQCAQG4WBYDAgbBXRS4XAsMDgu9Vh8UCAQGCAMEBA62VRsZGBi+XBs1FgytVh65VRBCHQYSGxCyURJzNCu9VxAuFAXgfhuzXB2gSB+rTxWaRyKbUhKnpaaGOiWzWhBHSUf3mhLAWgsgCAdyMg2FOBptNgxbW1poLBe4YRE6GxoiJSM3NjZNUE/EWx6YSBB0c3IlGhAoKSwfGSNGJiT2kyGVlJTFYygUDhNXKQzrhx9UIRD7/PhBO0L6kzEyLTC1s7SoXRJeMwo6QTnScR7JUyJqbGr1miUpHRspMCcZKRm5YB+3VifGbw9JGRTAYgh8NQvVeB1FRDhQHghpMipaMitMKQfwkBZxwQ+R+QZaIiDFZRiQSyKjSA9+NCKfnZ52Kh3KWg56Mjh9fny+bSKCRRL6nxySPyUCEBcSBBKoSx7DhiSlVCCNVRFKPCtlnQs2JAqvWTBzShr5+PmbUyN5iQ3vjiVuOhuGThDxkjlRPz4SIyi/UQvNy8yscxaLiYqOQxHVixXc3N3OjjiCRS7u7fLSYBjgiCpVigjmoh6YXj4BAhozOSmM6AVuVDt7tRHj5OCKLi6lYyuwhTpgYWDh6DPp5+il4QWcpJxIdgpz2QMyVxCQ3wSuwRSXbiopPQNsg4Hi7SWdozKtEnlOAAAAWXRSTlMAP/4RCx2BBwM1FDG4uTHVr1bqulU8Y2k8Jv76/bPxIuaMx959/jH+7I2/fpedr+Waef3x+vH90fNSPfB+96ONzoJz1N3FlsD3+ZpIYkHZwcrfx8uvqbrO/SK7d9AAAAdfSURBVEjHlZZVdBtZEoZ7ZZAsJ2aGmGMIM01omGH5tLrFZDFYtizLsmXJDDEzMzMzM9thZpoM0+6+bNuJJ5OzUeStPqdf+v5f31tVt6oAQIPZ/ukVM8IA/49hbLBuJBKZRCJRyATkTSJ8bLF5tZ6h4YkY+5a2UnpkUKmfmA7DcJmCpfpwm6HhZuSWNibqkq65bKYvnojD4QJEOCIeh5dyhG0tJR9pl9tgPjVFiSViqS+ViiP6UnkBfngEUEaFfcXM9uyk9/W0HR697+G15RScL52IkxJ5CECEJ4bhiDg8jlO5kDL6ty/RWgCOHm3j49UCAexLf76DdUAQLC0XCMrHZ8YdPnuz/u366tGYsHJZoSAvkfryCLy8vJSBxnLJvStdp6zeoEfbOF8XXFxMSBBUp8gErZEwDl7fAb11oTGl+kphglwcoHLF6miM319BlB9TiK8U8KfaBI0ZKeX01sGxSjhvQZZRHTLVMLCs4NZxK8Lf0wQw3QYlpY4kUnGlrNHCjAyZTJYg66tOyEhIKGyU3fk1Z+CWoiuggkI4ovkMQxM1atZl4nkxlRcUBNPpRHhQVBkJtzZmNC6nCFLCuDEgBOVqlJseAe96EkiM2lpFKQwLhUIpLkyBOFGKqyyUDVT7PWTFkFB18bQtmgAW4eTpqH4USAFVDbVdIpgOE3HrUaAHjfV7PAyPI1PilR0Vce9o0BsdiQXF2WESJYVsN9nUNB+sDKYHXRfhp5XBykdNTZOrh0mpdR3clqSP/qz7WsAOCAJ9pedhSQ4l89GD5qb5eXDJr+uJpL9k/nZz84PbmYEzXG5PRwsEsTUA5Mlgu1A8IuyuSB+e/LH5u1/uxZBodjFJv/3S3PzjT3ErdxsHu7iKeHmq3esBWFbicKqkbTBSQm9YiZv8+VFSQ0/AkycdPYzfmn7+IXxlsfBaEJfbFR8iHHoVgDUC1svNDgZxkXG5KjiKhfcV1kIUCj+7ow7Z9OJSEgWE+ktbr5AkFS2pFVHMe68A9Ezt7e0NsQDwRZEiu1bZQmLdZJbhw6Z9YV4+J4wn5QTliyvLhPiyxMJlOak+XinqWfMB1s3e/rAponf6akIyem3iPTSAji7ipMqv48aEvIDzkZHdzFJOYmQ3HJkvLMvn5cMjTFmGsp5PCo7aY4Xevn3fzLXRpfDtTsBBj7xbGQlj9W4AYB0jTnVwqDpPp6o4OVEcIR6fPMVisUIqhdkwKkqUUwh3MHzMg6OMkf86o8oHUm7lHf4MOFh162Jin2DpoCVgXcSsPWN9qD+SyQ8JFvtGckLkEHJ6flVrPk8UktywIPHca2EechkBbD/6NK8v8aKAvBOIaJjxiq/r619xXwOkfoC2nmjn5KS2B3VzFouSk/kM1JRqiZp9sypHVO3pZQis7wD7D9TTufr4Go8hU8CxxszyZL1yOsQbXRDDSfYBTn91wE+cT8TR2+V++YnJipvMHsZYN7W7r3xmr47OGuDEvrOrc6K6CZ+zXg7HAbSeHvpdNpep9LbgsyQoH8S/x098iPKjSqMYuNKy5JAwertqjkdVeBadtEVjdF0X21jyf66KBz1PWQJ/13teIj8p4XJQJFZfguJpg/t6aHOHhigMLk5MTQ5mjjDr5RQK2+XYWs0rvjw+t5A9DEr8KtywG4UMa7SK4tX9eke2fFPJPoNBo3XRtp96Q4Q4PoORJGfw+UkEwpdGWIyOLgJgVOUN3LmjkooqfHTOPgcYFlvEpE/n8KcYLP4ZE1vAhF2CJIo+LbMIJIFIQlLA9CLCW0iU2WwA2PnFIRWDwSePXC/aq1tstKZ3+fxrr9y4+AMGa2aJ8LYF5loCGP2Cb6/+Sw2RyWDu948fpyMAm/Bw4/cBHaP1hSiV2sv163d26gCf7M6RKmJJxibHXhTbj2mxsQeOHbofmvX9QRoEQRR1QZZ/ca7F6cDYWMKLFusE7DamxVddVK01KpOI2kR5jfvG1XBxBcMvhYaqoy+F0iC7H27f/gmirNIi1LnPCi7RyG47Nta5x4YwVX957gPnu3teXi9zCHp2tTOClvXYP5rNbmp+MEk+3Nub9Sy8ICuLRiY7bqzTcfzcw3XXi2Gg2Prl5dwCQSUEQm9mVlrajfs08Lv54biC2dnZ3tACNpkGkre+XPm22un3jvqH8cOckGuJ2VVM8b+RdiN05Zt/f/Ofmui02W+jCd5oHWwJ4Q8A3WOvbdVbTp7GAHr3waTetLSroTUODjW9N2bTItSgN/In921btU4IulgdDGbPBf/Q6NnZc+t2yb/TP7Pgwn5nJEN10dpnjOO7d53afyE6M/3c/qv+iHUiTyAh/dyFLJddzrabmHEMaKGd0RGHzMzMIqIjAiMC1+yAmVngs+hz6WwD7Xqr3eqI/S76iH8M9DfsLSPAaZ++WSctdq+pVsAWdSbh6Gvr/k47QjjNUTsgLtNYg6esaOlJJtoBBGiPhlHMij1M0B5GJBONNbmHTSZvAgAWv6vhE9aAsAmA+TYTjXM1ZuvRD7SnwRtDbfA/mfRfSLwM99CsU1kAAAAASUVORK5CYII="\
    },\
    "$explosion": {\
      "src": "data:image/png;base64,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"\
    },\
    "$bullet": {\
      "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAcBAMAAACwr9OGAAAAElBMVEVHcEz0v1rtfzzmPx7fAAD8/3nXZwFmAAAAAXRSTlMAQObYZgAAADlJREFUCNdjYFBiYGASVGAwClVGwU6CKnDsLGgCxsxKBmDMouSAwMYQzGDMwMDggoZZgNgBSjOAaQCecAnMAjzuGwAAAABJRU5ErkJggg=="\
    }}}';
    
    if(Sk.globals.ASSETS) {
    console.log("ASSETS DICT ")
    }

	if(PythonIDE.files['assets.json']) {
		assets = JSON.parse(PythonIDE.files['assets.json']); // якщо наявний файл ресурсів - розбираємо його
	}
	else {
		assets = JSON.parse(default_assets);
		console.log("Assets=",assets);
	}
    
	var loadedAssets = {}; // Тут Завантажені ресурси
    console.log("ASSETS=",assets)
// -Завантаження зображень--
function loadImage(name) {
    return new Promise(function(resolve, reject) {
        var jsName = Sk.ffi.remapToJs(name);
        var file_name = "/images/" + jsName + ".png";

        jsfs.read(file_name)
            .then(function(image_data) {
                // Перевірка валідності Data URL
                if (typeof image_data !== 'string' || !image_data.startsWith('data:image/')) {
                    throw new Error("Invalid image data for " + jsName);
                }

                var img = new Image();
                img.name = jsName;
                img.onload = function () {
                    loadedAssets[img.name] = {
                        image: img,
                        name: img.name,
                        type: "image",
                        width: img.width,
                        height: img.height
                    };
                    assets.images[jsName] = {
                        src: img.src,
                        width: img.width,
                        height: img.height
                    };
                    console.log("Loaded image:", jsName);
                    resolve(img);
                };
                img.onerror = function () {
                    console.error("Image load error:", jsName);
                    PythonIDE.showHint("Помилка: зображення '" + jsName + "' не завантажено!");
                    reject(new Error("Failed to load image: " + jsName));
                };
                img.src = image_data;
            })
            .catch(function(err) {
                if (!jsName.startsWith("$")) {
                    console.error("Failed to load image:", file_name, err);
                    PythonIDE.showHint("Помилка: зображення '" + jsName + "' не знайдено!");
                    PythonIDE.showHint("Помилка: зображення '" + jsName + "' не знайдено!");
                }
                reject(err);
            });
    });
}
//
	var promises = [];
	
	var animations = {};

    var animate = function(kwa, object) {
        Sk.builtin.pyCheckArgs("animate", 1, 1);
        var props = unpackKWA(kwa);
        console.log("Props received:", props);
        var duration = props.duration !== undefined ? Sk.ffi.remapToJs(props.duration) : 1;
        var onFinished = props.on_finished;
        var tweenName = props.tween || 'linear';
        var tweenFunc = TWEEN_FUNCTIONS[tweenName];
        if (!tweenFunc) {
            throw new Sk.builtin.ValueError("Unknown tween: " + tweenName);
        }
    
        var anim = {
            object: object,
            targets: {},
            startTime: Date.now(),
            duration: duration * 1000,
            tween: tweenFunc,
            onFinished: onFinished,
            id: object.id
        };
    
        for (var key in props) {
            if (['tween', 'duration', 'on_finished'].includes(key)) continue;
    
            var pyVal = props[key]; 
            var startVal = Sk.ffi.remapToJs(getActorAttribute(object, Sk.ffi.remapToPy(key)));
    
            if (key === 'pos') {
                               
                if (!Array.isArray(pyVal) || pyVal.length < 2) {                   
                anim.targets.x = {
                    start: Sk.ffi.remapToJs(getActorAttribute(object, Sk.ffi.remapToPy("x"))),
                    end: pyVal.v[0]
                };
                anim.targets.y = {
                    start: Sk.ffi.remapToJs(getActorAttribute(object, Sk.ffi.remapToPy("y"))),
                    end: pyVal.v[1]
                };                    
                    
                }
               else {
                anim.targets.x = {
                    start: Sk.ffi.remapToJs(getActorAttribute(object, Sk.ffi.remapToPy("x"))),
                    end: pyVal[0]
                };
                anim.targets.y = {
                    start: Sk.ffi.remapToJs(getActorAttribute(object, Sk.ffi.remapToPy("y"))),
                    end: pyVal[1]
                };
			   }
                anim.id += "_pos";
            } else if (object.attributes && object.attributes[key] !== undefined) {
                anim.targets[key] = {
                    start: startVal,
                    end: pyVal
                };
                anim.id += "_" + key;
            }
        }
    
        // Скасувати старі анімації на ті самі атрибути
        for (var attr in anim.targets) {
            var oldKey = object.id + "_" + attr;
            if (animations[oldKey]) {
                delete animations[oldKey];
            }
        }
    
        // Зареєструвати нову анімацію
        for (var attr in anim.targets) {
            animations[object.id + "_" + attr] = anim;
        }
    };
    animate.co_kwargs = true;
    Sk.globals.animate = new Sk.builtin.func(animate);
	
	function updateRectFromXY(self) {
		var i = loadedAssets[self.attributes.image];
		if(i == undefined) {
			i = {
				width: 0,
				height: 0
			};			
		}
 
		var a = self.attributes;
		a.width = i.width;
		a.height = i.height;

		a.left = a.x;
		a.right = a.x + a.width;
		a.top = a.y;
		a.bottom = a.y + a.height;
		
		self.coords = {
			x1: a.left,
			y1: a.top,
			x2: a.right,
			y2: a.bottom
		}
	}
	
	var updateActorAttribute = function(self, name, value) {
		Sk.builtin.pyCheckArgs("__setattr__", 3, 3);
		name = Sk.ffi.remapToJs(name);
		var a = self.attributes;
		a[name] = Sk.ffi.remapToJs(value);		
		var pos = Sk.ffi.remapToJs(value);
		switch(name) {
			case 'x':
				a.x = a.x - self.anchorVal.x;
			break;
			case 'y':
				a.y = a.y - self.anchorVal.y;
			break;
			case 'left':
				a.x = a.left;
			break;
			case 'right':
				a.x = a.right - a.width;
			break;
			case 'top':
				a.y = a.top;
			break;
			case 'bottom':
				a.y = a.bottom - a.height;
			break;
			case 'topleft':
				a.x = pos[0];
				a.y = pos[1];
			break;
			case 'topright':
				a.x = pos[0] - a.width;
				a.y = pos[1];
			break;
			case 'midtop':
				a.x = pos[0] - a.width/2;
				a.y = pos[1];				
			break;
			case 'bottomleft':
				a.x = pos[0];
				a.y = pos[1] - a.height;
			break;
			case 'bottomright':
				a.x = pos[0] - a.width;
				a.y = pos[1] - a.height;
			break;			
			case 'midbottom':
				a.x = pos[0] - a.width/2;
				a.y = pos[1] - a.height;
			break;
			case 'midleft':
				a.x = pos[0];
				a.y = pos[1] - a.height/2;
			break;
			case 'midright':
				a.x = pos[0] - a.width;
				a.y = pos[1] - a.height/2;
			break;
			case 'center':
				a.x = pos[0] - self.anchorVal.x;
				a.y = pos[1] - self.anchorVal.y;
			break;
			case 'anchor':
				self.anchor = Sk.ffi.remapToJs(value);
				updateAnchor(self);
			break;
			case 'pos':				
				a.x = pos[0] - self.anchorVal.x;
				a.y = pos[1] - self.anchorVal.y;
			break;
			case 'flip_x':
				a.flip_x = !!Sk.ffi.remapToJs(value);
			break;
			case 'flip_y':
				a.flip_y = !!Sk.ffi.remapToJs(value);
			break;
			case 'fps':
				self.fps = Math.max(0.1, Sk.ffi.remapToJs(value)); // avoid zero or negative
			break;
			case 'direction':
				self.direction = Sk.ffi.remapToJs(value);
			break;
            case 'images':
                var newImages = Sk.ffi.remapToJs(value);
                self.images = newImages;
                self.image_index = 0;
            
                if (newImages.length > 0) {
                    // Завантажуємо всі зображення зі списку (паралельно)
                    var loadPromises = newImages.map(function(imgName) {
                        return loadImage(imgName).catch(function(err) {
                            // Не ламаємо весь процес, якщо одне зображення не знайдено
                            console.warn("Failed to load image in 'images' list:", imgName, err);
                            return null;
                        });
                    });
            
                    // Після завантаження хоча б першого — встановлюємо його
                    Promise.all(loadPromises).then(function(results) {
                        if (newImages.length > 0 && loadedAssets[newImages[0]]) {
                            a.image = newImages[0];
                            updateRectFromXY(self);
                        } else {
                            console.warn("No valid image loaded from 'images' list");
                        }
                    });
                } else {
                    a.image = null;
                }
                break;			
            case 'image':
                var jsName = Sk.ffi.remapToJs(value);
                a.image = jsName;
            
                if (!loadedAssets[jsName]) {
                    loadImage(jsName)
                        .then(function(img) {
                            updateRectFromXY(self);
                        })
                        .catch(function(err) {
                            console.warn("Failed to load image via 'image' attribute:", jsName, err);
                        });
                } else {
                    updateRectFromXY(self);
                }
                break;
			default:
			self.others[name] = value;
			break;
		}
		
		
		updateRectFromXY(self);
	};
	
    var getActorAttribute = function(self, name) {
        Sk.builtin.pyCheckArgs("__getattr__", 2, 2);
        name = Sk.ffi.remapToJs(name);
        if (name === 'pos') { name = 'center'; }

        switch(name) {
            case 'x':
                return Sk.ffi.remapToPy(self.attributes.x + self.anchorVal.x);
            case 'y':
                return Sk.ffi.remapToPy(self.attributes.y + self.anchorVal.y);
            case 'center':
                return new Sk.builtin.tuple(Sk.ffi.remapToPy([
                    (self.coords.x1 + self.coords.x2) / 2,
                    (self.coords.y1 + self.coords.y2) / 2
                ]));
        }
    
        // Інші атрибути
        if(self.others[name] !== undefined) {
            return self.others[name];
        }
        if(self.attributes[name] !== undefined) {
            return Sk.ffi.remapToPy(self.attributes[name]);
        }
        if(name === 'anchor') {
            return new Sk.builtin.tuple(Sk.ffi.remapToPy(self.anchor));
        }
    
        // Якщо нічого не знайдено — помилка
        throw new Sk.builtin.AttributeError("'" + self.tp$name + "' object has no attribute '" + name + "'");
    };

	var idCount = 0;

	Sk.globals.ZRect = Sk.globals.Rect = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__repr__ = new Sk.builtin.func(function(self) {
			var x = self.coords.x1;
			var y = self.coords.y1;
			var w = self.coords.x2 - self.coords.x1;
			var h = self.coords.y2 - self.coords.y1;
			return Sk.ffi.remapToPy("Rect (x:" + x + " y:" + y + " w:" + w + " h:" + h + ")");
		});

		$loc.__init__ = new Sk.builtin.func(function(self) {
			Sk.builtin.pyCheckArgs("__init__", 2, 5);
			self.coords = {
				x1: 0,
				y1: 0,
				x2: 0,
				y2: 0
			}

			self.attributes = {};
			
			switch(arguments.length) {
				case 2:
					// either a 4-tuple or rect like object
					switch(arguments[1].tp$name) {
						case 'tuple':
							var coords = Sk.ffi.remapToJs(arguments[1]);
							self.coords = {
								x1: coords[0],
								y1: coords[1],
								x2: coords[2] + coords[0],
								y2: coords[3] + coords[1]
							}
						break;
						default:
							var other = arguments[1];
							self.coords = {
								x1: other.coords.x1,
								x2: other.coords.x2,
								y1: other.coords.y1,
								y2: other.coords.y2
							}
					}
				break;

				case 3:
					// pair of 2-tuples
					var topLeft = Sk.ffi.remapToJs(arguments[1]);
					if(topLeft.length == 2) {
						self.coords.x1 = topLeft[0];
						self.coords.y1 = topLeft[1];
					}

					var dims = Sk.ffi.remapToJs(arguments[2]);
					if(dims.length == 2) {
						self.coords.x2 = self.coords.x1 + dims[0];
						self.coords.y2 = self.coords.y1 + dims[1];
					}
				break;

				case 5:
					// individual coordinates
					self.coords.x1 = Sk.ffi.remapToJs(arguments[1]);
					self.coords.y1 = Sk.ffi.remapToJs(arguments[2]);
					self.coords.x2 = self.coords.x1 + Sk.ffi.remapToJs(arguments[3]);
					self.coords.y2 = self.coords.y1 + Sk.ffi.remapToJs(arguments[4]);

				break;
			}
			
		});

		$loc.__getattr__ = new Sk.builtin.func(function(self, name) {
			var jsName = Sk.ffi.remapToJs(name);
			if (jsName==='x') {jsName ='left';}
			if (jsName==='y') {jsName ='top';}
			if (jsName==='pos') {jsName ='center';}
			console.log('GetAttr:',jsName);
			switch(jsName) {							
				case 'centerx':
					return Sk.ffi.remapToPy((self.coords.x1 + self.coords.x2) / 2);
				break;

				case 'centery':
					return Sk.ffi.remapToPy((self.coords.y1 + self.coords.y2) / 2);
				break;

				case 'center':
					return new Sk.builtin.tuple(Sk.ffi.remapToPy([(self.coords.x1 + self.coords.x2) / 2, (self.coords.y1 + self.coords.y2) / 2]));
				break;

				case 'top':
					return Sk.ffi.remapToPy(self.coords.y1);
				break;

				case 'left':
					return Sk.ffi.remapToPy(self.coords.x1);
				break;

				case 'right':
					return Sk.ffi.remapToPy(self.coords.x2);
				break;

				case 'bottom':
					return Sk.ffi.remapToPy(self.coords.y2);
				break;

				case 'bottomleft':
					return new Sk.builtin.tuple(Sk.ffi.remapToPy([self.coords.x1, self.coords.y2]));
				break;
				case 'topleft':
					return new Sk.builtin.tuple(Sk.ffi.remapToPy([self.coords.x1, self.coords.y1]));
				break;
				case 'bottomright':
					return new Sk.builtin.tuple(Sk.ffi.remapToPy([self.coords.x2, self.coords.y2]));
				break;
				case 'topright':
					return new Sk.builtin.tuple(Sk.ffi.remapToPy([self.coords.x2, self.coords.y1]));
				break;

				default:
					if(self.attributes[jsName]) {
						return self.attributes[jsName];
					}
				break;
			}
		});

		$loc.__setattr__ = new Sk.builtin.func(function(self, name, value) {
			var jsName = Sk.ffi.remapToJs(name);
			var jsVal = Sk.ffi.remapToJs(value);
			if (jsName==='x') {jsName ='left';}
			if (jsName==='y') {jsName ='top';}
			console.log('SetAttr:',jsName);
			switch(jsName) {		
				case 'center':
					var oX = jsVal[0] - ((self.coords.x2 - self.coords.x1) / 2) - self.coords.x1;
					var oY = jsVal[1] - ((self.coords.y2 - self.coords.y1) / 2) - self.coords.y1;
					self.coords.x1 += oX;
					self.coords.x2 += oX;
					self.coords.y1 += oY;
					self.coords.y2 += oY;
				break;

				case 'centerx':
					var oX = jsVal - ((self.coords.x2 - self.coords.x1) / 2) - self.coords.x1;
					self.coords.x1 += oX;
					self.coords.x2 += oX;
				break;

				case 'centery':
					var oY = jsVal - ((self.coords.y2 - self.coords.y1) / 2) - self.coords.y1;
					self.coords.y1 += oY;
					self.coords.y2 += oY;
				break;

				case 'left':
					var w = self.coords.x2 - self.coords.x1;
					self.coords.x1 = jsVal;
					self.coords.x2 = self.coords.x1 + w;
				break;

				case 'right':
					var w = self.coords.x2 - self.coords.x1;
					self.coords.x2 = jsVal;
					self.coords.x1 = self.coords.x2 - w;
				break;

				case 'top':
					var h = self.coords.y2 - self.coords.y1;
					self.coords.y1 = jsVal;
					self.coords.y2 = self.coords.y1 + h;
				break;

				case 'bottom':
					var h = self.coords.y2 - self.coords.y1;
					self.coords.y2 = jsVal;
					self.coords.y1 = self.coords.y2 - h;
				break;


				default:
					self.attributes[jsName] = value;
				/*debugger;
					throw new Sk.builtin.NotImplemented("Rect property " + jsName + " not implemented yet");
				break;*/
			}
		});

		$loc.colliderect = new Sk.builtin.func(function(self) {
			var args = [];
			for(var i = 1; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			var other = Sk.misceval.callsim(Sk.globals.Rect, ...args);
			return Sk.ffi.remapToPy(
            	self.coords.x1 < other.coords.x2 &&
	            self.coords.y1 < other.coords.y2 &&
	            self.coords.x2 > other.coords.x1 &&
	            self.coords.y2 > other.coords.y1
	        );
		});

		$loc.collidelist = new Sk.builtin.func(function(self, others) {
			Sk.builtin.pyCheckArgs("collidelist", 2, 2);
			if(others && others.v && others.v.length) {
				for(var i = 0; i < others.v.length; i++) {
					var other = others.v[i];
					if(self.coords.x1 < other.coords.x2 &&
			            self.coords.y1 < other.coords.y2 &&
			            self.coords.x2 > other.coords.x1 &&
			            self.coords.y2 > other.coords.y1) {
						return Sk.ffi.remapToPy(i);
					}
				}	
			}
			return Sk.ffi.remapToPy(-1);
		});

	}, "Rect", []);

function unpackKWA(kwa) {
    result = {};
    for(var i = 0; i < kwa.length; i += 2) {
        var key = Sk.ffi.remapToJs(kwa[i]);
        var val = kwa[i + 1];
        result[key] = val;
    }
    return result;
}
	
	var Surface = Sk.misceval.buildClass(s, function($gbl, $loc) {

		$loc.blit = new Sk.builtin.func(function(self, source, dest, area, special_flags) {
			Sk.builtin.pyCheckArgs("blit", 3, 5);
			if(self.actor !== undefined) {
				throw new Sk.builtin.NotImplementedError("You can currently only blit to the screen surface");
			}
			
			if(!(source && source.actor && source.actor.attributes && source.actor.attributes.image)) {
				throw new Sk.builtin.TypeError("The source must be a pygame surface");
			}
			var i = loadedAssets[source.actor.attributes.image];

			var coords = Sk.ffi.remapToJs(dest);
			area = Sk.ffi.remapToJs(area);
			if(area && area.length >= 4) {
				cx.drawImage(i.image, area[0], area[1], area[2], area[3], coords[0], coords[1], area[2], area[3]);
			} else {
				cx.drawImage(i.image, coords[0], coords[1]);
			}
			


		});
		

		$loc.__init__ = new Sk.builtin.func(function(self, actor) {
			self.actor = actor;
		});
	});


	Sk.globals.Actor = Sk.misceval.buildClass(s, function($gbl, $loc) {
		
		$loc.distance_to = new Sk.builtin.func(function(self, target){
			Sk.builtin.pyCheckArgs("distance_to", 2, 2);

			var pos = Sk.ffi.remapToJs(target);
			var tx = 0;
			var ty = 0;
			if(pos) {
				tx = pos[0];
				ty = pos[1];
			} else {
				tx = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("x")));
				ty = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("y")));
			}
			
			var myx = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("x")));
			var myy = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("y")));
			
			var dx = tx - myx
			var dy = myy - ty
			return Sk.ffi.remapToPy(Math.sqrt(dx * dx + dy * dy));
		});
		
		$loc.angle_to = new Sk.builtin.func(function(self, target) {
			Sk.builtin.pyCheckArgs("angle_to", 2, 2);

			var pos = Sk.ffi.remapToJs(target);
			var tx = 0;
			var ty = 0;
			if(pos) {
				tx = pos[0];
				ty = pos[1];
			} else {
				tx = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("x")));
				ty = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("y")));
			}
			
			var myx = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("x")));
			var myy = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("y")));
			
			var dx = tx - myx
			var dy = myy - ty
			return Sk.ffi.remapToPy(Math.atan2(dy, dx) * 180 / Math.PI);
			
		});
		

		$loc.collidepoint = new Sk.builtin.func(function(self, pos) {
			Sk.builtin.pyCheckArgs("collidepoint", 2, 2);
			var c = Sk.ffi.remapToJs(pos);
			var pt = {
				x: c[0],
				y: c[1]
			}
			return new Sk.builtin.bool(pt.x >= self.attributes.x && pt.x <= self.attributes.right && pt.y >= self.attributes.y && pt.y <= self.attributes.bottom);
		});

		var anchors = {
			x: {
				left: 0.0,
				center: 0.5,
				middle: 0.5,
				right: 1.0
			},
			y: {
				top: 0.0,
				center: 0.5,
				middle: 0.5,
				bottom: 1.0
			}
		}

		function calculateAnchor(value, dim, total) {
			if(typeof value == 'string') {
				try {
					return total * anchors[dim][value];
				} catch (e){
					throw new Sk.builtin.ValueError(value + " is not a valid " + dim + "-anchor name");
				}
			}
			return value;
		}

		function transformAnchor(ax, ay, w, h, angle) {
			var theta = -angle * Math.PI / 180;
			var sinTheta = Math.sin(theta);
			var cosTheta = Math.cos(theta);

			var tw = abs(w * cosTheta) + abs(h * sinTheta);
		    var th = abs(w * sinTheta) + abs(h * cosTheta);

		    var cax = ax - w * 0.5;
		    var cay = ay - h * 0.5;

		    var rax = cax * cosTheta - cay * sinTheta;
		    var ray = cax * sinTheta + cay * cosTheta;

		    return {
		    	x: tw * 0.5 + rax,
		        y: th * 0.5 + ray
		    };

		}

		function updateAnchor(self) {
			var i = loadedAssets[self.attributes.image];
			if(i) {
				self.anchorVal.x = calculateAnchor(self.anchor[0], 'x', i.width);
				self.anchorVal.y = calculateAnchor(self.anchor[1], 'y', i.height);
			}		
		}


		$loc.__getattr__ = new Sk.builtin.func(getActorAttribute);

		$loc.__setattr__ = new Sk.builtin.func(updateActorAttribute);
//-----------------------------------

//
var init = function(kwa, self, name, pos) {
    Sk.builtin.pyCheckArgs("_init_", 2, 2);
    self.id = idCount++;

    self.attributes = {
        x: 0,
        y: 0,
        angle: 0,
        scale: 1,
        opacity: 1,
        flip_x: false,
        flip_y: false,
        image: Sk.ffi.remapToJs(name)        
    };
    self.direction = 0; // за замовчуванням — праворуч
    self.fps = 5; // default FPS for animation
    self.image_index = 0;
	self.images = []; // список назв зображень для анімації
    self.others = {};
    self.others._surf = Sk.misceval.callsim(Surface, self);

    self.anchor = ['center', 'center'];
    var args = unpackKWA(kwa);
    
    if(args.anchor) {
        self.anchor = args.anchor;
    }
    if(pos) {
        pos = Sk.ffi.remapToJs(pos);
    } else {
        if(args.pos) {
            pos = args.pos;
        } else {
            pos = [-55555, 0];
        }
    }
    
    self.anchorVal = {x: 0, y: 0};
    var jsName = Sk.ffi.remapToJs(name);
    var file_name = "/images/" + jsName + ".png";

// Завантажуємо зображення через спільну функцію
loadImage(jsName)
    .then(function(img) {
        self.attributes.width = img.width;
        self.attributes.height = img.height;
        updateRectFromXY(self);
        console.log("W/H=", self.attributes.width, self.attributes.height);
    })
    .catch(function(err) {
        // Помилки вже оброблені в loadImage, але можна додати fallback
        console.warn("Image loading failed:", err);
    });
};

init.co_kwargs = true;
$loc.__init__ = new Sk.builtin.func(init);

$loc.draw = new Sk.builtin.func(function(self) {
    if (!loadedAssets[self.attributes.image]) {
        return;
    }
    updateRectFromXY(self);
    var i = loadedAssets[self.attributes.image];
    var a = self.attributes;
    var w = a.width * a.scale;
    var h = a.height * a.scale;
    var radians = a.angle * Math.PI / 180;
    cx.save();
    cx.globalAlpha = a.opacity;
    // Переносимо до точки прив'язки (anchor point)
    cx.translate(a.x + self.anchorVal.x, a.y + self.anchorVal.y);
    // Обертання навколо anchor point
    if (a.angle !== 0) {
        cx.rotate(-radians);
    }
    // Дзеркальне відображення
    if (a.flip_x || a.flip_y) {
        cx.scale(a.flip_x ? -1 : 1, a.flip_y ? -1 : 1);
        // Малюємо з урахуванням масштабу та віддзеркалення
        cx.drawImage(i.image, a.flip_x ? -w : 0, a.flip_y ? -h : 0, w, h);
    } else {
        cx.drawImage(i.image, 0, 0, w, h);
    }
    cx.restore();
});
$loc.next_image = new Sk.builtin.func(function(self) {
    if (self.images.length === 0) {
        return Sk.builtin.none.none$;
    }
    self.image_index = (self.image_index + 1) % self.images.length;
    self.attributes.image = self.images[self.image_index];
    updateRectFromXY(self); // оновлюємо розміри, якщо нове зображення іншого розміру
    return Sk.builtin.none.none$;
});
$loc.animate = new Sk.builtin.func(function(self) {
    if (!self.images || self.images.length === 0) {
        return Sk.builtin.none.none$;
    }
    // Ініціалізуємо лічильник кадрів, якщо ще не існує
    if (self.frame_counter === undefined) {
        self.frame_counter = 0;
    }
    self.frame_counter += 1;
    // Обчислюємо інтервал у кадрах: 60 FPS / self.fps
    var interval = 60 / self.fps;
    if (self.frame_counter >= interval) {
        // Перемикаємо зображення
        self.image_index = (self.image_index + 1) % self.images.length;
        self.attributes.image = self.images[self.image_index];
        updateRectFromXY(self);
        self.frame_counter = 0; // скидаємо лічильник
    }
    return Sk.builtin.none.none$;
});
$loc.move_forward = new Sk.builtin.func(function(self, distance) {
    var d = Sk.ffi.remapToJs(distance);
    var angleRad = self.attributes.angle * Math.PI / 180;
    self.attributes.x += d * Math.cos(angleRad);
    self.attributes.y += d * Math.sin(angleRad);
    updateRectFromXY(self);
    return Sk.builtin.none.none$;
});

$loc.move_back = new Sk.builtin.func(function(self, distance) {
    var d = Sk.ffi.remapToJs(distance);
    var angleRad = self.attributes.angle * Math.PI / 180;
    self.attributes.x -= d * Math.cos(angleRad);
    self.attributes.y -= d * Math.sin(angleRad);
    updateRectFromXY(self);
    return Sk.builtin.none.none$;
});

$loc.move_right = new Sk.builtin.func(function(self, distance) {
    var d = Sk.ffi.remapToJs(distance);
    var angleRad = (self.attributes.angle + 90) * Math.PI / 180; // 90° to the right of forward
    self.attributes.x += d * Math.cos(angleRad);
    self.attributes.y += d * Math.sin(angleRad);
    updateRectFromXY(self);
    return Sk.builtin.none.none$;
});

$loc.move_left = new Sk.builtin.func(function(self, distance) {
    var d = Sk.ffi.remapToJs(distance);
    var angleRad = (self.attributes.angle - 90) * Math.PI / 180; // 90° to the left of forward
    self.attributes.x += d * Math.cos(angleRad);
    self.attributes.y += d * Math.sin(angleRad);
    updateRectFromXY(self);
    return Sk.builtin.none.none$;
});		
$loc.move_in_direction = new Sk.builtin.func(function(self, distance) {
    var d = Sk.ffi.remapToJs(distance);
    var angleRad = self.direction * Math.PI / 180;
    self.attributes.x += d * Math.cos(angleRad);
    self.attributes.y += d * Math.sin(angleRad);
    updateRectFromXY(self);
    return Sk.builtin.none.none$;
});
$loc.distance_to = new Sk.builtin.func(function(self, other) {
    Sk.builtin.pyCheckArgs("distance_to", 2, 2);
    // Отримуємо центри обох акторів
    var self_center = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("center")));
    var other_center = Sk.ffi.remapToJs(getActorAttribute(other, Sk.ffi.remapToPy("center")));
    var dx = other_center[0] - self_center[0];
    var dy = other_center[1] - self_center[1];
    var distance = Math.sqrt(dx * dx + dy * dy);
    return Sk.ffi.remapToPy(distance);
});

$loc.direction_to = new Sk.builtin.func(function(self, other) {
    Sk.builtin.pyCheckArgs("direction_to", 2, 2);
    // Отримуємо центри обох акторів
    var self_center = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("center")));
    var other_center = Sk.ffi.remapToJs(getActorAttribute(other, Sk.ffi.remapToPy("center")));
    var dx = other_center[0] - self_center[0];
    var dy = other_center[1] - self_center[1];
    // atan2(dy, dx) дає кут від осі X, з урахуванням квадранту
    // У системі canvas: Y зростає вниз → це вже враховано
    var angleRad = Math.atan2(dy, dx);
    var angleDeg = angleRad * 180 / Math.PI;
    return Sk.ffi.remapToPy(angleDeg);
});
$loc.move_towards = new Sk.builtin.func(function(self, target, distance) {
    Sk.builtin.pyCheckArgs("move_towards", 3, 3);
    var dist = Sk.ffi.remapToJs(distance);
    // Отримуємо центри обох акторів
    var self_center = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("center")));
    var target_center = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("center")));
    var dx = target_center[0] - self_center[0];
    var dy = target_center[1] - self_center[1];
    var length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) {
        // Ціль у тій самій точці — нічого не робимо
        return Sk.builtin.none.none$;
    }
    // Нормалізований вектор, помножений на відстань
    var stepX = (dx / length) * dist;
    var stepY = (dy / length) * dist;
    self.attributes.x += stepX;
    self.attributes.y += stepY;
    updateRectFromXY(self);
    return Sk.builtin.none.none$;
});

$loc.point_towards = new Sk.builtin.func(function(self, target) {
    Sk.builtin.pyCheckArgs("point_towards", 2, 2);
    // Отримуємо центри обох акторів
    var self_center = Sk.ffi.remapToJs(getActorAttribute(self, Sk.ffi.remapToPy("center")));
    var target_center = Sk.ffi.remapToJs(getActorAttribute(target, Sk.ffi.remapToPy("center")));
    var dx = target_center[0] - self_center[0];
    var dy = target_center[1] - self_center[1];
    var angleRad = Math.atan2(dy, dx);
    self.attributes.angle = angleRad * 180 / Math.PI;
    updateRectFromXY(self);
    return Sk.builtin.none.none$;
});
		$loc.__repr__ = new Sk.builtin.func(function(self) {

			return Sk.ffi.remapToPy(self.attributes.image + " (x:" + (self.attributes.x + self.anchorVal.x) + "," + (self.attributes.y + self.anchorVal.y) + ")");
		});
	}, 'Actor', [Sk.globals.Rect]);

	var EnumValue = Sk.misceval.buildClass(s, function($gbl, $loc) {
		
		$loc.__init__ = new Sk.builtin.func(function(self, enumName, key, value) {
			self.enumName = enumName;
			self.key = key;
			self.value = value;
		});

		$loc.__str__ = new Sk.builtin.func(function(self) {
			return new Sk.builtin.str(self.enumName + "." + self.key);
		});

		$loc.__getattr__ = new Sk.builtin.func(function(self, a) {
			switch(Sk.ffi.remapToJs(a)) {
				case 'name':
					return Sk.ffi.remapToPy(self.key);
				break;
				case 'value':
					return Sk.ffi.remapToPy(self.value);
				break;
			}
		});

		$loc.__int__ = new Sk.builtin.func(function(self) {
			return Sk.ffi.remapToPy(self.value);
		});

		$loc.__eq__ = new Sk.builtin.func(function(self, other) {
			var cmpTo = Sk.ffi.remapToJs(other);
			if(other.value !== undefined) {
				cmpTo = other.value;
			}
			return Sk.ffi.remapToPy(Sk.ffi.remapToJs(self.value) == cmpTo);
		});

	}, 'enum', []);

	var Enum = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self, name) {
			self.values = {};
			self.name = name;
		});

		$loc.__str__ = new Sk.builtin.func(function(self) {
			return new Sk.builtin.str("enum '" + self.name + "'");
		});
	}, 'Enum', []);

	var keysPressed = {

	}

	function isKeyPressed(key) {
		return new Sk.builtin.bool(keysPressed[key.toLowerCase()] == true);
	}

	var Keyboard = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__getattr__ = new Sk.builtin.func(function(self, name) {
			var key = Sk.ffi.remapToJs(name);
			if(key.match(/__/)) {
				return;
			}
			return isKeyPressed(key);
		});
	}, 'pgzero.keyboard.Keyboard', []);
	Sk.globals.keyboard = Sk.misceval.callsim(Keyboard);
	
	var mouse = Sk.misceval.buildClass(s, function($gbl, $loc) {
		var id = 1;
		function addVal(key, value) {
			if(value == undefined) {
				value = id++;
			}
			$loc[key] = Sk.misceval.callsim(EnumValue, "mouse", key, value);
		}
		addVal('LEFT');
		addVal('MIDDLE');
		addVal('RIGHT');
	}, 'mouse', [Enum]);

	Sk.globals.mouse = Sk.misceval.callsim(mouse, 'mouse');

	var keys = Sk.misceval.buildClass(s, function($gbl, $loc) {

		var values = {
			SPACE: 32,
			RETURN: 13,
			LEFT: 37,
			RIGHT: 39,
			UP: 38,
			DOWN: 40
		}

		for(var key in values) {
			$loc[key] = Sk.misceval.callsim(EnumValue, "keys", key, values[key]);
		}

	}, 'keys', [Enum]);
	Sk.globals.keys = Sk.misceval.callsim(keys, 'keys');

	var SurfacePainter = Sk.misceval.buildClass(s, function($gbl, $loc) {
		var line = function(kwa, self, coord1, coord2, color) {
			var jsCoord1 = Sk.ffi.remapToJs(coord1);
			var jsCoord2 = Sk.ffi.remapToJs(coord2);
			var jsColor = Sk.ffi.remapToJs(color);
			var props = unpackKWA(kwa);
			cx.strokeStyle = getColor(jsColor);
			var lineWidth = props.width !== undefined ? props.width : 1;
			cx.lineWidth = lineWidth;
			cx.beginPath();
			cx.moveTo(jsCoord1[0], jsCoord1[1]);
			cx.lineTo(jsCoord2[0], jsCoord2[1]);
			cx.stroke();

		}
		line.co_kwargs = true;
		$loc.line = new Sk.builtin.func(line);

        var circle = function(kwa, self, coords, radius, color) {
			Sk.builtin.pyCheckArgs("circle", 3, 3); 
            var jsCoords = Sk.ffi.remapToJs(coords);
            var jsRadius = Sk.ffi.remapToJs(radius);
            var jsColor = Sk.ffi.remapToJs(color);
            var props = unpackKWA(kwa);
            var lineWidth = (props && props.width !== undefined) ? props.width : 1;           
            cx.strokeStyle = getColor(jsColor);
            cx.lineWidth = Sk.ffi.remapToJs(lineWidth);
            cx.beginPath();
            cx.arc(jsCoords[0], jsCoords[1], jsRadius, 0, 2 * Math.PI);
            cx.stroke();
        };
        circle.co_kwargs = true;
		$loc.circle = new Sk.builtin.func(circle);
		
        var rect = function(kwa, self, coord, color) {
            // 1. rect((x, y, w, h), color, width=...)
            // 2. rect((x, y), (w, h), color, width=...)        
            var jsCoords = Sk.ffi.remapToJs(coord);
            var jsColor = Sk.ffi.remapToJs(color);
            cx.strokeStyle = getColor(jsColor);
            var props = unpackKWA(kwa);
			var lineWidth = props.width !== undefined ? props.width : 1;
			cx.lineWidth = Sk.ffi.remapToJs(lineWidth);
            var x, y, w, h;        
            // rect((x, y, w, h), color, ...)
            if (jsCoords.length === 4 ) {
                x = jsCoords[0];
                y = jsCoords[1];
                w = jsCoords[2];
                h = jsCoords[3];
            }
            // rect((x, y), (w, h), color, ...)
            else if (jsCoords.length === 2 ) {
                x = jsCoords[0][0];
                y = jsCoords[0][1];
                w = jsCoords[1][0];
                h = jsCoords[1][1];
            }
            else {
                throw new Sk.builtin.TypeError(
                    "rect() takes either (left, top, width, height) or ((left, top), (width, height))"
                );
            }       
            cx.beginPath();
            cx.rect(x, y, w, h);
            cx.stroke();
        };
		rect.co_kwargs = true;
		$loc.rect = new Sk.builtin.func(rect);
		
		$loc.filled_rect = new Sk.builtin.func(function(self, rect, color) {
			Sk.builtin.pyCheckArgs("filled_rect", 3, 3);
			var args = {
				x1: rect.coords.x1,
				y1: rect.coords.y1,
				x2: rect.coords.x2,
				y2: rect.coords.y2,
				color: Sk.ffi.remapToJs(color)
			}
			cx.fillStyle = getColor(args.color);
			cx.beginPath();
			cx.rect(args.x1, args.y1, args.x2 - args.x1, args.y2 - args.y1);
			cx.fill();
		});
		
		$loc.filled_circle = new Sk.builtin.func(function(self, pos, radius, color) {
			Sk.builtin.pyCheckArgs("filled_circle", arguments, 4, 4);
			
			var args = {
				coords: Sk.ffi.remapToJs(pos),
				radius: Sk.ffi.remapToJs(radius),
				color: Sk.ffi.remapToJs(color)
			};
			cx.fillStyle = getColor(args.color);
			cx.beginPath();
			cx.arc(args.coords[0], args.coords[1], args.radius, 0, 2 * Math.PI);
			cx.closePath();
			cx.fill();
		});

		var text =  function(kwa, self, text, pos) {
			Sk.builtin.pyCheckArgs("text", arguments, 2, 4);
			var jsText = Sk.ffi.remapToJs(text);

			var props = {};
			for(var i = 0; i < kwa.length; i += 2) {
				var key = Sk.ffi.remapToJs(kwa[i]);
				var val = kwa[i + 1];
				props[key] = Sk.ffi.remapToJs(val);
			}
			
			if(props.fontname === undefined) {
				props.fontname = "Arial";
			}
			if(props.fontsize === undefined) {
				props.fontsize = 18;
			}
			if(props.color === undefined) {
				props.color = 'white';
				
			}
			if(props.background) {
				cx.fillStyle = getColor(props.background);
				cx.fillRect(props.x, props.y, size.width, size.height);
			}
			if(props.ocolor === undefined) {
				props.ocolor = "#000";
			}
			if(props.owidth === undefined) {
				props.owidth = 0;
			}
			if(props.align === undefined) {
				props.align = "center";
			}
			if(props.angle === undefined) {
				props.angle = 0;
			}
			
			cx.fillStyle = getColor(props.color); 
			
			cx.shadowOffsetX = 0;
			cx.shadowOffsetY = 0;
			if(props.scolor){
			// Specify the shadow offset.
				cx.shadowOffsetX = 2;
				cx.shadowOffsetY = 2;
				cx.shadowColor = props.scolor;
			}		
		
			cx.font = 'bold '+props.fontsize + "px " + props.fontname;
			var lines = jsText.split("\n");
			var size = {
				height: cx.measureText("M").width * lines.length,
				width: cx.measureText(lines[0]).width,
				lineWidths: []
			}
			for(var i = 0; i < lines.length; i++) {
				var w = cx.measureText(lines[i]).width;
				size.lineWidths[i] = w;
				if( w > size.width) {
					size.width = w;
				}
			}
			
			updateCoordsFromProps(props, size, Sk.ffi.remapToJs(pos));
			cx.textBaseline = "top";	

			for(var i = 0; i < lines.length; i++) {
				var x = props.x;
				var yy = props.y;
				switch(props.align) {
					case 'center':
						x += (size.width - size.lineWidths[i]) / 2;
					break;
					case 'right':
						x += (size.width - size.lineWidths[i]);
					break;
				}
				
				cx.save();
				if(props.gcolor) {
					const grad=cx.createLinearGradient(0,0,0,props.fontsize);
					grad.addColorStop(0, props.color);
					grad.addColorStop(1, props.gcolor);
					cx.fillStyle = grad; 
			} 
				y = yy + (i * size.height)/2;
				if(props.alpha) { cx.globalAlpha = props.alpha; }
				cx.translate(x,y);
				cx.rotate(-props.angle*Math.PI/180);
				if(props.owidth) {					
					cx.strokeStyle = getColor(props.ocolor);
					cx.lineJoin = "round";
					cx.lineWidth = props.owidth*2;
					cx.strokeText(lines[i], 0, 0);
				}	
				cx.fillText(lines[i], 0, 0);
				cx.restore();
			}			
		};

		text.co_kwargs = true;
		$loc.text = new Sk.builtin.func(text);
	}, 'pgzero.screen.SurfacePainter', []);

	var Clock = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self) {
			self.callbacks = {};
		});

		$loc.schedule_unique = new Sk.builtin.func(function(self, callback, delay) {
			Sk.builtin.pyCheckArgs("schedule_unique", 3, 3);
			if(self.callbacks[callback]) {
				clearTimeout(self.callbacks[callback]);
				delete self.callbacks[callback];
			}
			self.callbacks[callback] = setTimeout(function() {
				delete self.callbacks[callback];
				Sk.misceval.callsimAsync(handlers, callback).then(function success(r) {}, function fail(e) {
					window.onerror(e);
				});
			}, Sk.ffi.remapToJs(delay) * 1000);
		});

		$loc.schedule = new Sk.builtin.func(function(self, callback, delay) {
			Sk.builtin.pyCheckArgs("schedule_unique", 3, 3);
			self.callbacks[callback] = setTimeout(function() {
				delete self.callbacks[callback];
				Sk.misceval.callsimAsync(handlers, callback).then(function success(r) {}, function fail(e) {
					window.onerror(e);
				});
			}, Sk.ffi.remapToJs(delay) * 1000);
		});
		
		$loc.schedule_interval = new Sk.builtin.func(function(self, callback, delay) {
			Sk.builtin.pyCheckArgs("schedule_schedule", 3, 3);
			self.callbacks[callback] = setInterval(function() {
				delete self.callbacks[callback];
				Sk.misceval.callsimAsync(handlers, callback).then(function success(r) {}, function fail(e) {
					window.onerror(e);
				});
			}, Sk.ffi.remapToJs(delay) * 1000);
		});
        $loc.unschedule = new Sk.builtin.func(function(self, callback) {
            Sk.builtin.pyCheckArgs("unschedule", arguments, 2, 2);
        
            var id = self.callbacks[callback];
            if (id !== undefined) {
                clearTimeout(id);
                clearInterval(id); // безпечно викликати обидва
                delete self.callbacks[callback];
            }
        });
   

        $loc.each_tick = new Sk.builtin.func(function(self, callback) {
            Sk.builtin.pyCheckArgs("each_tick", arguments, 2, 2);
            // 60 FPS ≈ 0.0167 сек
            scheduleInternal(self, callback, 1/60, true);
        });
    
        $loc.tick = $loc.each_tick;		
	}, 'pgzero.clock', []);


	Sk.globals.clock = Sk.misceval.callsim(Clock);

	var Sound = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self, name) {
			self.name = Sk.ffi.remapToJs(name);
		});

		$loc.play = new Sk.builtin.func(function(self) {
			if(!assets.sounds[self.name]) {
				throw new Sk.builtin.KeyError("No sound found like '" + jsName + "'. Are you sure the sound exists?");
			}
			assets.sounds[self.name].audio.play();
		});
	});

var SoundLoader = Sk.misceval.buildClass(s, function($gbl, $loc) {
    var soundCache = {}; // кеш для уникнення повторного завантаження

    $loc.__getattr__ = new Sk.builtin.func(function(self, name) {
        var soundName = Sk.ffi.remapToJs(name);

        // Перевіряємо, чи вже завантажено
        if (soundCache[soundName]) {
            return soundCache[soundName];
        }

        // Створюємо новий Sound
        var soundObj = Sk.misceval.callsim(Sound, Sk.ffi.remapToPy(soundName));
        soundCache[soundName] = soundObj;
        return soundObj;
    });
}, 'pgzero.loaders.SoundLoader', []);

	var Screen = Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.clear = new Sk.builtin.func(function(self) {
			Sk.builtin.pyCheckArgs("clear", arguments, 1, 1);
			cx.clearRect(0, 0, width, height);
		});
		
		$loc.surface = Sk.misceval.callsim(Surface);

        $loc.blit = new Sk.builtin.func(function(self, image, ccoords) {	
          var coords =	Sk.ffi.remapToJs(ccoords)
          var jsName = Sk.ffi.remapToJs(image);
          if (!loadedAssets[jsName]) {
            var file_name = "/images/" + jsName + ".png";
            return jsfs.read(file_name).then(function(image_data) {
              if (typeof image_data !== 'string' || !image_data.startsWith('data:image/')) {
                throw new Error("Invalid image data for " + jsName);
              }
              var img = new Image();
              img.onload = function() {
                loadedAssets[jsName] = {
                  image: img,
                  name: jsName,
                  width: img.width,
                  height: img.height
                };
                cx.drawImage(img, coords[0], coords[1]);
              };
              img.src = image_data;
              return Sk.builtin.none.none$;
            }).catch(function(err) {
              throw new Sk.builtin.KeyError("Image '" + jsName + "' not found in jsfs or invalid.");
            });
          } else {
            cx.drawImage(loadedAssets[jsName].image, coords[0], coords[1]);
            return Sk.builtin.none.none$;
          }
        });

		$loc.fill = new Sk.builtin.func(function(self, color) {
			Sk.builtin.pyCheckArgs("fill", arguments, 2, 2);

			var rgb = Sk.ffi.remapToJs(color);
			cx.fillStyle = getColor(rgb);
			cx.fillRect(0, 0, width, height);
			
		});

		$loc.draw = Sk.misceval.callsim(SurfacePainter);

        $loc.bounds = new Sk.builtin.func(function(self) {
            // Повертаємо ZRect(0, 0, width, height)
            return Sk.misceval.callsim(Sk.globals.ZRect,
                Sk.ffi.remapToPy(0),
                Sk.ffi.remapToPy(0),
                Sk.ffi.remapToPy(width),
                Sk.ffi.remapToPy(height)
            );
        });		

	}, 'pgzero.screen.Screen', []);

//
// ===== MUSIC SYSTEM =====
var MusicSystem = Sk.misceval.buildClass(s, function($gbl, $loc) {
    var currentAudio = null;
    var queuedTracks = [];
    var isPaused = false;
    var volume = 1.0;
    async function loadTrack(name) {
        const extensions = ['.mp3', '.ogg', '.wav'];    
    
        for (const ext of extensions) {
            const path = 'music/' + name + ext;
            try {
                const type = await jsfs.type(path);
                if (type === 'file') {
                    const dataUrl = await jsfs.read(path);
                    
                    return dataUrl;
                }
            } catch (e) {
                // Файл не знайдено — пробуємо наступне розширення
                continue;
            }
        }
        
        throw new Sk.builtin.Exception("Music file not found: " + name);
    }




    function createAudio(dataUrl) {
        const audio = new Audio(dataUrl);
        audio.volume = volume;
        return audio;
    }

    function onTrackEnd() {
        if (queuedTracks.length > 0) {
            const next = queuedTracks.shift();
            playTrack(next.name, next.once, false);
        } else {
            currentAudio = null;
        }
    }

async function playTrack(name, once = false, stopCurrent = true) {
    if (stopCurrent && currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    try {
        const dataUrl = await loadTrack(name);       
        const audio = createAudio(dataUrl);
        
        if (once) {
            audio.addEventListener('ended', onTrackEnd, { once: true });
        } else {
            audio.loop = true;
        }

        if (isPaused) {
            currentAudio = audio;
        } else {
            try {
                await audio.play(); 
            } catch (e) {
                console.warn("Autoplay blocked:", e);
                PythonIDE.showHint("Звук заблоковано браузером. Натисніть будь-яку кнопку.");
            }
            currentAudio = audio;
        }
    } catch (e) {
        PythonIDE.handleError("Music error: " + String(e));
    }
}

$loc.play = new Sk.builtin.func(function(self, name) {
    Sk.builtin.pyCheckArgs("play", arguments, 2, 2);
    const jsName = Sk.ffi.remapToJs(name);
    playTrack(jsName, false, true);
    return Sk.builtin.none.none$;
});

$loc.play_once = new Sk.builtin.func(function(self, name) {
    Sk.builtin.pyCheckArgs("play_once", arguments, 2, 2);
    const jsName = Sk.ffi.remapToJs(name);
    playTrack(jsName, true, true);
    return Sk.builtin.none.none$;
});

$loc.queue = new Sk.builtin.func(function(self, name) {
    Sk.builtin.pyCheckArgs("queue", arguments, 2, 2);
    const jsName = Sk.ffi.remapToJs(name);
    queuedTracks.push({ name: jsName, once: true });
    return Sk.builtin.none.none$;
});

$loc.fadeout = new Sk.builtin.func(function(self, duration) {
    Sk.builtin.pyCheckArgs("fadeout", arguments, 2, 2);
    const dur = Sk.ffi.remapToJs(duration);
        if (currentAudio) {
            const steps = 50;
            const stepTime = (dur * 1000) / steps;
            const volStep = currentAudio.volume / steps;
            let i = 0;
            const fade = setInterval(() => {
                i++;
                if (i >= steps || !currentAudio) {
                    clearInterval(fade);
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio = null;
                    }
                } else if (currentAudio) {
                    currentAudio.volume = Math.max(0, currentAudio.volume - volStep);
                }
            }, stepTime);
        }
        return Sk.builtin.none.none$;
});

$loc.set_volume = new Sk.builtin.func(function(self, vol) {
    Sk.builtin.pyCheckArgs("set_volume", arguments, 2, 2);
    volume = Math.max(0, Math.min(1, Sk.ffi.remapToJs(vol)));        
        if (currentAudio) {
            currentAudio.volume = volume;
        }
        return Sk.builtin.none.none$;
});

    $loc.stop = new Sk.builtin.func(function(self) {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        queuedTracks = [];
        return Sk.builtin.none.none$;
    });

    $loc.pause = new Sk.builtin.func(function(self) {
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
            isPaused = true;
        }
        return Sk.builtin.none.none$;
    });

    $loc.unpause = new Sk.builtin.func(function(self) {
        if (currentAudio && isPaused) {
            currentAudio.play().catch(e => {
                console.warn("Autoplay blocked on unpause:", e);
            });
            isPaused = false;
        }
        return Sk.builtin.none.none$;
    });

    $loc.is_playing = new Sk.builtin.func(function(self) {
        const playing = currentAudio && !currentAudio.paused && !isPaused;
        return Sk.ffi.remapToPy(playing);
    });

    $loc.get_volume = new Sk.builtin.func(function(self) {
        return Sk.ffi.remapToPy(volume);
    });
}, 'MusicSystem', []);

Sk.globals.music = Sk.misceval.callsim(MusicSystem);

//
var Sound = Sk.misceval.buildClass(s, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self, name) {
        Sk.builtin.pyCheckArgs("__init__", 2, 2);
        self.name = Sk.ffi.remapToJs(name);
        self.audio = null;
        self.isPlaying = false;

        // Завантаження звуку з sounds/<name>.{mp3,ogg,wav}
        const extensions = ['.mp3', '.ogg', '.wav'];
        let dataUrl = null;
        for (const ext of extensions) {
            const path = 'sounds/' + self.name + ext;
            if (jsfs && jsfs.type(path) === 'file') {
                dataUrl = jsfs.read(path);
                break;
            }
        }
        if (!dataUrl) {
            throw new Sk.builtin.Exception("Sound file not found: " + self.name);
        }

        self.audio = new Audio(dataUrl);
        self.audio.preload = 'auto';
    });

    $loc.play = new Sk.builtin.func(function(self, loops) {
        Sk.builtin.pyCheckArgs("play", 1, 2);
        if (!self.audio) return Sk.builtin.none.none$;

        if (self.isPlaying) {
            self.audio.pause();
            self.audio.currentTime = 0;
        }

        let loopCount = (loops === undefined) ? 0 : Sk.ffi.remapToJs(loops);
        self.loopCount = loopCount;
        self.playCount = 0;

        const onEnded = () => {
            if (self.loopCount === -1) {
                self.audio.currentTime = 0;
                self.audio.play().catch(e => console.warn("Autoplay blocked:", e));
            } else if (self.playCount < self.loopCount) {
                self.playCount++;
                self.audio.currentTime = 0;
                self.audio.play().catch(e => console.warn("Autoplay blocked:", e));
            } else {
                self.isPlaying = false;
                self.audio.removeEventListener('ended', onEnded);
            }
        };

        self.audio.addEventListener('ended', onEnded);
        self.isPlaying = true;
        self.audio.play().catch(e => {
            console.warn("Autoplay blocked:", e);
            PythonIDE.showHint("Звук заблоковано браузером. Натисніть будь-яку кнопку.");
        });

        return Sk.builtin.none.none$;
    });

    $loc.stop = new Sk.builtin.func(function(self) {
        if (self.audio && self.isPlaying) {
            self.audio.pause();
            self.audio.currentTime = 0;
            self.isPlaying = false;
        }
        return Sk.builtin.none.none$;
    });

    $loc.get_length = new Sk.builtin.func(function(self) {
        if (!self.audio) return Sk.ffi.remapToPy(0.0);
        return Sk.ffi.remapToPy(self.audio.duration || 0.0);
    });
}, 'Sound', []);	
Sk.globals.sounds = Sk.misceval.callsim(SoundLoader);
//
// === TONE GENERATOR FOR PGZRUN (SKULPT EMULATOR) ===
// pygame zero compatible
// play(), create(), caching, fast replay, envelope, waveforms

var ToneGenerator = Sk.misceval.buildClass(s, function($gbl, $loc) {
    var audioContext = null;
    var activeSources = [];
    
    // Frequency mapping for note names (A0 - C8)
    var noteFreqs = {
        'C': 16.35, 'C#': 17.32, 'Db': 17.32, 'D': 18.35, 'D#': 19.45,
        'Eb': 19.45, 'E': 20.60, 'F': 21.83, 'F#': 23.12, 'Gb': 23.12,
        'G': 24.50, 'G#': 25.96, 'Ab': 25.96, 'A': 27.50, 'A#': 29.14,
        'Bb': 29.14, 'B': 30.87
    };
    
    // Initialize audio context (lazy initialization)
    function getAudioContext() {
        if (!audioContext) {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioContext = new AudioContext();
                
                // Resume context on user interaction (browser requirement)
                document.addEventListener('click', function() {
                    if (audioContext && audioContext.state === 'suspended') {
                        audioContext.resume();
                    }
                }, { once: true });
            }
        }
        return audioContext;
    }
    
    // Parse note string like 'A#4' or 'Bb3'
    function parseNote(noteStr) {
        if (typeof noteStr !== 'string') return noteStr;
        
        var match = noteStr.match(/^([A-G])([#b]?)(\d+)$/);
        if (!match) {
            throw new Sk.builtin.ValueError("Invalid note format: " + noteStr);
        }
        
        var note = match[1];
        var accidental = match[2];
        var octave = parseInt(match[3]);
        
        var noteName = note;
        if (accidental === '#') noteName = note + '#';
        if (accidental === 'b') noteName = note + 'b';
        
        // Adjust for enharmonic equivalents
        if (noteName === 'B#') { noteName = 'C'; octave += 1; }
        if (noteName === 'E#') { noteName = 'F'; }
        if (noteName === 'Fb') { noteName = 'E'; }
        if (noteName === 'Cb') { noteName = 'B'; octave -= 1; }
        
        var baseFreq = noteFreqs[noteName];
        if (!baseFreq) {
            throw new Sk.builtin.ValueError("Invalid note: " + noteStr);
        }
        
        return baseFreq * Math.pow(2, octave);
    }
    
    // Generate tone buffer
function generateToneBuffer(frequency, duration) {
    var ctx = getAudioContext();
    if (!ctx) return null;
    
    var sampleRate = ctx.sampleRate;
    var length = Math.floor(sampleRate * duration);
    var buffer = ctx.createBuffer(1, length, sampleRate);
    var data = buffer.getChannelData(0);
    
    // Параметри envelope (можна налаштувати)
    var attackTime = Math.min(0.01, duration * 0.1);        // швидкий атак
    var decayTime = Math.min(0.05, duration * 0.2);         // короткий decay
    var sustainLevel = 0.8;                                 // високий sustain
    var releaseTime = Math.min(0.3, duration * 0.5);        // довший, м'який release

    for (var i = 0; i < length; i++) {
        var t = i / sampleRate;
        var envelope = 0.0;

        if (t < attackTime) {
            // Лінійний атак (або експоненційний, але лінійний достатній)
            envelope = (t / attackTime);
        } else if (t < attackTime + decayTime) {
            // Decay до sustain рівня
            envelope = 1.0 - (1.0 - sustainLevel) * ((t - attackTime) / decayTime);
        } else if (t < duration - releaseTime) {
            // Sustain
            envelope = sustainLevel;
        } else {
            // ЕКСПОНЕНЦІЙНЕ ЗАТУХАННЯ (release)
            var releaseProgress = (t - (duration - releaseTime)) / releaseTime; // 0 → 1
            // Уникнути log(0) — clamp до [0.001, 1]
            releaseProgress = Math.min(Math.max(releaseProgress, 0), 0.999);
            // Експоненційний спад: envelope = sustainLevel * (1 - releaseProgress)^k
            // Або простіше: використовуємо exp(-a * x)
            var decayFactor = 4.0; // регулює "крутість" затухання
            envelope = sustainLevel * Math.exp(-decayFactor * releaseProgress);
        }
        
        data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
    }
    
    return buffer;
}
    
    // Play tone immediately
    $loc.play = new Sk.builtin.func(function(self, pitch, duration) {
        Sk.builtin.pyCheckArgs("play", arguments, 3, 3);
        
        var frequency = Sk.ffi.remapToJs(pitch);
        var dur = Sk.ffi.remapToJs(duration);
        
        // Convert note string to frequency if needed
        if (typeof frequency === 'string') {
            frequency = parseNote(frequency);
        }
        
        // Validate inputs
        if (typeof frequency !== 'number' || frequency <= 0) {
            throw new Sk.builtin.ValueError("Invalid frequency: " + frequency);
        }
        
        if (typeof dur !== 'number' || dur <= 0) {
            throw new Sk.builtin.ValueError("Invalid duration: " + dur);
        }
        
        var ctx = getAudioContext();
        if (!ctx) {
            console.warn("Web Audio API not supported");
            return Sk.builtin.none.none$;
        }
        
        // Ensure context is running
        if (ctx.state === 'suspended') {
            ctx.resume().catch(function(e) {
                console.warn("Could not resume audio context:", e);
            });
        }
        
        // Generate and play the tone
        var buffer = generateToneBuffer(frequency, dur);
        if (!buffer) {
            return Sk.builtin.none.none$;
        }
        
        var source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        
        // Clean up after playback
        source.onended = function() {
            var index = activeSources.indexOf(source);
            if (index > -1) {
                activeSources.splice(index, 1);
            }
            source.disconnect();
        };
        
        activeSources.push(source);
        
        return Sk.builtin.none.none$;
    });
    
    // Create a ToneSound class for deferred playback
    var ToneSound = Sk.misceval.buildClass(s, function($gbl2, $loc2) {
        $loc2.__init__ = new Sk.builtin.func(function(self, pitch, duration) {
            self.frequency = Sk.ffi.remapToJs(pitch);
            self.duration = Sk.ffi.remapToJs(duration);
            
            // Convert note string to frequency if needed
            if (typeof self.frequency === 'string') {
                self.frequency = parseNote(self.frequency);
            }
        });
        
        $loc2.play = new Sk.builtin.func(function(self) {
            var ctx = getAudioContext();
            if (!ctx) {
                console.warn("Web Audio API not supported");
                return Sk.builtin.none.none$;
            }
            
            // Validate inputs
            if (typeof self.frequency !== 'number' || self.frequency <= 0) {
                throw new Sk.builtin.ValueError("Invalid frequency: " + self.frequency);
            }
            
            if (typeof self.duration !== 'number' || self.duration <= 0) {
                throw new Sk.builtin.ValueError("Invalid duration: " + self.duration);
            }
            
            // Ensure context is running
            if (ctx.state === 'suspended') {
                ctx.resume().catch(function(e) {
                    console.warn("Could not resume audio context:", e);
                });
            }
            
            // Generate and play the tone
            var buffer = generateToneBuffer(self.frequency, self.duration);
            if (!buffer) {
                return Sk.builtin.none.none$;
            }
            
            var source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start();
            
            // Clean up after playback
            source.onended = function() {
                var index = activeSources.indexOf(source);
                if (index > -1) {
                    activeSources.splice(index, 1);
                }
                source.disconnect();
            };
            
            activeSources.push(source);
            
            return Sk.builtin.none.none$;
        });
        
        $loc2.stop = new Sk.builtin.func(function(self) {
            // Note: Web Audio API doesn't have a simple stop for buffer sources
            // once started. This would need more complex implementation.
            return Sk.builtin.none.none$;
        });
        
        $loc2.__repr__ = new Sk.builtin.func(function(self) {
            return new Sk.builtin.str("ToneSound(freq=" + self.frequency + ", duration=" + self.duration + ")");
        });
    }, 'ToneSound', []);
    
    // Create tone for later use
    $loc.create = new Sk.builtin.func(function(self, pitch, duration) {
        Sk.builtin.pyCheckArgs("create", arguments, 3, 3);
        
        return Sk.misceval.callsim(ToneSound, pitch, duration);
    });
    
    // Helper method to get frequency from note
    $loc.note_to_freq = new Sk.builtin.func(function(self, note) {
        Sk.builtin.pyCheckArgs("note_to_freq", arguments, 2, 2);
        
        var noteStr = Sk.ffi.remapToJs(note);
        var freq = parseNote(noteStr);
        return Sk.ffi.remapToPy(freq);
    });
    
    // Stop all active tones
    $loc.stop_all = new Sk.builtin.func(function(self) {
        while (activeSources.length > 0) {
            var source = activeSources.pop();
            try {
                source.stop();
                source.disconnect();
            } catch (e) {
                // Ignore errors if source already stopped
            }
        }
        return Sk.builtin.none.none$;
    });
}, 'ToneGenerator', []);

// Create global tone object
Sk.globals.tone = Sk.misceval.callsim(ToneGenerator);
//
	s.go = new Sk.builtin.func(function() {
        console.log("Go");
		// create globals
		Sk.globals.screen = Sk.misceval.callsim(Screen);
		
		width = 800;
		if(Sk.globals.WIDTH) {
			width = Sk.ffi.remapToJs(Sk.globals.WIDTH);
		}
		
		height = 600;
		if(Sk.globals.HEIGHT) {
			height = Sk.ffi.remapToJs(Sk.globals.HEIGHT);
			console.log("Height:",height);
		}
       
		if(Sk.globals.TITLE) {
			var title = Sk.ffi.remapToJs(Sk.globals.TITLE);
			document.getElementById('gameTitle').innerHTML = title;
		}
        if(Sk.globals.ASSETS) {
			//width = Sk.ffi.remapToJs(Sk.globals.WIDTH);
            assets.images["missile"] = {
                src:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAABgCAYAAAAKGMITAAAABmJLR0QAaACfADiOTMCgAAAFXklEQVRo3u3aa2xTVRwA8P+5d0k3xp6sLI5MxlCD2WIK+OCD4zUHOMZAh9EQiTExGP1ofMVP8oXEGPnkBzXBiAajYQEiASNBExGChDdso+vG+hxru3bt7uPc9zl+4BHX9q637W2Jsefbveec++v/f3tOz72nAHmWy++8tCvw2Qe78u3P5NNJCXhYORb/RA36P6aUonyuwebTaSfDbRRGzr+/QIg2q4J0Zv+J370liVgMTOyhugSgiSC7b75dklQPffh6vRr1bbt/rIc82yIH99cXHRbjs7uJlKi6f0wS/irJO7G76LA6PTWQek6f9A0UFR759N0WnZvuSj1vzIS7Yse+aykaLERifQTH0/qQhI/hz5/pLhqsxSObzeqoqu4oChw+/BWr84l1ZvXGTGQdvnWJtR2Oj3qeMxKBRWb1+pR7EX/14hrbYX506GlKdPMGugR4+Npq22FtJrIqWxsjNrXK/i9XRWWXham/y1bYve+9OkPi27NGnIwsjR05UGMbTAjtMBK+7O2m3SzRaadtMD8+ugwQY+lyeOR6u22wJvDLrd47Yyb2mG0w5aPLrMIUJ9tsg1HdI0ssf/sdtUtsg42Y12k5Yj7qtAUOH/+BYRqWtlqG2arFePQaUzCcvHAaURyzvLRhKthmxedGBcPYPwYEJy3fYiLEQbk9XHiqpXAIiIotw1RMgOJzZ5+BszWQBRkoYSF9AkFAGQcAzM2qoWCQJjyFw9888xYApRnGGILlbSZDFgHA4J7CYAIAFKEMLgKC8np6sQYzLAvUJCiGYUwDzjopZWtwLKCyAKCkPmchAOisZzJdwAAAR3tthVFQxMgkneheXb7JZuAhlTJchstwGS7D/0+Y/rcjDv19qgUgpze0TNBzq6Vg+E4o1E+p9cxQShlvMNRf+JMEx7+YaxoTnLClIPjg0ZPVWJY35ApjWdlwachTnTd82xdcK8rKglxhUZKrR73+tXnDMxzXn+94is/O39cUPnXuAiMr6pZ8h4skK5t9kxEmZ/jmrfEODktt+cKcKC0bHpvoyBkORaJ9hJC8JwiDEAiGo305wwLGmwudnTgRb8oJ/vGX35plVXu+UFhW1K5LQ+5my/CVYfd6SVHZQmGsqOw19/h6y7CkKDvApiJgabsl+NyVGw4sKy/YBWNZ6QmGo46s8PE/zroESW6yL2K56czF666ssKaqOymldrlAKAVOEAfmhbGqoyQv2Jbmf00mPam7rnPgrw8dbpVV1WU3jGXFdercxVZTeCo6vVXRdNuXOYqmQWAqstUUnhXErcVaY3ECzgx/f/TXSlXVuosFy6rWfeHGSGUa7PH6unlJriwWzGOpctw/2Z0Gc4LYV+wl7cws15cGY1npLTYsyWrvHPiLA4dcHJZaiw3Pirj15J/nXQ/gwJ1wDyEEFRs2CEHeyXDPA1jT9QEoUVG1uxbz7eDxpiQvukoFJwXRdfbyjSbGM+HfpOq6o1SwomqOMX+oh8Gy3A8lLrwobWeSgrix5DCWNjJYVpwPAXaW34GU4TJsW6mw1CrDOpuiu+dp+lsfe2BKCHj/OpFhfwkBaXGmnaeUWsItRUwJAUjb+KImEVtPtWGhHZsaBULoXmQZPpCFa1YggHl/Epsb6xm3Z+xqghc65iYaINrWlpaJxtqFw82NdSvD8eS87zEsLXc++vzLV28H7/yUGnHq/jFCACvaWl97Y8eWn20ZTiuWtw/W11SPZGvXULNwpPPx9kHbxvGbL/caDbU1e9E8G9UIIXA21O1d3fGEYesE8uzKp47ULqgy/btD/cLq4TWuziO2z1yvbFqvL17UsM+svsXZuO/J9kctP2r+A3UXdUdhId83AAAAAElFTkSuQmCC',
                width: 30,
                height: 96
		    }
            
        }


		console.log("Canvas: ", width,height)
        let canvas = document.getElementById('gameCanvas');
		console.log("canvas: ", canvas)
const modalContainer = document.querySelector('#gameModal > div'); // внутрішній контейнер

if (modalContainer && document.getElementById('gameCanvas')) {
    // Встановлюємо розміри контейнера (заголовок + canvas)
    modalContainer.style.width = width + 'px';
    modalContainer.style.height = (height+30) + 'px';
}
    // Встановлюємо фактичні розміри canvas (буфер)
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
// -----------------------	   
               
		document.activeElement.blur();

	    var jqCanvas = $('#gameCanvas');    
	    canvas = jqCanvas[0];
	    cx = canvas.getContext("2d");
		document.addEventListener('contextmenu', event => event.preventDefault());
		var lastUpdate = new Date().getTime()
	    function update() {
	    	var tasks = [];
            // process animations
            for (var id in animations) {
                var a = animations[id];
                var now = Date.now();
                var elapsed = now - a.startTime;
                var progress = elapsed / a.duration;
            
                if (progress >= 1) {
                    progress = 1;
                    // Встановити кінцеві значення
                    for (var key in a.targets) {
                        updateActorAttribute(a.object, Sk.ffi.remapToPy(key), Sk.ffi.remapToPy(a.targets[key].end));
                    }
                    // Виклик on_finished
                    
if (a.onFinished) {
    // Запускаємо колбек у наступному фреймі
    setTimeout(function() {
        Sk.misceval.asyncToPromise(() => Sk.misceval.callsim(a.onFinished))
            .catch(window.onerror);
    }, 0);
}
                    // Видалити анімацію
                    for (var key in a.targets) {
                        delete animations[a.object.id + "_" + key];
                    }
                    continue;
                }
            
                // Інтерполяція через easing
                var eased = a.tween(progress);
                for (var key in a.targets) {
                    var t = a.targets[key];
                    var newVal = t.start + (t.end - t.start) * eased;
                    updateActorAttribute(a.object, Sk.ffi.remapToPy(key), Sk.ffi.remapToPy(newVal));
                }
            }
			

if (Sk.globals.update !== undefined) {
  if (Sk.globals.update.func_code.co_argcount > 0) {
    var newTime = new Date().getTime();
    var dt = (newTime - lastUpdate) / 1000;
    lastUpdate = new Date().getTime();
    tasks.push(Sk.misceval.callsimAsync(handlers, Sk.globals.update, new Sk.ffi.remapToPy(dt)));
  } else {
    tasks.push(Sk.misceval.callsimAsync(handlers, Sk.globals.update));
  }
}

	    	if(Sk.globals.draw) {
	    		//Sk.misceval.callsim(Sk.globals.draw);
	    		tasks.push(Sk.misceval.callsimAsync(handlers, Sk.globals.draw));
	    	}

			var p = Promise.all(tasks).then(function() {
				window.requestAnimationFrame(update);	
				//update();
			}, function(e) {
				PythonIDE.handleError(e);
			}).catch(function(e) {
				PythonIDE.handleError(e);
			}); 
			return p;
			

	    	
	    }

	    // add event handlers
	    if(Sk.globals.on_mouse_down) {
    		jqCanvas.on('mousedown', function(e) {	
				var arg =[0,0];			
				var mouseButton = 0;
				if (e.buttons === 1) {mouseButton= Sk.globals.mouse.LEFT}
				if (e.buttons === 4) {mouseButton= Sk.globals.mouse.MIDDLE}
				if (e.buttons === 2) {mouseButton= Sk.globals.mouse.RIGHT}
				var params = Sk.globals.on_mouse_down.func_code.co_varnames;
				
				function getParams() {
					if (params.indexOf('pos')>-1) {
						arg[params.indexOf('pos')] = pos;
					}
					if (params.indexOf('button')>-1) {
						arg[params.indexOf('button')] = mouseButton;
					}
				}
				
				if (!params) { params =[]; }				
    			var pos = new Sk.builtin.tuple([Math.round(e.offsetX), Math.round(e.offsetY)]);
    			
    			if (params.length === 2) {
					getParams();
					Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_down, arg[0], arg[1]);
				} else
				if (params.length === 1) {
					getParams();
					Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_down, arg[0]);
				} else {
							Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_down); //no param
						}
    			
    		});
    	}
    	
    	if(Sk.globals.on_mouse_up) {
    		jqCanvas.on('mouseup', function(e) {	
				var arg =[0,0];				
				var mouseButton = 1;				
				var params = Sk.globals.on_mouse_up.func_code.co_varnames;
				
				function getParams() {
					if (params.indexOf('pos')>-1) {
						arg[params.indexOf('pos')] = pos;
					}
					if (params.indexOf('button')>-1) {
						arg[params.indexOf('button')] = mouseButton;
					}
				}
				
				if (!params) { params =[]; }				
    			var pos = new Sk.builtin.tuple([Math.round(e.offsetX), Math.round(e.offsetY)]);
    			
    			if (params.length === 2) {
					getParams();
					Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_up, arg[0], arg[1]);
				} else
				if (params.length === 1) {
					getParams();
					Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_up, arg[0]);
				} else {
							Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_up); //no param
						}
    			
    		});
    	}

    	if(Sk.globals.on_mouse_move) {
			var px = -1;
			var py;
    		jqCanvas.on('mousemove', function(e) {
				var mouseButton = 0;
				if (e.buttons === 1) {mouseButton= Sk.globals.mouse.LEFT}
				if (e.buttons === 4) {mouseButton= Sk.globals.mouse.MIDDLE}
				if (e.buttons === 2) {mouseButton= Sk.globals.mouse.RIGHT}
				
				var arg =[0,0,0];
				var params = Sk.globals.on_mouse_move.func_code.co_varnames;
				
				function getParams() {
					if (params.indexOf('pos')>-1) {
						arg[params.indexOf('pos')] = pos;
					}
					if (params.indexOf('rel')>-1) {
						arg[params.indexOf('rel')] = rel;
					}
					if (params.indexOf('buttons')>-1) {
						arg[params.indexOf('buttons')] = mouseButton;
					}
				}	

    			var pos = new Sk.builtin.tuple([Math.round(e.offsetX), Math.round(e.offsetY)]);

    			if (px<0) {
					px =pos.v[0];
					px =pos.v[1];
				}
					    			
    			var rel = new Sk.builtin.tuple([pos.v[0]-px, pos.v[1]-py]);
    			px =pos.v[0];
    			py =pos.v[1];				
				
				if (!params) { params =[]; }				

    			if (params.length === 3) {				
					getParams();
					Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_move, arg[0], arg[1], arg[2]);					
				} else
				if (params.length === 2) {
					getParams();
					Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_move, arg[0], arg[1]);
				} else
				if (params.length === 1) {
					getParams();
					Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_move, arg[0]);
				} else {		
    			 Sk.misceval.callsimAsync(handlers, Sk.globals.on_mouse_move);
    			} 
    			
    		});	
    	}


	    Sk.globals.sounds = Sk.misceval.callsim(SoundLoader);
	    
    	// wait for assets to load
    	Promise.all(promises).then(function() {
    		update();
    	}, function(e) {
    		PythonIDE.handleError(e);
    	}).catch(PythonIDE.handleError);	
    	

    	PythonIDE.keyHandlers.push(function(e) {
    		var key = e.key.replace("Arrow", "").toLowerCase();
    		switch(key) {
    			case " ":
    				key = "space";
    			break;
    			case "enter":
    				key = "return";
    			break;
    		}
		
    		if(e.type == "keydown") {
    			keysPressed[key] = true;
    			if(Sk.globals.on_key_down) {
					var pyKey = Sk.misceval.callsim(EnumValue, "keys", key.toUpperCase(), e.keyCode);
    				if(Sk.globals.on_key_down.func_code.length > 0) {
	    				Sk.misceval.callsimAsync(handlers, Sk.globals.on_key_down, pyKey).then(function success(r) {}, function fail(e) {
							window.onerror(e);
						});
	    			} else {
	    				Sk.misceval.callsimAsync(handlers, Sk.globals.on_key_down).then(function success(r) {}, function fail(e) {
							window.onerror(e);
						});
	    			}
    				
    			}
    		}
    		if(e.type == "keyup") {
    			keysPressed[key] = false;	
    		}
    	});
	
    	

	    return PythonIDE.runAsync(function(resolve, reject) {
	    });
		
	});

	function loadAssets() {
		
		return promises;
	}

	// load assets
    if(assets) {

    	// load sounds
    	if(assets.sounds) {
    		for(var name in assets.sounds) {
    			promises.push(new Promise(function(resolve, reject) {
    				assets.sounds[name].pySound = Sk.misceval.callsim(Sound, Sk.ffi.remapToPy(name));
    				assets.sounds[name].audio = new Audio(assets.sounds[name].src);
    				assets.sounds[name].audio.oncanplaythrough = function() {
    					resolve();	
    				}
    				assets.sounds[name].audio.label = name;
    				assets.sounds[name].audio.onerror = function(e) {
    					PythonIDE.handleError("Could not load sound: " + e.currentTarget.label);
    				}
    				assets.sounds[name].audio.load();
    			}));
    		}
    	}

    	// load images
    	if(assets.images) {
			
		    for(var name in assets.images) {
	    		promises.push(new Promise(function(resolve, reject) {
					var img = new Image;
    				img.name = name;
    				img.addEventListener("load", function(e) {
    					var a = assets.images[img.name];
    					if(!a.width) {
    						a.width = img.width * (a.height / img.height);
    					}
    					if(!a.width) {
    						a.width = img.width;
    					}
    					if(!a.height) {
    						a.height = img.height * (a.width / img.width);
    					}
    					if(!a.height) {
    						a.height = img.height;
    					}
    					loadedAssets[img.name] = {
			    			image: img,
			    			name: img.name,
			    			type: "image",
			    			width: a.width,
			    			height: a.height
			    		};
    					resolve(img.img);
    					
    				}, false);
    				img.addEventListener("error", function(e) {
    					throw new Sk.builtin.Exception("Could not load image " + img.name + ". Images can only be loaded from servers that have enabled CORS - try a different URL");
    					reject("Could not load image " + img.name);
    				});
    				img.src = assets.images[img.name].src;
				}));
	    	}
	    }
    }
    return s;
	
};
