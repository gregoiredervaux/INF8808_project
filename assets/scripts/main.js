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


    var margin_map = {
        top: 50,
        right: 50,
        bottom: 50,
        left: 80
    };

    var barChartMarginV2 = {
        top: 40,
        right: 40,
        bottom: 40,
        left: 60
    };
    var barChartWidthV2 = 400 - barChartMarginV2.left - barChartMarginV2.right;
    var barChartHeightV2 = 250 - barChartMarginV2.top - barChartMarginV2.bottom;

    /***** Échelles utilisées *****/

    var x_map = d3.scaleLinear().range([10, map_width]);
    var y_map = d3.scaleLinear().range([10, map_height]);

    var color_station = d3.scaleLinear().range(["white", "red"]);
    var pipe_scale = d3.scaleLinear().range([2, 40]);

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

            console.log("Sources",sources);
            console.log("Ligne: ", sources.map(row=>row.ligne))
            console.log("Somme des incidents freins par ligne", sources.map(row=>row.stations.map(k=>k.incidents.length).reduce((a,b)=>a+b)));
            var count_freins_station = sources.map(row=>row.stations.map(k=>k.incidents.length).sort((a,b)=>b-a));
            console.log("Incidents freins par station", count_freins_station);
            //Stations par ordre décroissant d'incidents frein
            var stations_names_count_freins = sources.map(row=>row.stations.sort((a,b)=>b.incidents.length-a.incidents.length));//.map(k=>k.incidents.length).sort((a,b,)=>b-a));
            console.log("Stations en ordre de count d'incidents",stations_names_count_freins);

            //console.log("Incidents max par ligne", d3.max(sources.map(row=>row.stations.map(k=>k.incidents.length).reduce((a,b)=>a+b))));
            //console.log("Nombre d'incidents à la station Beaubien: ", d3.sum(sources.map(row=>row.stations.filter(d=>d.name==="Beaubien").map(k=>k.incidents.length))));          
            //console.log("nombre d'incidents conservés", d3.sum(data_stations.map(data_st => data_st.incidents.length)));
            //console.log("moyenne de temps tot d'arret", d3.sum(data_stations.map(data_st => data_st.total_stop_time))/data_stations.length);

            /***** Prétraitement des données *****/

            scale_from_GPS(pt_metro, x_map, y_map);
            scale_incidents(data_stations, color_station, pipe_scale);


            /***** V1 *****/

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
            rush_hours(incidents, svg_1);
            create_rectangles(svg_1);
            create_absolut_display(piechart_dataset, svg_1);
            create_piechart(piechart_dataset, svg_1, radius_v1);

            // Update du piechart selon la sélection de l'utilisateur
            select_rectangles(incidents, svg_1, radius_v1);


            /***** V2 *****/
            
            var metro_map = d3.select("#canvasV2 svg")
                .attr("width", map_width + margin_map.left + margin_map.right)
                .attr("height", map_height + margin_map.top + margin_map.bottom)
                .attr("margin", d3.mean(margin_map))
                .attr("pointer-events", "visible");

            var panel = d3.select("#panel")
                .style("display", "block");

            panel.select("button")
                .on("click", function () {
                    panel.style("display", "none");
            });

            var data_by_lines = create_map(metro_map, data_stations, lines, x_map, y_map, color_station, pipe_scale, panel);

            var selected_data = Object.keys(lines).map(line => {
                return {name: line, stations:[]}});

            var x_hour = d3.scaleBand().range([0,barChartWidthV2]);
            x_hour.domain(d3.range(1, 25));
            var y_hour = d3.scaleLinear().range([barChartHeightV2, 0]);

            var xAxis = d3.axisBottom(x_hour).tickFormat( d => (`${d}h`));
            var yAxis = d3.axisLeft(y_hour);

            var day_graph_svg  = panel.select("#day_graph")
                .attr("width", barChartWidthV2 + barChartMarginV2.left + barChartMarginV2.right)
                .attr("height", barChartHeightV2 + barChartMarginV2.top + barChartMarginV2.bottom);
            var day_graph = day_graph_svg.append("g")
                .attr("transform", "translate(" + barChartMarginV2.left + "," + barChartMarginV2.top + ")");

            create_barChart(day_graph, selected_data, x_hour, y_hour, xAxis, yAxis, barChartWidthV2, barChartHeightV2);

            addSelectionToStations(metro_map, panel, data_stations, data_by_lines, selected_data, x_map, y_map, y_hour, yAxis, barChartHeightV2);

            /***** V3 *****/
            // Mettre la V3 dans l'élément SVG qui se nomme svg_v3
            
            var margin = {
                top: 40,
                right: 40,
                bottom: 40,
                left: 60
            };
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

            
            // svg_v4 est maintenant deux fois plus large pour permettre 2 bar chart un à coté de l'autre
            var svg_v4 = d3.select('#canvasV4')
                           .append('svg')
                           .attr("width", 2*(barChartWidth + barChartMargin.left + barChartMargin.right))
                           .attr("height", (barChartHeight + barChartMargin.top + barChartMargin.bottom));

            var bar_count = svg_v4.append("g")
                                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                                .attr("id", "left_bar_chart");

            var bar_count_causes = svg_v4.append("g")
                                .attr("transform", "translate(" + (margin.left+barChartWidth+barChartMargin.left) + "," + margin.top + ")")
                                .attr("id","right_bar_chart");

            /***Création de l'infobulle***/
            var tip_v4 = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0]);

            /***** Création du graphique à barres *****/
            console.log("data",sources.map(row=>row.ligne).values());

            createAxes(bar_count, sources, data_freins, barChartHeight, barChartWidth);
            create_bar_count(bar_count, sources, data_freins, tip_v4, barChartHeight, barChartWidth);


            // Fonction que lorsque l'on clique sur une barre à gauche, faut apparaitre un bar chart à droite
            // data_freins doit simplement être remplacer par un jeu de données qui a rapport avec les causes secondaires
            display_causes(bar_count_causes, sources, data_freins, barChartHeight, barChartWidth, tip_v4);

            
           
            
            /***** Création de l'infobulle *****/
            tip_v4.html(function(d) {
                return getToolTipText.call(this, d, sources);
            });
            svg_v4.call(tip_v4);
  
  

        });
})(d3);
