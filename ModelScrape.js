var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var cheerioTableparser = require('cheerio-tableparser');
var csv = require("fast-csv");

var inputCompanies = [];
var resultCompanies = [["SIRET", "Nom", "Addresse", "Code Postal", "Ville", "Pays", "code NAF", "Nature de l'etablissement"]];
var codeNAF, companyName, address, postalCode, city, pays, natureEtablissement;

//Default features for every company
address = "Unknown"
postalCode = "Unknown"
city = "Unknown"
pays = "Unknown"
codeNAF = "Unknown"
natureEtablissement = "Unknown"
companyName = "Unknown"


//Read csv file, with headers.
csv
.fromPath("Companies_DPE.csv", {headers : true} )
.on("data", function(arrayCompanies){
  inputCompanies.push(arrayCompanies);

})
.on("end", function(){
  console.log("done");

  //Call our recursive function.
  getCompanyForLine(5301);


}); //Ending CSV Parsing callback


/**
* This function is used in the recursive function getCompanyForLine.
* Indeed, we will get a first time the name of the company but we will need to put it in the url after that.
* Exemple : the company name is "La belle tat'a". The return will be : "la-belle-tat-a"
*
* @param companyName : The name of the company that we want to clean.
* return the company name cleaned.
*/
function cleanName(companyName){
  // _ espaces dans le nom d'entreprise
  companyName=companyName.replace(/[ \u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g,'-')

  //_ tirets apres le nom de l'entreprise à supprimer car inutile.
  companyName = companyName.substring(0, companyName.length - 2);

  // _ mettre en minuscule
  companyName = companyName.toLowerCase();
  return companyName;
}




/**
*
* This function is a recursive function.
* For each line, we retrieve SIRET number and look for the correspondant company in the website societe.com.
* If the siret is wrong, it will name every feature of the company "Unknown".
*
* @param i : the line of the csv file.
*/
function getCompanyForLine(i) {

  //Default features for every company
  address = "Unknown"
  postalCode = "Unknown"
  city = "Unknown"
  pays = "Unknown"
  codeNAF = "Unknown"
  natureEtablissement = "Unknown"
  companyName = "Unknown"

  // Condition for recursivity.
  if(i< inputCompanies.length){



    siret  = inputCompanies[i].siret;
    siren = siret.toString().substring(0, siret.toString().length - 5);
    url = 'http://www.societe.com/cgi-bin/fiche/?rncs='+ siret.toString().substring(0, siret.toString().length - 5);
    console.log(url);
    //The first request's goal is to get the name of the company, by the SIREN.
    request(url, function (error, response, body) {
      if(!error){
        var $ = cheerio.load(body);

        $('#identite_deno').filter(function(){
          var data = $(this);
          companyName = data.text();
        })

        companyName = cleanName(companyName);


            var $ = cheerio.load(body);

            $('#etabs').filter(function(){
              var data = $(this);
              cheerioTableparser($);

              //Convert html div into an array.
              var table = $('#etabs').parsetable(false, false, true);


              //Get the index of the SIRET in the array
              var indexOfSiret = findIndexOfSIRET(table, siret);

              //Get the value of the correspondant key.
              address = findValueAfterThisSiretIndex(table, "Adresse", indexOfSiret);
              postalCode = findValueAfterThisSiretIndex(table, "Code postal", indexOfSiret);
              city = findValueAfterThisSiretIndex(table, "Ville", indexOfSiret);
              pays = findValueAfterThisSiretIndex(table, "Pays", indexOfSiret);
              codeNAF = findValueAfterThisSiretIndex(table, "Code ape (NAF)", indexOfSiret);

              natureEtablissement = findValueAfterThisSiretIndex(table, "Nature de l\'�tablissement", indexOfSiret);

              if(findValueAfterThisSiretIndex(table, "Nom", indexOfSiret) == "Unknown" || findValueAfterThisSiretIndex(table, "Nom", indexOfSiret) == "unkno"){

                $('#identite_deno').filter(function(){
                  var data = $(this);
                  companyName = data.text();
                })
                companyName = companyName.substring(0, companyName.length - 2);



              }
              else {
                companyName = findValueAfterThisSiretIndex(table, "Nom", indexOfSiret)

              }

            });

            // console.log(address);
            // console.log(postalCode);
            // console.log(city);
            // console.log(pays);
            // console.log(codeNAF);
            // console.log(natureEtablissement);

            //Add a line in the csv file.
            resultCompanies.push([siret, companyName, address, postalCode, city, pays, codeNAF, natureEtablissement]);
            console.log(companyName +" (" + i + "/" + inputCompanies.length + ") scrapped.");

            //Go to the next company.
            getCompanyForLine(i+1);

            var ws = fs.createWriteStream("resultCompanies.csv");
            csv
            .write(resultCompanies, {headers: true})
            .pipe(ws);

      }
      else{
        console.log("Erreur de connexion" );
      }


      //First Request
    });
    //End of IF
  }

  //Ending of function
}


function findIndexOfSIRET(table, siret){
  for(var i =0; i<table[0].length;i++){

    //If we Found a SIRET row and Value of SIRET corresponds to our desired SIRET
    if(table[0][i] == "SIRET" && table[1][i] == siret){
      return i;
    }

  }
  return null;
}


function findValueAfterThisSiretIndex(tablee, text, siretIndex){
  var timesFoundAddress = 0;
  for(i = siretIndex; i < tablee[0].length; i++){
    //console.log(tablee[0]);
    //The problem with Addresse is that this Key is quoted 2 times in the page. We want the second one and not the First one.
    switch (tablee[0][i]) {
      case "Adresse" :
      if(text == "Adresse") timesFoundAddress++;
      if(timesFoundAddress == 2){
        return tablee[1][i];
      }
      break;

      default:
      if(tablee[0][i] == text)
      return tablee[1][i];
    }

  }
  return "Unknown";
}


//Copyright (c) 2017 Copyright Holder All Rights Reserved. ;)
