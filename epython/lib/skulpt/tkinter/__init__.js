// Tkinter module for Skulpt. Pete Dring, 2015-2018, Gr.Gromko, 2020-2024
var $builtinmodule = function(name) {
	// clear all previous frames
	$('.tkinter').remove();
    // adapted from https://www.tcl.tk/man/tcl8.4/TkCmd/colors.htm
    var tk_colors={"alice blue":"rgb(240,248,255)",AliceBlue:"rgb(240,248,255)","antique white":"rgb(250,235,215)",AntiqueWhite:"rgb(250,235,215)",AntiqueWhite1:"rgb(255,239,219)",AntiqueWhite2:"rgb(238,223,204)",AntiqueWhite3:"rgb(205,192,176)",AntiqueWhite4:"rgb(139,131,120)",aquamarine:"rgb(127,255,212)",aquamarine1:"rgb(127,255,212)",aquamarine2:"rgb(118,238,198)",aquamarine3:"rgb(102,205,170)",aquamarine4:"rgb(69,139,116)",azure:"rgb(240,255,255)",azure1:"rgb(240,255,255)",azure2:"rgb(224,238,238)",azure3:"rgb(193,205,205)",azure4:"rgb(131,139,139)",beige:"rgb(245,245,220)",bisque:"rgb(255,228,196)",bisque1:"rgb(255,228,196)",bisque2:"rgb(238,213,183)",bisque3:"rgb(205,183,158)",bisque4:"rgb(139,125,107)",black:"rgb(0,0,0)","blanched almond":"rgb(255,235,205)",BlanchedAlmond:"rgb(255,235,205)",blue:"rgb(0,0,255)","blue violet":"rgb(138,43,226)",blue1:"rgb(0,0,255)",blue2:"rgb(0,0,238)",blue3:"rgb(0,0,205)",blue4:"rgb(0,0,139)",BlueViolet:"rgb(138,43,226)",brown:"rgb(165,42,42)",brown1:"rgb(255,64,64)",brown2:"rgb(238,59,59)",brown3:"rgb(205,51,51)",brown4:"rgb(139,35,35)",burlywood:"rgb(222,184,135)",burlywood1:"rgb(255,211,155)",burlywood2:"rgb(238,197,145)",burlywood3:"rgb(205,170,125)",burlywood4:"rgb(139,115,85)","cadet blue":"rgb(95,158,160)",CadetBlue:"rgb(95,158,160)",CadetBlue1:"rgb(152,245,255)",CadetBlue2:"rgb(142,229,238)",CadetBlue3:"rgb(122,197,205)",CadetBlue4:"rgb(83,134,139)",chartreuse:"rgb(127,255,0)",chartreuse1:"rgb(127,255,0)",chartreuse2:"rgb(118,238,0)",chartreuse3:"rgb(102,205,0)",chartreuse4:"rgb(69,139,0)",chocolate:"rgb(210,105,30)",chocolate1:"rgb(255,127,36)",chocolate2:"rgb(238,118,33)",chocolate3:"rgb(205,102,29)",chocolate4:"rgb(139,69,19)",coral:"rgb(255,127,80)",coral1:"rgb(255,114,86)",coral2:"rgb(238,106,80)",coral3:"rgb(205,91,69)",coral4:"rgb(139,62,47)","cornflower blue":"rgb(100,149,237)",CornflowerBlue:"rgb(100,149,237)",cornsilk:"rgb(255,248,220)",cornsilk1:"rgb(255,248,220)",cornsilk2:"rgb(238,232,205)",cornsilk3:"rgb(205,200,177)",cornsilk4:"rgb(139,136,120)",cyan:"rgb(0,255,255)",cyan1:"rgb(0,255,255)",cyan2:"rgb(0,238,238)",cyan3:"rgb(0,205,205)",cyan4:"rgb(0,139,139)","dark blue":"rgb(0,0,139)","dark cyan":"rgb(0,139,139)","dark goldenrod":"rgb(184,134,11)","dark gray":"rgb(169,169,169)","dark green":"rgb(0,100,0)","dark grey":"rgb(169,169,169)","dark khaki":"rgb(189,183,107)","dark magenta":"rgb(139,0,139)","dark olive green":"rgb(85,107,47)","dark orange":"rgb(255,140,0)","dark orchid":"rgb(153,50,204)","dark red":"rgb(139,0,0)","dark salmon":"rgb(233,150,122)","dark sea green":"rgb(143,188,143)","dark slate blue":"rgb(72,61,139)","dark slate gray":"rgb(47,79,79)","dark slate grey":"rgb(47,79,79)","dark turquoise":"rgb(0,206,209)","dark violet":"rgb(148,0,211)",DarkBlue:"rgb(0,0,139)",DarkCyan:"rgb(0,139,139)",DarkGoldenrod:"rgb(184,134,11)",DarkGoldenrod1:"rgb(255,185,15)",DarkGoldenrod2:"rgb(238,173,14)",DarkGoldenrod3:"rgb(205,149,12)",DarkGoldenrod4:"rgb(139,101,8)",DarkGray:"rgb(169,169,169)",DarkGreen:"rgb(0,100,0)",DarkGrey:"rgb(169,169,169)",DarkKhaki:"rgb(189,183,107)",DarkMagenta:"rgb(139,0,139)",DarkOliveGreen:"rgb(85,107,47)",DarkOliveGreen1:"rgb(202,255,112)",DarkOliveGreen2:"rgb(188,238,104)",DarkOliveGreen3:"rgb(162,205,90)",DarkOliveGreen4:"rgb(110,139,61)",DarkOrange:"rgb(255,140,0)",DarkOrange1:"rgb(255,127,0)",DarkOrange2:"rgb(238,118,0)",DarkOrange3:"rgb(205,102,0)",DarkOrange4:"rgb(139,69,0)",DarkOrchid:"rgb(153,50,204)",DarkOrchid1:"rgb(191,62,255)",DarkOrchid2:"rgb(178,58,238)",DarkOrchid3:"rgb(154,50,205)",DarkOrchid4:"rgb(104,34,139)",DarkRed:"rgb(139,0,0)",DarkSalmon:"rgb(233,150,122)",DarkSeaGreen:"rgb(143,188,143)",DarkSeaGreen1:"rgb(193,255,193)",DarkSeaGreen2:"rgb(180,238,180)",DarkSeaGreen3:"rgb(155,205,155)",DarkSeaGreen4:"rgb(105,139,105)",DarkSlateBlue:"rgb(72,61,139)",DarkSlateGray:"rgb(47,79,79)",DarkSlateGray1:"rgb(151,255,255)",DarkSlateGray2:"rgb(141,238,238)",DarkSlateGray3:"rgb(121,205,205)",DarkSlateGray4:"rgb(82,139,139)",DarkSlateGrey:"rgb(47,79,79)",DarkTurquoise:"rgb(0,206,209)",DarkViolet:"rgb(148,0,211)","deep pink":"rgb(255,20,147)","deep sky blue":"rgb(0,191,255)",DeepPink:"rgb(255,20,147)",DeepPink1:"rgb(255,20,147)",DeepPink2:"rgb(238,18,137)",DeepPink3:"rgb(205,16,118)",DeepPink4:"rgb(139,10,80)",DeepSkyBlue:"rgb(0,191,255)",DeepSkyBlue1:"rgb(0,191,255)",DeepSkyBlue2:"rgb(0,178,238)",DeepSkyBlue3:"rgb(0,154,205)",DeepSkyBlue4:"rgb(0,104,139)","dim gray":"rgb(105,105,105)","dim grey":"rgb(105,105,105)",DimGray:"rgb(105,105,105)",DimGrey:"rgb(105,105,105)","dodger blue":"rgb(30,144,255)",DodgerBlue:"rgb(30,144,255)",DodgerBlue1:"rgb(30,144,255)",DodgerBlue2:"rgb(28,134,238)",DodgerBlue3:"rgb(24,116,205)",DodgerBlue4:"rgb(16,78,139)",firebrick:"rgb(178,34,34)",firebrick1:"rgb(255,48,48)",firebrick2:"rgb(238,44,44)",firebrick3:"rgb(205,38,38)",firebrick4:"rgb(139,26,26)","floral white":"rgb(255,250,240)",FloralWhite:"rgb(255,250,240)","forest green":"rgb(34,139,34)",ForestGreen:"rgb(34,139,34)",gainsboro:"rgb(220,220,220)","ghost white":"rgb(248,248,255)",GhostWhite:"rgb(248,248,255)",gold:"rgb(255,215,0)",gold1:"rgb(255,215,0)",gold2:"rgb(238,201,0)",gold3:"rgb(205,173,0)",gold4:"rgb(139,117,0)",goldenrod:"rgb(218,165,32)",goldenrod1:"rgb(255,193,37)",goldenrod2:"rgb(238,180,34)",goldenrod3:"rgb(205,155,29)",goldenrod4:"rgb(139,105,20)",gray:"rgb(190,190,190)",gray0:"rgb(0,0,0)",gray1:"rgb(3,3,3)",gray2:"rgb(5,5,5)",gray3:"rgb(8,8,8)",gray4:"rgb(10,10,10)",gray5:"rgb(13,13,13)",gray6:"rgb(15,15,15)",gray7:"rgb(18,18,18)",gray8:"rgb(20,20,20)",gray9:"rgb(23,23,23)",gray10:"rgb(26,26,26)",gray11:"rgb(28,28,28)",gray12:"rgb(31,31,31)",gray13:"rgb(33,33,33)",gray14:"rgb(36,36,36)",gray15:"rgb(38,38,38)",gray16:"rgb(41,41,41)",gray17:"rgb(43,43,43)",gray18:"rgb(46,46,46)",gray19:"rgb(48,48,48)",gray20:"rgb(51,51,51)",gray21:"rgb(54,54,54)",gray22:"rgb(56,56,56)",gray23:"rgb(59,59,59)",gray24:"rgb(61,61,61)",gray25:"rgb(64,64,64)",gray26:"rgb(66,66,66)",gray27:"rgb(69,69,69)",gray28:"rgb(71,71,71)",gray29:"rgb(74,74,74)",gray30:"rgb(77,77,77)",gray31:"rgb(79,79,79)",gray32:"rgb(82,82,82)",gray33:"rgb(84,84,84)",gray34:"rgb(87,87,87)",gray35:"rgb(89,89,89)",gray36:"rgb(92,92,92)",gray37:"rgb(94,94,94)",gray38:"rgb(97,97,97)",gray39:"rgb(99,99,99)",gray40:"rgb(102,102,102)",gray41:"rgb(105,105,105)",gray42:"rgb(107,107,107)",gray43:"rgb(110,110,110)",gray44:"rgb(112,112,112)",gray45:"rgb(115,115,115)",gray46:"rgb(117,117,117)",gray47:"rgb(120,120,120)",gray48:"rgb(122,122,122)",gray49:"rgb(125,125,125)",gray50:"rgb(127,127,127)",gray51:"rgb(130,130,130)",gray52:"rgb(133,133,133)",gray53:"rgb(135,135,135)",gray54:"rgb(138,138,138)",gray55:"rgb(140,140,140)",gray56:"rgb(143,143,143)",gray57:"rgb(145,145,145)",gray58:"rgb(148,148,148)",gray59:"rgb(150,150,150)",gray60:"rgb(153,153,153)",gray61:"rgb(156,156,156)",gray62:"rgb(158,158,158)",gray63:"rgb(161,161,161)",gray64:"rgb(163,163,163)",gray65:"rgb(166,166,166)",gray66:"rgb(168,168,168)",gray67:"rgb(171,171,171)",gray68:"rgb(173,173,173)",gray69:"rgb(176,176,176)",gray70:"rgb(179,179,179)",gray71:"rgb(181,181,181)",gray72:"rgb(184,184,184)",gray73:"rgb(186,186,186)",gray74:"rgb(189,189,189)",gray75:"rgb(191,191,191)",gray76:"rgb(194,194,194)",gray77:"rgb(196,196,196)",gray78:"rgb(199,199,199)",gray79:"rgb(201,201,201)",gray80:"rgb(204,204,204)",gray81:"rgb(207,207,207)",gray82:"rgb(209,209,209)",gray83:"rgb(212,212,212)",gray84:"rgb(214,214,214)",gray85:"rgb(217,217,217)",gray86:"rgb(219,219,219)",gray87:"rgb(222,222,222)",gray88:"rgb(224,224,224)",gray89:"rgb(227,227,227)",gray90:"rgb(229,229,229)",gray91:"rgb(232,232,232)",gray92:"rgb(235,235,235)",gray93:"rgb(237,237,237)",gray94:"rgb(240,240,240)",gray95:"rgb(242,242,242)",gray96:"rgb(245,245,245)",gray97:"rgb(247,247,247)",gray98:"rgb(250,250,250)",gray99:"rgb(252,252,252)",gray100:"rgb(255,255,255)",green:"rgb(0,255,0)","green yellow":"rgb(173,255,47)",green1:"rgb(0,255,0)",green2:"rgb(0,238,0)",green3:"rgb(0,205,0)",green4:"rgb(0,139,0)",GreenYellow:"rgb(173,255,47)",grey:"rgb(190,190,190)",grey0:"rgb(0,0,0)",grey1:"rgb(3,3,3)",grey2:"rgb(5,5,5)",grey3:"rgb(8,8,8)",grey4:"rgb(10,10,10)",grey5:"rgb(13,13,13)",grey6:"rgb(15,15,15)",grey7:"rgb(18,18,18)",grey8:"rgb(20,20,20)",grey9:"rgb(23,23,23)",grey10:"rgb(26,26,26)",grey11:"rgb(28,28,28)",grey12:"rgb(31,31,31)",grey13:"rgb(33,33,33)",grey14:"rgb(36,36,36)",grey15:"rgb(38,38,38)",grey16:"rgb(41,41,41)",grey17:"rgb(43,43,43)",grey18:"rgb(46,46,46)",grey19:"rgb(48,48,48)",grey20:"rgb(51,51,51)",grey21:"rgb(54,54,54)",grey22:"rgb(56,56,56)",grey23:"rgb(59,59,59)",grey24:"rgb(61,61,61)",grey25:"rgb(64,64,64)",grey26:"rgb(66,66,66)",grey27:"rgb(69,69,69)",grey28:"rgb(71,71,71)",grey29:"rgb(74,74,74)",grey30:"rgb(77,77,77)",grey31:"rgb(79,79,79)",grey32:"rgb(82,82,82)",grey33:"rgb(84,84,84)",grey34:"rgb(87,87,87)",grey35:"rgb(89,89,89)",grey36:"rgb(92,92,92)",grey37:"rgb(94,94,94)",grey38:"rgb(97,97,97)",grey39:"rgb(99,99,99)",grey40:"rgb(102,102,102)",grey41:"rgb(105,105,105)",grey42:"rgb(107,107,107)",grey43:"rgb(110,110,110)",grey44:"rgb(112,112,112)",grey45:"rgb(115,115,115)",grey46:"rgb(117,117,117)",grey47:"rgb(120,120,120)",grey48:"rgb(122,122,122)",grey49:"rgb(125,125,125)",grey50:"rgb(127,127,127)",grey51:"rgb(130,130,130)",grey52:"rgb(133,133,133)",grey53:"rgb(135,135,135)",grey54:"rgb(138,138,138)",grey55:"rgb(140,140,140)",grey56:"rgb(143,143,143)",grey57:"rgb(145,145,145)",grey58:"rgb(148,148,148)",grey59:"rgb(150,150,150)",grey60:"rgb(153,153,153)",grey61:"rgb(156,156,156)",grey62:"rgb(158,158,158)",grey63:"rgb(161,161,161)",grey64:"rgb(163,163,163)",grey65:"rgb(166,166,166)",grey66:"rgb(168,168,168)",grey67:"rgb(171,171,171)",grey68:"rgb(173,173,173)",grey69:"rgb(176,176,176)",grey70:"rgb(179,179,179)",grey71:"rgb(181,181,181)",grey72:"rgb(184,184,184)",grey73:"rgb(186,186,186)",grey74:"rgb(189,189,189)",grey75:"rgb(191,191,191)",grey76:"rgb(194,194,194)",grey77:"rgb(196,196,196)",grey78:"rgb(199,199,199)",grey79:"rgb(201,201,201)",grey80:"rgb(204,204,204)",grey81:"rgb(207,207,207)",grey82:"rgb(209,209,209)",grey83:"rgb(212,212,212)",grey84:"rgb(214,214,214)",grey85:"rgb(217,217,217)",grey86:"rgb(219,219,219)",grey87:"rgb(222,222,222)",grey88:"rgb(224,224,224)",grey89:"rgb(227,227,227)",grey90:"rgb(229,229,229)",grey91:"rgb(232,232,232)",grey92:"rgb(235,235,235)",grey93:"rgb(237,237,237)",grey94:"rgb(240,240,240)",grey95:"rgb(242,242,242)",grey96:"rgb(245,245,245)",grey97:"rgb(247,247,247)",grey98:"rgb(250,250,250)",grey99:"rgb(252,252,252)",grey100:"rgb(255,255,255)",honeydew:"rgb(240,255,240)",honeydew1:"rgb(240,255,240)",honeydew2:"rgb(224,238,224)",honeydew3:"rgb(193,205,193)",honeydew4:"rgb(131,139,131)","hot pink":"rgb(255,105,180)",HotPink:"rgb(255,105,180)",HotPink1:"rgb(255,110,180)",HotPink2:"rgb(238,106,167)",HotPink3:"rgb(205,96,144)",HotPink4:"rgb(139,58,98)","indian red":"rgb(205,92,92)",IndianRed:"rgb(205,92,92)",IndianRed1:"rgb(255,106,106)",IndianRed2:"rgb(238,99,99)",IndianRed3:"rgb(205,85,85)",IndianRed4:"rgb(139,58,58)",ivory:"rgb(255,255,240)",ivory1:"rgb(255,255,240)",ivory2:"rgb(238,238,224)",ivory3:"rgb(205,205,193)",ivory4:"rgb(139,139,131)",khaki:"rgb(240,230,140)",khaki1:"rgb(255,246,143)",khaki2:"rgb(238,230,133)",khaki3:"rgb(205,198,115)",khaki4:"rgb(139,134,78)",lavender:"rgb(230,230,250)","lavender blush":"rgb(255,240,245)",LavenderBlush:"rgb(255,240,245)",LavenderBlush1:"rgb(255,240,245)",LavenderBlush2:"rgb(238,224,229)",LavenderBlush3:"rgb(205,193,197)",LavenderBlush4:"rgb(139,131,134)","lawn green":"rgb(124,252,0)",LawnGreen:"rgb(124,252,0)","lemon chiffon":"rgb(255,250,205)",LemonChiffon:"rgb(255,250,205)",LemonChiffon1:"rgb(255,250,205)",LemonChiffon2:"rgb(238,233,191)",LemonChiffon3:"rgb(205,201,165)",LemonChiffon4:"rgb(139,137,112)","light blue":"rgb(173,216,230)","light coral":"rgb(240,128,128)","light cyan":"rgb(224,255,255)","light goldenrod":"rgb(238,221,130)","light goldenrod yellow":"rgb(250,250,210)","light gray":"rgb(211,211,211)","light green":"rgb(144,238,144)","light grey":"rgb(211,211,211)","light pink":"rgb(255,182,193)","light salmon":"rgb(255,160,122)","light sea green":"rgb(32,178,170)","light sky blue":"rgb(135,206,250)","light slate blue":"rgb(132,112,255)","light slate gray":"rgb(119,136,153)","light slate grey":"rgb(119,136,153)","light steel blue":"rgb(176,196,222)","light yellow":"rgb(255,255,224)",LightBlue:"rgb(173,216,230)",LightBlue1:"rgb(191,239,255)",LightBlue2:"rgb(178,223,238)",LightBlue3:"rgb(154,192,205)",LightBlue4:"rgb(104,131,139)",LightCoral:"rgb(240,128,128)",LightCyan:"rgb(224,255,255)",LightCyan1:"rgb(224,255,255)",LightCyan2:"rgb(209,238,238)",LightCyan3:"rgb(180,205,205)",LightCyan4:"rgb(122,139,139)",LightGoldenrod:"rgb(238,221,130)",LightGoldenrod1:"rgb(255,236,139)",LightGoldenrod2:"rgb(238,220,130)",LightGoldenrod3:"rgb(205,190,112)",LightGoldenrod4:"rgb(139,129,76)",LightGoldenrodYellow:"rgb(250,250,210)",LightGray:"rgb(211,211,211)",LightGreen:"rgb(144,238,144)",LightGrey:"rgb(211,211,211)",LightPink:"rgb(255,182,193)",LightPink1:"rgb(255,174,185)",LightPink2:"rgb(238,162,173)",LightPink3:"rgb(205,140,149)",LightPink4:"rgb(139,95,101)",LightSalmon:"rgb(255,160,122)",LightSalmon1:"rgb(255,160,122)",LightSalmon2:"rgb(238,149,114)",LightSalmon3:"rgb(205,129,98)",LightSalmon4:"rgb(139,87,66)",LightSeaGreen:"rgb(32,178,170)",LightSkyBlue:"rgb(135,206,250)",LightSkyBlue1:"rgb(176,226,255)",LightSkyBlue2:"rgb(164,211,238)",LightSkyBlue3:"rgb(141,182,205)",LightSkyBlue4:"rgb(96,123,139)",LightSlateBlue:"rgb(132,112,255)",LightSlateGray:"rgb(119,136,153)",LightSlateGrey:"rgb(119,136,153)",LightSteelBlue:"rgb(176,196,222)",LightSteelBlue1:"rgb(202,225,255)",LightSteelBlue2:"rgb(188,210,238)",LightSteelBlue3:"rgb(162,181,205)",LightSteelBlue4:"rgb(110,123,139)",LightYellow:"rgb(255,255,224)",LightYellow1:"rgb(255,255,224)",LightYellow2:"rgb(238,238,209)",LightYellow3:"rgb(205,205,180)",LightYellow4:"rgb(139,139,122)","lime green":"rgb(50,205,50)",LimeGreen:"rgb(50,205,50)",linen:"rgb(250,240,230)",magenta:"rgb(255,0,255)",magenta1:"rgb(255,0,255)",magenta2:"rgb(238,0,238)",magenta3:"rgb(205,0,205)",magenta4:"rgb(139,0,139)",maroon:"rgb(176,48,96)",maroon1:"rgb(255,52,179)",maroon2:"rgb(238,48,167)",maroon3:"rgb(205,41,144)",maroon4:"rgb(139,28,98)","medium aquamarine":"rgb(102,205,170)","medium blue":"rgb(0,0,205)","medium orchid":"rgb(186,85,211)","medium purple":"rgb(147,112,219)","medium sea green":"rgb(60,179,113)","medium slate blue":"rgb(123,104,238)","medium spring green":"rgb(0,250,154)","medium turquoise":"rgb(72,209,204)","medium violet red":"rgb(199,21,133)",MediumAquamarine:"rgb(102,205,170)",MediumBlue:"rgb(0,0,205)",MediumOrchid:"rgb(186,85,211)",MediumOrchid1:"rgb(224,102,255)",MediumOrchid2:"rgb(209,95,238)",MediumOrchid3:"rgb(180,82,205)",MediumOrchid4:"rgb(122,55,139)",MediumPurple:"rgb(147,112,219)",MediumPurple1:"rgb(171,130,255)",MediumPurple2:"rgb(159,121,238)",MediumPurple3:"rgb(137,104,205)",MediumPurple4:"rgb(93,71,139)",MediumSeaGreen:"rgb(60,179,113)",MediumSlateBlue:"rgb(123,104,238)",MediumSpringGreen:"rgb(0,250,154)",MediumTurquoise:"rgb(72,209,204)",MediumVioletRed:"rgb(199,21,133)","midnight blue":"rgb(25,25,112)",MidnightBlue:"rgb(25,25,112)","mint cream":"rgb(245,255,250)",MintCream:"rgb(245,255,250)","misty rose":"rgb(255,228,225)",MistyRose:"rgb(255,228,225)",MistyRose1:"rgb(255,228,225)",MistyRose2:"rgb(238,213,210)",MistyRose3:"rgb(205,183,181)",MistyRose4:"rgb(139,125,123)",moccasin:"rgb(255,228,181)","navajo white":"rgb(255,222,173)",NavajoWhite:"rgb(255,222,173)",NavajoWhite1:"rgb(255,222,173)",NavajoWhite2:"rgb(238,207,161)",NavajoWhite3:"rgb(205,179,139)",NavajoWhite4:"rgb(139,121,94)",navy:"rgb(0,0,128)","navy blue":"rgb(0,0,128)",NavyBlue:"rgb(0,0,128)","old lace":"rgb(253,245,230)",OldLace:"rgb(253,245,230)","olive drab":"rgb(107,142,35)",OliveDrab:"rgb(107,142,35)",OliveDrab1:"rgb(192,255,62)",OliveDrab2:"rgb(179,238,58)",OliveDrab3:"rgb(154,205,50)",OliveDrab4:"rgb(105,139,34)",orange:"rgb(255,165,0)","orange red":"rgb(255,69,0)",orange1:"rgb(255,165,0)",orange2:"rgb(238,154,0)",orange3:"rgb(205,133,0)",orange4:"rgb(139,90,0)",OrangeRed:"rgb(255,69,0)",OrangeRed1:"rgb(255,69,0)",OrangeRed2:"rgb(238,64,0)",OrangeRed3:"rgb(205,55,0)",OrangeRed4:"rgb(139,37,0)",orchid:"rgb(218,112,214)",orchid1:"rgb(255,131,250)",orchid2:"rgb(238,122,233)",orchid3:"rgb(205,105,201)",orchid4:"rgb(139,71,137)","pale goldenrod":"rgb(238,232,170)","pale green":"rgb(152,251,152)","pale turquoise":"rgb(175,238,238)","pale violet red":"rgb(219,112,147)",PaleGoldenrod:"rgb(238,232,170)",PaleGreen:"rgb(152,251,152)",PaleGreen1:"rgb(154,255,154)",PaleGreen2:"rgb(144,238,144)",PaleGreen3:"rgb(124,205,124)",PaleGreen4:"rgb(84,139,84)",PaleTurquoise:"rgb(175,238,238)",PaleTurquoise1:"rgb(187,255,255)",PaleTurquoise2:"rgb(174,238,238)",PaleTurquoise3:"rgb(150,205,205)",PaleTurquoise4:"rgb(102,139,139)",PaleVioletRed:"rgb(219,112,147)",PaleVioletRed1:"rgb(255,130,171)",PaleVioletRed2:"rgb(238,121,159)",PaleVioletRed3:"rgb(205,104,127)",PaleVioletRed4:"rgb(139,71,93)","papaya whip":"rgb(255,239,213)",PapayaWhip:"rgb(255,239,213)","peach puff":"rgb(255,218,185)",PeachPuff:"rgb(255,218,185)",PeachPuff1:"rgb(255,218,185)",PeachPuff2:"rgb(238,203,173)",PeachPuff3:"rgb(205,175,149)",PeachPuff4:"rgb(139,119,101)",peru:"rgb(205,133,63)",pink:"rgb(255,192,203)",pink1:"rgb(255,181,197)",pink2:"rgb(238,169,184)",pink3:"rgb(205,145,158)",pink4:"rgb(139,99,108)",plum:"rgb(221,160,221)",plum1:"rgb(255,187,255)",plum2:"rgb(238,174,238)",plum3:"rgb(205,150,205)",plum4:"rgb(139,102,139)","powder blue":"rgb(176,224,230)",PowderBlue:"rgb(176,224,230)",purple:"rgb(160,32,240)",purple1:"rgb(155,48,255)",purple2:"rgb(145,44,238)",purple3:"rgb(125,38,205)",purple4:"rgb(85,26,139)",red:"rgb(255,0,0)",red1:"rgb(255,0,0)",red2:"rgb(238,0,0)",red3:"rgb(205,0,0)",red4:"rgb(139,0,0)","rosy brown":"rgb(188,143,143)",RosyBrown:"rgb(188,143,143)",RosyBrown1:"rgb(255,193,193)",RosyBrown2:"rgb(238,180,180)",RosyBrown3:"rgb(205,155,155)",RosyBrown4:"rgb(139,105,105)","royal blue":"rgb(65,105,225)",RoyalBlue:"rgb(65,105,225)",RoyalBlue1:"rgb(72,118,255)",RoyalBlue2:"rgb(67,110,238)",RoyalBlue3:"rgb(58,95,205)",RoyalBlue4:"rgb(39,64,139)","saddle brown":"rgb(139,69,19)",SaddleBrown:"rgb(139,69,19)",salmon:"rgb(250,128,114)",salmon1:"rgb(255,140,105)",salmon2:"rgb(238,130,98)",salmon3:"rgb(205,112,84)",salmon4:"rgb(139,76,57)","sandy brown":"rgb(244,164,96)",SandyBrown:"rgb(244,164,96)","sea green":"rgb(46,139,87)",SeaGreen:"rgb(46,139,87)",SeaGreen1:"rgb(84,255,159)",SeaGreen2:"rgb(78,238,148)",SeaGreen3:"rgb(67,205,128)",SeaGreen4:"rgb(46,139,87)",seashell:"rgb(255,245,238)",seashell1:"rgb(255,245,238)",seashell2:"rgb(238,229,222)",seashell3:"rgb(205,197,191)",seashell4:"rgb(139,134,130)",sienna:"rgb(160,82,45)",sienna1:"rgb(255,130,71)",sienna2:"rgb(238,121,66)",sienna3:"rgb(205,104,57)",sienna4:"rgb(139,71,38)","sky blue":"rgb(135,206,235)",SkyBlue:"rgb(135,206,235)",SkyBlue1:"rgb(135,206,255)",SkyBlue2:"rgb(126,192,238)",SkyBlue3:"rgb(108,166,205)",SkyBlue4:"rgb(74,112,139)","slate blue":"rgb(106,90,205)","slate gray":"rgb(112,128,144)","slate grey":"rgb(112,128,144)",SlateBlue:"rgb(106,90,205)",SlateBlue1:"rgb(131,111,255)",SlateBlue2:"rgb(122,103,238)",SlateBlue3:"rgb(105,89,205)",SlateBlue4:"rgb(71,60,139)",SlateGray:"rgb(112,128,144)",SlateGray1:"rgb(198,226,255)",SlateGray2:"rgb(185,211,238)",SlateGray3:"rgb(159,182,205)",SlateGray4:"rgb(108,123,139)",SlateGrey:"rgb(112,128,144)",snow:"rgb(255,250,250)",snow1:"rgb(255,250,250)",snow2:"rgb(238,233,233)",snow3:"rgb(205,201,201)",snow4:"rgb(139,137,137)","spring green":"rgb(0,255,127)",SpringGreen:"rgb(0,255,127)",SpringGreen1:"rgb(0,255,127)",SpringGreen2:"rgb(0,238,118)",SpringGreen3:"rgb(0,205,102)",SpringGreen4:"rgb(0,139,69)","steel blue":"rgb(70,130,180)",SteelBlue:"rgb(70,130,180)",SteelBlue1:"rgb(99,184,255)",SteelBlue2:"rgb(92,172,238)",SteelBlue3:"rgb(79,148,205)",SteelBlue4:"rgb(54,100,139)",tan:"rgb(210,180,140)",tan1:"rgb(255,165,79)",tan2:"rgb(238,154,73)",tan3:"rgb(205,133,63)",tan4:"rgb(139,90,43)",thistle:"rgb(216,191,216)",thistle1:"rgb(255,225,255)",thistle2:"rgb(238,210,238)",thistle3:"rgb(205,181,205)",thistle4:"rgb(139,123,139)",tomato:"rgb(255,99,71",tomato1:"rgb(255,99,71)",tomato2:"rgb(238,92,66)",tomato3:"rgb(205,79,57)",tomato4:"rgb(139,54,38)",turquoise:"rgb(64,224,208)",turquoise1:"rgb(0,245,255)",turquoise2:"rgb(0,229,238)",turquoise3:"rgb(0,197,205)",turquoise4:"rgb(0,134,139)",violet:"rgb(238,130,238)","violet red":"rgb(208,32,144)",VioletRed:"rgb(208,32,144)",VioletRed1:"rgb(255,62,150)",VioletRed2:"rgb(238,58,140)",VioletRed3:"rgb(205,50,120)",VioletRed4:"rgb(139,34,82)",wheat:"rgb(245,222,179)",wheat1:"rgb(255,231,186)",wheat2:"rgb(238,216,174)",wheat3:"rgb(205,186,150)",wheat4:"rgb(139,126,102)",white:"rgb(255,255,255)","white smoke":"rgb(245,245,245)",WhiteSmoke:"rgb(245,245,245)",yellow:"rgb(255,255,0)","yellow green":"rgb(154,205,50)",yellow1:"rgb(255,255,0)",yellow2:"rgb(238,238,0)",yellow3:"rgb(205,205,0)",yellow4:"rgb(139,139,0)",YellowGreen:"rgb(154,205,50)"};

	var idCount = 0;
	var varCount = 0;
	var firstRoot = 0;

	var widgets = [];
	var variables = [];
	var timeouts = [];

	var cleanup = function() {
		for (var i = 0; i < timeouts.length; i++) {
			clearTimeout(timeouts[i]);
		}
	}
	var s = {};

	function forceDomReflow() {
		document.body.offsetHeight;
		window.dispatchEvent(new Event('resize'));
	}
	// Tkinter aliases
	s.__name__ = new Sk.builtin.str("tkinter");
	s.END = new Sk.builtin.str("end");
	s.W   = new Sk.builtin.str("w");
	s.E   = new Sk.builtin.str("e");
	s.N   = new Sk.builtin.str("n");
	s.S   = new Sk.builtin.str("s");
	s.NW  = new Sk.builtin.str("nw");
	s.NE  = new Sk.builtin.str("ne");
	s.SW  = new Sk.builtin.str("sw");
	s.SE  = new Sk.builtin.str("se");
	s.Y   = new Sk.builtin.str("y");
	s.X   = new Sk.builtin.str("x");
	s.DISABLED = new Sk.builtin.str("disabled");
	s.NORMAL = new Sk.builtin.str("normal");
	s.YES = new Sk.builtin.int_(1);
	s.NO = new Sk.builtin.int_(0);
	s.BOTH = new Sk.builtin.str("both");
	s.BOTTOM = new Sk.builtin.str("bottom");
	s.TOP = new Sk.builtin.str("top");
	s.RAISED = new Sk.builtin.str("raised");
	s.HORIZONTAL = new Sk.builtin.str("horizontal");
	s.VERTICAL = new Sk.builtin.str("vertical");
	s.SUNKEN = new Sk.builtin.str("sunken");
	s.ALL = new Sk.builtin.str("all");
	s.MULTIPLE = new Sk.builtin.str("multiple");
	s.ARC = new Sk.builtin.str("arc");
	s.CHORD = new Sk.builtin.str("chord");
	s.PIESLICE = new Sk.builtin.str("pieslice");
	s.LAST = new Sk.builtin.str("last");
	s.FIRST = new Sk.builtin.str("first");
	s.LEFT = new Sk.builtin.str("left");
	s.CENTER = new Sk.builtin.str("center");
	s.RIGHT = new Sk.builtin.str("right");
	s.SINGLE = new Sk.builtin.str("single");
	s.EXTENDED = new Sk.builtin.str("extended");
	s.INDETERMINATE = new Sk.builtin.str("indeterminate");

	function getColor(c) {
		var cName = c.replace(" ", "")
		if (tk_colors && tk_colors[cName]) {
			return tk_colors[cName];
		}
		return c;
	}
	// ----------------------------
	var applyWidgetStyles = function(self) {
		/* Apply common widget properties:
		 * justify
		 * padx
		 * pady
		 * bd
		 * fg
		 * bg
		 * relief
		 * font
		 * width
		 * height
		 * text
		 */
		var e = $('#tkinter_' + self.id);

		if (self.props.justify) {
			var align = Sk.ffi.remapToJs(self.props.justify);
			e.css('text-align', align);
		}

		if (self.props.bd) {
			var bdwidth = Sk.ffi.remapToJs(self.props.bd);
			e.css('border-style', 'solid');
			e.css('border-width', bdwidth + 'px');
		}

		if (self.props.foreground) {
			var fg = Sk.ffi.remapToJs(self.props.foreground);
			e.css('color', getColor(fg));
		}
		if (self.props.fg) {
			var fg = Sk.ffi.remapToJs(self.props.fg);
			e.css('color', getColor(fg));
		}

		if (self.props.relief) {
			var relief = Sk.ffi.remapToJs(self.props.relief);
			if (relief == "raised") {
				e.css({
					'border-style': 'solid',
					'border-width': '1px',
					'border-color': '#CCC #000 #000 #CCC'
				});
			}
		}

		if (self.props.padx) {
			var padx = Sk.ffi.remapToJs(self.props.padx) + 'px';
			e.css({
				'margin-right': padx,
				'margin-left': padx
			});
		}
		if (self.props.pady) {
			var pady = Sk.ffi.remapToJs(self.props.pady) + 'px';
			e.css({
				'margin-top': pady,
				'margin-bottom': pady
			});
		}

		if (self.props.background) {
			var bg = Sk.ffi.remapToJs(self.props.background);
			e.css('background-color', getColor(bg));
		}
		if (self.props.bg) {
			var bg = Sk.ffi.remapToJs(self.props.bg);
			e.css('background-color', getColor(bg));
		}

		if (self.props.font) {
			var font = Sk.ffi.remapToJs(self.props.font);

			if (typeof(font) == "string") {
				font = ("" + font).split(" ");
			}

			var fontFamily = font[0];
			var fontWeight = font.includes("bold") ? "bold" : "normal";
			var fontStyle = font.includes("italic") ? "italic" : "normal";

			if (font[1] === 0) {
				font[1] = 12;
			}

			e.css({
				'font-family': fontFamily,
				'font-weight': fontWeight,
				'font-size': font[1] + "pt",
				'font-style': fontStyle
			});
		}
		
		if ((self.props.text) || (self.props.textarea)) {
			if (!(self.props.justify)) {
				e.css('text-align', 'center');
			}
		}

		if (self.props.width) {
			let width = Sk.ffi.remapToJs(self.props.width);
            if (e.hasClass("tk_charsized")) {                
                e.css('width', width + 'ch');
            }
			else {
				e.css('width', width + 'px');
			}
		}

		if (self.props.height) {
			let height = Sk.ffi.remapToJs(self.props.height);           
            if (e.hasClass("tk_charsized")) { 
                mh = 1;
                if (e.is("button")) { mh = 1.25;}              
                e.css('height', height * mh + 'em');
            }
			else {
				e.css('height', height + 'px');
			}
        }

		if (self.props.text) {
			if (self.hasLabel) {
				let labelElement = document.getElementById("l_" + self.id);
				if (labelElement) {
					labelElement.innerHTML = PythonIDE.sanitize(Sk.ffi.remapToJs(self.props.text));
				}
			} else {
				var vimg = "";
				var vtxt = PythonIDE.sanitize(Sk.ffi.remapToJs(self.props.text))
				var html = vtxt;
				if (self.props.image) {
					var imgd = Sk.ffi.remapToJs(self.props.image);
					vimg = '<img src="' + self.props.image + '"/>';

					if (self.props.compound) {
						var comp = Sk.ffi.remapToJs(self.props.compound);
						if (comp == "top") {
							html = vimg + '<br>' + vtxt
						}
						if (comp == "bottom") {
							html = vtxt + '<br>' + vimg
						}
						if (comp == "left") {
							html = vimg + vtxt
						}
						if (comp == "roght") {
							html = vtxt + vimg
						}
					} else {
						html = vimg
					}
				}
				$('#tkinter_' + self.id).html(html);
				$('#tkinter_' + self.id).css('vertical-align', 'middle');

			}
		}
		if (self.props.state) {
			var disabled = Sk.ffi.remapToJs(self.props.state) == 'disabled';
			$('#tkinter_' + self.id).prop('disabled', disabled);
		}
	}

	var configure = function(kwa, self) {
		for (var i = 0; i < kwa.length; i += 2) {
			var key = Sk.ffi.remapToJs(kwa[i]);
			var val = kwa[i + 1];
			self.props[key] = val;
		}
		applyWidgetStyles(self);
	}
	configure.co_kwargs = true;

//------------------------------------------------
	s.mainloop = new Sk.builtin.func(function() {
		Sk.builtin.pyCheckArgs("mainloop", arguments, 0, 0);
	});

// Variable, StringVar, IntVar, BooleanVar    
//🔡 Variable
	s.Variable = Sk.misceval.buildClass(s, function($gbl, $loc) {
		var init = function(kwa, self, master,value) {            
            if (value) {
                self.value = Sk.ffi.remapToJs(value);
                }
            else {self.value ='';}    
			initVariable(self, kwa, self.value);
			self.value = String(self.value);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.__str__ = new Sk.builtin.func(self =>
			new Sk.builtin.str("PY_VAR" + self.id)
		);

		$loc.set = new Sk.builtin.func(function(self, value) {
			self.value = Sk.ffi.remapToJs(value);
			if (self.updateID !== undefined && widgets[self.updateID].update) {
				widgets[self.updateID].update();
			}
		});

		$loc.get = new Sk.builtin.func(self =>
			Sk.ffi.remapToPy(self.value)
		);
	}, "Variable", []);
	// 
	function initVariable(self, kwa, defaultValue) {
        
		self.props = unpackKWA(kwa);
		self.value = defaultValue;

		if (self.props.value !== undefined) {
			self.value = Sk.ffi.remapToJs(self.props.value);
		}

		self.id = varCount;
		variables[varCount++] = self;
	}

	s.StringVar = Sk.misceval.buildClass(s, function($gbl, $loc) {
		var init = function(kwa, self, master,value) {            
            if (value) {
                self.value = Sk.ffi.remapToJs(value);
                }
            else {self.value ='';}    
			initVariable(self, kwa, self.value);
			self.value = String(self.value);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.__str__ = new Sk.builtin.func(self =>
			new Sk.builtin.str("PY_VAR" + self.id)
		);

		$loc.set = new Sk.builtin.func(function(self, value) {
			self.value = Sk.ffi.remapToJs(value);
			if (self.updateID !== undefined && widgets[self.updateID].update) {
				widgets[self.updateID].update();
			}
		});

		$loc.get = new Sk.builtin.func(self =>
			Sk.ffi.remapToPy(self.value)
		);
	}, "StringVar", []);

	s.IntVar = Sk.misceval.buildClass(s, function($gbl, $loc) {
		var init = function(kwa, self, master,value) {            
            if (value) {
                self.value = Sk.ffi.remapToJs(value);
                }
            else {self.value =0;}    
			initVariable(self, kwa, self.value);
			self.value = parseInt(self.value);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.__str__ = new Sk.builtin.func(self =>
			new Sk.builtin.str("PY_VAR" + self.id)
		);

		$loc.set = new Sk.builtin.func(function(self, value) {
			self.value = parseInt(Sk.ffi.remapToJs(value));
			if (self.updateID !== undefined && widgets[self.updateID].update) {
				widgets[self.updateID].update();
			}
		});

		$loc.get = new Sk.builtin.func(self =>
			Sk.ffi.remapToPy(parseInt(self.value))
		);
	}, "IntVar", []);

	s.DoubleVar = Sk.misceval.buildClass(s, function($gbl, $loc) {
		var init = function(kwa, self, master,value) {            
            if (value) {
                self.value = Sk.ffi.remapToJs(value);
                }
            else {self.value =0.0;}    
			initVariable(self, kwa, self.value);
			self.value = parseFloat(self.value);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.__str__ = new Sk.builtin.func(self =>
			new Sk.builtin.str("PY_VAR" + self.id)
		);

		$loc.set = new Sk.builtin.func(function(self, value) {
			self.value = parseFloat(Sk.ffi.remapToJs(value));
			if (self.updateID !== undefined && widgets[self.updateID].update) {
				widgets[self.updateID].update();
			}
		});

		$loc.get = new Sk.builtin.func(self =>
			Sk.ffi.remapToPy(parseFloat(self.value))
		);
	}, "DoubleVar", []);

	s.BooleanVar = Sk.misceval.buildClass(s, function($gbl, $loc) {
        
        var init = function(kwa, self, master,value) {            
            if (value) {
                self.value = Sk.ffi.remapToJs(value);
                }
            else {self.value =false;}    
			initVariable(self, kwa, self.value);
			let jsval = self.value;
			self.value = (jsval === true || jsval === "true" || jsval === 1 || jsval === "1") ? "1" : "0";
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.__str__ = new Sk.builtin.func(self =>
			new Sk.builtin.str("PY_VAR" + self.id)
		);

		$loc.set = new Sk.builtin.func(function(self, value) {
			let jsval = Sk.ffi.remapToJs(value);
			let result = false;

			if (typeof jsval === "boolean") {
				result = jsval;
			} else if (typeof jsval === "string") {
				result = jsval.toLowerCase() === "true" || jsval === "1";
			} else if (typeof jsval === "number") {
				result = jsval !== 0;
			}

			self.value = result ? "1" : "0";

			if (self.updateID !== undefined && widgets[self.updateID].update) {
				widgets[self.updateID].update();
			}
		});

		$loc.get = new Sk.builtin.func(self =>
			Sk.ffi.remapToPy(self.value === "1")
		);
	}, "BooleanVar", []);

// Event ---    
	s.Event = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var init = function(kwa, self, master) {
			self.props = unpackKWA(kwa);

		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.__setattr = new Sk.builtin.func(function(self, key, value) {
			self.props[Sk.ffi.remapToJs(key)] = value;
		});

		$loc.__getattr__ = new Sk.builtin.func(function(self, key) {
			return self.props[Sk.ffi.remapToJs(key)];
		});

		$loc.__str__ = new Sk.builtin.func(function(self) {
			return new Sk.builtin.str("Event");
		});

	}, "Event", []);

	function getOffset(elem) { // fix getBoundingClientRect
		if (elem.getBoundingClientRect) {
			return getOffsetRect(elem)
		} else {
			return getOffsetSum(elem)
		}
	}

	function getOffsetSum(elem) {
		var top = 0,
			left = 0
		while (elem) {
			top = top + parseInt(elem.offsetTop)
			left = left + parseInt(elem.offsetLeft)
			elem = elem.offsetParent
		}
		return {
			top: top,
			left: left
		}
	}

	function getOffsetRect(elem) {
		var box = elem.getBoundingClientRect()
		var body = document.body
		var docElem = document.documentElement
		var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
		var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft
		var clientTop = docElem.clientTop || body.clientTop || 0
		var clientLeft = docElem.clientLeft || body.clientLeft || 0
		var top = box.top + scrollTop - clientTop
		var left = box.left + scrollLeft - clientLeft
		return {
			top: Math.round(top),
			left: Math.round(left)
		}
	}
// Common widget class ---
	s.Widget = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		function updateEventHandlers(self) {
			if (self.eventHandlers) {
				if (self.eventHandlers['<Return>']) {
					$('#tkinter_' + self.id).keypress(function(event) {
						var keycode = (event.keyCode ? event.keyCode : event.which);
						if (keycode == 13) {
							Sk.misceval.callsimAsync(null, self.eventHandlers['<Return>'], Sk.builtin.str("test")).then(function success(r) {

							}, function fail(e) {
								window.onerror(e);
							});
						}

					});
				}

				function commonKeyHandler(ev) {

					PythonIDE.keyHandlers.push(function(e) {
						if (e.type != "keydown") {
							return;
						}
						var event = {
							char: e.key
						}
						switch (e.key) {
							case "ArrowUp":
								event.keysym = "Up";
								break;
							case "ArrowDown":
								event.keysym = "Down";
								break;
							case "ArrowLeft":
								event.keysym = "Left";
								break;
							case "ArrowRight":
								event.keysym = "Right";
								break;
							default:
								event.keysym = e.key;
								break;
						}
						var e = new Sk.builtin.object();
						e.$d = new Sk.ffi.remapToPy(event);
						if (ev.eventDetails) {
							if (event.keysym != ev.eventDetails) {
								return;
							}
						}
						Sk.misceval.callsimAsync(null, ev, e).then(function success(r) {

						}, function fail(e) {
							window.onerror(e);
						});
					});
				}
				if (self.eventHandlers['<Key>']) {
					var ev = self.eventHandlers['<Key>'];
					commonKeyHandler(ev);
				}
				if (self.eventHandlers['<KeyPress>']) {
					var ev = self.eventHandlers['<KeyPress>'];
					commonKeyHandler(ev);
				}


				if (self.eventHandlers['<Button>']) {
					$('#tkinter_' + self.id).mousedown(function(e) {
						if (e.buttons) {
							var x = e.pageX - getOffsetRect(this).left;
							var y = e.pageY - getOffsetRect(this).top;

							var pyE = Sk.misceval.callsim(s.Event);
							pyE.props.x = new Sk.builtin.int_(x);
							pyE.props.y = new Sk.builtin.int_(y);
							Sk.misceval.callsimAsync(null, self.eventHandlers['<Button>'], pyE).then(function success(r) {

							}, function fail(e) {
								window.onerror(e);
							});
						}
					});
				}

				if (self.eventHandlers['<DoubleButton>']) {
					$('#tkinter_' + self.id).dblclick(function(e) {

						var x = e.pageX - getOffsetRect(this).left;
						var y = e.pageY - getOffsetRect(this).top;

						var pyE = Sk.misceval.callsim(s.Event);
						pyE.props.x = new Sk.builtin.int_(x);
						pyE.props.y = new Sk.builtin.int_(y);
						Sk.misceval.callsimAsync(null, self.eventHandlers['<DoubleButton>'], pyE).then(function success(r) {

						}, function fail(e) {
							window.onerror(e);
						});
					});
				}


				if (self.eventHandlers['<B1Motion>']) {
					$('#tkinter_' + self.id).mousemove(function(e) {

						if (e.buttons) {
							var x = e.pageX - getOffsetRect(this).left;
							var y = e.pageY - getOffsetRect(this).top;

							var pyE = Sk.misceval.callsim(s.Event);
							pyE.props.x = new Sk.builtin.int_(x);
							pyE.props.y = new Sk.builtin.int_(y);
							Sk.misceval.callsimAsync(null, self.eventHandlers['<B1Motion>'], pyE).then(function success(r) {

							}, function fail(e) {
								window.onerror(e);
							});
						}
					});
				}
				if (self.eventHandlers['<Motion>']) {
					$('#tkinter_' + self.id).mousemove(function(e) {
						var x = 0,
							y = 0;
						var element = $(this)[0];
						do {
							x += element.offsetLeft;
							y += element.offsetTop;
						}
						while (element = element.offsetParent);
						y += window.scrollY;
						var pyE = Sk.misceval.callsim(s.Event);
						pyE.props.x = new Sk.builtin.int_(e.pageX - x);
						pyE.props.y = new Sk.builtin.int_(e.pageY - y);
						Sk.misceval.callsimAsync(null, self.eventHandlers['<Motion>'], pyE).then(function success(r) {

						}, function fail(e) {
							window.onerror(e);
						});
					});
				}
			}
		}

		var after = function(kwa, self, delay, callback) {
			var timeout = Sk.ffi.remapToJs(delay);
			var timeoutId = setTimeout(function() {
				Sk.misceval.callsimAsync(null, callback).then(function success(r) {

				}, function fail(e) {
					window.onerror(e);
				});
			}, timeout);
			timeouts.push(timeoutId);
		}
		after.co_kwargs = true;
		$loc.after = new Sk.builtin.func(after);

		$loc.__getitem__ = new Sk.builtin.func(function(self, i) {
			return self.props[Sk.ffi.remapToJs(i)];
		});

		$loc.__init__ = new Sk.builtin.func(function(self) {
			self.eventHandlers = {};

			self.updateEventHandlers = updateEventHandlers;
		});

		$loc.update_idletasks = new Sk.builtin.func(function() {

		});

		$loc.configure = new Sk.builtin.func(configure);
		$loc.config = new Sk.builtin.func(configure);

		$loc.winfo_width = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_($('#tkinter_' + self.id).width());
		});

		$loc.winfo_height = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_($('#tkinter_' + self.id).height());
		});

		$loc.winfo_x = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_($('#tkinter_' + self.id).position().left);
		});

		$loc.winfo_y = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_($('#tkinter_' + self.id).position().top);
		});

		$loc.cget = new Sk.builtin.func(function(self, value) { // widget .cget() method
			var p = Sk.ffi.remapToJs(value);
			switch (p) {
				case 'text':
					return new Sk.builtin.str($('#tkinter_' + self.id).text());
				case 'bg':
					if (self.props.bg) {
						return new Sk.builtin.str(self.props.bg);
					} else {
						return new Sk.builtin.str($('#tkinter_' + self.id).css("background-color"));
					}
				case 'fg':
					if (self.props.fg) {
						return new Sk.builtin.str(self.props.fg);
					} else {
						return new Sk.builtin.str($('#tkinter_' + self.id).css("color"));
					}
				case 'width':
					return new Sk.builtin.int_($('#tkinter_' + self.id).width());
				case 'height':
					return new Sk.builtin.int_($('#tkinter_' + self.id).height());
				default:
					return new new Sk.builtin.ValueError("Error: Сan't get object property");
					break;
			}
		});
//--------------        
		var commonDisplay = function(kwa, self, parent) {
			var props = unpackKWA(kwa);
			if (self.getHtml) {
				$('#tkinter_' + self.id).remove();
				var html = self.getHtml(self);
				parent.append(html);

				var e = $('#tkinter_' + self.id);
				if (props.fill) {
					var f = Sk.ffi.remapToJs(props.fill);
					c
					if (f === 'x') {
						e.css('width', '100%');
					} else if (f === 'y') {
						e.css('height', '100%');
					} else if (f === 'both') {
						e.css({
							width: '100%',
							height: '100%'
						});
					}
				}
				if (props.expand && Sk.ffi.remapToJs(props.expand)) e.css('flex', '1');
				var px = props.padx ? Sk.ffi.remapToJs(props.padx) : 0;
				var py = props.pady ? Sk.ffi.remapToJs(props.pady) : 0;
				e.css('margin', py + 'px ' + px + 'px');
				var ipx = props.ipadx ? Sk.ffi.remapToJs(props.ipadx) : 0;
				var ipy = props.ipady ? Sk.ffi.remapToJs(props.ipady) : 0;
				e.css('padding', ipy + 'px ' + ipx + 'px');


				if (self.onShow) {
					self.onShow();
				}

				applyWidgetStyles(self);

				if (self.updateEventHandlers) self.updateEventHandlers(self);
				// 🛠 Не обробляти повторно command, якщо воно вже реалізоване у віджеті
				if (self.props.command) { // && !self.customCommandHandled) {
					e.click(function() {

						Sk.misceval.callsimAsync(null, self.props.command)
							.catch((e) => {
								window.onerror(e.toString());
							});
					});
				}





				if (self.props.validate) {
					switch (Sk.ffi.remapToJs(self.props.validate)) {
						case 'key':
							$('#tkinter_' + self.id).on("change keyup", function(ev) {
								if (self.props.validatecommand) {
									var args = [];
									for (var i = 1; i < self.props.validatecommand.v.length; i++) {
										switch (Sk.ffi.remapToJs(self.props.validatecommand.v[i])) {
											case '%P':
												args = new Sk.builtin.str($('#tkinter_' + self.id).val());
												break;
										}
									}
									Sk.misceval.callsimAsync(null, self.props.validatecommand.v[0], args).then(function success(r) {

									}, function fail(e) {
										window.onerror(e);
									});
								}
							});

							break;

					}
				}
			}
		}

		function checkGeometryConflict(currentStyleId) { // перевірка на конфлікт менеджерів геометрії
			const styles = [{
					id: '#tkinter-pack-style',
					name: 'pack'
				},
				{
					id: '#tkinter-grid-style',
					name: 'grid'
				},
				{
					id: '#tkinter-place-style',
					name: 'place'
				},
			];
			console.log("CID:", currentStyleId, $(currentStyleId).length);
			if ($(currentStyleId).length) return; // якщо вже застосовувався
			for (let style of styles) {
				console.log("CCID:", style.id, $(style.id).length);
				if ($(style.id).length) { // якщо перевірюваний стиль різниться запитуваному і перевірюваний стиль існує -> помилка
					current = currentStyleId.replace('#tkinter-', '').replace('-style', '');
					throw new Sk.builtin.RuntimeError(
						"cannot use geometry manager " + current +
						" inside a widget which already has slaves managed by " + style.name
					);
				}
			}
		}

		// place layout manager ---
		var place = function(kwa, self) {
			var props = unpackKWA(kwa);
			var elementId = 'tkinter_' + self.id;
			var masterId = 'tkinter_' + self.master.id;
			var parentJQ = $('#' + masterId);


			var parentHeight = parentJQ.height();
			var parentWidth = parentJQ.width();


			// Додаємо CSS стилі, якщо ще не додано
			if (!$('#tkinter-place-style').length) {
				$('head').append(
					'<style id="tkinter-place-style">' +
					'.tk-place-item { position: absolute; box-sizing: border-box; }' +
					'</style>'
				);
			}

			var placeRoot = $('#tkinter_' + self.master.id);

			// Отримуємо координати та розміри
			var x = 0;
			if (props.x) {
				x = Sk.ffi.remapToJs(props.x);
			}
			var y = 0;
			if (props.y) {
				y = Sk.ffi.remapToJs(props.y);
			}
			var width = null;
			if (props.width) {
				width = Sk.ffi.remapToJs(props.width);
			}
			var height = null;
			if (props.height) {
				height = Sk.ffi.remapToJs(props.height);
			}
			var pos = 'absolute';
			var relx = null;
			if (props.relx) {
				relx = Sk.ffi.remapToJs(props.relx);
			}
			var rely = null;
			if (props.rely) {
				rely = Sk.ffi.remapToJs(props.rely);
			}
			var relwidth = null;
			if (props.relwidth) {
				relwidth = Sk.ffi.remapToJs(props.relwidth);
			}
			var relheight = null;
			if (props.relheight) {
				relheight = Sk.ffi.remapToJs(props.relheight);
			}
			var anchor = "nw"; // за замовчуванням "nw"
			if (props.anchor) {
				anchor = Sk.ffi.remapToJs(props.anchor);
			}
			if (relx !== null) {
				x = (relx * parentWidth);
			}
			if (rely !== null) {
				y = (rely * parentHeight);
			}
			// Додаємо до контейнера   
			commonDisplay(kwa, self, placeRoot);
			setTimeout(forceDomReflow, 0);
			var el = $('#tkinter_' + self.id)

			var oWidth = el.width();
			var oHeight = el.height();
			var dx = 0;
			var dy = 0;
			// ⚓ Позиціонування з anchor
			if (props.anchor) {

				if (anchor.includes('s')) dy = -oHeight;
				if (anchor.includes('e')) dx = -oWidth;
				if (anchor === 'center') {
					dy = -oHeight / 2;
					dx = -oWidth / 2;
				}
				if (anchor === 'n') {
					dx = -oWidth / 2;
				}
				if (anchor === 's') {
					dy = -oHeight;
					dx = -oWidth / 2;
				}
				if (anchor === 'e') {
					dy = -oHeight / 2;
					dx = -oWidth;
				}
				if (anchor === 'w') {
					dy = -oHeight / 2;
				}
				if (anchor === 'ne') {
					dx = -oWidth;
				}
				if (anchor === 'se') {
					dy = -oHeight;
					dx = -oWidth;
				}
				if (anchor === 'sw') {
					dy = -oHeight;
				}

			}

			x = x + dx;
			y = y + dy;

			// Початкове позиціонування
			var style = {
				'position': pos,
				left: x + 'px',
				top: y + 'px',
			};

			if (width !== null) style.width = width + 'px';
			if (height !== null) style.height = height + 'px';
			if (relwidth !== null) style.width = (relwidth * 100) + '%';
			if (relheight !== null) style.height = (relheight * 100) + '%';

			el.css(style);

		};

		place.co_kwargs = true;
		$loc.place = new Sk.builtin.func(place);

		// pack layout manager ---
		var pack = function(kwa, self) {
			let props = unpackKWA(kwa);

			if (!self.master) {
				self.master = self;
			}
			let elementId = 'tkinter_' + self.id;
			let masterId = 'tkinter_' + self.master.id;
			let parentJQ = $('#' + masterId);
			let parentHeight = self.master.props.height - 60;

			// Додавання CSS один раз
			if (!$('#tkinter-pack-style').length) {
				$('head').append(`
                <style id="tkinter-pack-style">
                    .flex-root { display: flex; flex-direction: column; }
                    .flex-section { display: flex; box-sizing: border-box; align-items: center; }
                    .flex-main { display: flex; flex: 1; flex-direction: row; }
                    .column { flex-direction: column; }
                    .column-reverse { flex-direction: column-reverse; }
                    .row { flex-direction: row; }
                    .row-reverse { flex-direction: row-reverse; }
                    .flex-center { display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; }
                </style>
            `);
			}

			// Додаємо лише flex-root, без підсекцій
			if (!parentJQ.find('.flex-root').length) {
				parentJQ.append(`<div id="flex-root" class="flex-root"></div>`);
			}

			const flexRoot = parentJQ.find('#flex-root');

			// Забезпечення потрібних секцій залежно від props.side
			const ensureSection = (id, className, inside) => {
				if (!flexRoot.find(`#${id}`).length) {
					if (inside) {
						if (!flexRoot.find('.flex-main').length) {
							flexRoot.append(`<div class="flex-main"></div>`);
						}
						flexRoot.find('.flex-main').append(`<div id="${id}" class="${className}"></div>`);
					} else {
						flexRoot.append(`<div id="${id}" class="${className}"></div>`);
					}
				}
			};

			// Визначення позиції
			let pos = props.side ? Sk.ffi.remapToJs(props.side) : 'top';
			let targetId = '';
			switch (pos) {
				case 'top':
					targetId = 'up_side';
					ensureSection('up_side', 'flex-section column', false);
					break;
				case 'bottom':
					targetId = 'down_side';
					ensureSection('down_side', 'flex-section column-reverse', false);
					break;
				case 'left':
					ensureSection('flex-main', 'flex-main', false);
					targetId = 'left_side';
					ensureSection('left_side', 'flex-section row', true);
					break;
				case 'right':
					ensureSection('flex-main', 'flex-main', false);
					targetId = 'right_side';
					ensureSection('right_side', 'flex-section row-reverse', true);
					break;
				case 'center':
					ensureSection('flex-main', 'flex-main', false);
					targetId = 'center';
					ensureSection('center', 'flex-center', true);
					break;
				default:
					console.error('Unknown pos "' + pos + '"');
					return;
			}

			// Налаштування розміру
			document.getElementById("flex-root").style.height = parentHeight + "px";

			// Стилізація елемента
			const el = $('#' + elementId);
			el.css({
				flex: '',
				width: 'auto',
				height: 'auto',
				margin: 0,
				padding: 0
			});

			// Налаштування anchor
			const placeJQ = flexRoot.find('#' + targetId);
			if (props.anchor) {
				let anchor = Sk.ffi.remapToJs(props.anchor);
				if (anchor === "center") {
					placeJQ.css('align-items', "center");
				} else if (anchor.includes("w")) {
					placeJQ.css('align-items', "flex-start");
				} else if (anchor.includes("e")) {
					placeJQ.css('align-items', "flex-end");
				}
			}

			// Вставка елемента
			commonDisplay(kwa, self, placeJQ);
			setTimeout(forceDomReflow, 0);
		};
		pack.co_kwargs = true;
		$loc.pack = new Sk.builtin.func(pack);



		// grid layout manager ---
		var grid = function(kwa, self) {
			var props = unpackKWA(kwa);
			var elementId = 'tkinter_' + self.id;
			var masterId = 'tkinter_' + self.master.id;
			var parentJQ = $('#' + masterId);

			if (!self.master) {
				self.master = self;
			}

			// Додаємо CSS-стилі до <head>, якщо ще не додані
			if (!$('#tkinter-grid-style').length) {
				$('head').append(
					'<style id="tkinter-grid-style">' +
					'.tk-grid-container { display: grid; gap: 4px; padding: 5px; width: 100%; height: 100%; box-sizing: border-box; }' +
					'.tk-grid-item { align-self: streth; justify-self: streth; }' +
					'</style>'
				);
			}

			// Створення grid-контейнера, якщо ще немає
			if (!$('#tk-grid-root').length) {
				parentJQ.append('<div id="tk-grid-root" class="tk-grid-container"></div>');
			}

			var gridRoot = $('#tk-grid-root');

			// Отримуємо параметри
			var row = Sk.ffi.remapToJs(props.row ?? 0);
			var column = Sk.ffi.remapToJs(props.column ?? 0);
			var rowspan = Sk.ffi.remapToJs(props.rowspan ?? 1);
			var columnspan = Sk.ffi.remapToJs(props.columnspan ?? 1);
			var padx = Sk.ffi.remapToJs(props.padx ?? 0);
			var pady = Sk.ffi.remapToJs(props.pady ?? 0);
			var sticky = Sk.ffi.remapToJs(props.sticky ?? ''); // e.g., "nsew"
			// Додаємо віджет до контейнера
			commonDisplay(kwa, self, gridRoot);
			setTimeout(forceDomReflow, 0);
			// Встановлення позиціонування
			var el = $('#' + elementId);
			el.css({
				'grid-row': (row + 1) + ' / span ' + rowspan,
				'grid-column': (column + 1) + ' / span ' + columnspan,
				'padding': `${pady}px ${padx}px`,
				'align-self': 'stretch',
				'justify-self': 'stretch'
			});

			// Sticky (n, s, e, w → управління вирівнюванням)
			if (sticky.includes('n')) el.css('align-self', 'start');
			if (sticky.includes('s')) el.css('align-self', 'end');
			if (sticky.includes('e')) el.css('justify-self', 'end');
			if (sticky.includes('w')) el.css('justify-self', 'start');
			if (sticky.includes('n') && sticky.includes('s')) el.css('align-self', 'stretch');
			if (sticky.includes('e') && sticky.includes('w')) el.css('justify-self', 'stretch');


		};

		grid.co_kwargs = true;
		$loc.grid = new Sk.builtin.func(grid);

		function bind(self, event, command) {
			var e = Sk.ffi.remapToJs(event);
			if (e === '<B1-Motion>') {
				e = '<B1Motion>';
			}
			if (e === '<Double-Button>') {
				e = '<DoubleButton>';
			}
			if (e.indexOf("-") > -1) {
				var parts = e.substr(1, e.length - 2).split("-");
				command.eventDetails = parts[1];
				e = "<" + parts[0] + ">";
			}
			if (!self.eventHandlers) {
				self.eventHandlers = {};
			}
			self.eventHandlers[e] = command;
			self.updateEventHandlers = updateEventHandlers;
			updateEventHandlers(self);
		};

		$loc.bind = new Sk.builtin.func(bind);

		$loc.bind_all = new Sk.builtin.func(bind);

		$loc.__setitem__ = new Sk.builtin.func(function(self, key, value) { // Set key item values            
			self.props[Sk.ffi.remapToJs(key)] = value;
			applyWidgetStyles(self); //
		});

		$loc.destroy = new Sk.builtin.func(function(self) {
			$('#tkinter_' + self.id).remove();
			if (self.closeMainLoop) {
				self.closeMainLoop();
			}
		});
	}, 'Widget', []);

	function unpackKWA(kwa) {
		result = {};

		for (var i = 0; i < kwa.length; i += 2) {
			var key = Sk.ffi.remapToJs(kwa[i]);
			var val = kwa[i + 1];
			result[key] = val;
		}
		return result;
	}

	var commonWidgetConstructor = function(kwa, self, master, getHtml) {

		self.props = unpackKWA(kwa);
		if (!master && firstRoot) {
			master = firstRoot;
		}
		self.master = master;
		widgets[idCount] = self;
		self.id = idCount++;
		self.getHtml = getHtml;
	}
	// Canvas ---
	s.Canvas = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var canvasBg = '#eeeeee';
		var getHtml = function(self) {

			if (self.props.bg) {
				canvasBg = Sk.ffi.remapToJs(self.props.bg);
			}
			if (self.props.background) {
				canvasBg = Sk.ffi.remapToJs(self.props.background);
			}
			var width = 200;
			if (self.props.width) {
				width = Sk.ffi.remapToJs(self.props.width);
			}
			var height = 200;
			if (self.props.height) {
				height = Sk.ffi.remapToJs(self.props.height);
			}
			return '<canvas id="tkinter_' + self.id + '" class="tk_pixelsized" width="' + width + '" height="' + height + '"></canvas>';
		}

		function commonCanvasElement(self, element) {
			var canvas = document.getElementById('tkinter_' + self.id);
			if (canvas) {
				element.draw(canvas);
			}

			self.elements.push(element);

			return new Sk.ffi.remapToPy(self.elements.length - 1);
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			self.elements = [];
			self.onShow = function() {
				var canvas = document.getElementById('tkinter_' + self.id);
				if (canvas) {
					const cx = canvas.getContext('2d');
					if (self.props.bg) {
						cx.fillStyle = getColor(Sk.ffi.remapToJs(self.props.bg));
					}
					if (self.props.background) {
						cx.fillStyle = getColor(Sk.ffi.remapToJs(self.props.background));
					}
					cx.clearRect(0, 0, canvas.width, canvas.height);

					for (var i = 0; i < self.elements.length; i++) {
						if (self.elements[i].deleted)
							continue;
						self.elements[i].draw(canvas);
					}
				}
			}
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.bbox = new Sk.builtin.func(function(self, item) {
			var bbox = [0, 0, 0, 0];
			if (item) {
				var e = self.elements[Sk.ffi.remapToJs(item)];
				if (e.coords.x1)
					bbox[0] = new Sk.builtin.int_(e.coords.x1);
				if (e.coords.y1)
					bbox[1] = new Sk.builtin.int_(e.coords.y1);
				if (e.coords.x2)
					bbox[2] = new Sk.builtin.int_(e.coords.x2);
				if (e.coords.y2)
					bbox[3] = new Sk.builtin.int_(e.coords.y2);
			}
			return new Sk.builtin.tuple(bbox);
		});

		$loc.find_withtag = new Sk.builtin.func(function(self, tagname) {
			var tag = Sk.ffi.remapToJs(tagname);
			var matches = [];
			for (var i = 0; i < self.elements.length; i++) {
				if (self.elements[i] && self.elements[i].props && self.elements[i].props.tag && Sk.ffi.remapToJs(self.elements[i].props.tag) == tag && !self.elements[i].deleted) {
					matches.push(Sk.ffi.remapToPy(i));
				}
			}
			return new Sk.builtin.tuple(matches);
		});

		var coords = function(kwa, self, item, coords) {
			var id = Sk.ffi.remapToJs(item);
			if (coords) {
				var jsCoords = Sk.ffi.remapToJs(coords);
				if (typeof(jsCoords) == "number") {
					jsCoords = [];
					var found = false;
					for (var i = 0; i < arguments.length; i++) {
						if (arguments[i] == coords) {
							found = true;
						}
						if (found) {
							jsCoords.push(Sk.ffi.remapToJs(arguments[i]));
						}
					}
				}

				if (self.elements[id].coords.x1) { // перевірка як задані координати - як об’єкт: { x1: ..., y1: ..., x2: ..., y2: ... } або як масив: [x1, y1, x2, y2]
					if (jsCoords.length === 2) {
						self.elements[id].coords.x1 = jsCoords[0];
						self.elements[id].coords.y1 = jsCoords[1];
					} else if (jsCoords.length === 4) {
						self.elements[id].coords.x1 = jsCoords[0];
						self.elements[id].coords.y1 = jsCoords[1];
						self.elements[id].coords.x2 = jsCoords[2];
						self.elements[id].coords.y2 = jsCoords[3];
					}
				} else
					for (var i = 0; i < jsCoords.length; i++) {
						self.elements[id].coords[i] = jsCoords[i];
					}
				self.onShow();
			}
			var c = [];
			if (self && self.elements && self.elements[id] && !self.elements[id].deleted) {
				var crd = self.elements[id].coords;

				if (Array.isArray(crd)) {
					// Якщо coords — масив
					for (var i = 0; i < crd.length; i++) {
						c.push(new Sk.builtin.int_(crd[i]));
					}
				} else if (typeof crd === "object") {
					// Якщо coords — об’єкт
					if (crd.x1 !== undefined) c.push(new Sk.builtin.int_(crd.x1));
					if (crd.y1 !== undefined) c.push(new Sk.builtin.int_(crd.y1));
					if (crd.x2 !== undefined) c.push(new Sk.builtin.int_(crd.x2));
					if (crd.y2 !== undefined) c.push(new Sk.builtin.int_(crd.y2));
				}
			}
			return new Sk.builtin.tuple(c);
		};
		coords.co_kwargs = true;
		$loc.coords = new Sk.builtin.func(coords);

		$loc.move = new Sk.builtin.func(function(self, item, dx, dy) {
			var id = Sk.ffi.remapToJs(item);
			if (self && self.elements && self.elements[id] && !self.elements[id].deleted) {
				self.elements[id].coords.x1 += Sk.ffi.remapToJs(dx);
				self.elements[id].coords.y1 += Sk.ffi.remapToJs(dy);
				self.elements[id].coords.x2 += Sk.ffi.remapToJs(dx);
				self.elements[id].coords.y2 += Sk.ffi.remapToJs(dy);
			}
			self.onShow();
		});

		$loc.find_overlapping = new Sk.builtin.func(function(self, x1, y1, x2, y2) {
			var matches = [];
			for (var i = 0; i < self.elements.length; i++) {
				if (self.elements[i] && self.elements[i].coords && !self.elements[i].deleted) {
					var r1 = {
						x1: Sk.ffi.remapToJs(x1),
						y1: Sk.ffi.remapToJs(y1),
						x2: Sk.ffi.remapToJs(x2),
						y2: Sk.ffi.remapToJs(y2)
					}
					var r2 = self.elements[i].coords;
					// r1 is param
					// r2 is e
					if ((r1.x2 >= r2.x1) && (r1.x1 <= r2.x2) && (r1.y2 >= r2.y1) && (r1.y1 <= r2.y2)) {
						matches.push(new Sk.builtin.int_(i));
					}
				}
			}
			return new Sk.builtin.tuple(matches);
		});

		$loc.delete_$rw$ = new Sk.builtin.func(function(self, id) {
			if (!id) id = new Sk.builtin.str("all");
			var idName = Sk.ffi.remapToJs(id);
			if (idName == "all") {
				self.elements = [];
			} else {
				var i = Sk.ffi.remapToJs(id);
				self.elements[i].deleted = true;
			}
			self.onShow();
		});

		function applyStyles(props, cx) {

			if (!props.dash) {
				cx.setLineDash([]);
			}
			if (props.fill) {
				cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.fill));
			}
			if (!props.outline) {
				props.outline = new Sk.builtin.str("black");
			}
			cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.outline));

			if (props.width) {
				cx.lineWidth = Sk.ffi.remapToJs(props.width);
			} else {
				cx.lineWidth = 1
			}

			if (props.dash) {
				var dash = Sk.ffi.remapToJs(props.dash);
				if (Array.isArray(dash)) {
					cx.setLineDash(dash);
				} else {
					var dashes = [dash, dash];
					cx.setLineDash(dashes);
				}
			}

			if (props.font) {
				var font = Sk.ffi.remapToJs(props.font);
				if (typeof(font) == "string") {
					font = ("" + f).split(" ");
				}
				var sFont = "";

				if (font.length > 1) {
					sFont = font[1] + "pt ";
				}
				sFont += font[0];
				cx.font = sFont;
			}
		}

// -----------------        
		function draw_curve(ctx, pointsArray, closed = true, smoothing = 0.6) {
			if (pointsArray.length < 6) {
				console.error('Need at least 3 points (6 coordinates) to smooth a polygon');
				return;
			}
			const points = [];
			for (let i = 0; i < pointsArray.length; i += 2) {
				points.push({
					x: pointsArray[i],
					y: pointsArray[i + 1]
				});
			}
			if (closed) {
				points.push(points[0]);
				points.push(points[1]);
			}
			//ctx.beginPath();
			// Починаємо з середини першої сторони
			let firstX = (points[0].x + points[1].x) / 2;
			let firstY = (points[0].y + points[1].y) / 2;
			let pend = 1;
			if (!closed) {
				firstX = points[0].x;
				firstY = points[0].y;
				pend = 2;
			}
			ctx.moveTo(firstX, firstY);

			for (let i = 1; i < points.length - pend; i++) {
				const prev = points[i - 1];
				const curr = points[i];
				const next = points[i + 1];
				// Обчислюємо середини сторін
				const mid1 = {
					x: (prev.x + curr.x) / 2,
					y: (prev.y + curr.y) / 2
				};
				const mid2 = {
					x: (curr.x + next.x) / 2,
					y: (curr.y + next.y) / 2
				};
				// Обчислюємо контрольні точки всередині полігона
				const control1 = {
					x: mid1.x + (curr.x - mid1.x) * smoothing,
					y: mid1.y + (curr.y - mid1.y) * smoothing
				};
				const control2 = {
					x: mid2.x + (curr.x - mid2.x) * smoothing,
					y: mid2.y + (curr.y - mid2.y) * smoothing
				};
				// Малюємо криву Безьє
				ctx.bezierCurveTo(
					control1.x, control1.y,
					control2.x, control2.y,
					mid2.x, mid2.y
				);
			}

			if (closed) {

				ctx.closePath();
				ctx.fill()

			} else {
				ctx.quadraticCurveTo(
					points[3].x, points[3].y,
					points[4].x, points[4].y);

			}

			ctx.stroke();

		}

		// ---------------
		function draw_polygon(ctx, pointsArray, isClosed) {
			ctx.moveTo(pointsArray[0], pointsArray[1]);
			for (var i = 2; i < pointsArray.length; i += 2) {
				ctx.lineTo(pointsArray[i], pointsArray[i + 1]);
			}
			if (isClosed) {
				ctx.closePath();
			}
			ctx.stroke();

		}
		//----------------
		var create_polygon = function(kwa, self, coords) {
			var jsCoords = Sk.ffi.remapToJs(coords);
			if (self.props.fill) {
				self.props.fill = undefined;
			}
			var props = unpackKWA(kwa);
			for (var key in props) {
				self.props[key] = props[key];
			}
			if (typeof(jsCoords) == "number") {
				jsCoords = [];
				var found = false;
				for (var i = 0; i < arguments.length; i++) {
					if (arguments[i] == coords) {
						found = true;
					}
					if (found) {
						jsCoords.push(Sk.ffi.remapToJs(arguments[i]));
					}
				}
			}
			return commonCanvasElement(self, {
				props: props,
				coords: jsCoords,
				draw: function(canvas) {
					var cx = canvas.getContext('2d');
					cx.beginPath();
					applyStyles(props, cx);
					let smooth = false;

					if (self.props.smooth) {
						smooth = Sk.ffi.remapToJs(self.props.smooth)
						if (smooth) {
							draw_curve(cx, jsCoords, true)
							//if(self.props.fill && Sk.ffi.remapToJs(self.props.fill) != '') {
							//    cx.lineWidth = 1;
							//    draw_polygon(cx, jsCoords, true)
							//    }
						}

						if (!smooth) {
							draw_polygon(cx, jsCoords, true)
						}
					} else {
						draw_polygon(cx, jsCoords, true)
					}
					self.props.smooth = "";
					if (self.props.fill && Sk.ffi.remapToJs(self.props.fill) != '') {
						cx.fillStyle = Sk.ffi.remapToJs(self.props.fill);
						cx.fill();
					}
				}
			});
		}
		create_polygon.co_kwargs = true;
		$loc.create_polygon = new Sk.builtin.func(create_polygon);

		// -----------------

		var create_line = function(kwa, self, coords) {
			var jsCoords = Sk.ffi.remapToJs(coords);
			if (self.props.fill) {
				self.props.fill = undefined;
			}
			var props = unpackKWA(kwa);
			for (var key in props) {
				self.props[key] = props[key];
			}
			if (typeof(jsCoords) == "number") {
				jsCoords = [];
				var found = false;
				for (var i = 0; i < arguments.length; i++) {
					if (arguments[i] == coords) {
						found = true;
					}
					if (found) {
						jsCoords.push(Sk.ffi.remapToJs(arguments[i]));
					}
				}
			}
			return commonCanvasElement(self, {
				props: props,
				coords: jsCoords,
				draw: function(canvas) {
					function drawArrow(x0, y0, x1, y1) {
						var headLength = 15;
						// constants
						var deg_in_rad_200 = 200 * Math.PI / 180;
						var deg_in_rad_160 = 160 * Math.PI / 180;
						// calc the angle of the line
						var dx = x1 - x0;
						var dy = y1 - y0;
						var angle = Math.atan2(dy, dx);
						// calc arrowhead points
						var x200 = x1 + headLength * Math.cos(angle + deg_in_rad_200);
						var y200 = y1 + headLength * Math.sin(angle + deg_in_rad_200);
						var x160 = x1 + headLength * Math.cos(angle + deg_in_rad_160);
						var y160 = y1 + headLength * Math.sin(angle + deg_in_rad_160);
						cx.beginPath();
						cx.moveTo(x1, y1);
						cx.setLineDash([]);
						cx.lineWidth = 2;
						// draw arrowhead
						cx.lineTo(x200, y200);
						cx.lineTo(x160, y160);
						cx.lineTo(x1, y1);
						cx.closePath();
						cx.stroke();
						cx.fill()
					}
					var cx = canvas.getContext('2d');
					cx.beginPath();
					applyStyles(props, cx);
					if (props.fill) {
						cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.fill));
						cx.fillStyle = getColor(Sk.ffi.remapToJs(props.fill));
					} else {
						cx.strokeStyle = 'black';
						cx.fillStyle = 'black';
					}

					if (self.props.smooth) {
						smooth = Sk.ffi.remapToJs(self.props.smooth);
						if (smooth) {
							draw_curve(cx, jsCoords, false)
						}
						if (!smooth) {
							draw_polygon(cx, jsCoords, false)
						}
					} else {
						draw_polygon(cx, jsCoords, false)
					}


					self.props.smooth = "";
					// arrow head
					if (props.arrow) {
						arrw = Sk.ffi.remapToJs(props.arrow);
						var l = jsCoords.length;
						if ((arrw == "last") || (arrw == "both")) {
							drawArrow(jsCoords[l - 4], jsCoords[l - 3], jsCoords[l - 2], jsCoords[l - 1])
						}
						if ((arrw == "first") || (arrw == "both")) {
							drawArrow(jsCoords[2], jsCoords[3], jsCoords[0], jsCoords[1])
						}
					}
				}
			});
		}
		create_line.co_kwargs = true;
		$loc.create_line = new Sk.builtin.func(create_line);
		//------------------

		var create_text = function(kwa, self, x, y) {
			var coords = {
				x1: Sk.ffi.remapToJs(x),
				y1: Sk.ffi.remapToJs(y),
				x2: Sk.ffi.remapToJs(x + 10),
				y2: Sk.ffi.remapToJs(y + 10)
			}
			var props = unpackKWA(kwa);
			return commonCanvasElement(self, {
				type: "text",
				props: props,
				coords: coords,
				draw: function(canvas) {
					var cx = canvas.getContext('2d');
					var text = "";
					var angle = 0;
					if (props.text) {
						text = "" + Sk.ffi.remapToJs(props.text);
					}
					cx.textAlign = "center";
					applyStyles(props, cx);
					if (props.fill) {
						cx.fillStyle = getColor(Sk.ffi.remapToJs(props.fill));
					} else {
						cx.fillStyle = 'black';
					}
					if (props.angle) {
						angle = Sk.ffi.remapToJs(props.angle);
					}
					cx.save();
					cx.translate(coords.x1 + 6, coords.y1 + 6);
					cx.rotate(-angle * (Math.PI / 180));
					cx.fillText(text, 0, 0);
					cx.restore();
				}
			});
		}
		create_text.co_kwargs = true;
		$loc.create_text = new Sk.builtin.func(create_text);

		var create_rectangle = function(kwa, self, x1, y1, x2, y2) {
			var coords = {
				x1: Sk.ffi.remapToJs(x1),
				y1: Sk.ffi.remapToJs(y1),
				x2: Sk.ffi.remapToJs(x2),
				y2: Sk.ffi.remapToJs(y2),
			}

			var props = unpackKWA(kwa);

			return commonCanvasElement(self, {
				type: "rectangle",
				props: props,
				coords: coords,
				draw: function(canvas) {
					var cx = canvas.getContext('2d');
					applyStyles(props, cx);
					if (props.fill) {
						cx.fillStyle = getColor(Sk.ffi.remapToJs(props.fill));
					}
					if (props.outline) {
						cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.outline));
					}
					if (props.width) {
						cx.lineWidth = Sk.ffi.remapToJs(props.width);
					}
					if (props.fill) {
						cx.fillRect(coords.x1, coords.y1, coords.x2 - coords.x1, coords.y2 - coords.y1);
					}
					cx.strokeRect(coords.x1, coords.y1, coords.x2 - coords.x1, coords.y2 - coords.y1);
				}
			});

		}
		create_rectangle.co_kwargs = true;
		$loc.create_rectangle = new Sk.builtin.func(create_rectangle);
		// create image
		var create_image = function(kwa, self, x1, y1) {
			var coords = {
				x1: Sk.ffi.remapToJs(x1),
				y1: Sk.ffi.remapToJs(y1)
			}

			var props = unpackKWA(kwa);
			console.log("Create image:", props);
			return commonCanvasElement(self, {
				type: "image",
				props: props,
				coords: coords,
				draw: function(canvas) {
					var cx = canvas.getContext('2d');
					base_image = new Image();
					base_image.src = props.image;
					console.log("Width=", base_image.width);
					var img_width = base_image.width;
					var img_height = base_image.height;
					var dx = 0;
					var dy = 0;
					var anchor = "CENTER";
					if (props.anchor) {
						anchor = props.anchor.v;
						console.log("Anchor=", anchor);
						anchor = anchor.toUpperCase();
					}
					if (anchor == "N") {
						dx = -base_image.width / 2;
						dy = 0;
					}
					if (anchor == "S") {
						dx = -base_image.width / 2;
						dy = -base_image.height;
					}
					if (anchor == "W") {
						dx = 0;
						dy = -base_image.height / 2;
					}
					if (anchor == "E") {
						dx = -base_image.width;
						dy = -base_image.height / 2;
					}
					if (anchor == "CENTER") {
						dx = -base_image.width / 2;
						dy = -base_image.height / 2;
					}
					if (anchor == "NW") {
						dx = 0;
						dy = 0;
					}
					if (anchor == "NE") {
						dx = -base_image.width;
						dy = 0;
					}
					if (anchor == "SW") {
						dx = 0;
						dy = -base_image.height;
					}
					if (anchor == "SE") {
						dx = -base_image.width;
						dy = -base_image.height;
					}
					if (anchor == "CENTER") {
						dx = -base_image.width / 2;
						dy = -base_image.height / 2;
					}
					cx.drawImage(base_image, coords.x1 + dx, coords.y1 + dy);
				}
			});

		}
		create_image.co_kwargs = true;
		$loc.create_image = new Sk.builtin.func(create_image);

		//
		var create_oval = function(kwa, self, x1, y1, x2, y2) {
			var coords = {
				x1: Sk.ffi.remapToJs(x1),
				y1: Sk.ffi.remapToJs(y1),
				x2: Sk.ffi.remapToJs(x2),
				y2: Sk.ffi.remapToJs(y2),
			}

			var props = unpackKWA(kwa);

			return commonCanvasElement(self, {
				type: "oval",
				props: props,
				coords: coords,
				draw: function(canvas) {
					var cx = canvas.getContext('2d');
					applyStyles(props, cx);
					if (props.fill) {
						cx.fillStyle = getColor(Sk.ffi.remapToJs(props.fill));
					}
					if (props.outline) {
						cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.outline));
					}
					if (props.width) {
						cx.lineWidth = Sk.ffi.remapToJs(props.width);
					}
					//applyStyles                
					cx.beginPath();
					var w = coords.x2 - coords.x1;
					var h = coords.y2 - coords.y1
					cx.ellipse(coords.x1 + (w / 2), coords.y1 + (h / 2), w / 2, h / 2, 0, 0, 2 * Math.PI);
					if (props.fill) {
						cx.fill();
					}
					cx.stroke();
				}
			});
		}
		create_oval.co_kwargs = true;
		$loc.create_oval = new Sk.builtin.func(create_oval);

		//
		var create_arc = function(kwa, self, x1, y1, x2, y2) {
			var coords = {
				x1: Sk.ffi.remapToJs(x1),
				y1: Sk.ffi.remapToJs(y1),
				x2: Sk.ffi.remapToJs(x2),
				y2: Sk.ffi.remapToJs(y2),
			}

			var props = unpackKWA(kwa);

			return commonCanvasElement(self, {
				type: "arc",
				props: props,
				coords: coords,
				draw: function(canvas) {
					var cx = canvas.getContext('2d');
					var start = 2 * Math.PI - Sk.ffi.remapToJs(props.start) * Math.PI / 180;
					var extent = 2 * Math.PI - Sk.ffi.remapToJs(props.extent) * Math.PI / 180;
					var style = Sk.ffi.remapToJs(props.style);
					if (!props.style) {
						style = "pieslice"
					}

					applyStyles(props, cx);
					if (props.fill) {
						cx.fillStyle = getColor(Sk.ffi.remapToJs(props.fill));
					}
					if (props.outline) {
						cx.strokeStyle = getColor(Sk.ffi.remapToJs(props.outline));
					}
					if (props.width) {
						cx.lineWidth = Sk.ffi.remapToJs(props.width);
					}
					//applyStyles
					cx.beginPath();
					var w = coords.x2 - coords.x1;
					var h = coords.y2 - coords.y1;
					if (style == "pieslice") {
						cx.moveTo(coords.x1 + (w / 2), coords.y1 + (h / 2));
					}

					cx.ellipse(coords.x1 + (w / 2), coords.y1 + (h / 2), w / 2, h / 2, 0, start, start + extent, true);
					if (style == "pieslice") {
						cx.lineTo(coords.x1 + (w / 2), coords.y1 + (h / 2));
					}
					if (props.fill) {
						cx.fill();
					}
					if (style == "chord") {
						cx.closePath();
					}
					cx.stroke();

				}
			});
		}
		create_arc.co_kwargs = true;
		$loc.create_arc = new Sk.builtin.func(create_arc);

		//
		var item_config = function(kwa, self, id) {
			var e = self.elements[Sk.ffi.remapToJs(id)];
			var newProps = unpackKWA(kwa);
			for (var prop in newProps) {
				e.props[prop] = newProps[prop];
			}
			self.onShow();
		};

		item_config.co_kwargs = true;
		$loc.itemconfig = new Sk.builtin.func(item_config);
		$loc.itemconfigure = new Sk.builtin.func(item_config);

	}, 'Canvas', [s.Widget]);

// Entry ---
	s.Entry = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {
			var v = "";
			if (self.props.textvariable) {
				v = Sk.ffi.remapToJs(self.props.textvariable.value);
				self.props.textvariable.updateID = self.id;
			}
			return '<input type="text" id="tkinter_' + self.id + '" class="tk_charsized" style="text-align:right;" value="' + v + '">';
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);

			self.update = function() {
				if (self.props.textvariable) {
					let v = Sk.ffi.remapToJs(self.props.textvariable.value);
					$('#tkinter_' + self.id).val(v);
				}
			}

			self.onShow = function() {
				$('#tkinter_' + self.id).off('change').on('change', function() {
					if (self.props.textvariable) {
						self.props.textvariable.value = Sk.ffi.remapToPy($(this).val());
					}
				});
			}
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.get = new Sk.builtin.func(self =>
			new Sk.builtin.str($('#tkinter_' + self.id).val())
		);

		$loc.focus = $loc.focus_set = new Sk.builtin.func(function(self) {
			$('#tkinter_' + self.id).focus();
		});

		$loc.insert = new Sk.builtin.func(function(self, index, string) {
			var i = Sk.ffi.remapToJs(index);
			var v = $('#tkinter_' + self.id).val();
			var s = Sk.ffi.remapToJs(string);
			if (i == "end") {
				$('#tkinter_' + self.id).val(v + s);
			} else {
				var before = v.substr(0, i);
				var after = v.substr(i);
				$('#tkinter_' + self.id).val(before + s + after);
			}
			if (self.props.textvariable) {
				self.props.textvariable.value = Sk.ffi.remapToPy($('#tkinter_' + self.id).val());
			}
		});

		$loc.delete_$rw$ = new Sk.builtin.func(function(self, first, last) {
			var val = $('#tkinter_' + self.id).val();
			var start = Sk.ffi.remapToJs(first);
			var end = Sk.ffi.remapToJs(last);
			if (end === 'end') end = val.length;
			$('#tkinter_' + self.id).val(val.substring(0, start) + val.substring(end));
			if (self.props.textvariable) {
				self.props.textvariable.value = Sk.ffi.remapToPy($('#tkinter_' + self.id).val());
			}
		});
	}, 'Entry', [s.Widget]);

// Scale ---
	s.Scale = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {
			let min = 0;
			if (self.props.from_) {
				min = Sk.ffi.remapToJs(self.props.from_);
			}

			let max = 100;
			if (self.props.to) {
				max = Sk.ffi.remapToJs(self.props.to);
			}

			let step = 1;
			if (self.props.resolution) {
				step = Sk.ffi.remapToJs(self.props.resolution);
			}

			let orientation = "vertical";
			if (self.props.orient) {
				orientation = Sk.ffi.remapToJs(self.props.orient);
			}

			let value = 0;
			if (self.props.variable) {
				if (typeof self.props.variable.value === "undefined") {
					self.props.variable.value = Sk.ffi.remapToPy(value);
				}
				value = Sk.ffi.remapToJs(self.props.variable.value);
				self.props.variable.updateID = self.id;
			}

			let html = `<input id="slider_${self.id}" type="range" min="${min}" max="${max}" value="${value}" step="${step}" orient="${orientation}" />`;
			return `<div id="tkinter_${self.id}" class="tk_pixelsized" style="margin:auto;">
                    <span id="slider_${self.id}_Value">${value}</span>
                    <div style="line-height:0px;margin:0px;"></div>
                    ${html}
                </div>`;
		};

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);

			self.customCommandHandled = true; // command вже оброблено

			self.onShow = function() {
				self.sliderValue = document.getElementById(`slider_${self.id}_Value`);
				self.slider = document.getElementById(`slider_${self.id}`);

				if (!self.slider) return;

				self.sliderValue.innerHTML = self.slider.value;

				self.slider.oninput = function() {
					const val = parseFloat(self.slider.value);
					if (self.sliderValue) self.sliderValue.innerHTML = val;

					if (self.props.variable) {
						self.props.variable.value = Sk.ffi.remapToPy(val);
					}

					if (self.props.command) {
						const pyVal = Sk.ffi.remapToPy(val);
						Sk.misceval.callsimAsync(null, self.props.command, pyVal).catch((e) => {
							window.onerror(e.toString());
						});
					}
				};
			};

			self.update = function() {
				if (self.props.variable) {
					let v = Sk.ffi.remapToJs(self.props.variable.value);
					if (self.slider) self.slider.value = v;
					if (self.sliderValue) self.sliderValue.innerHTML = v;
				}
			};
		};

		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.get = new Sk.builtin.func(function(self) {
			if (!self.slider) return Sk.ffi.remapToPy(0);
			let val = self.slider.value;
			let num = Number(val);
			return Number.isInteger(num) ? Sk.ffi.remapToPy(parseInt(val)) : Sk.ffi.remapToPy(parseFloat(val));
		});

		$loc.set = new Sk.builtin.func(function(self, value) {
			let v = Sk.ffi.remapToJs(value);
			if (self.slider) self.slider.value = v;
			if (self.sliderValue) self.sliderValue.innerHTML = v;
			if (self.props.variable) {
				self.props.variable.value = Sk.ffi.remapToPy(Number(v));
			}
		});
	}, "Scale", [s.Widget]);

// Message ---
	s.Message = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {

			var v = "";
			if (self.props.text) {
				v = Sk.ffi.remapToJs(self.props.text);
			}
			if (!self.props.width) {
				self.props.width = 26;
			}
			if (!self.props.justify) {
				self.props.justify = 'left';
			}
			if (self.props.textvariable) {
				v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				self.props.textvariable.updateID = self.id;
			}
			var html = '<div id="tkinter_' + self.id + '" class="tk_charsized" style="word-wrap:break-word;line-height:120%" >' + PythonIDE.sanitize(v) + '</div>';
			return html;
		}

		var init = function(kwa, self, master) {
			self.update = function() {
				var v = "";
				if (self.props.text) {
					v = Sk.ffi.remapToJs(self.props.text);
				}
				if (self.props.textvariable) {
					v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				}
				$('#tkinter_' + self.id).text(Sk.ffi.remapToJs(v));
				self.props.text = v;

				if (self.props.width === 1) {
					self.props.width = v.length + 1;
				}
				$('#tkinter_' + self.id).css('width', Sk.ffi.remapToJs(self.props.width) + 'em');
			}
			commonWidgetConstructor(kwa, self, master, getHtml);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);
	}, 'Message', [s.Widget]);

// PhotoImage ---
	var PhotoImage = function(kwa) {
		props = unpackKWA(kwa);
		imgData = fsToBrowse.read(Sk.ffi.remapToJs(props.file));
		return new Sk.builtin.str(imgData)
	};
	PhotoImage['co_kwargs'] = true;
	s.PhotoImage = new Sk.builtin.func(PhotoImage);


// Label ---
	s.Label = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {

			var v = "";
			if (self.props.text) {
				v = Sk.ffi.remapToJs(self.props.text);
			}
			txtwidth = v.length;
			if (!self.props.width) {
				self.props.width = txtwidth;
			}
            
			if (self.props.textvariable) {
				v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				self.props.textvariable.updateID = self.id;
			}
			var html = '<div id="tkinter_' + self.id + '" class="tk_charsized" style="display:flex;align-items:center;justify-content:center;">' + PythonIDE.sanitize(v) + '</div>';
			return html;
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			self.update = function() {
				var v = "";
				if (self.props.text) {
					v = Sk.ffi.remapToJs(self.props.text);
				}
				if (self.props.textvariable) {
					v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				}
				$('#tkinter_' + self.id).text(Sk.ffi.remapToJs(v));
				self.props.text = v;

				if (self.props.width === 1) {
					self.props.width = v.length + 0;
				}
				$('#tkinter_' + self.id).css('width', Sk.ffi.remapToJs(self.props.width) + 'ch');
                $('#tkinter_' + self.id).classList.add("tk-label")
			}
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

	}, 'Label', [s.Widget]);

// Button ---
        s.Button = new Sk.misceval.buildClass(s, function($gbl, $loc) {
        
            var getHtml = function(self) {
                var disabled = false;
                if (self.props.state) {
                    disabled = Sk.ffi.remapToJs(self.props.state) == 'disabled';
                }
                var vtxt = "";
                if (self.props.text) {
                    vtxt = Sk.ffi.remapToJs(self.props.text);
                }
                if (self.props.textvariable) {
                    vtxt = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
                    self.props.textvariable.updateID = self.id;
                }
                if (vtxt === "") {
                    vtxt = "\u2000\u2000"; // blank button
                }
                var vimg = "";
                if (self.props.image) {
                    var imgd = Sk.ffi.remapToJs(self.props.image);
                    vimg = '<img src="' + self.props.image + '"/>';
                    if (vtxt == "\u2000\u2000") {
                        vtxt = "";
                    }
                }
        
                vtxt = vtxt + vimg;
                var html = '<button id="tkinter_' + self.id + '" class="tk_charsized"' + (disabled ? ' disabled' : '') + '>' + vtxt + '</button>';
                return html;
            }
        
            var init = function(kwa, self, master) {
                commonWidgetConstructor(kwa, self, master, getHtml);
        
                self.update = function() {
                    var v = "";
                    if (self.props.textvariable) {
                        v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
                    } else if (self.props.text) {
                        v = Sk.ffi.remapToJs(self.props.text);
                    }
        
                    if (v === "") {
                        v = "\u2000\u2000";
                    }
        
                    var vimg = "";
                    if (self.props.image) {
                        vimg = '<img src="' + self.props.image + '"/>';
                        if (v === "\u2000\u2000") {
                            v = "";
                        }
                    }
        
                    v = v + vimg;
                    $('#tkinter_' + self.id).html(v);
                };
            }
        
            init.co_kwargs = true;
            $loc.__init__ = new Sk.builtin.func(init);
        
        }, 'Button', [s.Widget]);
        
// Checkbutton ---
	s.Checkbutton = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		var getHtml = function(self) {
			self.props.justify = 'left';
			self.onval = 1;
			self.offval = 0;
			if (self.props.onvalue) {
				self.onval = Sk.ffi.remapToJs(self.props.onvalue);
			}
			if (self.props.offvalue) {
				self.offval = Sk.ffi.remapToJs(self.props.offvalue);
			}
			var label = "";
			if (self.props.text) {
				label = Sk.ffi.remapToJs(self.props.text);
			}
			if (self.props.textvariable) {
				label = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				self.props.textvariable.updateID = self.id;
			}
			var checked = false;
			if (self.props.variable) {
				self.props.variable.updateID = self.id;
				v = Sk.ffi.remapToJs(self.props.variable.value);
				if (v === '') {
					self.props.variable.value = Sk.ffi.remapToPy(self.offval);
					v = self.offval;
				}
				if (v === self.onval) {
					checked = true;
				}
			}
			var html = '<div id="tkinter_' + self.id + '"><input type="checkbox"' + (checked ? ' checked' : '') + '>' + '<label id="l_' + self.id + '" for="tkinter_' + self.id + '">' + PythonIDE.sanitize(label) + '</label></div>';
			return html;
		}

		var init = function(kwa, self, master) {

			self.onShow = function() {

				$('#item_' + self.id).css({
					'margin-left': '0'
				});

				$('#tkinter_' + self.id + ' :checkbox').change(function() {
					var v = Sk.ffi.remapToJs($('#tkinter_' + self.id + " input").prop('checked'));
					if (self.props.variable) {
						if (v) {
							self.props.variable.value = Sk.ffi.remapToPy(self.onval);
						} else {
							self.props.variable.value = Sk.ffi.remapToPy(self.offval)
						}
					}
				});
			}

			self.update = function() {

				var checked = false;
				if (self.props.variable) {
					checked = (Sk.ffi.remapToJs(self.props.variable.value) === self.onval);
				}
				$('#tkinter_' + self.id + " input").prop('checked', checked);
				if (self.props.textvariable) {
					v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
					$('#l_' + self.id).text(Sk.ffi.remapToJs(v));
				}
			}

			commonWidgetConstructor(kwa, self, master, getHtml);
			self.hasLabel = true; //LW.push(self.id);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

	}, 'Checkbutton', [s.Widget]);

// Radiobutton ---
	s.Radiobutton = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {
			self.props.justify = 'left';
			var label = "";
			if (self.props.text) {
				label = Sk.ffi.remapToJs(self.props.text);
			}
			if (self.props.textvariable) {
				label = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
				self.props.textvariable.updateID = self.id;
			}
			var value = "";
			if (self.props.value) {
				value = "" + Sk.ffi.remapToJs(self.props.value);
			}

			var name = "default";
			if (self.props.variable) {
				name = "PY_VAR" + self.props.variable.id;
			}

			if (self.props.var) {
				self.props.variable = self.props.var
			}

			var checked = false;
			if (self.props.variable) {
				self.props.variable.updateID = self.id;
				if (
					Sk.ffi.remapToJs(self.props.variable?.value) ===
					Sk.ffi.remapToJs(self.props.value)
				) {
					checked = true;
				}
			}
			var html = '<div id="tkinter_' + self.id + '"><input name="' + name + '" type="radio" ' + (checked ? ' checked' : '') + ' value="' + PythonIDE.sanitize(value) + '">' +
				'<label id="l_' + self.id + '" for="tkinter_' + self.id + '">' + PythonIDE.sanitize(label) + '</label></div>';
			return html;
		}

		var init = function(kwa, self, master) {

			self.onShow = function() {
				$('#item_' + self.id).css({
					'margin-left': '0'
				});

				$('#tkinter_' + self.id + ' input').click(function() {
					if (self.props.variable) {
						var val = $('#tkinter_' + self.id + ' input').val();
						self.props.variable.value = Sk.ffi.remapToPy(val);
					}
				});
			}

			self.update = function() {
				var v = false;
				if (self.props.value) {
					v = Sk.ffi.remapToJs(self.props.value);
				}
				if (self.props.variable) {
					v = Sk.ffi.remapToJs(self.props.variable.value);
				}
				$('#tkinter_' + self.id + " input").prop('checked', v);
				if (self.props.textvariable) {
					v = "" + Sk.ffi.remapToJs(self.props.textvariable.value);
					$('#l_' + self.id).text(Sk.ffi.remapToJs(v));
				}
			}
			commonWidgetConstructor(kwa, self, master, getHtml);
			self.hasLabel = true; //LW.push(self.id);
		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		$loc.set = new Sk.builtin.func(function(self, value) {
			self.props.value = Sk.ffi.remapToJs(value); // ✅ правильно
			$('#tkinter_' + self.id + ' input').prop('checked', value);
		});
	}, 'Radiobutton', [s.Widget]);

// Listbox ---
	s.Listbox = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		const getHtml = function(self) {
			const items = self.items || [];
			const widthChars = self.props.width || 20;
			const heightLines = self.props.height || 6;

			let html = `<select id="tkinter_${self.id}" multiple  class="tk_charsized" style="width: ${widthChars}ch; height: ${heightLines}em;">`;

			for (let i = 0; i < items.length; i++) {
				html += `<option value="${i}">${PythonIDE.sanitize(items[i])}</option>`;
			}
			const selectmode = self.props.selectmode ? Sk.ffi.remapToJs(self.props.selectmode) : "single";
			if (selectmode === "multiple" || selectmode === "extended") {
				html += " multiple";
			}
			html += `</select>`;
			return html;
		};

		const init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
			self.items = [];

			// Support for listvariable
			if (self.props.listvariable) {
				const listVar = self.props.listvariable;
				listVar.updateID = self.id;

				const jsList = Sk.ffi.remapToJs(listVar.value);

				if (Array.isArray(jsList)) {
					self.items = jsList.map(item => item.toString());
				} else if (typeof jsList === "string") {
					self.items = jsList.trim().length > 0 ? jsList.trim().split(",") : [];
				} else {
					self.items = [];
				}

				listVar.linkedWidget = self;
			}

			self.onShow = function() {
				const el = $(`#tkinter_${self.id}`);
				el.off("change").on("change", function() {
					if (self.props.command) {
						Sk.misceval.callsimOrSuspend(self.props.command)
							.catch((e) => window.onerror(e.toString()));
					}
				});
			};

			self.insert = function(index, value) {
				const jsval = Sk.ffi.remapToJs(value);
				const el = $('#tkinter_' + self.id);

				let newOption = $('<option>', {
					text: jsval,
					value: self.items.length
				});

				if (index === "end" || (index.v && index.v === "end")) {
					el.append(newOption).trigger('change');
					self.items.push(jsval);
				} else {
					const pos = Sk.ffi.remapToJs(index);
					self.items.splice(pos, 0, jsval);
					if (pos >= el.children().length) {
						el.append(newOption);
					} else {
						el.children().eq(pos).before(newOption);
					}
					el.trigger('change');
				}
			};

			self.delete = function(first, last) {
				const el = $('#tkinter_' + self.id);
				const from = Sk.ffi.remapToJs(first);
				let to;

				if (typeof last === "undefined") {
					to = from;
				} else {
					to = (Sk.ffi.remapToJs(last) === "end") ?
						self.items.length - 1 :
						Sk.ffi.remapToJs(last);
				}

				if (from < 0 || from >= self.items.length || to < from) {
					throw new Sk.builtin.IndexError("listbox index out of range");
				}

				for (let i = to; i >= from; i--) {
					self.items.splice(i, 1);
					el.find(`option:eq(${i})`).remove();
				}
			};

			self.selection_set = function(self, first, last) {
				const el = document.getElementById("tkinter_" + self.id);
				const f = Sk.ffi.remapToJs(first);
				const l = Sk.ffi.remapToJs(last);

				for (let i = f; i <= l; i++) {
					if (el.options[i]) {
						el.options[i].selected = true;
					}
				}
			};

			self.selection_clear = function(self, first, last) {
				const el = document.getElementById("tkinter_" + self.id);
				const f = Sk.ffi.remapToJs(first);
				const l = Sk.ffi.remapToJs(last);

				for (let i = f; i <= l; i++) {
					el.options[i].selected = false;
				}
			};

			self.get = function(index, ilast) {
				const first = Sk.ffi.remapToJs(index);
				let last;
				let result = [];

				if (typeof ilast === "undefined") {
					last = first;
				} else {
					last = (Sk.ffi.remapToJs(ilast) === "end") ?
						self.items.length - 1 :
						Sk.ffi.remapToJs(ilast);
				}

				if (first >= 0 && last < self.items.length && first <= last) {
					for (let i = first; i <= last; i++) {
						result.push(Sk.ffi.remapToPy(self.items[i]));
					}
					return new Sk.builtin.tuple(result);
				} else {
					throw new Sk.builtin.IndexError("listbox index out of range");
				}
			};

			self.size = function() {
				return new Sk.builtin.int_(self.items.length);
			};

			self.curselection = function() {
				let selected = [];
				$(`#tkinter_${self.id} option:selected`).each(function() {
					selected.push(new Sk.builtin.int_($(this).index()));
				});
				return new Sk.builtin.tuple(selected);
			};
		};
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);
		$loc.insert = new Sk.builtin.func((self, index, value) => self.insert(index, value));
		$loc.delete = new Sk.builtin.func((self, first, last) => self.delete(first, last));
		$loc.get = new Sk.builtin.func((self, index, ilast) => self.get(index, ilast));
		$loc.selection_set = new Sk.builtin.func((self, first, last) => self.selection_set(self, first, last));
		$loc.selection_clear = new Sk.builtin.func((self, first, last) => self.selection_clear(self, first, last));
		$loc.size = new Sk.builtin.func(self => self.size());
		$loc.curselection = new Sk.builtin.func(self => self.curselection());

	}, "Listbox", [s.Widget]);

// SpinBox ---
	s.Spinbox = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		const getSpinData = function(self) {
			const inputVal = Sk.ffi.remapToJs($('#spinner_input_' + self.id).val().replace(/_/g, ""));
			let sv;

			if (self.props.values) {
				sv = new Sk.builtin.str(inputVal);
			} else {
				const numVal = Number(inputVal);
				sv = Number.isInteger(numVal) ?
					new Sk.builtin.int_(numVal) :
					new Sk.builtin.float_(numVal);
			}

			if (self.props.textvariable) {
				self.props.textvariable.value = sv;
			}

			return sv;
		};

		const getHtml = function(self) {
			let minVal = 0,
				maxVal = 100,
				step = 1;
			let startVal = 0;
			self._values = [];

			const useValues = !!self.props.values;

			if (useValues) {
				const vals = Sk.ffi.remapToJs(self.props.values);
				self._values = vals.map(val => String(val).replace(/_/g, ""));
				startVal = self._values[0] || "";
			} else {
				minVal = Sk.ffi.remapToJs(self.props.from_ || 0);
				maxVal = Sk.ffi.remapToJs(self.props.to || 100);
				step = Sk.ffi.remapToJs(self.props.increment || 1);
				startVal = minVal;
			}

			startVal = String(startVal).replace(/_/g, "");

			if (self.props.textvariable) {
				self.props.textvariable.updateID = self.id;
				self.props.textvariable.value = new Sk.builtin.str(startVal);
			}

			const id$ = `id='tkinter_${self.id}'`;
			const html = `
            <div ${id$} class="tk_charsized" style='margin: 5px 0; width: 120px; display: flex; gap: 4px; align-items: center; border: 1px solid gray; padding: 2px; border-radius: 4px;'>
                <input type='text' id='spinner_input_${self.id}' value='${startVal}' 
                    style='width: 100px; color: black; border: none; outline: none;'>
                <div style='display: flex; flex-direction: column; gap: 0px;'>
                    <button id='spinner_up_${self.id}' style='height: 10px; font-size: 8px;padding: 0;'>▲</button>
                    <button id='spinner_down_${self.id}' style='height: 10px; font-size: 8px;padding: 0;'>▼</button>
                </div>
            </div>
        `;

			return html;
		};

		const init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);

			self.onShow = function() {
				const $input = $('#spinner_input_' + self.id);
				const $up = $('#spinner_up_' + self.id);
				const $down = $('#spinner_down_' + self.id);

				$input.change(function() {
					getSpinData(self);
				});

				if (self.props.values) {
					let index = 0;
					const updateInput = () => {
						const val = self._values[index];
						$input.val(val);
						if (self.props.textvariable) {
							self.props.textvariable.value = new Sk.builtin.str(val);
						}
					};
					$up.click(() => {
						index = (index + 1) % self._values.length;
						updateInput();
					});
					$down.click(() => {
						index = (index - 1 + self._values.length) % self._values.length;
						updateInput();
					});
				} else {
					let val = Sk.ffi.remapToJs(self.props.from_ || 0);
					const minVal = Sk.ffi.remapToJs(self.props.from_ || 0);
					const maxVal = Sk.ffi.remapToJs(self.props.to || 100);
					const step = Sk.ffi.remapToJs(self.props.increment || 1);

					const updateInput = () => {
						$input.val(val);
						if (self.props.textvariable) {
							self.props.textvariable.value = new Sk.builtin.int_(val);
						}
					};

					$up.click(() => {
						val = Math.min(val + step, maxVal);
						updateInput();
					});
					$down.click(() => {
						val = Math.max(val - step, minVal);
						updateInput();
					});
				}
			};
		};

		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);
		$loc.get = new Sk.builtin.func(function(self) {
			return getSpinData(self);
		});

	}, 'Spinbox', [s.Widget]);



// Frame ---
	s.Frame = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		var getHtml = function(self) {
			var width = 200;
			var height = 100;
			if (self.props.width) {
				width = Sk.ffi.remapToJs(self.props.width);
			} else {
				self.props.width = width
			}

			if (self.props.height) {
				height = Sk.ffi.remapToJs(self.props.height);
			} else {
				self.props.height = height
			}

			return '<div id="tkinter_' + self.id + '" class="tk_pixelsized" style="margin:auto;width:' + width + 'px; height:' + height + 'px;"></div>';
		}

		var init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);

		}
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		//---------------------------------------

		$loc.__getattr__ = new Sk.builtin.func(function(self, name) {
			switch (Sk.ffi.remapToJs(name)) {
				case 'master':
					return self.master;
					break;
			};
		});

		$loc.mainloop = new Sk.builtin.func(function(self) {});
	}, 'Frame', [s.Widget]);

// Text ---
	s.Text = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		function parseIndex(text, indexStr) {
			if (indexStr === 'end') {
				return text.length;
			}
			const [rowStr, colStr] = indexStr.split('.');
			const row = parseInt(rowStr, 10) - 1;
			const col = parseInt(colStr, 10);
			const lines = text.split('\n');

			let offset = 0;
			for (let i = 0; i < row && i < lines.length; i++) {
				offset += lines[i].length + 1; // +1 for '\n'
			}
			return offset + col;
		}

		var getHtml = function(self) {
			self.props.textarea = true;
			let rows = self.props.height || 10; // height в рядках
			let cols = self.props.width || 40; // width у символах
			return `<textarea id="tkinter_${self.id}" class="tk_charsized" rows="${rows}" cols="${cols}" style="resize:none;"></textarea>`;
		}

		const init = function(kwa, self, master) {
			commonWidgetConstructor(kwa, self, master, getHtml);
		};
		init.co_kwargs = true;
		$loc.__init__ = new Sk.builtin.func(init);

		// Get the current text value
		$loc.get = new Sk.builtin.func(function(self) {
			return new Sk.builtin.str($('#tkinter_' + self.id).val());
		});

		// Focus the text widget
		$loc.focus = new Sk.builtin.func(function(self) {
			$('#tkinter_' + self.id).focus();
		});

		// Delete from index `first` to `last`
		$loc.delete_$rw$ = new Sk.builtin.func(function(self, first, last) {
			const $el = $('#tkinter_' + self.id);
			const val = $el.val();

			const start = parseIndex(val, Sk.ffi.remapToJs(first));
			let end = Sk.ffi.remapToJs(last);

			if (end === 'end') {
				end = val.length;
			} else {
				end = parseIndex(val, end);
			}

			const updated = val.slice(0, start) + val.slice(end);
			$el.val(updated).focus();
		});

		// Insert `newVal` at position `pos`
		$loc.insert = new Sk.builtin.func(function(self, pos, newVal) {
			const $el = $('#tkinter_' + self.id);
			const val = $el.val();
			let position = Sk.ffi.remapToJs(pos);
			newVal = Sk.ffi.remapToJs(newVal);

			if (position === 'end') {
				position = val.length;
			} else {
				position = parseIndex(val, position);
			}

			const updated = val.slice(0, position) + newVal + val.slice(position);
			$el.val(updated).focus();
		});

	}, "Text", [s.Widget]);


// TopLevel ---
	s.Toplevel = new Sk.misceval.buildClass(s, function($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function(self) {

			self.tk_left = 0;
			self.tk_top = 0;
			self.props = {};
			self.id = idCount++;
			if (!firstRoot) firstRoot = self;
			s.lastCreatedWin = self;
			var html = '<div id="tkinter_' + self.id + '" class="tkinter" class="tk_pixelsized" title="Tk"></div>';
			PythonIDE.python.output(html);
			$('#tkinter_' + self.id).dialog({
				width: 200,
				height: 200,
				open: function(event, ui) {
					$(this).parent().find(".ui-dialog-titlebar").css({
						"background-color": "#4b42d6",
						"color": "white"
					});
				},
				close: function() {
					if (self.closeMainLoop) {
						self.closeMainLoop();
					}
				}
			}).parent().css({
				position: "fixed",
				'background-color': '#BBB',
				'border': '1px solid #550',
				'box-shadow': '0 8px 16px rgba(0, 0, 0, 0.4)',
				'font-size': '12pt'
			});
			$('#tkinter_' + self.id).dialog({
				position: {
					my: "center",
					at: "center",
					of: window,
					offset: "100 100" // зсув на 50px вправо і 50px вниз
				}
			});
		});

		$loc.destroy = new Sk.builtin.func(function(self) {
			$('#tkinter_' + self.id).remove();
			if (self.closeMainLoop) {
				self.closeMainLoop();
			}
		});

		$loc.attributes = new Sk.builtin.func(function(self, key, val) {});


		$loc.configure = new Sk.builtin.func(configure);
		$loc.config = new Sk.builtin.func(configure);

		$loc.title = new Sk.builtin.func(function(self, title) {

			$('#tkinter_' + self.id).dialog('option', 'title', PythonIDE.sanitize(Sk.ffi.remapToJs(title)));
		});

		$loc.quit = new Sk.builtin.func(function(self) {
			if (self.closeMainLoop) {
				self.closeMainLoop();
			}
		});

		$loc.mainloop = new Sk.builtin.func(function(self, pyData) {
			return PythonIDE.runAsync(function(resolve, reject) {
				self.closeMainLoop = function() {
					cleanup();
					resolve();
				}
			});
		});

		$loc.register = new Sk.builtin.func(function(self, func) {
			return func;
		});

		$loc.geometry = new Sk.builtin.func(function(self, geometry) {
			if (geometry) {
				var size = Sk.ffi.remapToJs(geometry).split("x");
				$('#tkinter_' + self.id).dialog('option', {
					width: size[0],
					height: size[1]
				});
			}

		});
	}, "Toplevel", [s.Widget]);

// Tk main class ---
	s.Tk = new Sk.misceval.buildClass(s, function($gbl, $loc) {

		$loc.update = new Sk.builtin.func(function(self) {});

		$loc.update_idletasks = new Sk.builtin.func(function(self) {});

		$loc.__init__ = new Sk.builtin.func(function(self) {
			self.tk_left = 0;
			self.tk_top = 0;
			self.props = {};

			self.id = idCount++;
			if (!firstRoot) firstRoot = self;
			s.lastCreatedWin = self;
			var html = '<div id="tkinter_' + self.id + '" class="tkinter" class="tk_pixelsized" title="Tk" ></div>';
			PythonIDE.python.output(html);

			$('#tkinter_' + self.id).dialog({
				width: 300,
				height: 300,
				open: function(event, ui) {
					$(this).parent().find(".ui-dialog-titlebar").css({
						"background-color": "#025a9a",
						"color": "white"
					});
				},
				close: function() {
					if (self.closeMainLoop) {
						self.closeMainLoop();
					}
				}
			}).css({
				padding: '0px'
			}).parent().css({
				position: "fixed",
				'background-color': '#CCC',
				'border': '1px solid #225',
				'box-shadow': '0 8px 16px rgba(0, 0, 0, 0.4)',
				'font-size': '11pt',
				'line-height': '2em'
			});
			self.props.width = 300;
			self.props.height = 300;
			$('#tkinter_' + self.id).dialog({
				position: {
					my: "center",
					at: "center",
					of: window
				}
			});

			self.tk_left = Math.ceil($('#tkinter_' + self.id).offset().left - $(window).scrollLeft());
			self.tk_top = Math.ceil($('#tkinter_' + self.id).offset().top - $(window).scrollTop());

		});

		$loc.winfo_screenwidth = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_(window.screen.width);
		});

		$loc.winfo_screenheight = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_(window.screen.height);
		});

		$loc.winfo_x = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_(self.tk_left);
		});

		$loc.winfo_y = new Sk.builtin.func(function(self) {
			return new Sk.builtin.int_(self.tk_top);
		});

		$loc.destroy = new Sk.builtin.func(function(self) {
			$('#tkinter_' + self.id).remove();
			if (self.closeMainLoop) {
				self.closeMainLoop();
			}
		});

		$loc.attributes = new Sk.builtin.func(function(self, key, val) {});

		$loc.configure = new Sk.builtin.func(configure);
		$loc.config = new Sk.builtin.func(configure);

		$loc.title = new Sk.builtin.func(function(self, title) {

			$('#tkinter_' + self.id).dialog('option', 'title', PythonIDE.sanitize(Sk.ffi.remapToJs(title)));
		});

		$loc.quit = new Sk.builtin.func(function(self) {
			if (self.closeMainLoop) {
				self.closeMainLoop();
			}
		});

		$loc.mainloop = new Sk.builtin.func(function(self, pyData) {
			return PythonIDE.runAsync(function(resolve, reject) {
				self.closeMainLoop = function() {
					cleanup();
					resolve();
				}
			});
		});

		$loc.register = new Sk.builtin.func(function(self, func) {
			return func;
		});

		$loc.geometry = new Sk.builtin.func(function(self, geometry) {
			if (geometry) {

				let txt2 = Sk.ffi.remapToJs(geometry);
				let w = window.innerWidth;
				let h = window.innerHeight;

				txt2 = txt2.replaceAll('x', ':');
				txt2 = txt2.replaceAll('+', ':+');
				txt2 = txt2.replaceAll('-', ':-');
				const v = txt2.split(':');

				if (v.length === 4) {
					x_pos = Number(v[2]);
					y_pos = Number(v[3]);
					if (x_pos < 0) {
						x_pos = w + x_pos - v[0];
					}
					if (y_pos < 0) {
						y_pos = h + y_pos - v[1];
					}

					$('#tkinter_' + self.id).dialog({
						position: {
							my: 'left top',
							at: 'left+' + x_pos + ' top+' + y_pos,
							of: window
						},
					});
					self.tk_left = x_pos;
					self.tk_top = y_pos;
				}

				$('#tkinter_' + self.id).dialog('option', {
					width: v[0],
					height: v[1]
				});
				self.props.width = v[0];
				self.props.height = v[1];

				$('#tkinter_' + self.id).dialog("option", "resizable", false);
			}
		});

	}, 'Tk', [s.Widget]);

	//PythonIDE.python.output('<small>tkinter/Skulpt, by Pete Dring, 30042024</small><br><br>');

	s.ttk = new Sk.builtin.module();
	var ttk = function(name) {
		var t = {
			// ttk псевдоніми - працює як перенаправлення до tk-варіантів, зроблено для сумісності

			Button: s.Button,
			Checkbutton: s.Checkbutton,
			Radiobutton: s.Radiobutton,
			Label: s.Label,
			Entry: s.Entry,
			Frame: s.Frame,
			Scale: s.Scale,
			Spinbox: s.Spinbox
		};
// Combobox ---
        t.Combobox = new Sk.misceval.buildClass(t, function($gbl, $loc) {
        	var getHtml = function(self) {
        		var html = '<select id="tkinter_' + self.id + '" class="tk_charsized">';
        		if (self.props.values) {
        			var vals = Sk.ffi.remapToJs(self.props.values);
        			for (var i = 0; i < vals.length; i++) {
        				var val = PythonIDE.sanitize("" + vals[i]);
        				var selected = self.props.current && self.props.current == i;
        				html += '<option value="' + i + '"' + (selected ? ' selected' : '') + '>' + val + '</option>';
        			}
        		}
        		html += '</select>';
        		return html;
        	};
        
        	var init = function(kwa, self, master) {
        		commonWidgetConstructor(kwa, self, master, getHtml);
        
        		self.onShow = function() {
        			const select = $('#tkinter_' + self.id);
        			select.on('change', function() {
        				const selectedText = select.find("option:selected").text();
        				if (self.props.textvariable) {
        					self.props.textvariable.value = new Sk.builtin.str(selectedText);
        				}
        			});
        		};
        
        		self.update = function() {
        			if (self.props.textvariable) {
        				const value = Sk.ffi.remapToJs(self.props.textvariable.value);
        				const select = $('#tkinter_' + self.id);
        				select.find('option').each(function(index) {
        					if ($(this).text() === value) {
        						select.val(index);
        						self.props.current = index;
        						return false;
        					}
        				});
        			}
        		};
        
        		if (self.props.textvariable) {
        			self.props.textvariable.updateID = self.id;
        		}
        	};
        	init.co_kwargs = true;
        	$loc.__init__ = new Sk.builtin.func(init);
        
        	$loc.current = new Sk.builtin.func(function(self, item) {
        		var val = Sk.ffi.remapToJs(item);
        		$('#tkinter_' + self.id).val(val);
        		self.props.current = val;
        	});
        
        	$loc.set = new Sk.builtin.func(function(self, value) {
        		let target = Sk.ffi.remapToJs(value);
        		let select = $('#tkinter_' + self.id);
        		let found = false;
        
        		select.find('option').each(function(index) {
        			if ($(this).text() === target) {
        				select.val(index);
        				self.props.current = index;
        				found = true;
        				return false;
        			}
        		});
        
        		if (!found) {
        			let newIndex = select.children().length;
        			select.append('<option value="' + newIndex + '" selected>' + PythonIDE.sanitize(target) + '</option>');
        			self.props.current = newIndex;
        		}
        
        		if (self.props.textvariable) {
        			self.props.textvariable.value = new Sk.builtin.str(target);
        		}
        	});
        
        	$loc.get = new Sk.builtin.func(function(self) {
        		const value = $('#tkinter_' + self.id + ' option:selected').text();
        		return new Sk.builtin.str(value);
        	});
        
        }, 'Combobox', [s.Widget]);

// Separator ---
		t.Separator = new Sk.misceval.buildClass(t, function($gbl, $loc) {
			const getHtml = function(self) {
				let html = "";
				const id = `tkinter_${self.id}`;

				if (self.props.orient) {
					const orient = Sk.ffi.remapToJs(self.props.orient);
					if (orient === "vertical") {
						// Вертикальна лінія: вузький блок з border
						html = `<div id="${id}" class="tk_pixelsized" style="display:inline-block; width:1px; height:100px; background-color:gray; margin:0 5px;"></div>`;
					} else {
						// Горизонтальна лінія
						html = `<hr id="${id}" class="tk_pixelsized" style="margin:5px 0;">`;
					}
				} else {
					// За замовчуванням горизонтальна
					html = `<hr id="${id}" class="tk_pixelsized" style="margin:5px 0;">`;
				}

				return html;
			};

			const init = function(kwa, self, master) {
				commonWidgetConstructor(kwa, self, master, getHtml);
			};
			init.co_kwargs = true;

			$loc.__init__ = new Sk.builtin.func(init);
		}, "Separator", [s.Widget]);


// Progressbar ---
		t.Progressbar = new Sk.misceval.buildClass(s, function($gbl, $loc) {
			const getHtml = function(self) {
				let value = 0;
				let maximum = 100;
				self._mode = self.props.mode ? Sk.ffi.remapToJs(self.props.mode) : "determinate";

				if (self.props.maximum) {
					maximum = Sk.ffi.remapToJs(self.props.maximum);
				}

				if (self.props.variable) {
					if (typeof self.props.variable.value === "undefined") {
						self.props.variable.value = Sk.ffi.remapToPy(value);
					}
					value = Sk.ffi.remapToJs(self.props.variable.value);
					self.props.variable.updateID = self.id;
				} else if (self.props.value) {
					value = Sk.ffi.remapToJs(self.props.value);
				}

				const isIndeterminate = self._mode === "indeterminate";
				const attrs = isIndeterminate ? "" : `max="${maximum}" value="${value}"`;

				return `<progress id="tkinter_${self.id}" ${attrs} class="tk_pixelsized" style="height: 10px; width: 100%;"></progress>`;
			};

			const init = function(kwa, self, master) {
				commonWidgetConstructor(kwa, self, master, getHtml);

				self.update = function() {
					const el = document.getElementById("tkinter_" + self.id);
					if (!el || self._mode === "indeterminate") return;

					let v = 0;
					if (self.props.variable) {
						v = Sk.ffi.remapToJs(self.props.variable.value || Sk.ffi.remapToPy(0));
					} else if (self.props.value) {
						v = Sk.ffi.remapToJs(self.props.value);
					}
					el.value = v;
				};

				// indeterminate start
				self.start = function() {
					if (self._mode !== "indeterminate") return;
					const el = document.getElementById("tkinter_" + self.id);
					if (el) {
						el.removeAttribute("value");
					}
				};

				self.stop = function() {
					if (self._mode !== "indeterminate") return;
					const el = document.getElementById("tkinter_" + self.id);
					if (el) {
						el.setAttribute("value", "0");
					}
				};

				self.step = function(amount) {
					// Заглушка для indeterminate
				};

				setTimeout(() => {
					self.tkWidget = document.getElementById("tkinter_" + self.id);
				}, 0);
			};

			init.co_kwargs = true;
			$loc.__init__ = new Sk.builtin.func(init);

			$loc.__setitem__ = new Sk.builtin.func(function(self, key, value) {
				key = Sk.ffi.remapToJs(key);
				if (key === "value") {
					if (self.props.variable) {
						self.props.variable.value = value;
					} else {
						self.props.value = value;
					}
					self.update();
				}
				return Sk.builtin.none.none$;
			});

			$loc.__getitem__ = new Sk.builtin.func(function(self, key) {
				key = Sk.ffi.remapToJs(key);
				if (key === "value") {
					if (self.props.variable) {
						return self.props.variable.value;
					} else {
						return self.props.value || Sk.ffi.remapToPy(0);
					}
				}
				return Sk.builtin.none.none$;
			});

			// Методи start, stop, step
			$loc.start = new Sk.builtin.func(function(self) {
				self.start();
				return Sk.builtin.none.none$;
			});

			$loc.stop = new Sk.builtin.func(function(self) {
				self.stop();
				return Sk.builtin.none.none$;
			});

			$loc.step = new Sk.builtin.func(function(self, inc) {
				self.step(inc);
				return Sk.builtin.none.none$;
			});

		}, 'Progressbar', [s.Widget]);



		return t;
	}

// tkinter.colorchooser ---
	s.colorchooser = new Sk.builtin.module();

	(function() {
		// Допоміжна функція: конвертація HEX у RGB
		function hexToRgb(hex) {
			const bigint = parseInt(hex.slice(1), 16);
			return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
		}

		// Основна функція askcolor
		const askcolor = new Sk.builtin.func(function() {
			return Sk.misceval.promiseToSuspension(new Promise((resolve) => {
				const input = document.createElement('input');
				input.type = 'color';
				input.value = '#000000';
				input.style.position = 'fixed';
				input.style.left = '-1000px';
				document.body.appendChild(input);

				input.addEventListener('input', () => {
					const color = input.value;
					const rgb = hexToRgb(color);
					resolve(
						new Sk.builtin.tuple([
							new Sk.builtin.tuple(rgb.map(x => new Sk.builtin.int_(x))),
							new Sk.builtin.str(color)
						])
					);
					input.remove();
				}, {
					once: true
				});

				input.click();
			}));
		});

		// Додавання функції до модуля
		s.colorchooser.$d = {
			askcolor: askcolor
		};

		// Реєстрація модуля у sys.modules
		const modName = new Sk.builtin.str("tkinter.colorchooser");
		Sk.sysmodules.mp$ass_subscript(modName, s.colorchooser);
	})();

// Заглушка для tkinter.font ---
	var font_mod = new Sk.builtin.module({});
	font_mod.$d = new Sk.builtin.dict();

	font_mod.$d.mp$ass_subscript(
		new Sk.builtin.str("Font"),
		Sk.builtin.none.none$
	);

	s.font = font_mod;
	//--------------------

	s.ttk.$d = new ttk("tkinter.ttk");
	const pyModName0 = new Sk.builtin.str("tkinter.ttk");
	Sk.sysmodules.mp$ass_subscript(pyModName0, s.ttk);

// message box ---
	s.messagebox = new Sk.builtin.module();
	var messagebox = function(name) {
		var m = {};

		function msgOutput(title, message, msg) {
			if (!title) title = new Sk.builtin.str("");
			if (!message) message = new Sk.builtin.str("");
			title = PythonIDE.sanitize("" + Sk.ffi.remapToJs(title));
			message = PythonIDE.sanitize("" + Sk.ffi.remapToJs(message));
			return PythonIDE.runAsync(function(resolve, reject) {
				var html = '<div id="tkinter_show' + msg + '" title="' + title + '">' +
					'<p><img style="vertical-align:middle" src="./media/' + msg + '.png" width="48" height="48">' +
					'     ' + message +
					'</p><br><button id="btn_tkinter_dlg_ok" class="btn_tkinter_dlg">OK</button></div>';
				PythonIDE.python.output(html);
				$('#tkinter_show' + msg).dialog();
				$('.btn_tkinter_dlg').button().click(function(e) {
					var id = e.currentTarget.id.split("_")[3];
					resolve();
					$('#tkinter_show' + msg).remove();
				});
			});
		}
		m.showinfo = new Sk.builtin.func(function(title, message) {
			msgOutput(title, message, 'info');
		});

		m.showwarning = new Sk.builtin.func(function(title, message) {
			msgOutput(title, message, 'warning');
		});

		m.showerror = new Sk.builtin.func(function(title, message) {
			msgOutput(title, message, 'error');
		});

		m.askyesno = new Sk.builtin.func(function(title, message) {
			if (!title) title = new Sk.builtin.str("");
			if (!message) message = new Sk.builtin.str("");
			title = PythonIDE.sanitize("" + Sk.ffi.remapToJs(title));
			message = PythonIDE.sanitize("" + Sk.ffi.remapToJs(message));

			return PythonIDE.runAsync(function(resolve, reject) {

				var html = '<div id="tkinter_askyesno" title="' + title + '">' +
					'<p><img style="vertical-align:middle" src="./media/yesno.png" width="48" height="48">' +
					'     ' + message +
					'<br><br><button id="btn_tkinter_dlg_yes" class="btn_tkinter_dlg">Yes</button>' +
					'<button id="btn_tkinter_dlg_no" class="btn_tkinter_dlg">No</button></div>';
				PythonIDE.python.output(html);
				$('#tkinter_askyesno').dialog();
				$('.btn_tkinter_dlg').button().click(function(e) {
					var id = e.currentTarget.id.split("_")[3];
					resolve(new Sk.builtin.bool(id == "yes"));
					$('#tkinter_askyesno').remove();
				});
			});
		});
		return m;
	};

	s.messagebox.$d = new messagebox("tkinter.messagebox");
	const pyModName1 = new Sk.builtin.str("tkinter.messagebox");
	Sk.sysmodules.mp$ass_subscript(pyModName1, s.messagebox);


// simpledialog ---
	s.simpledialog = new Sk.builtin.module();
	var simpledialog = function(name) {
		var m = {};

		function createPrompt(title, prompt, parseFunc, resolve) {
			const dialogId = "simpledialog_" + Math.random().toString(36).substring(2);
			const html = `
            <div id="${dialogId}" title="${title || 'Input'}" style="overflow-x: hidden;">
                <p>${prompt || ''}</p>
                <input type="text" id="${dialogId}_input" style="width:100%; margin-top:5px;" autofocus>
            </div>
        `;
			$("body").append(html);

			const $dialog = $("#" + dialogId);
			const $input = $("#" + dialogId + "_input");

			// Обробка натискання Enter
			$input.on("keypress", function(event) {
				if (event.which === 13) { // Enter key code
					const value = $input.val();
					$dialog.dialog("close");
					$dialog.remove();
					try {
						resolve(parseFunc(value));
					} catch {
						resolve(Sk.builtin.none.none$);
					}
				}
			});

			$dialog.dialog({
				modal: true,
				buttons: {
					OK: function() {
						const value = $input.val();
						$(this).dialog("close");
						$(this).remove();
						try {
							resolve(parseFunc(value));
						} catch {
							resolve(Sk.builtin.none.none$);
						}
					},
					Cancel: function() {
						$(this).dialog("close");
						$(this).remove();
						resolve(Sk.builtin.none.none$);
					}
				},
				width: 250,
				open: function(event, ui) {
					$(this).parent().find(".ui-dialog-titlebar").css({
						"background-color": "#d63c00",
						"color": "white"
					});
				},
				close: function() {
					$(this).remove();
				}
			}).parent().css({
				position: "fixed",
				'background-color': '#EEE',
				'border': '1px solid #225',
				'box-shadow': '0 8px 16px rgba(0, 0, 0, 0.4)',
				'font-size': '11pt',
				'line-height': '1em'
			});
		}

		function makeAsyncDialog(parseFunc) {
			return new Sk.builtin.func(function(title, prompt) {
				Sk.builtin.pyCheckArgs("ask", arguments, 2, 2);
				title = Sk.ffi.remapToJs(title);
				prompt = Sk.ffi.remapToJs(prompt);

				return Sk.misceval.promiseToSuspension(
					new Promise((resolve) => {
						createPrompt(title, prompt, parseFunc, (result) => {
							resolve(Sk.ffi.remapToPy(result));
						});
					})
				);
			});
		}

		m.askstring = makeAsyncDialog((val) => val);
		m.askinteger = makeAsyncDialog((val) => {
			const i = parseInt(val);
			if (isNaN(i)) throw new Error("Invalid integer");
			return i;
		});
		m.askfloat = makeAsyncDialog((val) => {
			const f = parseFloat(val);
			if (isNaN(f)) throw new Error("Invalid float");
			return f;
		});

		return m;
	};

	s.simpledialog.$d = new simpledialog("tkinter.simpledialog");
	const pyModName3 = new Sk.builtin.str("tkinter.simpledialog");
	Sk.sysmodules.mp$ass_subscript(pyModName3, s.simpledialog);

//------------------------------   

	return s;
};
