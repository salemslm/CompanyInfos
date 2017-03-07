var societe = require('./scrapSociete.js')
var nameSociete = require('./nameCompany.js')

var express = require('express')
var jsonSociete, name;
var app = express();
var bodyParser = require('body-parser')


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/form.html');
});


//Permet de réaliser le app.POST.
// to support URL-encoded bodies
app.use(bodyParser.urlencoded({
  extended: true

}));
// to support JSON-encoded bodies
app.use(bodyParser.json());

app.post("/scrape", function (req, res) {
  // Get URL from POST input
  var siret=req.body.siret;
  var url = "http://www.societe.com/societe/la-banque-postale-421100645.html"


    nameSociete.getNameCompany(url, function(name){


    var url = makeURL(siret, name);
    //'http://www.societe.com/etablissement/la-banque-postale-42110064500967-74a.html';
    console.log("******************" + url + "******************");
    societe.getDataFromWebSite(url, function(jsonSociete){
      console.log(jsonSociete.companyName);

    });
  });
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

console.log("Done !!");


function makeURL(siret, name) {

  // Corriger les exceptions :

  // _ espaces dans le nom d'entreprise
  name=name.replace(/[ \u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g,'-')

  //_ tirets apres le nom de l'entreprise à supprimer car inutile.
  name = name.substring(0, name.length - 2);

  // _ mettre en minuscule
  name = name.toLowerCase();

  var url ="http://www.societe.com/etablissement/" + name + "-"+ siret + ".html";

  return url;
}
