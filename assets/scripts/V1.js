
//http://www.cagrimmett.com/til/2016/08/19/d3-pie-chart.html


// Fonction pour créer piechart_dataset. Retourne le nombre d'incident dans l'intervalle et hors de l'intervalle
function select_incidents_in_the_timeframe(dataset, begin, end){

};











// dataset est de la forme [{'nombre_incident_dans_intervalle':123},{'nombre_incident_hors_intervalle'}]
// g est le groupe SVG dans lequel le piechart doit être
function create_piechart(g, dataset) {

    var width = 300,
	height = 300,
    radius = Math.min(width, height) / 2;
    
    var color = d3.scaleOrdinal()
	              .range(["#2C93E8","#838690"]);

    var pie = d3.pie()
    .value(function(d) { return d.presses; })(dataset);
    console.log(pie);

    var arc = d3.arc()
	            .outerRadius(radius - 10)
	            .innerRadius(0);

    var labelArc = d3.arc()
	                .outerRadius(radius - 40)
                    .innerRadius(radius - 40);
    console.log(labelArc);

    

};