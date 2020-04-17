/**
 * Réorganise les données afin de combiner les résultats pour une même ligne.
 *
 *                  [
 *                    {
 *                      ligne: string,           // La couleur (le nom) de la ligne
 *                      count: number,           // Nombre total d'incidents incluant un enclenchement du frein d'urgence.
 *                      stoptime: number         // Temps total d'arrêt de service dû à un incident incluant un enclenchement du frein d'urgence'.
 *                    }
 *                  ]
 */
function createSources(data) {
  // Retourner l'objet selon le format énoncé ci-haut.
  
    // on recupère la liste des couleurs des lignes
    var line_set = d3.set(data.map(row => row.line)).values();

    // pour chaque ligne, on réalise le traitement
    return line_set.map(id => {
        return {
            ligne: data.find(row => row.line ===id).line,
            // on compte le nombre d'incidents à la station
            count: d3.sum(data.filter(row=>row.line ===id).map(d => d.incidents.length)),
            // on filtre les résultats qui correspond uniquement à la circonscription
            stoptime: d3.sum(data.filter(row=>row.line ===id).map(d => d.total_stop_time)),

            // on classe en fonction du nombre d'arrêt de services
            };
        })
}

function createAxes(g, xAxis, yAxis, height) {
  // Dessiner les axes X et Y du graphique. Assurez-vous d'indiquer un titre pour l'axe Y.
    // ajout du l'axe X
    g.append("g")

        .attr("transform", `translate(0,${height - 1})`)
        .call(xAxis)
    .selectAll("text")
        .attr("y", 20)
        .attr("transform", "rotate(30)")
        .style("text-anchor", "start");

    // ajout de l'axe Y
    g.append("g")

        .attr("transform", `translate(0,0)`)
        .call(yAxis);
      


}


/**
 * Crée le graphique à bandes.
 *
 * g             Le groupe SVG dans lequel le graphique à bandes doit être dessiné.
 * data          Les données à utiliser.
 * x             L'échelle pour l'axe X.
 * y             L'échelle pour l'axe Y.
 * color         L'échelle de couleurs qui est associée à chacune des lignes de métro
 * tip           L'infobulle à afficher lorsqu'une barre est survolée.
 * height        La hauteur du graphique.
 */

function create_bar_count(g, sources, data, x, y, height) {
  
  var sclBand  = d3.scaleBand()
      .domain(x.domain())
      .range(x.range())
      .paddingInner(0.05)
      .paddingOuter(0.05);
  
  g.selectAll("rect")
      .data(sources)
      .enter()
      .append("rect")
      .attr("x", d => x(d.ligne) + sclBand.step() * 0.05)
      .attr("y", d => y(d.count))
      .attr("width", sclBand.bandwidth())
      .attr("height", d => height-y(d.count));

  g.selectAll("text")
      .data(sources)
      .enter()
      .append("text")
      .text("valuetext", d => valuetext(d.count))
      .attr("x", (d,i) => i*sclBand.bandwidth()/sources.length)
      .attr("y", d => height - 4*d)
      .attr("width", sclBand.bandwidth())

}