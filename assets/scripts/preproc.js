"use strict";

/**
 * Fichier permettant de traiter les données provenant du fichier CSV.
 */


/**
 * Précise le domaine et la plage de couleurs pour l'échelle qui est utilisées pour distinguer les partis politiques.
 *
 * @param pt_metro  Les données des stations de métro.
 * @param scale_x   echelle des abscisses
 * @param scale_y   echelle des ordonnées
 */
function scale_from_GPS(pt_metro, scale_x, scale_y) {

    scale_x.domain([d3.min(pt_metro, row => row.coordinates_map.cx), d3.max(pt_metro, row => row.coordinates_map.cx)]);
    scale_y.domain([d3.min(pt_metro, row => row.coordinates_map.cy), d3.max(pt_metro, row => (row.coordinates_map.cy))]);

    // console.log(scale_y.domain());
    // console.log(scale_x.domain());
}

function scale_incidents(data, color, pipe) {

    var min = 0;
    // var min = d3.min(data , station => d3.sum(station.incidents, inci =>  inci.time));
    var max = d3.max(data , station => d3.sum(station.incidents, inci =>  inci.time));

    color.domain([min , max]);
    pipe.domain([min, max]);
    //console.log("color and pipe", pipe.domain());
}

function normalize_str(strg) {

    return strg.normalize("NFD").replace(/[\u0300-\u036f\^\'\¨]/g, "")
        .replace(/[-_]/g, " ")
        .replace(/St/ig, "Saint");
}

function clean_data(pt_metro, incidents) {

    incidents.forEach(inci => {
        inci["Code de lieu"] = normalize_str(inci["Code de lieu"]);
        inci["Code de lieu"] = inci["Code de lieu"].normalize("NFD").replace(/[\u0300-\u036f\^\'\¨]/g, "")
        inci.debut = new Date(`${inci["Jour calendaire"]}T${inci["Heure de l'incident"]}`);
        inci.fin = new Date(`${inci["Jour calendaire"]}T${inci["Heure de reprise"]}`);
        inci.time = (inci.fin - inci.debut)/60000
        switch(inci["Ligne"]) {
            case "Ligne orange":
                inci.line = "orange";
                break;
            case "Ligne verte":
                inci.line = "green";
                break;
            case "Ligne bleue":
                inci.line = "blue";
                break;
            case "Ligne jaune":
                inci.line = "yellow";
                break;
        }
    });

    pt_metro.forEach(st => {
        st.name_id = normalize_str(st.name);
        st.name_id = st.name_id.normalize("NFD").replace(/[\u0300-\u036f\^\'\¨]/g, "")
    })
}


function data_per_station(pt_metro, incidents) {
    var list_station_incidents = d3.set(incidents.map(incidents => incidents["Code de lieu"])).values().sort();
    var list_station_metro = d3.set(pt_metro.map(pt_metro => pt_metro.name_id)).values().sort();

    //console.log("liste station incidents", list_station_incidents);
    //console.log("liste station metro", list_station_metro);

    let common = list_station_incidents.filter(x =>  pt_metro.find(stations => new RegExp(stations.name_id, "i").test(x)));
    let difference = list_station_incidents.filter(x =>  pt_metro.every(stations => !new RegExp(stations.name_id, "i").test(x)));

    //console.log("commun:", common);
    //console.log("différent", difference);

    return pt_metro.map(row => {
        return {
            id: parseInt(row.id),
            name: row.name,
            coordinates: row.coordinates,
            coordinates_map: row.coordinates_map,
            line: row.line,
            populartimes: row.populartimes,
            incidents: incidents.filter(incident => new RegExp(row.name_id, "i").test(incident["Code de lieu"]) &&
                row.line === incident.line)
        }
    }).map(station => {
        station.incidents.forEach(inci => {if(inci["Code de lieu"].includes("/")){inci.time /= 2}});
        station.total_stop_time = d3.sum(station.incidents, inci => inci.time);
        return station
    })
}
