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

// Création d'une carte zoomée sur les stations d'intérêt à l'étude selon 3 cas
function create_map_zoomed(g, data, lines, x, y, buttons, scenario) {

    var data_by_lines = Object.keys(lines).map(line => {
        return {name: line, stations: lines[line].map(pt_station => {
            return data.find(station => station.id === pt_station)
        })}
    });

    // Garder les stations et temps du trajet selon le scénario
    var stations_trajet = trajets[scenario][0];
    var temps_trajet = trajets[scenario][1];

    // Coordonnées minimum et maximum du zoom selon le scénario
    var min_x;
    var min_y;
    var max_x;
    var max_y;

    // Si la station existe dans le trajet
    var station_existe_dans_trajet;

    // Pour chaque station de ligne
    data_by_lines.forEach(line => {

        // Attribuer un id à la ligne selon sa couleur
        var line_conteneur = g.append("g")
        .attr("id", `line_${line.name}`);

        line.stations.forEach(station => {
            // Coordonnées de la station
            var cx1 = station.coordinates_map.cx;
            var cy1 = station.coordinates_map.cy;
            station_existe_dans_trajet = false;

            // Trouver si la station actuelle fait partie du scénario
            stations_trajet.forEach(station_trajet => {
                if (station.name === station_trajet)
                    station_existe_dans_trajet = true
                // Initialiser les valeurs de min et max si indéfinis
                if (min_x == undefined) min_x = cx1;
                if (min_y == undefined) min_y = cy1;
                if (max_x == undefined) max_x = cx1;
                if (max_y == undefined) max_y = cy1;
                // Ajuster les coordonnées min et max qui cadrent le zoom
                if (station_existe_dans_trajet) {
                    min_x = d3.min(min_x, cx1)
                    min_y = d3.min(min_y, cy1)
                    max_x = d3.max(max_x, cx1)
                    max_y = d3.max(max_y, cy1)
                }
            });

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

            line_conteneur.append("circle")
                .attr("class", "all")
                .attr("cx", x(station.coordinates_map.cx))
                .attr("cy", y(station.coordinates_map.cy))
                .attr("r", 5)
                .attr("fill", multi_lines_stations.indexOf(station.name) !== -1 ? "black" : line.name)
                .attr("fill-opacity", station_existe_dans_trajet ? 1 : 0.5);

            if (c2!==undefined) {
                line_conteneur.append("line")
                    .attr("x1", x(cx1))
                    .attr("y1", y(cy1))
                    .attr("x2", x(cx2))
                    .attr("y2", y(cy2))
                    .attr("stroke-width", 1)
                    .attr("stroke", "grey");
            }
        });
    
        var textContainer = line_conteneur.selectAll("text")
            .data(line.stations)
            .enter()
            .append("text")
            .attr("x", d => x(d.coordinates_map.cx) + 5)
            .attr("y", d => y(d.coordinates_map.cy))
            .text(d => d.name);
    });
}