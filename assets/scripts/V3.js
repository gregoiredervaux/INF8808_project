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
                [          0,            1,         1,          2,          1,            1,              8,      1,        2,           1,                   2,                        1]],
               [["Sherbrooke", "Berri-UQAM", "Champs-de-Mars", "Place-d'Armes", "Square-Victoria", "Bonaventure", "Lucien L'Allier", "Georges-Vanier", "Lionel Groulx", "Charlevoix", "Lasalle"],
                [          0,            1,               2,               1,                      1,             1,                 1,                2,               6,            2,         1]],
               [["Sherbrooke", "Berri-UQAM", "Saint-Laurent", "Place-Des-Arts", "McGill", "Peel", "Guy-Concordia", "Atwater", "Lionel Groulx", "Charlevoix", "Lasalle"],
                [          0,            1,               6,                1,        1,      2,               1,         1,               2,            2,         1]]]

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
                .attr("name", station.name);

            // Création des lignes entre stations, en gris
            if (c2!==undefined) {
                line_conteneur.append("line")
                    .attr("x1", x(cx1))
                    .attr("y1", y(cy1))
                    .attr("x2", x(cx2))
                    .attr("y2", y(cy2))
                    .attr("stroke-width", 1)
                    .attr("stroke", "grey"); // TODO changer pour un CSS
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

    buttons
        .selectAll('button')
        .data(trajets)
        .enter()
        .append('button')
        .attr('type', 'button')
        .text(function(d, i) { return 'Scénario ' + (1+i) });

    // TODO À assigner dans une fonction
    // Assigne des functions aux boutons de scénarios
    // var scenario_button_1 = document.getElementById("S1");
    // var scenario_button_2 = document.getElementById("S2");
    // var scenario_button_3 = document.getElementById("S3");
    // if (scenario_button_1 != undefined) scenario_button_1.addEventListener("click", function(){initScenario(1);});
    // if (scenario_button_2 != undefined) scenario_button_2.addEventListener("click", function(){initScenario(2);});
    // if (scenario_button_3 != undefined) scenario_button_3.addEventListener("click", function(){initScenario(3);});

    // Chargement du scénario
    function init_scenario(scenario)
    {
        clearScenario();

        // À voir
        // line_conteneur.selectAll(".scenarioCircle").each(function(d,i) {
        //     stations_scenario_1.forEach(station_trajet => {
        //         if (d3.select(this).attr("name") === station_trajet)
        //             d3.select(this).attr("fill-opacity", 1);
        //     });
        // });

        // Garder les stations et temps du trajet selon le scénario
        var stations_scenario = trajets[scenario][0];
        var temps_scenario = trajets[scenario][1];

        // Coordonnées minimum et maximum du zoom selon le scénario
        var min_x;
        var min_y;
        var max_x;
        var max_y;

        // Si la station existe dans le trajet
        var station_existe_dans_trajet;

        // Pour chaque lignes du métro
        data_by_lines.forEach(line => {

            // Pour chaque stations de la ligne 
            line.stations.forEach(station => {

                // Coordonnées de la station
                var cx1 = station.coordinates_map.cx;
                var cy1 = station.coordinates_map.cy;

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

                console.log(min_x);

                // Modification des points de stations
                // line_conteneur.append("circle")
                // .attr("cx", x(cx1))
                // .attr("cy", y(cy1))
                // .attr("r", 5)
                // .attr("fill", line.name)
                // .attr("fill-opacity", 0.2)
                // .attr("name", station.name)
                // .attr("class", station_existe_dans_trajet ? "scenarioCircle" : "");

                // //Dynamique
                // line_conteneur.append("line")
                // .attr("x1", x(cx1))
                // .attr("y1", y(cy1))
                // .attr("x2", x(cx1))
                // .attr("y2", y(cy1))
                // .attr("stroke-width", 1)
                // .attr("stroke", "black")
                // .attr("name", station.name)
                // .attr("class", station_existe_dans_trajet ? "scenarioLine" : "");
            }); // line.stations.forEach(station =>
        }); // data_by_lines.forEach(line =>
    } // function initScenario(num)

    // Démarre le scénario,
    function startScenario(num)
    {
        line_conteneur.selectAll(".scenarioLine").each(function(d,i) {
            stations_scenario.forEach(station_trajet => {
                //if (d3.select(this).attr("name") === station_trajet)
                            //TODO: Progressivement augmenter x2 et y2 vers cx et cy, selon le temps assigné à cette station.
                            //dynamic_line.x2 = 
                            //dynamic_line.y2 = 

                            //TODO: Une fois fini, il faut recommencer pour la prochaine station, ainsi jusqu'au dernier
                            //TODO: Faire bouger un personnage selon la progression
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
