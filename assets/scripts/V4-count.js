"use strict";

/**
 * Réorganise les données afin de combiner les résultats pour une même circonsription.
 *
 * @param incidents      Données provenant du fichier CSV.
 * @return {Array}  Les données réorganisées qui seront utilisées. L'élément retourné doit être un tableau d'objets
 *                  comptant 338 entrées, c'est-à-dire, une entrée par circonscription. Chacune des entrées devra
 *                  présenter les résultats pour chacune des lignes de métro des candidats triés en ordre décroissant (du candidat ayant
 *                  obtenu le plus de votes à celui en ayant reçu le moins). L'objet retourné doit avoir la forme suivante:
 *
 *                  [
 *                    {
 *                      id: number              // Le numéro de la ligne
 *                      name: string,           // Le nom de la ligne
 *                      results: [              // Le tableau contenant les résultats pour les incidents durant lesquels le frein d'urgence a été actionné.
 *                                              // *** Ce tableau doit être trié en ordre décroissant de nombre d'indicents durant lesquels le frein d'urgence a été actionné. ***
 *                        {
 *                          station: string,  // Le nom de la station
 *                          count: number,      // Le nombre d'arrêts de service durant lesquels le frein d'urgence a été actionné
 *                          percent: string,    // Le pourcentage des votes obtenus par le candidat
 *                          party: string       // Le parti politique du candidat
 *                        },
 *                        ...
 *                      ]
 *                    },
 *                    ...
 *                  ]
 */
function createSources(data) {
    // Retourner l'objet ayant le format demandé. Assurez-vous de trier le tableau "results" pour chacune des entrées
    //       en ordre décroissant de votes (le candidat gagnant doit être le premier élément du tableau).$
  
      // on recupère la liste des Id des circonscriptions
      var id_set = d3.set(data.map(row => row.id)).values();
      // pour chaque sation, on réalise le traitement
      return id_set.map(id => {
          return {
              id: parseInt(id),
              // on cherche le nom qui correspond à l'id
              name: data.find(row => row.id === parseInt(id)).name,
              // on filtre les résultats qui correspond uniquement à la circonscription
              results: data.filter(row => row.id === parseInt(id)).map(row => {
                  return {
                      candidate: row.candidate,
                      votes: row.votes,
                      percent: row.percent,
                      party: row.party
                  }
              // on classe en fonction des votes
              }).sort((res_a, res_b) => res_b.votes - res_a.votes)
          }
      });
  }


/**
 * Fichier permettant de dessiner le graphique à bandes.
 */


/**
 * Crée les axes du graphique à bandes.
 *
 * @param g       Le groupe SVG dans lequel le graphique à bandes doit être dessiné.
 * @param xAxis   L'axe X.
 * @param yAxis   L'axe Y.
 * @param height  La hauteur du graphique.
 */
function createAxes(g, xAxis, yAxis, height) {
  // Dessiner les axes X et Y du graphique. Assurez-vous d'indiquer un titre pour l'axe Y.
    // ajout du l'axe X
    g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height - 1})`)
        .call(xAxis)
    .selectAll("text")
        .attr("y", 20)
        .attr("transform", "rotate(30)")
        .style("text-anchor", "start");

    // ajout de l'axe Y
    g.append("g")
        .attr("class", "y axis")
        .attr("transform", `translate(0,0)`)
        .call(yAxis);

    g.append("text")
        .attr("class", "y axis legend")
        .attr("text-anchor", "end")
        .attr("y", -10)
        .attr("x", 80)
        .text('Nombre de trajets');

}

/**
 * Crée le graphique à bandes.
 *
 * @param g             Le groupe SVG dans lequel le graphique à bandes doit être dessiné.
 * @param currentData   Les données à utiliser.
 * @param x             L'échelle pour l'axe X.
 * @param y             L'échelle pour l'axe Y.
 * @param color         L'échelle de couleurs qui est associée à chacun des noms des stations de BIXI.
 * @param tip           L'infobulle à afficher lorsqu'une barre est survolée.
 * @param height        La hauteur du graphique.
 */
function createBarChart(g, currentData, x, y, color, tip, height) {
  // Dessiner les cercles à bandes en utilisant les échelles spécifiées.
  //       Assurez-vous d'afficher l'infobulle spécifiée lorsqu'une barre est survolée.

    var sclBand  = d3.scaleBand()
        .domain(x.domain())
        .range(x.range())
        .paddingInner(0.05)
        .paddingOuter(0.05);

    g.selectAll("bars")
        .data(currentData.destinations)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.count))
        .attr("height", d => height - y(d.count))
        .attr("x", d => x(d.name) + sclBand.step() * 0.05)
        .attr("width", sclBand.bandwidth())
        .style("fill", d => color(d.name))
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

}

/**
 * Réalise une transition entre les données actuellement utilisées et les nouvelles qui doivent être utilisées.
 *
 * @param g         Le groupe SVG dans lequel le graphique à bandes est dessiné.
 * @param newData   Les nouvelles données à utiliser.
 * @param y         L'échelle pour l'axe Y.
 * @param yAxis     L'axe Y.
 * @param height    La hauteur du graphique.
 */
function transition(g, newData, y, yAxis, height) {
  /*
   - Réaliser une transition pour mettre à jour l'axe des Y et la hauteur des barres à partir des nouvelles données.
   - La transition doit se faire en 1 seconde.
   */
    g.selectAll(".y.axis")
        .call(yAxis);

    g.selectAll("rect")
        .data(newData.destinations)
        .transition()
        .duration(1000)
        .attr("y", d => y(d.count))
        .attr("height", d => height - y(d.count))
}

/**
 * Obtient le texte associé à l'infobulle.
 *
 * @param d               Les données associées à la barre survollée par la souris.
 * @param currentData     Les données qui sont actuellement utilisées.
 * @param formatPercent   Fonction permettant de formater correctement un pourcentage.
 * @return {string}       Le texte à afficher dans l'infobulle.
 */
function getToolTipText(d, currentData, formatPercent) {
  // Retourner le texte à afficher dans l'infobulle selon le format demandé.
  //       Assurez-vous d'utiliser la fonction "formatPercent" pour formater le pourcentage correctement.

    var total = d3.sum(currentData.destinations, desti => desti.count);
    var percent = d.count/total;
    return "<span>"+ d.count + " (" + formatPercent(percent) + ")</span>";
}
