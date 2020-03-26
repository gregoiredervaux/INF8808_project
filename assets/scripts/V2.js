function createLine(x, y) {
    // Retourner une ligne SVG (voir "d3.line"). Pour l'option curve, utiliser un curveBasisOpen.

    // A partie du couple passé en argument, on en déduit des coordonnées (date, compteur)
    // on utilise l'interpolation suggérée par l'ennoncé
    return (d3.line()
            .x(d => {console.log(d); return x(d.cx)})
            .y(d => y(d.cy))
    )

}


function create_map(g, data, x, y, color) {

    var bubbles = g.selectAll("circle")
        .data(data)
        .enter();

    bubbles.append("circle")
        .attr("cx", d => x(d.coordinates_map.cx))
        .attr("cy", d => y(d.coordinates_map.cy))
        .attr("r", d => 5)
        .attr("fill", d => color(d.total_stop_time))
        .attr("fill-opacity", 0.7);
        //.on('mouseover', tip.show)
        //.on('mouseout', tip.hide);

    var line = createLine(x, y);

    var paths = g.selectAll("path")
        .data(data)
        .enter();

    paths.append("path")
        .attr("class", "line")
        .attr("d", d => {console.log(d.coordinates_map); return line(d.coordinates_map)})
        .attr("clip-path", "url(#clip)")
        .style("opacity", 1);
}
