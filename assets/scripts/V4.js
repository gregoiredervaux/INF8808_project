/**
 * Réorganise les données afin de combiner les nombre d'arrêts  pour une même ligne/station.
 *
 *                  [
 *                    {
 *                      ligne: string,                                          // La couleur (le nom) de la ligne
 *                      stations:[
 *                                 {
 *                                  name: string,                               // Le nom de la station
 *                                  totalcount: number,                         // Le nombre total d'incidents à la station
 *                                  incidents: [
 *                                                  {cause: string,             // La cause secondaire de l'incident
 *                                                   count: number,             // Le nombre cumulatif d'incidents associés à la cause secondaire                        
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
function create_SourcesCount(data_freins) {
    // Retourner l'objet selon le format énoncé ci-haut.
    
      // on recupère la liste des couleurs des lignes

      var cause_set = ["Blessée ou malade","Méfait volontaire","Nuisance involontaire"];

      var line_set = d3.set(data_freins.map(row => row.line)).values();
      
      // pour chaque ligne, on réalise le traitement
      return line_set.map(line => {
          return {
              ligne: line,
              // on compte le nombre d'incidents à la station
              stations: data_freins.filter(row => row.line === line).map(stat => {
                  return {
                        name: stat.name,
                        totalcount: stat.incidents.map(cause => cause['Cause secondaire']).filter(k=> k === cause_set[0]).flat(1).length
                                    +stat.incidents.map(cause => cause['Cause secondaire']).filter(k=> k === cause_set[1]).flat(1).length
                                    +stat.incidents.map(cause => cause['Cause secondaire']).filter(k=> k === cause_set[2]).flat(1).length,
                        incidents:  cause_set.map(cause => {
                            return {
                                cause: cause,
                                count: stat.incidents.filter(inci=>inci['Cause secondaire'] === cause).length
                            }
                        })
                    }

                }).sort((a,b)=>b.totalcount-a.totalcount) 
            }
        })
}

function create_SourcesTime(data_freins) {
    // Retourner l'objet selon le format énoncé ci-haut.
    
      // on recupère la liste des couleurs des lignes

      var cause_set = ["Blessée ou malade","Méfait volontaire","Nuisance involontaire"];

      var line_set = d3.set(data_freins.map(row => row.line)).values();
      
      // pour chaque ligne, on réalise le traitement
      return line_set.map(line => {
          return {
              ligne: line,
              // on compte le nombre d'incidents à la station
              stations: data_freins.filter(row => row.line === line).map(stat => {
                  return {
                        name: stat.name,
                        totalcount:  d3.sum([stat.incidents.filter(cause => cause['Cause secondaire'] === cause_set[0]).map(d=>d.time), 
                                            stat.incidents.filter(cause => cause['Cause secondaire'] === cause_set[1]).map(d=>d.time),
                                            stat.incidents.filter(cause => cause['Cause secondaire'] === cause_set[2]).map(d=>d.time)]),
                        incidents:  cause_set.map(cause => {
                            return {
                                cause: cause,
                                count: d3.sum(stat.incidents.filter(inci=>inci['Cause secondaire'] === cause).map(t=>t.time))

                            }
                        })
                    }

                }).sort((a,b)=>b.totalcount-a.totalcount) 
            }
        })
}



/**
 * Crée le graphique à bandes.
 *
 * g             Le groupe SVG dans lequel le graphique à bandes doit être dessiné.
 * sources       Les données à utiliser.
 * tip           L'infobulle à afficher lorsqu'une barre est survolée.
 * height        La hauteur du graphique.
 * width         La largeur du graphique
 */

function create_bar_count(g, sources, tip, height, width) {
    
    var x = d3.scaleBand().range([0, width]).round(0.05)
                 .domain(sources.map(d => d.ligne));

    var y = d3.scaleLinear().range([0, height])
                 .domain([0, d3.max(sources.map(row=>row.stations.map(inci=>inci.incidents.map(k=>k.count).reduce((a,b)=>a+b)).reduce((a,b)=>a+b)))]);
  
    var sclBand  = d3.scaleBand()
      .domain(x.domain())
      .range(x.range())
      .paddingInner(0.05)
      .paddingOuter(0.05);

    g.append("line")
        .attr("x1",0)
        .attr("y1", height+15)
        .attr("x2", width)
        .attr("y2", height+15)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
  
    g.selectAll("rect")
      .data(sources)
      .enter()
      .append("rect")
      .attr("x", d => x(d.ligne) + sclBand.step() * 0.05)
      .attr("y", d => height - y(d.stations.map(inci=>inci.incidents.map(k=>k.count).reduce((a,b)=>a+b)).reduce((a,b)=>a+b)))
      .attr("width", sclBand.bandwidth())
      .attr("height", d => y(d.stations.map(inci=>inci.incidents.map(k=>k.count).reduce((a,b)=>a+b)).reduce((a,b)=>a+b)))
      .attr("fill", d => color_value(d.ligne))
      .attr("stroke", d => color_value(d.ligne))
      .attr("stroke-width", 2)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);   
      
    g.selectAll(".text")        
      .data(sources)
      .enter()
      .append("text")
      .attr("class","label")
      .attr("x", d => 0.48*sclBand.bandwidth() + x(d.ligne))
      .attr("y", d => height - y(d.stations.map(inci=>inci.incidents.map(k=>k.count).reduce((a,b)=>a+b)).reduce((a,b)=>a+b))-20)
      .attr("dy", ".75em")
      .text(d => Math.round(d.stations.map(inci=>inci.incidents.map(k=>k.count).reduce((a,b)=>a+b)).reduce((a,b)=>a+b))); 

}


function transition_bar_charts(g, sources, tip, height, width, bar_count_causes) {
    /* TODO:
         - Réaliser une transition entre l'ancienne position et la nouvelle position des cercles.
         - Mettre à jour la taille du rayon des cercles.
         - La transition doit se faire en 1 seconde.
     */
    var x = d3.scaleBand().range([0, width]).round(0.05)
                 .domain(sources.map(d => d.ligne));

    var y = d3.scaleLinear().range([0, height])
                 .domain([0, d3.max(sources.map(row=>row.stations.map(inci=>inci.incidents.map(k=>k.count).reduce((a,b)=>a+b)).reduce((a,b)=>a+b)))]);
  
    var sclBand  = d3.scaleBand()
      .domain(x.domain())
      .range(x.range())
      .paddingInner(0.05)
      .paddingOuter(0.05);
    
    g.selectAll("rect")
      .data(sources)
      .attr("x", d => x(d.ligne) + sclBand.step() * 0.05)
      .attr("width", sclBand.bandwidth())
      .attr("fill", d => color_value(d.ligne))
      .attr("stroke", d => color_value(d.ligne))
      .attr("stroke-width", 2)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .transition()
        .duration(750)
        .ease(d3.easeLinear)   
        .attr("y", d => height - y(d.stations.map(inci=>inci.incidents.map(k=>k.count).reduce((a,b)=>a+b)).reduce((a,b)=>a+b)))
        .attr("height", d => y(d.stations.map(inci=>inci.incidents.map(k=>k.count).reduce((a,b)=>a+b)).reduce((a,b)=>a+b)));
    
    g.selectAll("text")        
        .data(sources)
        .attr("class","label")
        .attr("x", d => 0.48*sclBand.bandwidth() + x(d.ligne))
        .attr("dy", ".75em")
        .transition()
            .duration(750)
            .ease(d3.easeLinear)   
            .attr("y", d => height - y(d.stations.map(inci=>inci.incidents.map(k=>k.count).reduce((a,b)=>a+b)).reduce((a,b)=>a+b))-20)
            .text(d => Math.round(d.stations.map(inci=>inci.incidents.map(k=>k.count).reduce((a,b)=>a+b)).reduce((a,b)=>a+b)));
    
    // Fonction que lorsque l'on clique sur une barre à gauche, fait apparaitre le bar chart par cause droite
    display_causes(bar_count_causes, sources, height, width);
}


function getToolTipText(d) {

    /**Format à retourner:
     * Stations sur la ligne [couleur de la ligne en français] avec le plus grand nombre d'arrêts de service]
     * 1. [Nom de la station 1]: [nombre d'arrêts de service/temps d'arrêt dû à des incidents +"minutes"]
     * 2. [Nom de la station 2]: [nombre d'arrêts de service/temps d'arrêt dû à des incidents +"minutes"]
     * 3. [Nom de la station] 3: [nombre d'arrêts de service/temps d'arrêt dû à des incidents +"minutes"]
     */


    return "<span>"+ "<b>Top 3 des stations de la ligne "+ frenchLine(d.ligne) + "</b>" 
    + "<br>1. " + d.stations.map(k=>k.name)[0] +": " + Math.round(d.stations.map(k=>k.totalcount)[0])
    + "<br>2. " + d.stations.map(k=>k.name)[1] +": " + Math.round(d.stations.map(k=>k.totalcount)[1])
    + "<br>3. " + d.stations.map(k=>k.name)[2] +": " + Math.ceil(d.stations.map(k=>k.totalcount)[2])
    + "</span>"; 
}

// Fonction qui affiche un bar chart des causes secondaires pour une ligne en particulier
// Bar chart s'afficher uniquemment lorsque l'on clique sur une barre du graphique de gauche
function display_causes(g, sources, height, width) {

    // Trouver tous les rectangles du bar chart de gauche
    var all_rects_left = d3.selectAll("#left_bar_chart").selectAll("rect");

    // Lorsque l'on clique sur un rectangle du bar chart de gauche, le bar chart de droite apparait
    all_rects_left.on("click", function(d)    {

        createAxes(g, height, width);
        create_bar_cause(g, d, sources, height, width);

        // On trouve la couleur de la barre du chart de gauche sur laquelle on a cliqué
        var color_clicked = d3.select(this).attr("fill"); 

        // On applique cette couleur à toute les barres de droite
        d3.selectAll("#right_bar_chart").selectAll("rect")
                                        .attr("fill",color_clicked)
                                        .attr("stroke", color_clicked)
                                        .attr("stroke-width",2)

    });
};




function create_bar_cause(g, d, sources, height, width) {

    var cause_set = ["Blessée ou malade","Méfait volontaire","Nuisance involontaire"];
    var sources2 = sources.filter(k=>k.ligne === d.ligne);
    var sources_right = createSources_rightbar(cause_set, sources2);

    var x = d3.scaleBand().range([0, width]).round(0.05)
                   .domain(cause_set);
    
    var y = d3.scaleLinear().range([0, height])
        .domain([0, d3.max(sources.map(row=>row.stations.map(inci=>inci.incidents.map(k=>k.count).reduce((a,b)=>a+b)).reduce((a,b)=>a+b)))]);

    var sclBand  = d3.scaleBand()
        .domain(x.domain())
        .range(x.range())
        .paddingInner(0.05)
        .paddingOuter(0.05);

    g.append("line")
      .attr("x1",0)
      .attr("y1", height+15)
      .attr("x2", width)
      .attr("y2", height+15)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
    
    // On retire toutes les barres ************* Addition d'Étienne ***********************
    g.selectAll("rect").remove().exit();
    g.selectAll(".tick")
        .attr("stroke-width",2)

    // On ajoute toutes les barres    
    g.selectAll("rect")
      .data(sources_right)
      .enter()
      .append("rect")
      .attr("x", c => x(c.name) + sclBand.step() * 0.05)
      .attr("width", sclBand.bandwidth())
      .attr("y", c => height - y(c.count))
      .attr("height", c => y(c.count))
    
    // On retire tout le texte du bar chart (sur l'axe et les chiffres au dessus)
    g.selectAll("text").text("");

    // On remet les nouveaux chiffres au desuss
    g.selectAll("label")        
      .data(sources_right)
      .enter()
      .append("text")
      .attr("class","label")
      .attr("x", c => 0.48*sclBand.bandwidth() + x(c.name))
      .attr("y", c => height - y(c.count)-7)
      .text(c => Math.round(c.count));

    // On remet les noms de causes sur l'axe
    createAxes(g, height, width);

} 

  
function createAxes(g, height, width) {

    // Ajout du l'axe X
    var cause_set = ["Blessée ou malade","Méfait volontaire","Nuisance involontaire"];

    var x = d3.scaleBand().range([0, width]).round(0.05)
                   .domain(cause_set);
    
    var xAxis = d3.axisBottom(x);

    
    g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height+15})`)
        .call(xAxis)
    .selectAll("text")
        .attr("y", 15)
        .style("text-anchor", "center")
        .style("font-size", 16);
}

function createSources_rightbar(cause_set, sources2){
    return cause_set.map(causes =>{
        return{
            name: causes,
            count: d3.sum(sources2.map(row=>row.stations.map(k=>k.incidents.filter(c=>c.cause===causes).map(c=>c.count))).flat(2))
        }
    }).sort((a,b) => b.count - a.count)
}
