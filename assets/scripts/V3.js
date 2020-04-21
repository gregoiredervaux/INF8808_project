// Temps moyen d'un trajet en semaine de A à B à différentes heures

// TODO
// Créer des boutons pour la sélection des scénarios selon le nombre de trajets
// Rappeler l'animation de zoom de la carte et reset des données selon click de bouton
// X Créer une liste ordonnée des stations à parcourir avec le temps de déplacement entre
// X Toutes les stations sont un rond de la couleur de la ligne sauf noir pour double ou Berri-UQAM
// X Créer une ligne reliant chacune des stations en gris
// Zoom de la carte pour que toutes les stations de l'itinéraire soient visibles
// X Mettre toutes les stations et tunnels non-utilisés en opacité faible
// Animer le trajet d'une personne en changeant la couleur de sa ligne en noir (1 minute = 1 seconde?)
// Avoir une sélection de l'heure de départ
// Ajouter les incidents sur le trajet qui retardent le déplacement

var trajets = [[["Sherbrooke", "Mont-Royal", "Laurier", "Rosemont", "Beaubien", "Jean Talon", "De Castelnau", "Parc", "Acadie", "Outremont", "Édouard-Montpetit", "Université de Montréal"],
                [          1,            1,         1,          2,          1,            1,              8,      1,        2,           1,                   2,                        1]],
               [["Sherbrooke", "Berri-UQAM", "Champs-de-Mars", "Place-d'Armes", "Square-Victoria", "Bonaventure", "Lucien L'Allier", "Georges-Vanier", "Lionel Groulx", "Charlevoix", "Lasalle"],
                [          1,            1,               2,               1,                      1,             1,                 1,                2,               6,            2,         1]],
               [["Sherbrooke", "Berri-UQAM", "Saint-Laurent", "Place-Des-Arts", "McGill", "Peel", "Guy-Concordia", "Atwater", "Lionel Groulx", "Charlevoix", "Lasalle"],
                [          1,            1,               6,                1,        1,      2,               1,         1,               2,            2,         1]]]

const multi_lines_stations = ["Lionel Groulx", "Snowdon", "Jean Talon", "Berri-UQAM"];

// Création d'une carte complète du métro
function create_map_v3(g, data, lines, x, y, buttons)
{
    var data_by_lines = Object.keys(lines).map(line => {
        return {name: line, stations: lines[line].map(pt_station => {
            return data.find(station => station.id === pt_station)
        })}
    });

    // Création du conteneur d'éléments
    var line_conteneur = g.append("g")

    // Pour chaque ligne du métro
    data_by_lines.forEach(line =>
        {
        // Attribuer un id à la ligne selon sa couleur
        line_conteneur.attr("id", `line_${line.name}`);

        // Pour chaque stations de la ligne
        line.stations.forEach(station =>
        {
            // Coordonnées de la station
            var cx1 = station.coordinates_map.cx;
            var cy1 = station.coordinates_map.cy;

            // Trouver la station précédente c0 et suivante c2
            var c0 = line.stations.find(st => {
                return st.id === lines[line.name][lines[line.name].indexOf(parseInt(station.id)) - 1]
            });
            var c2 = line.stations.find(st => {
                return st.id === lines[line.name][lines[line.name].indexOf(parseInt(station.id)) + 1]
            });

            // Trouver les coordonnées de la station précédente et suivante si elles existent
            if (c0!==undefined) {
                var cx0 = c0.coordinates_map.cx;
                var cy0 = c0.coordinates_map.cy;
            }
            if (c2!==undefined) {
                var cx2 = c2.coordinates_map.cx;
                var cy2 = c2.coordinates_map.cy;
            }

            // Création des points de stations, opaques
            line_conteneur.append("circle")
                .attr("cx", x(cx1))
                .attr("cy", y(cy1))
                .attr("r", 5)
                .attr("fill", line.name)
                .attr("fill-opacity", 1) // TODO Changer pour un CSS
                .attr("name", station.name)
                .attr("class", "scenarioCircle");

            // Lignes entre les stations
            if (c2!==undefined) {
                // Création des lignes statiques entre stations, en gris
                line_conteneur.append("line")
                    .attr("x1", x(cx1))
                    .attr("y1", y(cy1))
                    .attr("x2", x(cx2))
                    .attr("y2", y(cy2))
                    .attr("stroke-width", 1)
                    .attr("stroke", "grey"); // TODO changer pour un CSS

                // Création des lignes dynamiques qui montreront le déplacement
                // De façon temporaire avec longueur de 0
                line_conteneur.append("line")
                    .attr("x1", x(cx1))
                    .attr("y1", y(cy1))
                    .attr("x2", x(cx1))
                    .attr("y2", y(cy1))
                    .attr("name", station.name)
                    .attr("nextName", c2.name)
                    .attr("stroke-width", 2)
                    .attr("stroke", "black")
                    .attr("class", "scenarioLine");
            }

            // Création des noms de stations
            line_conteneur.append("text")
                .attr("x", x(station.coordinates_map.cx) + 5)
                .attr("y", y(station.coordinates_map.cy))
                .attr("font-size", "10px")
                .attr("font-family", "Arial") // TODO Changer pour un CSS
                .text(station.name);
        }); // line.stations.forEach(station =>
    }); // data_by_lines.forEach(line =>

    // Création des boutons de façon dynamique
    // TODO mettre des espaces entre les boutons avec CSS
    // TODO mettre les boutons grisés quand ils sont clickés
    buttons
        .selectAll('button')
        .data(trajets)
        .enter()
        .append('button')
        .on('click', function(d, i) { init_scenario(i) })
        //.on('click', function(d, i) { start_scenario(i) })
        .attr('type', 'button')
        .text(function(d, i) { return 'Scénario ' + (1+i) });

    // Chargement du scénario
    function init_scenario(scenario)
    {
        clearScenario();
        // TODO remettre les boutons à non-clickés

        // Garder les stations et temps du trajet selon le scénario
        var stations_scenario = trajets[scenario][0];
        var temps_scenario = trajets[scenario][1];

        // Mettre les stations du trajet opaques
        line_conteneur.selectAll(".scenarioCircle").each(function(d, i) {
            stations_scenario.forEach(station_trajet => {
                if (d3.select(this).attr("name") === station_trajet)
                    d3.select(this).attr("fill-opacity", 1);
            });
        });

        // Coordonnées minimum et maximum du zoom selon le scénario
        var min_x;
        var min_y;
        var max_x;
        var max_y;

        // Si la station existe dans le trajet
        var station_existe_dans_trajet;

        // Pour chaque lignes du métro
        data_by_lines.forEach(line =>
        {
            // Pour chaque stations de la ligne 
            line.stations.forEach(station =>
            {
                // Coordonnées ajustées de la station
                var cx1 = x(station.coordinates_map.cx);
                var cy1 = y(station.coordinates_map.cy);

                // Initialiser à false la station recherchée
                station_existe_dans_trajet = false;

                // Trouver si la station actuelle fait partie d'un des scénarios
                stations_scenario.forEach(station_trajet => {
                    if (station.name === station_trajet)
                        station_existe_dans_trajet = true
                });
                
                // Ajuster les coordonnées min et max qui cadrent le zoom
                if (station_existe_dans_trajet) {
                    // Initialiser les valeurs de min et max si indéfinis
                    if (min_x == undefined) min_x = cx1;
                    if (min_y == undefined) min_y = cy1;
                    if (max_x == undefined) max_x = cx1;
                    if (max_y == undefined) max_y = cy1;

                    min_x = Math.min(min_x, cx1);
                    min_y = Math.min(min_y, cy1);
                    max_x = Math.max(max_x, cx1);
                    max_y = Math.max(max_y, cy1);
                }
            }); // line.stations.forEach(station =>
        }); // data_by_lines.forEach(line =>
    } // function initScenario(num)

    // Démarre le scénario,
    function start_scenario(scenario)
    {
        // Garder les stations et temps du trajet selon le scénario
        var stations_scenario = trajets[scenario][0];
        var temps_scenario = trajets[scenario][1];

        line_conteneur.selectAll(".scenarioLine").each(function(d, i) {
            stations_scenario.forEach(station => {
                if (d3.select(this).attr("name") === station) 
                {
                    //TODO: Progressivement augmenter x2 et y2 vers cx et cy, selon le temps assigné à cette station.
                    var index = stations_scenario.indexOf(station);
                    var deltaT = temps_scenario[index] * 60;
                    var current_line = this;
                    
                    line_conteneur.selectAll(".scenarioLine").select(function(h) {
                        if (d3.select(this).attr("name") === d3.select(current_line).attr("nextName"))
                        {

                            var direction_x = d3.select(this).attr("x1") - d3.select(current_line).attr("x1");
                            var direction_y = d3.select(this).attr("y1") - d3.select(current_line).attr("y1");
                            var direction_x_t = direction_x / deltaT;
                            var direction_y_t = direction_y / deltaT;
    
                            var current_line_position_x;
                            var current_line_position_y;
                            var new_line_position_x;
                            var new_line_position_y;
                            console.log(d3.select(current_line).attr("x2") <= parseFloat(d3.select(this).attr("x1")) + 1);
                            console.log(d3.select(current_line).attr("x2") >= parseFloat(d3.select(this).attr("x1")) - 1);
                            console.log(d3.select(current_line).attr("y2") <= parseFloat(d3.select(this).attr("y1")) + 1);
                            console.log(d3.select(current_line).attr("y2") >= parseFloat(d3.select(this).attr("y1")) - 1);
                            console.log("----------");

                            while ( !(d3.select(current_line).attr("x2") <= parseFloat(d3.select(this).attr("x1")) + 1 && 
                                    d3.select(current_line).attr("x2") >= parseFloat(d3.select(this).attr("x1")) - 1 && 
                                    d3.select(current_line).attr("y2") <= parseFloat(d3.select(this).attr("y1")) + 1 &&
                                    d3.select(current_line).attr("y2") >= parseFloat(d3.select(this).attr("y1")) - 1))
                            {
                                console.log("entered");
                                current_line_position_x = d3.select(current_line).attr("x2");
                                current_line_position_y = d3.select(current_line).attr("y2");
                                new_line_position_x = parseFloat(current_line_position_x) + parseFloat(direction_x_t);
                                new_line_position_y = parseFloat(current_line_position_y) + parseFloat(direction_y_t);

                                console.log(new_line_position_x);
                                console.log(new_line_position_y);
                                console.log("-----");

                                d3.select(current_line).attr("x2", new_line_position_x);
                                d3.select(current_line).attr("y2", new_line_position_y);
                            }
                        }
                    });
                    //TODO: Une fois fini, il faut recommencer pour la prochaine station, ainsi jusqu'au dernier
                    //TODO: Faire bouger un personnage selon la progression
                }
            });
        });
    } // function startScenario(num)

    // Remise à neuf de la carte
    function clearScenario()
    {
        line_conteneur.selectAll(".scenarioCircle").each(function(d,i) {
            d3.select(this).attr("fill-opacity", 0.2);
        });

        line_conteneur.selectAll(".scenarioLine").each(function(d,i) {
            d3.select(this).attr("x2", d3.select(this).attr("x1"));
            d3.select(this).attr("y2", d3.select(this).attr("y1"));
        });
    } // function clearScenario()
} // function create_map_v3(g, data, lines, x, y)
