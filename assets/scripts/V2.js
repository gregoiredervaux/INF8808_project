function create_map(g, data, lines,  x, y, color, pipe, panel) {

    var data_by_lines = Object.keys(lines).map(line => {
        return {name: line, stations: lines[line].map(pt_station =>  {
                return data.find(station => station.id === pt_station)
            })}
    });

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

        var tot_area_curve = d3.area()
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
            .attr("d", d => {console.log("d tot", d); return tot_area_curve(d)})
            .attr("stroke", color_value(data.name))
            .attr("stroke-width", 1)
            .attr("opacity", 1)
            .attr("fill", color_value(data.name));

        line_conteneur.selectAll(".end_circle")
            .data([data.stations[0], data.stations[data.stations.length - 1]])
            .enter()
            .append("circle")
            .attr("class", "end_circle")
            .attr("cx", d => x(d.coordinates_map.cx))
            .attr("cy", d => y(d.coordinates_map.cy))
            .attr("r", d => pipe(d.total_stop_time / 2) * 0.65)
            .attr("fill", color_value(data.name))
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

    });

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(d => `<p>${d.name}</p><br/><p> ligne ${frenchLine(d.line)}</p>`);

    var station_container = g.selectAll(".circle_st")
        .data(data)
        .enter()
        .append("g")
        .attr('class', "station")
        .attr('id', d => d.id)
        .attr("margin","10px");


    station_container.append("circle")
        .attr("class", "circle_st")
        .attr("name", d => d.name)
        .attr("cx", d => x(d.coordinates_map.cx))
        .attr("cy", d => y(d.coordinates_map.cy))
        .attr("r", 3)
        .attr("fill", "dark-grey")
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    station_container.on("mouseover", (d, i) => showPanel(panel, d.id, data));
    g.call(tip);
}

function showPanel(panel, stationId, data) {
    var station = data.find(d => stationId === d.id);
    panel.style("display", "block");

    panel.select("#station-name")
        .text(`${station.name} (ligne ${frenchLine(station.line)})`);
    panel.select("#nb-incidents")
        .text(`Incidents sur l'année 2019: ${station.incidents.length}`);
    panel.select("#tps-moy-arret")
        .text(`temps moyen d'un incident sur l'année 2019: ${parseInt(station.total_stop_time / station.incidents.length)} minutes`);
    panel.select("#tps-tot-arret")
        .text(`temps total d'arret sur l'année 2019: ${parseInt(station.total_stop_time)} minutes`);
}