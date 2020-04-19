
function create_rectangles(svg_1)
{
    /*
    Fonction qui crée les 24 rectangles qui désigne les heures
    svg_1 est l'élément SVG qui contient le piechart
    La fonction ne retourne rien. Elle ne fait qu'afficher les rectangles
     */

    // Dimensions de l'élément SVG
    var width = svg_1.attr("width");
    var height = svg_1.attr("height");

    // Permet d'itérer sur les 24 heures d'une journée
    var hours_in_a_day = d3.range(1,25);

    // On crée et positionne chacun des rectangles
    var rectangles = svg_1.selectAll("rect")
        .data(hours_in_a_day)
        .enter()
        .append("g")
        .append("rect")
        .attr("width",0.03*width)
        .attr("height",0.03*width)
        .attr("x",function(d){return (width/30)*d+width/20})
        .attr("y",0.85*height)
        .attr("id", function(d,i){return "rect_"+d;})
        .classed("unselected_hour", true);


    // On ajoute les étiquettes (l'heure) de chaque rectangle
    var text = svg_1.selectAll("text")
                    .data(hours_in_a_day)
                    .enter()
                    .append("text")
                    .text(function(d,i){return d+"h"})
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "15px")
                    .attr("fill", "white")
                    .attr("id", function(d,i){return "text_"+d;});


    // On positionne ces étiquettes au-dessus de chaque rectangle
    var text_labels = text.attr("x",function(d){return (width/30)*d+width/20})
                          .attr("y",0.84*height)



    // L'affichage intiial est selon les heures d'ouverture du métro, soit de 5h à 24h
    // On affiche les étiquettes pour les heures 5 et 24
    var opening_hours = d3.range(5,25);
    d3.select("#text_" + d3.min(opening_hours)).attr("fill", "#009DE0");
    d3.select("#text_" + d3.max(opening_hours)).attr("fill", "#009DE0");


    // On augmente l'opacité de chacun des rectangles dans les heures d'ouvertures pour souligner la sélection
    opening_hours.forEach(function(hour)
    {
        var rect_name = "rect_"+hour;
        var open_rect = d3.select("#"+rect_name);
        open_rect.classed("unselected_hour", false);
        open_rect.classed("selected_hour", true);
    }
    )
};





function create_absolut_display(dataset, svg_1)
{
    /*
    Fonction qui crée l'affichage du nombre absolut d'incidents dans l'intervalle sélectionné
    dataset contient le nombre d'incidents dans l'intervalle et hors l'intervalle
    dataset est la sortie de la fonction count_incidents
    svg_1 est l'élément SVG qui contient la V1
    La fonction ne retourne rien
     */

    // Dimensions de l'élément SVG
    var width = svg_1.attr("width");
    var height = svg_1.attr("height"); 

    // Calcul du nombre total d'incidents du jeu de données
    var total = dataset[0]['number']+dataset[1]['number'];

    // Positionnement du nombre total d'incidents dans l'intervalle
    var abs_in_number = svg_1.append("text")
                      .attr("id", "abs_in_number")
                      .text(dataset[0]["number"]+" / "+total)
                      .attr("font-family", "sans-serif")
                      .attr("font-size", "20px")
                      .attr("fill", "#019535")
                      .attr("text-anchor","end")
                      .attr("x", 880)
                      .attr("y", height/2.5);

    // Positionnement du texte accompagnant le nombre d'incidents dans l'intervalle
    var abs_in_context = svg_1.append("text")
                      .attr("id", "abs_in_context")
                      .text("incidents")
                      .attr("font-family", "sans-serif")
                      .attr("font-size", "20px")
                      .attr("fill", "#019535")
                      .attr("text-anchor","end")
                      .attr("x", 880)
                      .attr("y", height/2.5+30);
};





function update_absolut_display(dataset)
{
    /*
    Fonction qui met à jour l'affichage du nombre absolut d'incidents
    dataset est la sortie de count_incidents
    La fonction ne retourne rien
     */

     // Re-calcul du nombre d'incidents selon le nouvel intervalle sélectionné
    var total = dataset[0]["number"]+dataset[1]["number"];
    var to_update = d3.select("#abs_in_number");

    // Mise à jour du texte de l'élément
    to_update.text(dataset[0]["number"]+" / "+total);
};





function select_rectangles(dataset, svg_1, radius)
{
    /*
    Fonction qui enregistre la nouvelle sélection de l'utilisateur
    Appel également les fonctions pour mettre à jour les affichages (piechart, pourcentage et nombre d'incidents)
    dataset est la sortie de count_incidents
    svg_1 est l'élément SVG contenant le piechart
    radius est le rayon du piechart
    La fonction ne retourne rien
     */

     // Dimensions de l'élément SVG
    var width = svg_1.attr("width");
    var height = svg_1.attr("height"); 
    
    // Lorsque l'utilisateur fait un clique gauche de souris, tous les rectangles sont désélectionnés
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


    function select_with_mouse()
    {
        // Mecanisme pour assurer une sélection consécutive
        var sel_rect = d3.selectAll(".selected_hour")._groups;

        // Si aucune heure n'est sélectionnée, on peut sélectionner n'importe quelle heure
        if (sel_rect[0].length == 0)
        {
            d3.select(this)
            .classed("unselected_hour",false)
            .classed("selected_hour",true);
        }

        // Si des heures sont sélectionnées, on regarde les voisins de l'heure que l'on essaie de sélectionner
        // Si au moins un voisin est déjà sélectionné, alors on peut sélectionner cette heure
        // Assure une sélection consécutive
        // Cas spéciaux pour les heures 1 et 24 (possède un seul voisin)
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
        };

        // Affichage du tooltip lors du mouseover
        var tooltip = d3.selectAll('.toolTip');
        tooltip.style("left", (d3.event.pageX) + "px")
              .style("top","835" + "px")
              .style("display", "inline-block")
              .style("border", "1px solid #009De0")
              .style("min-width", "10px")
              .style("height", "8px")
              .text(parseInt(this.id.slice(5,8))+"h")
              .style("color", "#009De0");

        // On détermine toutes les heures qui sont actuellement sélectionnées
        sel_rect = d3.selectAll(".selected_hour")._groups;
        var id_array = new Array(); 
        sel_rect.forEach (function (row)
        {
            row.forEach(function(rect)
            {
                // Le numéro du rectangle se trouve de l'indice 5 à 7 dans le format du id
                id_array.push(parseInt(rect.id.slice(5,7)));
            })
        })

        // On veut afficher l'heure du premier et dernier rectangle de la sélection
        // On affichage également en permanence la boite de référence présentant les heures de pointes
        var first_text = d3.selectAll("#text_"+d3.min(id_array));
        var last_text = d3.selectAll("#text_"+d3.max(id_array));
        var rush_hour = d3.selectAll(".rush_hour");
        var all_text = d3.selectAll("text").filter(function(d){if(Number.isInteger(d)){return d}});
        all_text.attr("fill", "none");
        first_text.attr("fill", "#009De0");
        last_text.attr("fill", "#009De0");
        rush_hour.attr("fill","black");

        // On détermine la première et dernière heure sélectionnée
        var begin = d3.min(id_array);
        var end = d3.max(id_array);

        // On créer le nouveau dataset qui doit être affiché dans le piechart
        var new_piechart_dataset = count_incidents(dataset, begin, end);

        // On met à jour le piechart et le nombre absolut d'incidents affiché
        update_absolut_display(new_piechart_dataset);
        update_piechart(new_piechart_dataset, radius);
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





function rush_hours(dataset, svg_1)
{
    /*
    Fonction qui ajoute l'affichage pour les heures de pointes
    dataset est la liste de tous les incidents (chaque ligne est un incident et chaque colonne est un attribut, dont l'heure de début et de fin)
    svg_1 est l'élément SVG contenant le piechart
    La fonction ne retourne rien
    */

    // Dimensions de l'élément SVG
    var width = svg_1.attr("width");
    var height = svg_1.attr("height"); 
    
    // On trouve le nombre d'incidents aux heures de pointes du matin et du soir
    var data_morning = count_incidents(dataset, 7, 9);
    var data_evening = count_incidents(dataset, 16, 18);
    var total = dataset.length;
    
    // On crée l'affichage
    var rush_hour_text = svg_1
                        .append("text")
                        .attr("class","rush_hour")
                        .attr("text-decoration", "underline")
                        .text("Heures de pointe")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "20px")
                        .attr("fill", "black")
                        .attr("text-anchor","start")
                        .attr("x","83.333")
                        .attr("y", height/2.5);

    var morning_text = svg_1
                        .append("text")
                        .attr("class","rush_hour")
                        .text("7h à 9h: "+ Math.round(100*data_morning[0]['number']/total)+"%")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "20px")
                        .attr("fill", "black")
                        .attr("text-anchor","start")
                        .attr("x","83.333")
                        .attr("y", height/2.5+25);

    var evening_text = svg_1
                        .append("text")
                        .attr("class","rush_hour")
                        .text("16h à 18h: "+ Math.round(100*data_evening[0]['number']/total)+"%")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "20px")
                        .attr("fill", "black")
                        .attr("text-anchor","start")
                        .attr("x","80")
                        .attr("y", height/2.5+50);
};





function count_incidents(dataset, begin, end)
{
    /*
    Fonction qui détermine le nombre d'incidents dans l'intervalle sélectionné
    dataset est les données tabulaire dont chaque ligne représente un incident
    begin est un integer qui détermine le début de l'intervalle
    end est un integer qui détermine la fin de l'intervalle
    La fonction retourne le résultat sous la forme [{'name':'nombre_incident_dans_intervalle', 'number':123},{'name':'nombre_incident_hors_intervalle','number':844}]
    */

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

    // Filtre les incidents de begin à end
    var number_in = above.filter(d => d <=end ).length;

    // Détermine le nombre d'incidents à l'extérieur de l'intervalle
    var number_out = hours.length - number_in;

    // piechart_dataset est pret pour la fonction create_piechart
    return piechart_dataset = [{"name":"Incidents dans l'intervalle", 'number':number_in},{"name":"Incidents hors de l'intervalle",'number':number_out}];
};





function create_piechart(dataset, svg_1,radius)
{
    /*
    Fonction qui crée le premier piechart intial
    dataset est la sortie de la fonction count_incidents
    svg_1 est l'élément SVG qui contient le piechart
    radius est le rayon du piechart
    La fonction ne retourne rien
    */

    // Dimensions de l'élément SVG
    var width = svg_1.attr("width");
    var height = svg_1.attr("height"); 
    
    // configuration de l'échelle de couleur
    var color = d3.scaleOrdinal()
                  .range(["#019535","#f2f2f2"]);


    // sort et sortValue permettent de toujours avoir le pourcentage "dans l'intervalle" commencant à angle=0
    var pie = d3.pie()
                .sort(null)
                .sortValues(null)
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
                   .attr("transform", "translate(" + width/2 + "," + height/2.5 +")")
                   .attr("id", "the_piechart");
                
    // on ajoute les données du pie sur chacun des arcs
    var g = svg_moved.selectAll("arc")
                .data(pie)
                .enter()
                .append("g")
                    .attr("class", "arc");

    // g2 va servir à mettre les étiquettes (pour ne pas être cach.es par les path du piechart)
    var g2 = svg_moved.selectAll("arc2")
                     .data(pie)
                     .enter()
                     .append("g")
                        .attr("class", "arc");

    // on trace les arcs (ajout du path)
    g.append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data.name);});


    // calcul du nombre total d'incident pour déterminer le pourcentage dans l'intervalle
    var total_incidents = dataset[0]["number"] + dataset[1]["number"];

    // ajout des étiquettes sur g2 pour ne pas que les paths cachent les étiquettes
    g2.append("text")
	 .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
	 .text(function(d) { 
         return (Math.round(100*d.data.number/total_incidents)).toString()+"%";
     })
     .style("fill", "#000")
     .style("font-size","20px")
     .attr("text-anchor","middle");
};





function update_piechart(dataset, radius)
{
        /*
        Fonction qui met à jour le piechart
        dataset est la sortie de count_incidents
        radius est le rayon du piechart
        La fonction ne retourne rien
        */
        
        // On va chercher par son id le piechart déja existant
        var old_pie = d3.select("#the_piechart");

        // configuration de l'échelle de couleur
        var color = d3.scaleOrdinal()
        .range(["#019535 ","#f2f2f2"]);

        // On calcul le layout pour le pie selon le snouvelles données
        var pie = d3.pie()
        .sort(null)
        .sortValues(null)
        .value(function(d) { return d.number; })(dataset)

        // On enlève les arcs du piechart actuel
        old_pie.selectAll('.arc')
            .remove()
            .exit();

         // initialisation des nouveaux arcs
        var arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

        // initialisation des nouveaux arcs pour les étiquettes
        var labelArc = d3.arc()
                .outerRadius(radius - 80)
                .innerRadius(radius - 80);

        // on ajoute les données du pie sur chacun des arcs
        var g = old_pie.selectAll("arc")
            .data(pie)
            .enter()
            .append("g")
                .attr("class", "arc");

        // g2 va servire à mettre les étiquettes (pour ne pas être cacher par les path du piechart)
        var g2 = old_pie.selectAll("arc2")
                .data(pie)
                .enter()
                .append("g")
                    .attr("class", "arc");


        // on trace les arcs (ajout du path)
        g.append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data.name);});


        // calcul du nombre total d'incident pour déterminer le pourcentage dans l'intervalle
        var total_incidents = dataset[0]["number"] + dataset[1]["number"];


        // ajout des étiquettes sur g2 pour ne pas que les paths cachent les étiquettes
        g2.append("text")
        .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
        .text(function(d) { 
        return (Math.round(100*d.data.number/total_incidents)).toString()+"%";
        })
        .style("fill", "#000")
        .style("font-size","20px")
        .attr("text-anchor","middle");
};