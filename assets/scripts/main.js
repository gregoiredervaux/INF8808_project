/**
 * Fichier principal permettant de gérer la carte. Ce fichier utilise les autres fichiers
 * que vous devez compléter.
 *
 * /!\ Aucune modification n'est nécessaire dans ce fichier!
 */
(function (d3) {
    "use strict";

    /***** Configuration *****/

    const double_lines_st = ["Lionel-Groulx", "Snowdon", "Jean-Talon"];
    const triple_line_st = ["Berri-Uqam"];
    const map_width = 300;
    const map_height = 300;


    var margin = {
        top: 50,
        right: 50,
        bottom: 50,
        left: 80
    };

    /***** Échelles utilisées *****/

    var x_map = d3.scaleLinear().range([0, map_width]);
    var y_map = d3.scaleLinear().range([0, map_height]);

    var color_station = d3.scaleLinear().range(["white", "red"]);

    /***** Chargement des données *****/
    var promises = [];
    promises.push(d3.csv("./data/incidents.csv"));
    promises.push(d3.json("./data/pt_metro.json"));

    Promise.all(promises)
        .then(function (results) {
            var incidents = results[0];
            console.log("liste des incidents", incidents);

            var pt_metro = results[1];
            console.log("liste des stations de métro", pt_metro);

            clean_data(pt_metro, incidents);

            var data_stations = data_per_station(pt_metro, incidents);
            console.log("données de travail", data_stations);

            console.log("nombre d'incidants conservés", d3.sum(data_stations.map(data_st => data_st.incidents.length)));

            console.log("moyenne de temps tot d'arret", d3.sum(data_stations.map(data_st => data_st.total_stop_time))/data_stations.length);

            /***** Prétraitement des données *****/

            scale_from_GPS(pt_metro, x_map, y_map);
            scale_color(data_stations, color_station);


            /***** V1 *****/

            /***** V2 *****/

            var svg = d3.select("body")
                .append("svg")
                .attr("width", map_width + margin.left + margin.right)
                .attr("height", map_height + margin.top + margin.bottom);

            var metro_map = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            create_map(metro_map, data_stations, x_map, y_map, color_station, double_lines_st, triple_line_st);

            /***** V3 *****/

            /***** V4 *****/

        });
})(d3);
