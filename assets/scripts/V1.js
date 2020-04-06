
//http://www.cagrimmett.com/til/2016/08/19/d3-pie-chart.html


// Fonction qui détecte l'heure de début et de fin sélectionnées par l'utilisateur
// Défini par le brush sur les 24 carrées
// Peut être fait en comptant le nombre d'éléments dont la classe est ''sélectionnée''
// g est l'élément SVG qui contient la V1
// Retourne l'heure de début et de fin
function select_begin_end(g){

};


// Fonction qui détermine le nombre d'incidents dans l'intervalle sélectionné
// On lui fourni l'heure de début (sur 24) et l'heure de fin (sur 24) de l'intervalle
// Retourne le nombre d'incident dans l'intervalle et hors de l'intervalle sous la forme [{'name':'nombre_incident_dans_intervalle', 'number':123},{'name':'nombre_incident_hors_intervalle','number':844}]
function count_incidents(dataset, begin, end){

    
    // Initialisation
    var hours = new Array();

    // On extrait la colonne d'heure de début des incidents
    dataset.forEach(row => 
                        hours.push(parseInt(row["Heure de l'incident"].slice(0,2)))
                   )

    // On corrige les heures de débuts supérieures à 24
    hours.some(function(d,i){
        if(d>24){
            hours[i] = d-24;
        };
    });
        
    // Sélectionne les incidents de begin à 24
    var above = hours.filter(d => begin <= d );

    // Sélectionne les incidents de begin à end
    var number_in = above.filter(d => d <=end ).length;

    // Détermine le nombre d'incidents à l'extérieur de l'intervalle
    var number_out = hours.length - number_in;

    // piechart_dataset est pret pour la fonction create_piechart
    return piechart_dataset = [{"name":"Incidents dans l'intervalle", 'number':number_in},{"name":"Incidents hors de l'intervalle",'number':number_out}];

};











// dataset est de la forme [{'name':'nombre_incident_dans_intervalle', 'number':123},{'name':'nombre_incident_hors_intervalle','number':844}]
// g est le groupe SVG dans lequel le piechart doit être
function create_piechart(dataset) {

    // dimensions du piechart
    var width = 430,
	height = 400,
    radius = Math.min(width, height) / 2;

    // configuration de l'échelle de couleur
    var color = d3.scaleOrdinal()
                  .range(["#CA290D ","#B4B4B4"]);

    // initialisation d'un objet piechart de d3         
    var pie = d3.pie()
                .value(function(d) { return d.number; })(dataset);

    // initialisation des arcs
    var arc = d3.arc()
	            .outerRadius(radius - 10)
	            .innerRadius(0);

    // initialisation des arcs pour les étiquettes
    var labelArc = d3.arc()
	                .outerRadius(radius - 80)
                    .innerRadius(radius - 80);

    // création de l'élément SVG qui contient le piechart
    // ajout d'un g au centre de SVG qui va être le centre du piechart
    var svg = d3.select("#canvasV1")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                    .append('g')
                    .attr("transform", "translate(" + width/2 + "," + height/2 +")");

    // on ajoute les données du pie sur chacun des arcs
    var g = svg.selectAll("arc")
                .data(pie)
                .enter()
                .append("g")
                    .attr("class", "arc");

    // on trace les arcs (ajout du path)
    g.append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data.name);});


    // ajout des étiquettes
    g.append("text")
	 .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
	 .text(function(d) { 
         return d.data.number;
     })
     .style("fill", "#000")
     .style("font-size","20px")
     .attr("text-anchor","middle");
    
    

    

};