// Temps moyen d'un trajet en semaine de A à B à différentes heures

// TODO
// X Créer des boutons pour la sélection des scénarios selon le nombre de trajets
// X Rappeler l'animation de zoom de la carte et reset des données selon click de bouton
// X Créer une liste ordonnée des stations à parcourir avec le temps de déplacement entre
// X Toutes les stations sont un rond de la couleur de la ligne sauf noir pour double ou Berri-UQAM
// X Créer une ligne reliant chacune des stations en gris
// X Zoom de la carte pour que toutes les stations de l'itinéraire soient visibles
// X Mettre toutes les stations et tunnels non-utilisés en opacité faible
// X Animer le trajet d'une personne en changeant la couleur de sa ligne en noir (1 minute = 1 seconde?)
// X Avoir une sélection de l'heure de départ
// Ajouter les incidents sur le trajet qui retardent le déplacement

var trajets = [[["Sherbrooke", "Mont-Royal", "Laurier", "Rosemont", "Beaubien", "Jean Talon", "De Castelnau", "Parc", "Acadie", "Outremont", "Édouard-Montpetit", "Université de Montréal"],
                [          0,            1,         1,          2,          1,            1,              8,      1,        2,           1,                   2,                        1],
                [          0,            2,         2,          1,          3,            1,              4,      3,        2,           1,                   2,                        1]],
                [["Sherbrooke", "Berri-UQAM", "Champs-de-Mars", "Place-d'Armes", "Square-Victoria", "Bonaventure", "Lucien L'Allier", "Georges-Vanier", "Lionel Groulx", "Charlevoix", "Lasalle"],
                [          0,            1,               2,               1,                      1,             1,                 1,                2,               6,            2,         1],
                [          0,            3,               1,               2,                      2,             3,                 1,                1,               4,            2,         1]],
                // Scénarios temporaires de test, sauf le dernier
               [["Honoré-Beaugrand", "Radisson"],
                [0, 1],
                [0, 2]],
               [["Côte-Vertu", "Du Collège"],
                [0, 1],
                [0, 2]],
               [["Beaudry", "Berri-UQAM", "Jean-Drapeau", "Longueuil"],
                [0, 1, 2, 3],
                [0, 2, 3, 2]],
               [["Plamondon", "Côte-Ste-Catherine", "Snowdon", "Côte-des-Neiges", "Université de Montréal"],
                [0, 1, 2, 3, 4],
                [0, 1, 3, 1, 5]],
               [["Sherbrooke", "Berri-UQAM", "Saint-Laurent", "Place-Des-Arts", "McGill", "Peel", "Guy-Concordia", "Atwater", "Lionel Groulx", "Charlevoix", "Lasalle"],
                [          0,            1,               6,                1,        1,      2,               1,         1,               2,            2,         1],
                [          0,            2,               3,                2,        1,      3,               1,         3,               1,            1,         1]]]

var format_time = d3.timeFormat("%H:%M");
var parse_time = d3.timeParse("%H:%M");

var time = [parse_time('9:00'), parse_time('17:00')];

const multi_lines_stations = ["Lionel Groulx", "Snowdon", "Jean Talon", "Berri-UQAM"];
var is_multi_line = false;
var is_multi_line_init = false;

var current_scenario = -1;

// Création d'une carte complète du métro
function create_map_v3(g, data, lines, x, y, button_panel, time_panel)
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

            //Vérifie si une instance de station à multiple ligne est déjà créé ou non
            is_multi_line = multi_lines_stations.includes(station.name);
            is_multi_line_init = false;

            if(is_multi_line)
                is_multi_line_init = !line_conteneur.selectAll(".scenarioCircle").select(function(h, j) {return d3.select(this).attr("name") === station.name}).empty();

            if(!is_multi_line_init)
            {
                // Création des points de stations, opaques
                line_conteneur.append("circle")
                .attr("cx", x(cx1))
                .attr("cy", y(cy1))
                .attr("r", 5)
                .attr("fill", is_multi_line ? "black" : line.name)
                .attr("fill-opacity", 1) // TODO Changer pour un CSS
                .attr("name", station.name)
                .attr("class", "scenarioCircle");

                // Création des noms de stations
                line_conteneur.append("text")
                .attr("x", x(station.coordinates_map.cx) + 5)
                .attr("y", y(station.coordinates_map.cy))
                .attr("font-size", "10px")
                .attr("font-family", "Arial") // TODO Changer pour un CSS
                .text(station.name);
            }

            if (c2!==undefined) {
                // Création des lignes statiques entre stations, en gris
                line_conteneur.append("line")
                    .attr("x1", x(cx1))
                    .attr("y1", y(cy1))
                    .attr("x2", x(cx2))
                    .attr("y2", y(cy2))
                    .attr("stroke-width", 1)
                    .attr("stroke", "grey"); // TODO changer pour un CSS
            }

            // Création des lignes dynamiques qui montreront le déplacement
            // De façon temporaire avec longueur de 0
            if (!is_multi_line_init)
            {
                line_conteneur.append("line")
                    .attr("x1", x(cx1))
                    .attr("y1", y(cy1))
                    .attr("x2", x(cx1))
                    .attr("y2", y(cy1))
                    .attr("name", station.name)
                    .attr("stroke-width", 2)
                    .attr("stroke", "black")
                    .attr("class", "scenarioLine");
            }
        }); // line.stations.forEach(station =>
    }); // data_by_lines.forEach(line =>

    // Création des boutons de façon dynamique
    button_panel
        .selectAll('button')
        .data(trajets)
        .enter()
        .append('button')
        .attr('type', 'button')
        .attr('style', 'margin: 4px')
        .attr('id', function(d, i) { return 'scenario_' + i })
        .on('click', function(d, i) { init_scenario(i); })
        .text(function(d, i) { return 'Scénario ' + (1+i) });

    // Ajout de la table qui contient les éléments du temps
    time_panel.append('table')
        .attr('id', 'table_time')
        .append('tr')
        .attr('id', 'row_start')
        .append('th')
        .text('Départ :');

    // Rangée pour le temps de départ
    time_panel.select('#row_start')
        .selectAll('td')
        .data(time)
        .enter()
        .append('td')
        .attr('width', '60px')
        .append('button')
        .attr('id', function(d, i) { return 'start_button_' + i })
        .on('click', function(d, i) { start_scenario(i, current_scenario) })
        .attr('type', 'button')
        .text(function(d, i) { return format_time(time[i]) });

    // Header pour la durée
    time_panel.select('#table_time')
        .append('tr')
        .attr('id', 'row_duration')
        .append('th')
        .text('Durée (min) :');

    // Rangée pour la durée
    time_panel.select('#row_duration')
        .selectAll('td')
        .data(time)
        .enter()
        .append('td')
        .append('span')
        .attr('id', function(d, i) { return 'duration_' + i })
        .text('0');

    // Header pour le temps d'arrivée
    time_panel.select('#table_time')
        .append('tr')
        .attr('id', 'row_end')
        .append('th')
        .text('Arrivée :');

    // Rangée pour le temps d'arrivée
    time_panel.select('#row_end')
        .selectAll('td')
        .data(time)
        .enter()
        .append('td')
        .append('span')
        .attr('id', function(d, i) { return 'end_time_' + i })
        .text(function(d, i) { return format_time(time[i]) });

    // Header pour la durée moyenne
    time_panel.select('#table_time')
        .append('tr')
        .attr('id', 'row_mean')
        .append('th')
        .text('Moyenne (min) :');

    // Rangée pour la durée moyenne
    time_panel.select('#row_mean')
        .selectAll('td')
        .data(time)
        .enter()
        .append('td')
        .append('span')
        .attr('id', function(d, i) { return 'mean_time_' + i })
        .text('0')

    // Chargement du scénario
    function init_scenario(scenario)
    {
        // Remettre la carte à son état initial
        clear_scenario();

        // Afficher le panel du temps
        time_panel.attr('style', 'float: right; visibility: visible');

        // Mettre à jour le tableau des temps
        time_panel
            .data(time)
            .enter()
            .select('#row_end')
            .selectAll('td span')
            // On ajoute tous les temps avec offset de l'heure de départ selon le scénario et le temps de départ
            .text(function(d, i) { return format_time(d3.timeMinute.offset(d, d3.sum(trajets[scenario][(i+1)]))) });

        // Réinitialiser les boutons de temps
        d3.select('#row_start')
            .selectAll('td button')
            .attr('style', '');

        // Mettre à jour le style des boutons
        button_panel
            .selectAll('button')
            .attr('style', 'margin: 4px')

        button_panel
            .select('#scenario_' + scenario)
            .attr('style', 'margin: 4px; background-color: grey; border: none');

        // Prends en note le scénario choisi
        current_scenario = scenario;

        // Garder les stations et temps du trajet selon le scénario
        var stations_scenario = trajets[scenario][0];

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
        
        // Trouver le ratio de zoom en x et y
        var scale_x = 600/(max_x-min_x);
        var scale_y = 600/(max_y-min_y);

        // Maximum scale selon les 2 axes et une valeur max
        var scale = d3.min([scale_x - 0.5, scale_y- 0.5, 4]);

        // Trouver le centre de la zone d'intérêt selon le scale
        var x_mid = min_x + (max_x - min_x)/2;
        var y_mid = min_y + (max_y - min_y)/2;

        // Affecter les transformations de scale et translation
        // TODO Note: Tout ceci est sans margin left et avec map width / 2 = 300 hardcodé
        d3.select('#canvasV3')
            .select('svg')
            .select('g')
            .transition()
            .duration(2000)
            .attr('transform', 'scale (' + scale + ') translate('+ ((300/scale)-x_mid) + ',' + ((300/scale)-y_mid) + ')');
    } // function initScenario(num)

    // Démarre le scénario
    function start_scenario(time_index, scenario)
    {
        //Ne pas commencer s'il n'y a pas de scénarios choisis
        if (scenario === -1) return;

        // Mettre le bon bouton de temps sélectionné
        d3.select('#row_start')
            .data(time)
            .enter()
            .selectAll('td button')
            .attr('style', function(d, i) { return time_index===i ? 'margin: 4px; background-color: grey; border: none' : '' });

        // Remettre la carte à son état initial
        clear_lines();

        // Garder les stations et temps du trajet selon le scénario
        var stations_scenario = trajets[scenario][0];
        var all_current_lines = [];
        var all_next_lines = [];

        stations_scenario.forEach(function(d, i) {
            var current_line = line_conteneur.selectAll(".scenarioLine").select(function(h, j) { if (d3.select(this).attr("name") === stations_scenario[i]){ return this}});
            var next_line = line_conteneur.selectAll(".scenarioLine").select(function(h, j) { if (d3.select(this).attr("name") === stations_scenario[i + 1]){ return this}});

            all_current_lines.push(current_line);
            all_next_lines.push(next_line);
        });

        apply_line_transition(time_index, scenario, all_current_lines, all_next_lines, 0);
    }

    function apply_line_transition(time_index, scenario, all_current_lines, all_next_lines, index)
    {
        // Garder les stations et temps du trajet selon le scénario
        var stations_scenario = trajets[scenario][0];
        var temps_scenario = trajets[scenario][time_index + 1];

        if (index < all_next_lines.length - 1)
        {
            var transition_line = all_current_lines.find( line => line.attr("name") === stations_scenario[index]);
            //console.log(transition_line);
            //console.log("trying " + stations_scenario[index]);
            //console.log("to " + all_next_lines[index].attr("name"));
    
            if(transition_line != undefined)
            {
                var deltaT = temps_scenario[index + 1] * 1000;
                //console.log(index + " out of " + stations_scenario.length);
    
                transition_line
                    .transition()
                    .duration(deltaT)
                    .attr("x2", parseFloat(all_next_lines[index].attr("x1")))
                    .attr("y2", parseFloat(all_next_lines[index].attr("y1")))
                    .on("end", function(){index++; apply_line_transition(time_index, scenario, all_current_lines, all_next_lines, index) });
            }
        }
    }

    // Remise à neuf de la carte
    function clear_scenario()
    {
        // TODO remettre les boutons à non-clickés
        // TODO Attention à ne pas faire en double ce qu'on fait dans init_scenario

        line_conteneur.selectAll(".scenarioCircle").each(function(d,i) {
            d3.select(this).attr("fill-opacity", 0.2);
        });

        clear_lines();
    }

    function clear_lines()
    {
        line_conteneur.selectAll(".scenarioLine").each(function(d,i) {
            d3.select(this).attr("x2", parseFloat(d3.select(this).attr("x1")));
            d3.select(this).attr("y2", parseFloat(d3.select(this).attr("y1")));
            d3.select(this).interrupt();
        });
    }
}
