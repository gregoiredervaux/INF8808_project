function createLine(x, y) {
    // Retourner une ligne SVG (voir "d3.line"). Pour l'option curve, utiliser un curveBasisOpen.

    // A partie du couple passé en argument, on en déduit des coordonnées (date, compteur)
    // on utilise l'interpolation suggérée par l'ennoncé
    return (d3.line()
            .x(d => x(d.cx))
            .y(d => y(d.cy))
    )

}


function create_map(g, data, lines,  x, y, color, pipe) {

    var data_by_lines = Object.keys(lines).map(line => {
        return {name: line, stations: lines[line].map(pt_station =>  {
                return data.find(station => station.id === pt_station)
            })}
    });

    //console.log("data par ligne: ", data_by_lines);


    // var line = d3.line()
    //     .x(d => x(d.cx))
    //     .y(d => y(d.cy));

    var line = d3.line()
        .x(d => x(d.cx))
        .y(d => y(d.cy));



    data_by_lines.forEach(data => {

        data.stations.forEach(d => {
            var cx1 = d.coordinates_map.cx;
            var cy1 = d.coordinates_map.cy;
            var c2 = data.stations.find(st => {
                return st.id === lines[data.name][lines[data.name].indexOf(parseInt(d.id)) + 1]
            });
            var c0 = data.stations.find(st => {
                return st.id === lines[data.name][lines[data.name].indexOf(parseInt(d.id)) - 1]
            });
            if (c2!==undefined) {
                var cx2 = c2.coordinates_map.cx;
                var cy2 = c2.coordinates_map.cy;

                var ortho12 = {cx : -1 * cy2 + cy1, cy: cx2 - cx1};
                var ortho21 = {cx : cy2 - cy1, cy: -1 * cx2 + cx1};
                var norme12 = Math.sqrt((ortho12.cx ** 2) + (ortho12.cy ** 2));
            }
            if (c0!==undefined) {
                var cx0 = c0.coordinates_map.cx;
                var cy0 = c0.coordinates_map.cy;

                var ortho01 = {cx : -1 * cy1 + cy0, cy: cx1 - cx0};
                var ortho10 = {cx : cy1 - cy0, cy: -1 * cx1 + cx0};
                var norme01 = Math.sqrt((ortho01.cx ** 2) + (ortho01.cy ** 2));
            }

            if (c2 !== undefined && c0 !== undefined) {

                d.coordinates_map_upper = {
                    cx: cx1 + pipe(d.total_stop_time) * (ortho12.cx / norme12 + ortho01.cx / norme01) / 2,
                    cy: cy1 + pipe(d.total_stop_time) * (ortho12.cy / norme12 + ortho01.cy / norme01) / 2
                };
                d.coordinates_map_lower = {
                    cx: cx1 + pipe(d.total_stop_time) * (ortho21.cx / norme12 + ortho10.cx / norme01) / 2,
                    cy: cy1 + pipe(d.total_stop_time) * (ortho21.cy / norme12 + ortho10.cy / norme01) / 2
                };

            } else if (c2 !== undefined && c0 === undefined) {

                d.coordinates_map_upper = {
                    cx: cx1 + pipe(d.total_stop_time) * ortho12.cx / norme12,
                    cy: cy1 + pipe(d.total_stop_time) * ortho12.cy / norme12
                };
                d.coordinates_map_lower = {
                    cx: cx1 + pipe(d.total_stop_time) * ortho21.cx / norme12,
                    cy: cy1 + pipe(d.total_stop_time) * ortho21.cy / norme12
                };

            } else if (c2 === undefined && c0 !== undefined) {

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

        var line_conteneur = g.append("g")
            .attr("id", `line_${data.name}`);

        var tot_area = d3.area()
            .x0(d => x(d.coordinates_map_lower.cx))
            .x1(d => x(d.coordinates_map_upper.cx))
            .y0(d => y(d.coordinates_map_lower.cy))
            .y1(d => y(d.coordinates_map_upper.cy))
            .curve(d3.curveCardinal);

        var tot_area = line_conteneur.selectAll(".tot_area")
            .data([data.stations])
            .enter()
            .append("path")
            .attr("class", "line tot_area")
            .attr("d", d => {console.log("d tot", d); return tot_area(d)})
            .attr("stroke", data.name)
            .attr("stroke-width", 1)
            .attr("opacity", 1)
            .attr("fill", data.name);

        line_conteneur.selectAll(".end_circle")
            .data([data.stations[0], data.stations[data.stations.length - 1]])
            .enter()
            .append("circle")
            .attr("class", "end_circle")
            .attr("cx", d => x(d.coordinates_map.cx))
            .attr("cy", d => y(d.coordinates_map.cy))
            .attr("r", d => pipe(d.total_stop_time / 2) * 0.9)
            .attr("fill", data.name)
            .attr("fill-opacity", 1);

        var tot_line = d3.line()
            .x(d => x(d.coordinates_map.cx))
            .y(d => y(d.coordinates_map.cy))
            .curve(d3.curveCardinal);

        var tot_paths = line_conteneur.selectAll(".tot_path")
            .data([data.stations])
            .enter()
            .append("path")
            .attr("class", "line tot_path")
            .attr("d", d => {console.log("d tot", d); return tot_line(d)})
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("opacity", 1)
            .attr("fill", "none");

        var bubbles = line_conteneur.selectAll(".circle_st")
            .data(data.stations)
            .enter();

        bubbles.append("circle")
            .attr("class", "circle_st")
            .attr("cx", d => x(d.coordinates_map.cx))
            .attr("cy", d => y(d.coordinates_map.cy))
            .attr("r", 1)
            .attr("fill", d => "black");
    });
}
