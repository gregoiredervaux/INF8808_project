
function create_map(g, data, lines,  x, y, color, pipe, panel) {

    var data_by_lines = Object.keys(lines).map(line => {
        return {name: line, stations: lines[line].map(pt_station =>  {
                return data.find(station => station.id === pt_station)
            })}
    });

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

        var tot_area_curve = d3.area()
            .x0(d => x(d.coordinates_map_lower.cx))
            .x1(d => x(d.coordinates_map_upper.cx))
            .y0(d => y(d.coordinates_map_lower.cy))
            .y1(d => y(d.coordinates_map_upper.cy))
            .curve(d3.curveCardinal);

        var tot_line = d3.line()
            .x(d => x(d.coordinates_map.cx))
            .y(d => y(d.coordinates_map.cy))
            .curve(d3.curveCardinal);

        var line_conteneur = g.append("g")
            .attr("id", `line_${data.name}`);

        var tot_area = line_conteneur.selectAll(".tot_area")
            .data([data.stations])
            .enter()
            .append("path")
            .attr("class", "line tot_area")
            .attr("d", d => tot_area_curve(d))
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

        var tot_paths = line_conteneur.selectAll(".tot_path")
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

    var station_container = g.selectAll(".circle_st")
        .data(data)
        .enter()
        .append("g")
        .attr('class', "station")
        .attr('id', d => d.id)
        .attr("margin","10px")
        .attr("pointer-events", "visible");


    station_container.append("circle")
        .attr("class", "under_circle")
        .attr("name", d => d.name)
        .attr("cx", d => x(d.coordinates_map.cx))
        .attr("cy", d => y(d.coordinates_map.cy))
        .attr("r", 7)
        .attr("fill", "none");
        //.on('mouseover', tip.show)
        //.on('mouseout', tip.hide);

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

    return data_by_lines
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

function addSelectionToStations(metro_map, panel, data_stations, data_by_lines, selected_data, x_map, y_map, y_hour, yAxis, barChartHeight) {

    metro_map.on("mousedown", () => {
        var stations = metro_map.selectAll(".station");

        console.log(metro_map.selectAll(".station.selected").nodes().length);
        if (metro_map.selectAll(".station.selected").nodes().length === 0) {
            console.log("selection");
            selected_data = data_by_lines.map(line => {
                return {name: line.name, stations:[]}});
            stations
                .on('mouseover', null)
                .on('mouseover', selectStation);
            panel.select("#info").attr("class", "hidden");
            panel.select("#day_graph").attr("class", "visible");
        } else {
            console.log("tip");
            stations
                .on('mouseover', null)
                .on("mouseover", (d, i) => showPanel(panel, d.id, data_stations));
            panel.select("#info").attr("class", "visible");
            panel.select("#day_graph").attr("class", "hidden");
            selected_data = {}
        }
        stations
            .classed("selected", false)
            .classed("unselected", true);
        metro_map.selectAll(".tot_area.selected").remove();
        metro_map.selectAll(".line.tot_area")
            .attr("opacity", 1);
    });


    function selectStation(d, i) {
        d3.select(this)
            .classed("selected", true)
            .classed("unselected",false);
        update_map(metro_map, panel, data_stations, selected_data, x_map, y_map, y_hour, yAxis, barChartHeight,d.id, d.line)
    }
}

function update_map(metro_map, panel, data_stations, selected_data, x, y, y_hour, yAxis, barChartHeight, st_id, st_line) {

    selected_data.forEach(line => {
        if (!line.stations.map(st => st.id).includes(st_id) && line.name === st_line) {
            line.stations.push(data_stations.find(st => st.id === st_id))
        }
    });

    var tot_area_curve = d3.area()
        .x0(d => x(d.coordinates_map_lower.cx))
        .x1(d => x(d.coordinates_map_upper.cx))
        .y0(d => y(d.coordinates_map_lower.cy))
        .y1(d => y(d.coordinates_map_upper.cy))
        .curve(d3.curveCardinal);

    metro_map.selectAll(".line.tot_area")
        .attr("opacity", 0.1);
    metro_map.selectAll("path.tot_area.selected").remove();

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

    // console.log("x_hour", x_hour.range(), x_hour.domain());
    // console.log("y_hour", y_hour.range(), y_hour.domain());

    panel.select(".y.axis")
        .call(yAxis);

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

    day_graph.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + barChartHeight + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("y", 20)
        .attr("transform", "rotate(30)")
        .style("text-anchor", "start");

    day_graph.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    day_graph.append("text")
        .attr("class", "y axis legend")
        .attr("text-anchor", "middle")
        .attr("y", -10)
        .attr("x", 0)
        .text("Somme des minutes de pannes");

    day_graph.append("text")
        .attr("class", "title legend")
        .attr("text-anchor", "begin")
        .attr("y", -20)
        .attr("x", barChartWidth / 3)
        .text("Heures d'affluences");

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
        .attr("x", d => {console.log("d: ", d, "x_hour(d): ", x_hour(d)); return x_hour(d)})
        .attr("width", x_hour.bandwidth())
        .style("fill", "#83c0ef");
}
