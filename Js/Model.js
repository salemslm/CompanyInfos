var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var cheerioTableparser = require('cheerio-tableparser');
var csv = require("fast-csv");
var urlEnd;
var app = express();
var firmapi;
var inputCompanies = [];
var resultCompanies = [["SIRET", "Nom", "Addresse", "Code Postal", "Ville", "Pays", "code NAF", "Nature de l'etablissement"]];
var codeNAF, companyName, address, postalCode, city, pays, natureEtablissement;
var companyObject;


csv
.fromPath("Companies_DPE.csv", {headers : true} )
.on("data", function(arrayCompanies){
  inputCompanies.push(arrayCompanies);

})
.on("end", function(){
  console.log("done");

  //console.log(inputCompanies);

        uploader(1390);


}); //Ending CSV Parsing callback




function findValue(tablee, text){
  //var i = 0;
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





function uploader(i) {

  // //console.log(isTrueSIREN(inputCompanies[i].siret.toString().substring(0, inputCompanies[i].siret.toString().length - 5)));
  // while(isTrueSIREN(inputCompanies[i].siret.toString().substring(0, inputCompanies[i].siret.toString().length - 5)) == false){
  // //  console.log( isTrueSIREN(inputCompanies[i].siret.toString().substring(0, inputCompanies[i].siret.toString().length - 5)));
  //   i++;
  //
  // }
//  console.log(i);

//Default features for companies
address = "‘Unknown’"
postalCode = "Unknown"
city = "Unknown"
pays = "Unknown"
codeNAF = "Unknown"
natureEtablissement = "Unknown"
companyName = "Unknown"

console.log(inputCompanies.length);

if(i< inputCompanies.length){


  //var isTrueSIREN = isTrueSIREN(inputCompanies[i].siret.toString().substring(0, siret.toString().length - 5));

  siret  = inputCompanies[i].siret;
  siren = siret.toString().substring(0, siret.toString().length - 5);
  url = 'http://www.societe.com/cgi-bin/fiche/?rncs='+ siret.toString().substring(0, siret.toString().length - 5);
  //console.log("Recherche du nom à partir du SIREN démarrée..");
  console.log("Redirection sur " + url + " ...");
  request(url, function (error, response, body) {
    if(!error){
      //console.log("Redirection effectuée.");
      var $ = cheerio.load(body);

      $('#identite_deno').filter(function(){
        var data = $(this);
        companyName = data.text();
      })

      console.log(siren);

      companyName = cleanName(companyName);

      //Then we see the desired etablissement.
      urlEtablissement = "http://www.societe.com/etablissements/" + companyName + "-" + siren + ".html";
      console.log("Redirection vers " + urlEtablissement + " ...");
      request(urlEtablissement, function (error, response, body) {
        var $ = cheerio.load(body);

        //console.log("Redirection effectuée.");
        $('#etabs').filter(function(){
          var data = $(this);

          //First Siret
          data = data.children();
          var j = 1;
          //While the siret is'nt found
          while (data.children().children().first().next().next().next().children().first().next().text() != siret) {
            data = data.next();
              j++;
            //console.log(data.children().children().first().next().next().next().children().first().next().text());
              if(j > 20){
                //abandonment for this company
                address = "‘Unknown’"
                postalCode = "Unknown"
                city = "Unknown"
                pays = "Unknown"
                codeNAF = "Unknown"
                natureEtablissement = "Unknown"
                companyName = "Unknown"
                resultCompanies.push([siret, companyName, address, postalCode, city, pays, codeNAF, natureEtablissement]);

                return "Error";
              }

          }
          urlEnd = data.children().children().first().next().next().next().children().first().next().children().first().attr('href');

        });

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
            uploader(i+1);
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

}
