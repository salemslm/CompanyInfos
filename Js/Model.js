var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var cheerioTableparser = require('cheerio-tableparser');
var csv = require("fast-csv");

var app = express();

var inputCompanies = [];
var resultCompanies = [["SIRET", "Nom", "Addresse", "Code Postal", "Ville", "Pays", "code NAF", "Nature de l'etablissement"]];

csv
.fromPath("companies.csv", {headers : true} )
.on("data", function(arrayCompanies){
  inputCompanies.push(arrayCompanies);

})
.on("end", function(){
  console.log("done");

  //console.log(inputCompanies);

  //console.log(inputCompanies);

  // J'ai cette information :

  // 66204244937404; BNP Paribas

  var codeNAF, companyName, address, postalCode, city, pays, natureEtablissement;

  /*
  // ou  ca :
  // 80238479200015
  // ou ca :
  // 802384792
  // ou ca :
  // 334  3453 345   23
  */
  //get SIREN and not SIRET.

  for(var i = 0 ; i<inputCompanies.length; i++){

    siret  = inputCompanies[i].SIRET;
  url = 'http://www.societe.com/cgi-bin/fiche/?rncs='+ siret.toString().substring(0, siret.toString().length - 5);
  //console.log("Recherche du nom à partir du SIREN démarrée..");
  //console.log("Redirection sur " + url + " ...");
  request(url, function (error, response, body) {
    if(!error){
      //console.log("Redirection effectuée.");
      var $ = cheerio.load(body);

      $('#identite_deno').filter(function(){
        var data = $(this);
        companyName = data.text();
      })

      companyName = cleanName(companyName);
      //console.log("Nom retrouvé : " + companyName);

      //Then we see the desired etablissement.
      urlEtablissement = "http://www.societe.com/etablissements/" + companyName + "-" + siret.toString().substring(0, siret.toString().length - 5) + ".html";
      //console.log("Redirection vers " + urlEtablissement + " ...");
      console.log(urlEtablissement);
      request(urlEtablissement, function (error, response, body) {
        var $ = cheerio.load(body);

        //console.log("Redirection effectuée.");
        $('#etabs').filter(function(){
          var data = $(this);

          //First Siret
          data = data.children();
          var i = 1;
          //While the siret is'nt found
          while (data.children().children().first().next().next().next().children().first().next().text() != siret) {
            data = data.next();

            console.log(data.children().children().first().next().next().next().children().first().next().text());

          }
          urlEnd = data.children().children().first().next().next().next().children().first().next().children().first().attr('href');
        });
        //var datatest = $("#etab2").find("tbody > tr:nth-child(1) > td:nth-child(2) > a");


        urlSiret = "http://www.societe.com" + urlEnd;
        //Maintenant que nous avons retrouvé l'entreprise, nous allons sur l'url de cette entreprise et allons scraper tout ca.
        //console.log(urlSiret);
        request(urlSiret, function (error, response, html) {

        //  console.log("Redirection vers : " + urlSiret + "...");
          if(!error){

            var $ = cheerio.load(html)

            cheerioTableparser($);

            var table = $('#etab').parsetable();

            address = findValue(table, "Adresse");
            postalCode = findValue(table, "Code postal");
            city = findValue(table, "Ville");
            pays = findValue(table, "Pays");
            codeNAF = findValue(table, "Code ape (NAF)");
            natureEtablissement = findValue(table, "Nature de l&apos;&#xFFFD;tablissement");
            companyName = findValue(table, "Nom");

            // console.log(address);
            // console.log(postalCode);
            // console.log(city);
            // console.log(pays);
            // console.log(codeNAF);
            // console.log(natureEtablissement);

            resultCompanies.push([siret, companyName, address, postalCode, city, pays, codeNAF, natureEtablissement]);
            var ws = fs.createWriteStream("resultCompanies.csv");
            csv
            .write(resultCompanies, {headers: true})
            .pipe(ws);

            console.log(companyName +" (" + i + "/" + inputCompanies.length + ") scrapped.");

          }
          else {
            console.log("Erreur de connexion sur lien : " + urlSiret );
          }




          //Ending Third callback
        });


        //Ending Second callback
      });


    }
    else{
      console.log("Erreur de connexion" );
    }

    //Ending first callback
  });

//Fin du For
}




}); //Ending CSV Parsing callback





function findValue(tablee, text){
  var i = 0;
  for(i = 0; i < tablee[0].length; i++){
    //console.log(tablee[0][i] );
    if(tablee[0][i] == text){
      return tablee[1][i];
    }

  }
  return "Unknown";
}


function cleanName(companyName){
  // _ espaces dans le nom d'entreprise
  companyName=companyName.replace(/[ \u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g,'-')

  //_ tirets apres le nom de l'entreprise à supprimer car inutile.
  companyName = companyName.substring(0, companyName.length - 2);

  // _ mettre en minuscule
  companyName = companyName.toLowerCase();
  return companyName;
}
