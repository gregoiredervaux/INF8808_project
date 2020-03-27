
//http://www.cagrimmett.com/til/2016/08/19/d3-pie-chart.html


// Fonction qui détecte l'heure de début et de fin sélectionnées par l'utuliateur
// g est l'élément SVG qui contient la V1
// Retourne l'heure de début et de fin
function select_begin_end(g){

};


// Fonction pour créer piechart_dataset.
// g est l'élément SVG qui contient la V1.
// Retourne le nombre d'incident dans l'intervalle et hors de l'intervalle sous la forme [{'name':'nombre_incident_dans_intervalle', 'number':123},{'name':'nombre_incident_hors_intervalle','number':844}]
function select_incidents_in_the_timeframe(dataset, begin, end){

};











// dataset est de la forme [{'name':'nombre_incident_dans_intervalle', 'number':123},{'name':'nombre_incident_hors_intervalle','number':844}]
// g est le groupe SVG dans lequel le piechart doit être
function create_piechart(dataset) {

    var width = 300,
	height = 300,
    radius = Math.min(width, height) / 2;




    
    var color = d3.scaleOrdinal()
                  .range(["#2C93E8","#838690"]);
                  





    var pie = d3.pie()
                .value(function(d) { return d.number; })(dataset);
 






    var arc = d3.arc()
	            .outerRadius(radius - 10)
	            .innerRadius(0);

    var labelArc = d3.arc()
	                .outerRadius(radius - 40)
                    .innerRadius(radius - 40);






    
    var svg = d3.select("#canvasV1")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                    .append('g')
                    .attr("transform", "translate(" + width/2 + "," + height/2 +")");
    
    var g = svg.selectAll("arc")
                .data(pie)
                .enter()
                .append("g")
                    .attr("class", "arc");

    
    g.append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data.name);});
    
    

    

};