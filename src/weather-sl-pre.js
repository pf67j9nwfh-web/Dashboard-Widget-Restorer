/* Snow Leopard's weather artwork uses names instead of Tiger icon arrays. MIT. */
var accuweatherIcons=[],accuweatherMiniIcons=[];
for(var twI=0;twI<50;twI++)accuweatherIcons[twI]=accuweatherMiniIcons[twI]='clouds';
var twIconNames={1:'sun',2:'partlycloudy',3:'partlycloudy',7:'clouds',11:'fog',12:'rain',15:'lightening',18:'rain',22:'snow',26:'rain&snow',33:'moon',34:'moon-partlycomboclouds',35:'moon-partlycomboclouds'};
for(var twK in twIconNames){accuweatherIcons[twK-1]=twIconNames[twK];accuweatherMiniIcons[twK-1]=twIconNames[twK];}
accuweatherIcons[33]=accuweatherIcons[34]=['moon','partlycomboclouds'];
