"use strict";

/**
 * Fichier permettant de traiter les données provenant du fichier CSV.
 */



function scale_from_GPS(pt_metro, scale_x, scale_y) {

    /**
     * Précise le domaine de l'échelle qui est utilisées pour positionner les stations de métro.
     *
     * @param pt_metro  Les données des stations de métro.
     * @param scale_x   echelle des abscisses
     * @param scale_y   echelle des ordonnées
     */

    scale_x.domain([d3.min(pt_metro, row => row.coordinates_map.cx), d3.max(pt_metro, row => row.coordinates_map.cx)]);
    scale_y.domain([d3.min(pt_metro, row => row.coordinates_map.cy), d3.max(pt_metro, row => (row.coordinates_map.cy))]);
}

function scale_incidents(data, color, pipe) {

    /**
     * Précise le domaine et la plage de couleurs utilisée pour afficher le temps total d'arrets des
     * stations de métro.
     *
     * @param data: Les données des stations de métro.
     * @param color: echelle des couleurs (plus utilisé dans la version finale)
     * @param pipe: echelle des aires en fonction du temp total d'arret sur l'année pour chaque station
     */

    var min = 0;
    var max = d3.max(data , station => d3.sum(station.incidents, inci =>  inci.time));

    color.domain([min , max]);
    pipe.domain([min, max]);
}

function color_value(couleur) {
    /**
     * traduit les couleurs en hex
     *
     * @param couleur: str de la couleur: "green, orange, blue, ou yellow"
     */

    switch(couleur) {
        case "green":
            return "#009534";
        case "orange":
            return "#ff782b";
        case "blue":
            return "#009ee0";
        case "yellow":
            return "#ffe400";
        default:
            return "black"
    }
}

function frenchLine(line) {

    /**
     * traduit les couleurs en francais
     *
     * @param couleur: str de la couleur: "green, orange, blue, ou yellow"
     */

    switch(line) {
        case "green":
            return "verte";
        case "orange":
            return "orange";
        case "blue":
            return "bleue";
        case "yellow":
            return "jaune";
        default:
            return "indéfinie"
    }
}

function normalize_str(strg) {

    /**
     * normalise un chaine de caractère (retire les caractères spéciaux et accents)
     * @param   strg: chaine de caractère a traiter
     *
     * @return la même chaine de caractère normalisée
     */

    return strg.normalize("NFD").replace(/[\u0300-\u036f\^\'\¨]/g, "")
        .replace(/[-_]/g, " ")
        .replace(/St/ig, "Saint");
}

function clean_data(pt_metro, incidents) {

    /**
     * Nettoie chaque donnée de station
     *
     * @param pt_metro: liste des stations de métro tirées de google maps
     * @param incidents: données des incidents de stations
     */

    incidents.forEach(inci => {
        // on normalise les noms des stations
        inci["Code de lieu"] = normalize_str(inci["Code de lieu"]);
        inci["Code de lieu"] = inci["Code de lieu"].normalize("NFD").replace(/[\u0300-\u036f\^\'\¨]/g, "");

        // on convertie les dates en objet Date
        inci.debut = new Date(`${inci["Jour calendaire"]}T${inci["Heure de l'incident"]}`);
        inci.fin = new Date(`${inci["Jour calendaire"]}T${inci["Heure de reprise"]}`);

        // on calcule la durée de chaque incident et on l'ajoute aux données des incidents
        inci.time = (inci.fin - inci.debut)/60000;

        // on traduite les ligne de francais à anglais pour simplifier le traitement et l'affichage
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
    // on normalise le nom des stations de métro tirées de google maps
    pt_metro.forEach(st => {
        st.name_id = normalize_str(st.name);
        st.name_id = st.name_id.normalize("NFD").replace(/[\u0300-\u036f\^\'\¨]/g, "")
    });

    // on gère la positon des stations communes à 2 ou 3 lignes, et décale leurs positions pour former un cercle.
    var staked_station = [];
    pt_metro.forEach(st => {
        var neighbour = pt_metro.filter(st_test => st_test.name_id === st.name_id);
        if (!staked_station.includes(st.name_id) && neighbour.length > 1) {
            staked_station.push(st.name_id);
            neighbour.forEach((st_neighbour, i) => {
                st_neighbour.coordinates_map_stacked = JSON.parse(JSON.stringify(st_neighbour.coordinates_map));
                st_neighbour.coordinates_map.cx += 10 * Math.cos(2 * Math.PI * i / neighbour.length );
                st_neighbour.coordinates_map.cy += 10 * Math.sin(2 * Math.PI * i / neighbour.length );
            })
        }
    })
    console.log("pt_metro", pt_metro)
}


function data_per_station(pt_metro, incidents) {

    /**
     * Ajoute chaque incident aux données de sa station correspondante
     *
     * @param pt_metro: liste des stations de métro tirées de google maps
     * @param incidents: données des incidents de stations
     *
     * @return: données des stations fusionnées au incidents
     */

    return pt_metro.map(row => {
        return {
            id: parseInt(row.id),
            name: row.name,
            coordinates: row.coordinates,
            coordinates_map: row.coordinates_map,
            coordinates_map_stacked : (row.coordinates_map_stacked ? row.coordinates_map_stacked : undefined),
            line: row.line,
            populartimes: row.populartimes,
            // on utilise un expression régulière pour selectionner les stations correspondantes aux incidents
            incidents: incidents.filter(incident => new RegExp(row.name_id, "i").test(incident["Code de lieu"]) &&
                row.line === incident.line)
        }
    }).map(station => {
        // On gère les incidents qui ont lieux entre deux stations
        station.incidents.forEach(inci => {if(inci["Code de lieu"].includes("/")){inci.time /= 2}});
        // Une fois que tout les incidents sont classés, on peut calculer facilement le temps total d'arret pour l'année
        station.total_stop_time = d3.sum(station.incidents, inci => inci.time);
        return station
    })
}