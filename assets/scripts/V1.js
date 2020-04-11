
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
        .attr("id", function(d,i){return "rect_"+d;})
        .classed("unselected_hour", true)
        .append("title")
        .text(function(d){return d}); // Éventuellement, un vrai tooltip

    var opening_hours = d3.range(5,25);
    opening_hours.forEach(function(hour)
    {
        var rect_name = "rect_"+hour;
        
        var open_rect = d3.select("#"+rect_name);
        open_rect.classed("unselected_hour", false);
        open_rect.classed("selected_hour", true);
    }
    )
};





//http://www.cagrimmett.com/til/2016/08/19/d3-pie-chart.html

//http://bl.ocks.org/paradite/71869a0f30592ade5246
//https://stackoverflow.com/questions/38155793/d3-js-pie-chart-clock
//https://bl.ocks.org/matt-mcdaniel/267ba6445f61371012d7/46f983e306527cee788bb0ac632b87faf294d96d
//http://bl.ocks.org/mbostock/1096355
//EXACTEMENT CELA QUE L'ON VEUT FAIRE http://bl.ocks.org/lgersman/5311083 

// Fonction qui change la class de certain rectangle de unselected_hour à selected_hour et vice versa
// Éventuellement, on veut un drag selection comme http://bl.ocks.org/lgersman/5311083 
// Pour l'instant, avec le click selection, on pourrait avoir une sélection discontinue 
// Cela poserait des problèmes pour déterminer le début et la fin de l'intervalle
function select_rectangles(dataset, svg_1, width, height, radius){

    // On trouve tous les éléments qui sont des rectangles
    var rectangles = d3.selectAll("rect");

    // Lorsque l'on clique sur un des rectangles, on change sa classe (sélection ou désélection)
    // Et on met à jour le piechart
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
        // Chaque rectangle possède un id
        // Ce id est de la forme "rect_HOUR" où HOUR est un chiffre de 1 à 24.
        // On va chercher tous les id de rectangle sélectionné pour déterminé l'intervalle de temps à considérer
        var sel_rect = d3.selectAll(".selected_hour")._groups;
        var id_array = new Array();
        
        sel_rect.forEach (function (row)
        {
            row.forEach(function(rect)
            {
                // Le numéro du rectangle se trouve de l'incide 5 à 7 dans le format du id
                id_array.push(parseInt(rect.id.slice(5,7)));
            })
        })

        
        
        var nb_select = id_array.length;
        var begin = d3.min(id_array);
        var end = d3.max(id_array);

        // Check si la sélection est consécutive (seulement à cause de la sélection par clique)
        // Éventuellement, le drag va assurer que la sélection est un intervalle continue
        if (begin + nb_select != end +1 )
        {
            console.log("Sélection non-consécutive!!!");
        };
        

        // On créer le dataset maintenant que l'on a begin et end
        var piechart_dataset = count_incidents(dataset, begin, end);

        // On update le piechart
        // BESOIN DE FAIRE UNE FONCTION QUI UPDATE!!!!! LE PIECHART ET NON QUI LE RECRÉ
        create_piechart(piechart_dataset, svg_1, width, height, radius);
        //update_piechart(piechart_dataset,);
        

        
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

// Fonction qui update le piechart, avec une transition
// On ne veut pas refaire tout le piechart à chaque fois que la sélection de l'utiliateur change
function update_piechart(dataset, pie)
{

};