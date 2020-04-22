/**
 * Réorganise les données afin de combiner les résultats pour une même ligne.
 *
 *                  [
 *                    {
 *                      ligne: string,                                          // La couleur (le nom) de la ligne
 *                      stations:[
 *                                 {
 *                                  name: string,                               // Le nom de la station
 *                                  totaltime: number,                          // Le temps total d'arrêt à la station
 *                                  totalcount: number,                         // Le nombre total d'incidents à la station
 *                                  incidents: [
 *                                                  {cause: string,             // La cause secondaire de l'incident
 *                                                   count: number,             // Le nombre cumulatif d'incidents associés à la cause secondaire
 *                                                   time: number               // Le temps d'arrêt total associé à la cause secondaire                        
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
      
      // pour chaque ligne, on réalise le traitement
      return line_set.map(line => {
          return {
              ligne: line,
              // on compte le nombre d'incidents à la station
              stations: data.filter(row => row.line === line).map(stat => {
                  return {
                        name: stat.name,
                        totaltime: stat.total_stop_time,
                        totalcount: stat.incidents.length,
                        incidents: (d3.set(stat.incidents.map(inci=>inci['Cause secondaire'])).values()).map(cause => {
                            return {
                                cause: cause,
                                count: stat.incidents.filter(inci=>inci['Cause secondaire'] === cause).length,
                                time: d3.sum(stat.incidents.filter(inci=>inci['Cause secondaire'] === cause).map(t=>t.time))

                            }
                        })  
                   }
                }).sort((a,b) => b.totalcount - a.totalcount)  
            }
        });
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

function create_bar_count(g, sources, tip, height, width) {
    var x = d3.scaleBand().range([0, width]).round(0.05)
                 .domain(sources.map(d => d.ligne));

    var y = d3.scaleLinear().range([height, 0])
                 .domain([0, d3.max(sources.map(row=>row.stations.map(k=>k.totalcount).reduce((a,b)=>a+b)))]);
  
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
      .attr("y", d => y(d3.sum(d.stations.map(k=>k.totalcount))))
      .attr("width", sclBand.bandwidth())
      .attr("height", d => height-y(d3.sum(d.stations.map(k=>k.totalcount))))
      .attr("fill", d => color_value(d.ligne))
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
      .attr("y", d => y(d3.sum(d.stations.map(k=>k.totalcount)))-20)
      .attr("dy", ".75em")
      .text(d => d3.sum(d.stations.map(k=>k.totalcount))); 

}



function getToolTipText(d) {

    /**Format à retourner:
     * Stations sur la ligne [couleur de la ligne en français] avec le plus grand nombre d'arrêts de service]
     * 1. [Nom de la station 1]: [nombre d'arrêts de service/temps d'arrêt dû à des incidents +"minutes"]
     * 2. [Nom de la station 2]: [nombre d'arrêts de service/temps d'arrêt dû à des incidents +"minutes"]
     * 3. [Nom de la station] 3: [nombre d'arrêts de service/temps d'arrêt dû à des incidents +"minutes"]
     */  

    return "<span>"+ "<b>Stations de la ligne "+ frenchLine(d.ligne) + " avec le plus grand nombre d'arrêts de service</b>" 
    + "<br>1. " + d.stations.map(d=>d.name)[0] +": " + d.stations.map(d=>d.totalcount)[0]
    + "<br>2. " + d.stations.map(d=>d.name)[1] +": " + d.stations.map(d=>d.totalcount)[1]
    + "<br>3. " + d.stations.map(d=>d.name)[2] +": " + d.stations.map(d=>d.totalcount)[2]
    + "</span>"; 
}

  


// Fonction qui affiche un bar chart des causes secondaires pour une ligne en particulier
// Bar chart s'afficher uniquemment lorsque l'on clique sur une barre du graphique de gauche
function display_causes(g, sources, height, width) {

       // Trouver tous les rectangles du bar chart de gauche
    var all_rects_left = d3.selectAll("#left_bar_chart").selectAll("rect");

    // Lorsque l'on clique sur un rectangle du bar chart de gauche, le bar chart de droite apparait
    all_rects_left.on("click", function(d)    {

        createAxes(g, d, sources, height, width);
        create_bar_cause(g, d, sources, height, width);

        // On trouve la couleur de la barre du chart de gauche sur laquelle on a cliqué
        var color_clicked = d3.select(this).attr("fill"); 

        // On applique cette couleur à toute les barres de droite
        d3.selectAll("#right_bar_chart").selectAll("rect")
                                        .attr("fill",color_clicked)
                                        .attr("stroke", color_clicked);
    });
};


function create_bar_cause(g, d, sources, height, width){


    var cause_set = d3.set(sources.filter(k=>k.ligne === d.ligne).map(row=>row.stations.map(k=>k.incidents.map(c=>c.cause))).flat(2)).values();
    var sources2 = sources.filter(k=>k.ligne === d.ligne);
    var sources_right = createSources_rightbar(cause_set, sources2);
    console.log(sources_right)

    var x = d3.scaleBand().range([0, width]).round(0.05)
                   .domain(sources_right.map(k=>k.name));
    
    var y = d3.scaleLinear().range([height, 0])
        .domain([0, d3.max(sources.map(row=>row.stations.map(k=>k.totalcount).reduce((a,b)=>a+b)))]);

    var sclBand  = d3.scaleBand()
        .domain(x.domain())
        .range(x.range())
        .paddingInner(0.05)
        .paddingOuter(0.05);

        console.log("test x", d3.set(sources.filter(k=>k.ligne === d.ligne).map(row=>row.stations.map(k=>k.incidents.map(c=>c.cause))).flat(2)).values());
        console.log("test y", d3.sum(sources.filter(k=>k.ligne === d.ligne).map(row=>row.stations.map(k=>k.incidents.filter(c=>c.cause==="Nuisance involontaire").map(c=>c.count))).flat(2)));
    
    // On retire toutes les barres ************* Addition d'Étienne ***********************
    // Un peu rough considérant que ca ne fait pas de transition. 
    // Pour un transition, voir la V2 de greg (ctrl-f pour transition)
    // Cependant, pour faire des transitions, il faudrait que l'axe en x soit fixe
    // C'est à dire, que l'on présente toujours les mêmes trois causes par exemple
    // Ainsi, même si un cause est à zéro pour une ligne, elle serait affiché et la barre grandit ou rétrécit lorsque l'on clique
    
    // Ce qui honnetement je trouve serait mieux
    // En ne gardant que méfait volontaire, nuisance involontaire, blessé ou malade
    // Mais live c'est good enough. Si tu as encore du temps, c'est plutôt sur le temps total vs nombre de panne qui serait intéressant de faire
    g.selectAll("rect").remove().exit();

    // On ajoute toutes les barres    
    g.selectAll("rect")
      .data(sources_right)
      .enter()
      .append("rect")
      .attr("x", c => x(c.name) + sclBand.step() * 0.05)
      .attr("y", c => y(c.count))
      .attr("width", sclBand.bandwidth())
      .attr("height", c => height-y(c.count))
      //.attr("fill-opacity", 0.7)
      //.attr("stroke", d => color_value(d.ligne))
      //.attr("stroke-width", 2.5);
    
    // On retire tout le texte du bar chart (sur l'axe et les chiffres au dessus)
    g.selectAll("text").text("");

    // On remet les nouveaux chiffres au desuss
    g.selectAll("label")        
      .data(sources_right)
      .enter()
      .append("text")
      .attr("class","label")
      .attr("x", c => 0.48*sclBand.bandwidth() + x(c.name))
      .attr("y", c => y(c.count)-20)
      .attr("dy", ".75em")
      .text(c => c.count);

    // On remet les noms de causes sur l'axe
    createAxes(g, d, sources, height, width);



      
}
  
function createAxes(g, d, sources, height, width) {

    // Ajout du l'axe X
    
    var cause_set = d3.set(sources.filter(k=>k.ligne === d.ligne).map(row=>row.stations.map(k=>k.incidents.map(c=>c.cause))).flat(2)).values();

    var x = d3.scaleBand().range([0, width]).round(0.05)
                   .domain(cause_set);
    
    var xAxis = d3.axisBottom(x);
    
    g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height-1})`)
        .call(xAxis)
    .selectAll("text")
        .attr("y", 20)
        .attr("transform", "rotate(15)")
        .style("text-anchor", "start")
        .style("font-size", 13);
        
        
}

function createSources_rightbar(cause_set, sources2){
    return cause_set.map(causes =>{
        return{
            name: causes,
            count: d3.sum(sources2.map(row=>row.stations.map(k=>k.incidents.filter(c=>c.cause===causes).map(c=>c.count))).flat(2))
        }
    }).sort((a,b) => b.count - a.count)
}
