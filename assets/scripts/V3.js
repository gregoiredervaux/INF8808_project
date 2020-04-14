// Temps moyen d'un trajet en semaine de A à B à différentes heures
// Cas proposés pour A à B
// Cas 1 : Sherbrooke à Université de Montréal
// Cas 2 : Sherbrooke à Lasalle. En empruntant la ligne verte
// Cas 3 : Sherbrooke à Lasalle. En empruntant la ligne orange

// TODO
// Créer une liste ordonnée des stations à parcourir avec le temps de déplacement entre
// Toutes les stations sont un rond de la couleur de la ligne sauf noir pour double ou Berri-UQAM
// Créer une ligne reliant chacune des stations en gris
// Zoom de la carte pour que toutes les stations de l'itinéraire soient visibles
// Mettre toutes les stations et tunnels non-utilisés en opacité faible
// Animer le trajet d'une personne en changeant la couleur de sa ligne en noir (1 minute = 1 seconde?)

// Création d'une carte zoomée sur les stations d'intérêt à l'étude selon 3 cas
function create_map_zoomed(g, data, lines, x, y) {

    var data_by_lines = Object.keys(lines).map(line => {
        return {name: line, stations: lines[line].map(pt_station => {
                return data.find(station => station.id === pt_station)
            })}
    });

    //console.log("data par ligne: ", data_by_lines);

    //console.log("data par station", data);

    data_by_lines.forEach(data => {

        data.stations.forEach(d => {
            // Coordonnées de la station
            var cx1 = d.coordinates_map.cx;
            var cy1 = d.coordinates_map.cy;

            // Trouver la station précédente c0 et suivante c2
            var c0 = data.stations.find(st => {
                return st.id === lines[data.name][lines[data.name].indexOf(parseInt(d.id)) - 1]
            });
            var c2 = data.stations.find(st => {
                return st.id === lines[data.name][lines[data.name].indexOf(parseInt(d.id)) + 1]
            });

            //console.log(d.id, c0, c2);

            // Trouver la distance avec la station précédente
            if (c0!==undefined) {
                var cx0 = c0.coordinates_map.cx;
                var cy0 = c0.coordinates_map.cy;

                var ortho_prev = {cx : cx1 - cx0, cy: cy1 - cy0};
                var norme_prev = Math.sqrt((ortho_prev.cx ** 2) + (ortho_prev.cy ** 2));
            }
            // Trouver la distance avec la station suivante
            if (c2!==undefined) {
                var cx2 = c2.coordinates_map.cx;
                var cy2 = c2.coordinates_map.cy;

                var ortho_next = {cx : cx2 - cx1, cy: cy2 - cy1};
                var norme_next = Math.sqrt((ortho_next.cx ** 2) + (ortho_next.cy ** 2));
            }
        });

        // Attribuer un id à la ligne selon sa couleur
        var line_conteneur = g.append("g")
            .attr("id", `line_${data.name}`);

        line_conteneur.selectAll(".all")
            .data(data.stations)
            // TODO retourner toutes les stations sauf celles dans
            // double_lines_st et triple_lines_st à mettre en noir
            .enter()
            .append("circle")
            .attr("class", "all")
            .attr("cx", d => x(d.coordinates_map.cx))
            .attr("cy", d => y(d.coordinates_map.cy))
            .attr("r", d => 10)
            .attr("fill", data.name)
            .attr("fill-opacity", 1);
    });
}
