function createLine(x, y) {
    // Retourner une ligne SVG (voir "d3.line"). Pour l'option curve, utiliser un curveBasisOpen.

    // A partie du couple passé en argument, on en déduit des coordonnées (date, compteur)
    // on utilise l'interpolation suggérée par l'ennoncé
    return (d3.line()
            .x(d => {console.log("test"); return x(d.cx)})
            .y(d => y(d.cy))
    )

}


function create_map(g, data, lines,  x, y, color, pipe) {

    var data_by_lines = Object.keys(lines).map(line => {
        return {name: line, stations: data.filter(station => {
                return lines[line].includes(parseInt(station.id))
            })}
    });

    //console.log("data par ligne: ", data_by_lines);


    var line = d3.line()
        .x(d => x(d.cx))
        .y(d => y(d.cy));

    data_by_lines.forEach(data => {

        var line_conteneur = g.append("g")
            .attr("id", `line_${data.name}`);

        var bubbles = line_conteneur.selectAll("circle")
            .data(data.stations)
            .enter();

        bubbles.append("circle")
            .attr("cx", d => x(d.coordinates_map.cx))
            .attr("cy", d => y(d.coordinates_map.cy))
            .attr("r", d => 5)
            .attr("fill", d => color(d.total_stop_time))
            .attr("fill-opacity", 0.7);

        var paths = line_conteneur.selectAll("path")
            .data(data.stations.slice(0, -1))
            .enter();

        paths.append("path")
            .attr("class", "line")
            .attr("id", d => `${d.id}-${data.stations.find(st => {
                return st.id === lines[data.name][lines[data.name].indexOf(parseInt(d.id)) + 1]
                }).id}`)
            .attr("d", d => {
                return line([
                    d.coordinates_map,
                    data.stations.find(st => {
                        return st.id === lines[data.name][lines[data.name].indexOf(parseInt(d.id)) + 1]
                    }).coordinates_map
                ])
            })
            .attr("stroke", data.name)
            .style("stroke-width", d => {console.log(pipe(d.total_stop_time));return pipe(d.total_stop_time)})
            .style("opacity", 0.8);
    });



}
