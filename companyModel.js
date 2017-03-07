var societe = require('./scrapSociete.js')
var express = require('express')
var jsonSociete;
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



  societe.getNameCompany(siret, function(name){

    var url = makeURL(siret, name);

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
  var url;

  return url;
}
