
function create_map(g, data, lines,  x, y, pipe, panel) {

    /***
     *
     * Créer la carte dse stations de métro
     *
     * @param g: conteneur de la carte
     * @param data: données de chaque stations
     * @param lines: liste des identifiants des stations pour chaque ligne
     * @param x: scale des stations en x
     * @param y: scale des stations en y
     * @param pipe: scale pour le temps cummulé de minutes d'arrets
     * @panel panel: conteneur du panneau
     * @return: données de chaque stations classées par lignes
     */

    // on regroupe les stations par lignes pour les traiter séparements
    var data_by_lines = Object.keys(lines).map(line => {
        return {name: line, stations: lines[line].map(pt_station =>  {
                return data.find(station => station.id === pt_station)
            })}
    });

    data_by_lines.forEach(data => {

        // Pour chaque station, on doit determiner un nouveau point qui correspond au nombre total de minutes d'arrets.
        // on veut afficher cela sur un graph d'aire, avec en x les stations,
        // et en y le nombre total de minutes d'arrets, le tout sur une carte,
        // pour localiser plus facilement les stations (l'axe des abscisses va donc bouger avec la position des stations sur la carte)
        // Comme les positions des stations ne sont pas rectilignes et horizontales, on utilise les vecteurs
        // orthogonaux des vecteurs d'une station a l'autre pour obtenir un tracé fidéle à l'orientations des stations sur la carte
        // On utilise les deux vecteurs orthogonaux existant pour obtenir une représentation symétrique par rapport
        // à la station
        data.stations.forEach(d => {

            // On determine pour chaque station la position de la station précedente et suivante
            var cx1 = d.coordinates_map.cx;
            var cy1 = d.coordinates_map.cy;
            var c2 = data.stations.find(st => {
                return st.id === lines[data.name][lines[data.name].indexOf(parseInt(d.id)) + 1]
            });
            var c0 = data.stations.find(st => {
                return st.id === lines[data.name][lines[data.name].indexOf(parseInt(d.id)) - 1]
            });
            // Si il y a une station suivante (pas une fin de ligne),
            if (c2!==undefined) {
                var cx2 = c2.coordinates_map.cx;
                var cy2 = c2.coordinates_map.cy;

                // les vecteurs orthogonaux sont calculé a partir de la station suivante
                var ortho12 = {cx : -1 * cy2 + cy1, cy: cx2 - cx1};
                var ortho21 = {cx : cy2 - cy1, cy: -1 * cx2 + cx1};
                var norme12 = Math.sqrt((ortho12.cx ** 2) + (ortho12.cy ** 2));
            }
            // Si il y a une station précédente (pas un début de ligne),
            if (c0!==undefined) {
                var cx0 = c0.coordinates_map.cx;
                var cy0 = c0.coordinates_map.cy;

                // les vecteurs orthogonaux sont calculé a partir de la station précédente
                var ortho01 = {cx : -1 * cy1 + cy0, cy: cx1 - cx0};
                var ortho10 = {cx : cy1 - cy0, cy: -1 * cx1 + cx0};
                var norme01 = Math.sqrt((ortho01.cx ** 2) + (ortho01.cy ** 2));
            }

            // Si les deux stations précédente et suivante existent,
            if (c2 !== undefined && c0 !== undefined) {
                // On utilise la moyenne des deux vecteurs pour obtenir les coordonnées de notre graphique
                d.coordinates_map_upper = {
                    cx: cx1 + pipe(d.total_stop_time) * (ortho12.cx / norme12 + ortho01.cx / norme01) / 2,
                    cy: cy1 + pipe(d.total_stop_time) * (ortho12.cy / norme12 + ortho01.cy / norme01) / 2
                };
                d.coordinates_map_lower = {
                    cx: cx1 + pipe(d.total_stop_time) * (ortho21.cx / norme12 + ortho10.cx / norme01) / 2,
                    cy: cy1 + pipe(d.total_stop_time) * (ortho21.cy / norme12 + ortho10.cy / norme01) / 2
                };

            } else if (c2 !== undefined && c0 === undefined) {
                // Si c'est un début de ligne, on utilise le vecteur orthogonal de la station suivante
                d.coordinates_map_upper = {
                    cx: cx1 + pipe(d.total_stop_time) * ortho12.cx / norme12,
                    cy: cy1 + pipe(d.total_stop_time) * ortho12.cy / norme12
                };
                d.coordinates_map_lower = {
                    cx: cx1 + pipe(d.total_stop_time) * ortho21.cx / norme12,
                    cy: cy1 + pipe(d.total_stop_time) * ortho21.cy / norme12
                };

            } else if (c2 === undefined && c0 !== undefined) {
                // Si c'est une fin de ligne, on utilise le vecteur orthogonal de la station précedente
                d.coordinates_map_upper = {
                    cx: cx1 + pipe(d.total_stop_time) * ortho01.cx / norme01,
                    cy: cy1 + pipe(d.total_stop_time) * ortho01.cy / norme01
                };
                d.coordinates_map_lower = {
                    cx: cx1 + pipe(d.total_stop_time) * ortho10.cx / norme01,
                    cy: cy1 + pipe(d.total_stop_time) * ortho10.cy / norme01
                };
            }
        });

        // fonction dessinant une aire a partir des nouvelle coordonnées du nombre de panne par station
        var tot_area_curve = d3.area()
            .x0(d => x(d.coordinates_map_lower.cx))
            .x1(d => x(d.coordinates_map_upper.cx))
            .y0(d => y(d.coordinates_map_lower.cy))
            .y1(d => y(d.coordinates_map_upper.cy))
            .curve(d3.curveCardinal);

        // fonction dessinant une ligne a partir des coordonnées réelle des stations
        var tot_line = d3.line()
            .x(d => x(d.coordinates_map.cx))
            .y(d => y(d.coordinates_map.cy))
            .curve(d3.curveCardinal);

        // On créer un conteneur pour chaque tracé des aires
        var line_conteneur = g.append("g")
            .attr("id", `line_${data.name}`);

        // On ajoute les aires aux conteneur
        line_conteneur.selectAll(".tot_area")
            .data([data.stations])
            .enter()
            .append("path")
            .attr("class", "line tot_area")
            .attr("d", d => tot_area_curve(d))
            .attr("stroke", color_value(data.name))
            .attr("stroke-width", 1)
            .attr("opacity", 1)
            .attr("fill", color_value(data.name));

        // On ajoute un cercle à la fin des aires pour éviter la fin abrupte du graph
        line_conteneur.selectAll(".end_circle")
            .data([data.stations[0], data.stations[data.stations.length - 1]])
            .enter()
            .append("circle")
            .attr("class", "end_circle")
            .attr("cx", d => x(d.coordinates_map.cx))
            .attr("cy", d => y(d.coordinates_map.cy))
            .attr("r", d => pipe(d.total_stop_time / 2))
            .attr("fill", color_value(data.name))
            .attr("fill-opacity", 1);

        // On ajoute une ligne sur les tracés "réels" des stations
        line_conteneur.selectAll(".tot_path")
            .data([data.stations])
            .enter()
            .append("path")
            .attr("class", "line tot_path")
            .attr("d", d => tot_line(d))
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("opacity", 1)
            .attr("fill", "none");

    });

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(d => `<p>${d.name}</p><br/><p> ligne ${frenchLine(d.line)}</p>`);

    // On créer un conteneur pour chaque station
    var station_container = g.selectAll(".circle_st")
        .data(data)
        .enter()
        .append("g")
        .attr('class', "station")
        .attr('id', d => d.id)
        .attr("margin","10px")
        .attr("pointer-events", "visible");

    // On ajoute un cercle transparent pour pouvoir selectionner les stations plus facilement
    station_container.append("circle")
        .attr("class", "under_circle")
        .attr("name", d => d.name)
        .attr("cx", d => x(d.coordinates_map.cx))
        .attr("cy", d => y(d.coordinates_map.cy))
        .attr("r", 10)
        .attr("fill", "none");

    // On affiche les stations sur la carte
    station_container.append("circle")
        .attr("class", "circle_st")
        .attr("name", d => d.name)
        .attr("cx", d => x(d.coordinates_map.cx))
        .attr("cy", d => y(d.coordinates_map.cy))
        .attr("r", 3)
        .attr("fill", "dark-grey")
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    // Tip quand on passe sur les stations
    station_container.on("mouseover", (d, i) => showPanel(panel, d.id, data));
    g.call(tip);

    return data_by_lines
}

function showPanelV2(panel, stationId, data) {

    /**
     * Affiche les informations d'une station
     *
     * @param panel: conteneur du panneau
     * @param stationId: identifiant de la station a afficher
     * @param data: données des stations
     */

    var station = data.find(d => stationId === d.id);
    panel.style("display", "block");

    panel.select("#station-name")
        .text(`${station.name} (ligne ${frenchLine(station.line)})`);
    panel.select("#nb-incidents")
        .text(`Nombre d'incidents: ${station.incidents.length}`);
    panel.select("#tps-moy-arret")
        .text(`Temps moyen d'un incident: ${parseInt(station.total_stop_time / station.incidents.length)} minutes`);
    panel.select("#tps-tot-arret")
        .text(`Temps d'arret cummulé sur l'année: ${parseInt(station.total_stop_time)} minutes`);


}

function addSelectionToStations(metro_map, panel, data_stations, data_by_lines, selected_data, x_map, y_map, y_hour, yAxis, barChartHeight) {

    /**
     * Ajoute les evenements de selection aux stations
     *
     * @param metro_map: conteneur de la carte
     * @param panel: conteneur du panneau
     * @param data_stations: données de chaque station
     * @param data_by_lines: données de chaque station regroupée par ligne
     * @param selected_data: données des stations selectionnées
     * @param x_map: scale des stations en x
     * @param y_map: scale des stations en y
     * @param y_hour: scale du total de minutes d'arrets par heur
     * @param yAxis: axe des ordonnées (minutes d'arrets total)
     * @param barChartHeught: hauteur du graphique
     */

    // lors d'un clique,
    metro_map.on("mousedown", () => {
        var stations = metro_map.selectAll(".station");
        // si aucune station n'est selectionnée, on passe en mode selection des stations
        if (metro_map.selectAll(".station.selected").nodes().length === 0) {
            // on ajout la station au données selectionnées
            selected_data = data_by_lines.map(line => {
                return {name: line.name, stations:[]}});
            // on ajoute l'evenement de selection
            stations
                .on('mouseover', null)
                .on('mouseover', selectStation);
            // on cache le panneau d'information, et on affiche le graph
            panel.select("#info").attr("class", "hidden");
            panel.select("#day_graph").attr("class", "visible");
        } else {
            // sinon, on affiche les informations des stations survolées
            stations
                .on('mouseover', null)
                .on("mouseover", (d, i) => showPanelV2(panel, d.id, data_stations));
            // on affiche le panneau des informations et on cache le graph
            panel.select("#info").attr("class", "visible");
            panel.select("#day_graph").attr("class", "hidden");
            // on vide les données selectionnées
            selected_data = data_by_lines.map(line => {
                return {name: line.name, stations:[]}});
        }
        // On desselectionne les stations et affiche le tracé classique des aires
        stations
            .classed("selected", false)
            .classed("unselected", true);
        metro_map.selectAll(".tot_area.selected").remove();
        metro_map.selectAll(".line.tot_area")
            .attr("opacity", 1);
    });


    function selectStation(d, i) {
        /**
         * Evenement lors d'une selection d'une station
         *
         * @param d: donnée de la station
         * @param i: index de la station (pas utilisé)
         */
        d3.select(this)
            .classed("selected", true)
            .classed("unselected",false);
        update_map(metro_map, panel, data_stations, selected_data, x_map, y_map, y_hour, yAxis, barChartHeight,d.id, d.line)
    }
}

function update_map(metro_map, panel, data_stations, selected_data, x, y, y_hour, yAxis, barChartHeight, st_id, st_line) {

    /**
     * Ajoute une nouvelle station sur la carte lors de la phase de selection, et met a jour le graphique
     * @param metro_map: conteneur de la carte
     * @param panel: conteneur du panneau
     * @param data_station: données des stations
     * @param selected_data: données des stations selectionnées classées par ligne
     * @param x: scale des stations en x
     * @param y: scale des stations en y
     * @param y_hour: scale du total de minutes d'arrets par heur
     * @param yAxis: axe des ordonnées (minutes d'arrets total)
     * @param barChartHeight: hauteur du graphique
     * @param st_id: identifiant de la station à ajouter
     * @param st_line: ligne de la station a ajouter
     */

    // On ajoute la station aux données selectionnées
    selected_data.forEach(line => {
        if (!line.stations.map(st => st.id).includes(st_id) && line.name === st_line) {
            line.stations.push(data_stations.find(st => st.id === st_id))
        }
    });

    // On diminue l'opacity des tracés des aires pour visualiser uniquement les stations selectionnées
    metro_map.selectAll(".line.tot_area")
        .attr("opacity", 0.1);
    metro_map.selectAll("path.tot_area.selected").remove();

    // On reutilise la fonction d'aire
    var tot_area_curve = d3.area()
        .x0(d => x(d.coordinates_map_lower.cx))
        .x1(d => x(d.coordinates_map_upper.cx))
        .y0(d => y(d.coordinates_map_lower.cy))
        .y1(d => y(d.coordinates_map_upper.cy))
        .curve(d3.curveCardinal);

    // on affiche les aires des stations selectionnées
    selected_data.forEach(data => {
        metro_map.select(`#line_${data.name}`).selectAll(".tot_area.selected")
            .data([data.stations])
            .enter()
            .append("path")
            .attr("class", "line tot_area selected")
            .attr("d", d => tot_area_curve(d))
            .attr("stroke", color_value(data.name))
            .attr("stroke-width", 1)
            .attr("opacity", 1)
            .attr("fill", color_value(data.name));

    });

    // On re-définie le domain du scale du temp total classé par heur
    y_hour.domain(
        [
            0,
            d3.max(d3.range(1, 25).map(hour =>
                d3.sum(selected_data, line =>
                    d3.sum(line.stations.map(station =>
                            d3.sum(station.incidents.filter(inci =>
                                inci.debut.getHours() === hour),
                                inci => inci.time)
                        )
                    )
                )
            ))
        ]);

    panel.select(".y.axis")
        .call(yAxis);

    // on met a jour les bar-chart pour chaque heur de la journée
    panel.selectAll("rect")
        .data(d3.range(1, 25))
        .transition()
        .duration(1000)
        .attr("y", d => y_hour(
            d3.sum(selected_data , line =>
                d3.sum(line.stations.map(station =>
                    d3.sum(station.incidents.filter(inci =>
                        inci.debut.getHours() === d),
                        inci => inci.time))
                )
            )
            )
        )
        .attr("height", d => barChartHeight - y_hour(
            d3.sum(selected_data , line =>
                d3.sum(line.stations.map(station =>
                    d3.sum(station.incidents.filter(inci =>
                        inci.debut.getHours() === d),
                        inci => inci.time))
                )
            )
            )
        )
}

function create_barChart(day_graph, selected_data, x_hour, y_hour, xAxis, yAxis, barChartWidth, barChartHeight){

    /**
     * Créer le graphique du temps total d'arret par heur sur l'ensemble des stations selectionnées
     *
     * @param day_graph: conteneur du bar-chart
     * @param selected_data: données des stations selectionnées
     * @param x_hour: scale des heures de la journée
     * @param y_hour: scale du total de minutes d'arrets par heur
     * @param xAxis: axe des abscisses
     * @param yAxis: axe des ordonnées
     * @param barChartHeight: hauteur du graphique
     * @param barChartwidth: largeur du graphique
     */

    // création du domaine du scale du total de minutes d'arrets par heur
    y_hour.domain(
        [
            0,
            d3.max(d3.range(1, 25).map(hour =>
                d3.sum(selected_data, line =>
                    d3.sum(line.stations.map(station =>
                            d3.sum(station.incidents.filter(inci =>
                                inci.debut.getHours() === hour),
                                inci => inci.time)
                        )
                    )
                )
            ))
        ]);

    x_hour.paddingInner(0.2);

    // On affiche le bar-chart.
    day_graph.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + barChartHeight + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(30)")
        .style("text-anchor", "start");

    day_graph.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    day_graph.append("text")
        .attr("class", "title legend")
        .attr("text-anchor", "begin")
        .attr("y", -20)
        .attr("x", -20)
        .text("Somme des minutes de pannes par heure");

    var rects = day_graph.selectAll("#bar_chart")
        .data(d3.range(1, 25))
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y_hour(
            d3.sum(selected_data , line =>
                d3.sum(line.stations.map(station =>
                        d3.sum(station.incidents.filter(inci =>
                            inci.debut.getHours() === d),
                            inci => inci.time))
                    )
                )
            )
        )
        .attr("height", d => barChartHeight - y_hour(
            d3.sum(selected_data , line =>
                d3.sum(line.stations.map(station =>
                        d3.sum(station.incidents.filter(inci =>
                            inci.debut.getHours() === d),
                            inci => inci.time))
                    )
                )
            )
        )
        .attr("x", d => x_hour(d))
        .attr("width", x_hour.bandwidth())
        .style("fill", "#83c0ef");
}
