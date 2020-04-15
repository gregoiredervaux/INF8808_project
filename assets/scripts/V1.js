
// Fonction qui crée les 24 rectangles qui désigne les heures
function create_rectangles(svg_1, width, height){

    var hours_in_a_day = d3.range(1,25);

    var rectangles = svg_1.selectAll("rect")
        .data(hours_in_a_day)
        .enter()
        .append("rect")
        .attr("width",0.03*width)
        .attr("height",0.03*width)
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







function select_rectangles(dataset, svg_1, width, height, radius){
    
    
    // When mouse is down, unselect all hours
    svg_1.on("mousedown", function() 
    {
        d3.event.preventDefault();
        var hours = d3.range(1,25);
        hours.forEach(function(hour)
        {
            var rect_name = "rect_"+hour;
            var one_rect = d3.select("#"+rect_name)
                             .classed("selected_hour", false)
                             .classed("unselected_hour",true);
        });

    });


    


    // On exécute select_with_mouse() lorsque l'on survol et click un rectangle
    // Ainsi, lorsque l'on clique pour tout dé-sélectionner, ce rectangle ce sélectionne sans avoir à faire des aller-retours
    function select_with_mouse()
    {
        // Mecanisme pour assurer une sélection consécutive
        var sel_rect = d3.selectAll(".selected_hour")._groups;

        // Si aucune n'est sélectionnée, on peut sélectionner n'importe quelle heure
        if (sel_rect[0].length == 0)
        {
            d3.select(this)
            .classed("unselected_hour",false)
            .classed("selected_hour",true);
        }

        // Si des heures sont sélectionnées, on regarde les voisins de l'heure que l'on essaie de sélectionner
        // Si au moins un voisin est déjà sélectionné, alors on peut sélectionner cette heure
        // Assure une sélection consécutive
        // Cas spéciaux pour les heures 1 et 24
        else
        {
            var id_string = this.id;
            var id_number = parseInt(id_string.slice(5,8));
            if (id_number == 1)
            {
                var status_before = false;
                var status_after = d3.select("#rect_2").classed("selected_hour");
            }
            else if (id_number == 24)
            {
                var status_before = d3.select("#rect_23").classed("selected_hour");
                var status_after = false;
            }
            else
            {            
            var id_before = "rect_"+parseInt(id_number-1);
            var id_after = "rect_"+parseInt(id_number+1);
            var status_before = d3.select("#"+id_before).classed("selected_hour");
            var status_after = d3.select("#"+id_after).classed("selected_hour");
            };


            

            if (status_before || status_after)
            {
                d3.select(this)
                  .classed("unselected_hour",false)
                  .classed("selected_hour",true);
            };
            
        }

        // Affichage du tooltip lors du mouseover
        console.log(this.x['baseVal'].value);
        var tooltip = d3.selectAll('.toolTip');
        tooltip
              .style("left",0+"px")
              .style("top",0+"px")
              .style("display", "inline-block")
              .html(parseInt(this.id.slice(5,8))+"h");

        
        sel_rect = d3.selectAll(".selected_hour")._groups;
        var id_array = new Array(); 
        
        sel_rect.forEach (function (row)
        {
            row.forEach(function(rect)
            {
                // Le numéro du rectangle se trouve de l'incide 5 à 7 dans le format du id
                id_array.push(parseInt(rect.id.slice(5,7)));
            })
        })
        //var first_rect = d3.selectAll("#rect_"+d3.min(id_array));
        //var last_rect = d3.selectAll("#rect_"+d3.max(id_array));

        var nb_select = id_array.length;
        var begin = d3.min(id_array);
        var end = d3.max(id_array);

        

        // On créer le dataset maintenant que l'on a begin et end
        var new_piechart_dataset = count_incidents(dataset, begin, end);

        // On update le piechart
        // BESOIN DE FAIRE UNE FONCTION QUI UPDATE!!!!! LE PIECHART ET NON QUI LE RECRÉ
        create_piechart(new_piechart_dataset, svg_1, width, height, radius);
        //update_piechart();
    };


    // On trouve tous les éléments qui sont des rectangles
    var rectangles = d3.selectAll("rect");
    rectangles.on("mouseover", select_with_mouse);
    rectangles.on("click", select_with_mouse);
    
    // Enlever le tooltip lorsque on ne survol plus les rectangles
    rectangles.on('mouseout', function()
    {
        d3.selectAll('.toolTip').style("display", "none");
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
                .value(function(d) { return d.number; })(dataset)
 
   


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
    

    // Making sure "incident dans l'intervalle" always starts at angle = 0
    if (pie[0].startAngle!=0)
    {   
        pie[0].startAngle = 0;
        pie[0].endAngle = 2*Math.PI - pie[1].endAngle;
        pie[1].startAngle = pie[0].endAngle;
        pie[1].endAngle = 2*Math.PI;   
    }
    

    // on trace les arcs (ajout du path)
    g.append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data.name);});
    

    // calcul du nombre total d'incident pour déterminer le pourcentage dans l'intervalle
    var total_incidents = dataset[0]["number"] + dataset[1]["number"];
    

    // ajout des étiquettes
    g.append("text")
	 .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
	 .text(function(d) { 
         return (Math.round(100*d.data.number/total_incidents)).toString()+"%";
     })
     .style("fill", "#000")
     .style("font-size","20px")
     .attr("text-anchor","middle")


   
    
    

    

};

//https://jonsadka.com/blog/how-to-create-adaptive-pie-charts-with-transitions-in-d3
// Source: https://bl.ocks.org/mbostock/1346410
// Fonction qui update le piechart, avec une transition
// On ne veut pas refaire tout le piechart à chaque fois que la sélection de l'utiliateur change
// La premiere version de la V1 créer un NOUVEAU piechart à chaque sélection, au lieu de simplement updater
function update_piechart()
{

};



