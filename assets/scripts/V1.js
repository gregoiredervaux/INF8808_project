
// Fonction qui crée les 24 rectangles qui désigne les heures
function create_rectangles(svg_1, width, height){

    var hours_in_a_day = d3.range(1,25);

    var rectangles = svg_1.selectAll("rect")
        .data(hours_in_a_day)
        .enter()
        .append("rect")
        .attr("width",20)
        .attr("height",20)
        .attr("x",function(d){return (width/30)*d+width/20})
        .attr("y",0.85*height)
        .classed("unselected_hour", true)
        .append("title")
        .text(function(d){return d}); //Change the tooltip for a hover action


/*
    svg_1.append("rect")
            .attr("x", 30)
            .attr("y", 30)
            .attr("width",20)
            .attr("height",20);
* */
};





//http://www.cagrimmett.com/til/2016/08/19/d3-pie-chart.html


// Fonction qui détecte l'heure de début et de fin sélectionnées par l'utilisateur
// Défini par le brush sur les 24 carrées
// Peut être fait en comptant le nombre d'éléments dont la classe est ''sélectionnée''
// g est l'élément SVG qui contient la V1
// Retourne l'heure de début et de fin

//http://bl.ocks.org/paradite/71869a0f30592ade5246
//https://stackoverflow.com/questions/38155793/d3-js-pie-chart-clock
//https://bl.ocks.org/matt-mcdaniel/267ba6445f61371012d7/46f983e306527cee788bb0ac632b87faf294d96d
//http://bl.ocks.org/mbostock/1096355
//EXACTEMENT CELA QUE L'ON VEUT FAIRE http://bl.ocks.org/lgersman/5311083 

// Fonction qui change la class de certain rectangle de unselected_hour à selected_hour et vice versa
// Éventuellement, on veut un drag selection comme http://bl.ocks.org/lgersman/5311083 
// Pour l'instant, avec le click selection, on pourrait avoir une sélection discontinue 
// Cela poserait des problèmes pour déterminer le début et la fin de l'intervalle
function select_rectangles(){

    // On trouve tous les éléments qui sont des rectangles
    var rectangles = d3.selectAll("rect");
    // Lorsque l'on clique sur un des rectangles, on change sa classe (sélection ou désélection)
    rectangles.on("click", function(d,i)
    {
        var rectangle = d3.select(this);
        var current_class = rectangle.attr("class");

        if (current_class == "unselected_hour")
        {
            rectangle.attr("class", "selected_hour")
        }
        else if (current_class == "selected_hour")
        {
            rectangle.attr("class", "unselected_hour")
        }

        // Affichage du nombre de rectangles sélectionnées
        var sel_rect = d3.selectAll(".selected_hour")._groups;
        sel_rect.forEach (row => console.log(row));
    });
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
//https://observablehq.com/@d3/pie-chart
function create_piechart(dataset, svg_1, width, height, radius)  {


    // configuration de l'échelle de couleur
    var color = d3.scaleOrdinal()
                  .range(["#019535 ","#B4B4B4"]);

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

    var svg_moved = svg_1.append('g')
                   .attr("transform", "translate(" + width/2 + "," + height/2.5 +")");
    // on ajoute les données du pie sur chacun des arcs
    var g = svg_moved.selectAll("arc")
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