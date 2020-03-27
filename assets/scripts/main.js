/**
 * Fichier principal
 *
 *
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
    var pipe_scale = d3.scaleLinear().range([0,20]);

    /***** Chargement des données *****/
    var promises = [];
    promises.push(d3.csv("./data/incidents.csv"));
    promises.push(d3.json("./data/pt_metro.json"));
    promises.push(d3.json("./data/lines.json"));

    Promise.all(promises)
        .then(function (results) {
            var incidents = results[0];
            //console.log("liste des incidents", incidents);


            var pt_metro = results[1].sort((a, b) => (parseInt(a.id) > parseInt(b.id)));
            //console.log("liste des stations de métro", pt_metro);

            var lines =  results[2];

            clean_data(pt_metro, incidents);

            var data_stations = data_per_station(pt_metro, incidents);
            //console.log("données de travail", data_stations);

            //console.log("nombre d'incidants conservés", d3.sum(data_stations.map(data_st => data_st.incidents.length)));

            //console.log("moyenne de temps tot d'arret", d3.sum(data_stations.map(data_st => data_st.total_stop_time))/data_stations.length);

            /***** Prétraitement des données *****/

            scale_from_GPS(pt_metro, x_map, y_map);
            scale_incidents(data_stations, color_station, pipe_scale);











            /***** V1 *****/
            var svg_v1 = d3.select('#canvasV1')
                            .append('svg')
                            .attr('width',map_width + margin.left + margin.right)
                            .attr('height', map_height + margin.top + margin.bottom);

            svg_v1.append("text")
                    .attr("fill", "black")
                    .style("text-anchor", "middle")
                    .attr("y", margin.top +1)
                    .attr('x',margin.left +1) 
                    .text('yoyoyo');

            //var piechart_dataset = [{'nombre_incident_dans_intervalle':123},{'nombre_incident_hors_intervalle'}];
            //create_piechart(g, piechart_dataset);













            

            /***** V2 *****/
            /** 
            var svg = d3.select("#canvasV2")
                .append("svg")
                .attr("width", map_width + margin.left + margin.right)
                .attr("height", map_height + margin.top + margin.bottom);

            var metro_map = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            create_map(metro_map, data_stations, lines, x_map, y_map, color_station, pipe_scale);
            */


            /***** V3 *****/

            /***** V4 *****/

        });
})(d3);
