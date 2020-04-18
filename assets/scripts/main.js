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
    var pipe_scale = d3.scaleLinear().range([5, 30]);

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

            var lines =  results[2];

            clean_data(pt_metro, incidents);
            //console.log("liste des stations de métro", pt_metro);

            var data_stations = data_per_station(pt_metro, incidents);
            //console.log("données de travail", data_stations);

            var KFS = results[0].filter(row => row.KFS == parseInt(1)); //Incidents pour lesquels le frein d'urgence a été actionné (KFS=1)
            //console.log("KFS", KFS);

            var data_freins = data_per_station(pt_metro,KFS); //Données par station pour les incidents pour lesquels KFS = 1
            //console.log("Données de travail Frein", data_freins);
            //console.log("Stations KFS par ligne", data_freins.filter(row=>row.line ==='orange').map(d=>d.name));         
            //console.log("Nombre d'incidents frein (cause: Blessée ou malade) sur la ligne orange", d3.set(data_freins.filter(row=>row.line ==='yellow').map(d=>d.incidents.map(cause => cause['Cause secondaire']))));
            //console.log("Valeurs des causes d'incidents", d3.set(data_freins.map(row => row.incidents.map(a => a['Cause secondaire']))).values())
            //console.log("Nombre d'incidents frein (cause: Blessée ou malade) sur la ligne orange", d3.sum(data_freins.filter(row=>row.line ==='orange').map(d=>d.incidents.map(cause => cause['Cause secondaire']).filter(k=>k==='Blessée ou malade').length)));
            //console.log("Nombre d'incidents frein sur la ligne jaune: ", d3.sum(data_freins.filter(row=>row.line ==='yellow').map(d=>d.incidents.map(cause => cause['Cause secondaire']).length)));
            //console.log("Temps d'arrêt frein", d3.sum(data_freins.map(d => d.total_stop_time)));

            var sources = createSources(data_freins);

            //console.log("Sources",sources);
            //console.log("Ligne: ", sources.map(row=>row.ligne))
            //console.log("Incidents freins par ligne", sources.map(row=>row.stations.map(k=>k.incidents.length).reduce((a,b)=>a+b)));
            //console.log("Incidents max par ligne", d3.max(sources.map(row=>row.stations.map(k=>k.incidents.length).reduce((a,b)=>a+b))));
            //console.log("Nombre d'incidents à la station Beaubien: ", d3.sum(sources.map(row=>row.stations.filter(d=>d.name==="Beaubien").map(k=>k.incidents.length))));          
            //console.log("nombre d'incidents conservés", d3.sum(data_stations.map(data_st => data_st.incidents.length)));
            //console.log("moyenne de temps tot d'arret", d3.sum(data_stations.map(data_st => data_st.total_stop_time))/data_stations.length);

            /***** Prétraitement des données *****/

            scale_from_GPS(pt_metro, x_map, y_map);
            scale_incidents(data_stations, color_station, pipe_scale);


            /***** V1 *****/

            // Éventuellement, begin et end vont être déterminé grâce à la fonction select_begin_end()

            // dimensions du piechart
            var width_v1 = 1000,
	        height_v1 = 400,
            radius_v1 = Math.min(width_v1, height_v1) / 2.5;

            var svg_1 = d3.select("#canvasV1")
                        .append("svg")
                        .attr("width", width_v1)
                        .attr("height", height_v1);

            // Creer le tooltip qui montre l'heure de chaque rectangle
            var tooltip = d3.select("#canvasV1").append("div")
                                                .attr("display", "none")
                                                .attr("class","toolTip")
                                                .style("font-size", "15px")
                                                .style("text-anchor", "middle")
                                                .append("text");

            // Heures d'ouvertures du métro        
            var ouverture = 5;
            var fermeture = 24;

            // Création du piechart que l'utilisateur voit lorsqu'il ouvre l'onglet (sélection par défaut)
            var piechart_dataset = count_incidents(incidents, ouverture, fermeture);
            rush_hours(incidents, svg_1, width_v1, height_v1);
            create_rectangles(svg_1, width_v1, height_v1);
            create_absolut_display(piechart_dataset, svg_1, width_v1, height_v1);
            create_piechart(piechart_dataset, svg_1, width_v1, height_v1, radius_v1);

            //select_drag(svg_1);

            // Update du piechart selon la sélection de l'utilisateur
            select_rectangles(incidents, svg_1, width_v1, height_v1, radius_v1);


            /***** V2 *****/
            
            var svg_v2 = d3.select("#canvasV2 svg")
                .attr("width", map_width + margin.left + margin.right)
                .attr("height", map_height + margin.top + margin.bottom);

            var metro_map = svg_v2.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var panel = d3.select("#panel")
                .style("display", "block");

            panel.select("button")
                .on("click", function () {
                    panel.style("display", "none");
            });

            create_map(metro_map, data_stations, lines, x_map, y_map, color_station, pipe_scale, panel);


            /***** V3 *****/
            // Mettre la V3 dans l'élément SVG qui se nomme svg_v3
            
            var svg_v3 = d3.select('#canvasV3')
                           .append('svg')
                           .attr('width', map_width + margin.left + margin.right)
                           .attr('height', map_height + margin.top + margin.bottom);

                           var metro_map_zoomed = svg_v3.append("g")
                           .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
           
                            create_map_zoomed(metro_map_zoomed, data_stations, lines, x_map, y_map);



            /***** V4 *****/
            // Mettre la V4 dans l'élément SVG qui se nomme svg_v4

            /***** Configuration *****/
            var barChartMargin = {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50
            };

            var barChartWidth = 550 - barChartMargin.left - barChartMargin.right;
            var barChartHeight = 500 - barChartMargin.top - barChartMargin.bottom;

            var svg_v4 = d3.select('#canvasV4')
                           .append('svg')
                           .attr("width", barChartWidth + barChartMargin.left + barChartMargin.right)
                           .attr("height", barChartHeight + barChartMargin.top + barChartMargin.bottom);

            var bar_count = svg_v4.append("g")
                                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            /***Création de l'infobulle***/
            var tip_v4 = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0]);

            /***** Création du graphique à barres *****/
            console.log("data",sources.map(row=>row.ligne));

            createAxes(bar_count, sources, data_freins, barChartHeight, barChartWidth);
            create_bar_count(bar_count, sources, data_freins, tip_v4, barChartHeight, barChartWidth);
           
            
            /***** Création de l'infobulle *****/
            tip_v4.html(function(d) {
                return getToolTipText.call(this, d, data_freins);
            });
            svg_v4.call(tip_v4);
  
  

        });
})(d3);
