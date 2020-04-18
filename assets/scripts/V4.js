/**
 * Réorganise les données afin de combiner les résultats pour une même ligne.
 *
 *                  [
 *                    {
 *                      ligne: string,                                          // La couleur (le nom) de la ligne
 *                      stations:[
 *                                 {
 *                                  name: string,                               // Le nom de la station
 *                                  incidents: [
 *                                                  {cause: string,             // La cause secondaire de l'incident
 *                                                   time: number           // Le temps d'arrêt lié à la cause secondaire                           
 *                                                  },
 *                                                  ...
 *                                              ],
 *                                              ...
 *                                 },
 *                                ...  
 *                              ],
 *                              ...
 *                    }
 *                  ]
 */

function createSources(data) {
  // Retourner l'objet selon le format énoncé ci-haut.
  
    // on recupère la liste des couleurs des lignes
    var line_set = d3.set(data.map(row => row.line)).values();
    //console.log(line_set);
    var cause_set_ghetto = ["Blessée ou malade", "Méfait volontaire","Nuisance involontaire","MR-73","MPM-10","Ligne 1, 2, 4, 5","Contrats Réno-Système",]
    //var cause_set = data.map(row => row.incidents.map(d=>d['Cause secondaire']));
    //console.log(cause_set_ghetto)

    //console.log("Nombre d'incidents frein (cause: Blessée ou malade) sur la ligne orange", d3.sum(data_freins.filter(row=>row.line ==='orange').map(d=>d.incidents.map(cause => cause['Cause secondaire']).filter(k=>k==='Blessée ou malade').length)));

    // pour chaque ligne, on réalise le traitement
    return line_set.map(line => {
        return {
            ligne: line,
            // on compte le nombre d'incidents à la station
            stations: data.filter(row => row.line === line).map(stat => {
                return {
                    name: stat.name,
                    incidents: stat.incidents.map(inci=>{//.filter(d => d['Cause secondaire'] === stat.incidents['Cause secondaire']).map(inci => {
                        return {
                            cause: inci['Cause secondaire'],
                            time: inci.time
                            //count: d3.sum(k.filter(b=>b.inci['Cause secondaire']===inci).length),
                            //timestop: inci.time,
                        }
                    }).sort((inc_a, inc_b) => inc_b.time - inc_a.time)  
                }
                     //.sort((count_a, count_b) => count_b.count - count_a.count)

                
            })
        }
    });
}  

function createAxes(g, sources, data_freins, height, width) {
  // Dessiner les axes X et Y du graphique. Assurez-vous d'indiquer un titre pour l'axe Y.
    // ajout du l'axe X
    var x = d3.scaleBand().range([0, width]).round(0.05)
                 .domain(sources.map(row=>row.ligne));

    var y = d3.scaleLinear().range([height, 0])
                 .domain([0, d3.max(sources.map(row=>row.stations.map(k=>k.incidents.length).reduce((a,b)=>a+b)))]);

    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisLeft(y);


    
    //g.append("line")
    //    .attr("x1",0)
    //    .attr("x2", width)
    //    .attr("y1", heigth+10)
    //    .attr("y2", height+10)
  
    // ajout de l'axe Y
    //g.append("g")
    //   .attr("transform", `translate(0,0)`)
    //   .call(yAxis);
      


}


/**
 * Crée le graphique à bandes.
 *
 * g             Le groupe SVG dans lequel le graphique à bandes doit être dessiné.
 * 
 * data          Les données à utiliser.
 * x             L'échelle pour l'axe X.
 * y             L'échelle pour l'axe Y.
 * tip           L'infobulle à afficher lorsqu'une barre est survolée.
 * height        La hauteur du graphique.
 * width         La largeur du graphique
 */

function create_bar_count(g, sources, data, tip, height, width) {
    var x = d3.scaleBand().range([0, width]).round(0.05)
                 .domain(sources.map(d => d.ligne));

    var y = d3.scaleLinear().range([height, 0])
                 .domain([0, d3.max(sources.map(row=>row.stations.map(k=>k.incidents.length).reduce((a,b)=>a+b)))]);
  
    var sclBand  = d3.scaleBand()
      .domain(x.domain())
      .range(x.range())
      .paddingInner(0.05)
      .paddingOuter(0.05);

      g.append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("y", height+40)
      .attr("x", width*0.5)
      .text('Ligne');
 
     g.append("line")
         .attr("x1",0)
         .attr("y1", height+15)
         .attr("x2", width)
         .attr("y2", height+15)
         .attr("stroke", "black")
         .attr("stroke-width", 1.5)
  
    g.selectAll("rect")
      .data(sources)
      .enter()
      .append("rect")
      .attr("x", d => x(d.ligne) + sclBand.step() * 0.05)
      .attr("y", d => y(d.stations.map(k=>k.incidents.length).reduce((a,b)=>a+b)))
      .attr("width", sclBand.bandwidth())
      .attr("height", d => height-y(d.stations.map(k=>k.incidents.length).reduce((a,b)=>a+b)))
      .attr("fill", d => color_value(d.ligne))
      .attr("fill-opacity", 0.7)
      .attr("stroke", d => color_value(d.ligne))
      .attr("stroke-width", 2.5)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);   
      
    g.selectAll(".text")        
      .data(sources)
      .enter()
      .append("text")
      .attr("class","label")
      .attr("x", d => 0.48*sclBand.bandwidth() + x(d.ligne))
      .attr("y", d => y(d.stations.map(k=>k.incidents.length).reduce((a,b)=>a+b))-20)
      .attr("dy", ".75em")
      .text(d => d.stations.map(k=>k.incidents.length).reduce((a,b)=>a+b)); 

}



function getToolTipText(d, data) {
    // Retourner le texte à afficher dans l'infobulle selon le format demandé.
    // Assurez-vous d'utiliser la fonction "formatPercent" pour formater le pourcentage correctement.

    
  
      var total = data.map(d=>d.count);
      //var percent = d.count/total;
      return "<span>"+ "test: " +  total + ")</span>";
  
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
  