var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');


// The URL we will scrape from
  //var url = 'http://www.societe.com/etablissement/dentsu-aegis-network-france-35256798600026-0a.html';


module.exports = {
  getDataFromWebSite: function(url, callback){
    var json = { companyName : "", siretId : "", address : "", postalCode : "", city : "", country : "", naf: "", trancheEffectifs: "", natureEtablissement:""};

          // The structure of our request call
          // The first parameter is our URL
          // The callback function takes 3 parameters, an error, response status code and the html
            request(url, function(error, response, html){
                    if(!error){
                        var $ = cheerio.load(html);

                        var companyName, siretId, address, postalCode, city, country, naf, trancheEffectifs, natureEtablissement;



                        //STEP 1 : WEB SCRAPING data

                        // We'll use the unique header class as a starting point.
                        // Title class is named "no-border". It's unique in the page.
                        $('.no-border').filter(function(){
                            var data = $(this);
                            title = data.text();

                        })

                        //Look for the price
                       $('.item_price.clearfix').filter(function(){
                            var data = $(this);
                            price =  data.attr('content');
                        })

                        //Look for the location
                       $('div.line.line_city').filter(function(){
                            var data = $(this);
                            location =  data.children().children().next().text();
                        })

                        //Look for the house type
                       $('div.line.line_city').filter(function(){
                            var data = $(this);
                            //Type de bien
                            while(data.children().children().first().text() != "Type de bien" ){
                              data = data.next();

                            }

                            type =  data.children().children().next().text();
                        })

                        //Look for the house surface
                       $('div.line.line_city').filter(function(){
                            var data = $(this);

                            while(data.children().children().first().text() != "Surface" ){
                              data = data.next();

                            }

                            houseSurface =  data.children().children().next().text();
                        })


                      //STEP 2 : Formalize data
                       //Separate City and Postal codePostal
                        var locationArray = location.split(" ");
                        city = locationArray[0].toLowerCase();
                        postalCode = locationArray[1];


                        // Ajust title.
                        title = title.substring(14, title.length);
                        var index = title.indexOf("\n");
                        title = title.substring(0, index);

                        // Ajust surface
                        houseSurface = houseSurface.substring(0, 3);

                        // STEP 3: Save it into readable data file, like json or csv.

                        json.type = type;
                        json.city = city;
                        json.postalCode = postalCode;
                        json.title = title;
                        json.price = price;
                        json.houseSurface = houseSurface;

                        console.log(title)
                        console.log(price)
                        console.log(location)
                        console.log(type)
                        console.log(houseSurface);



                        response = json;

                    }

                    // To write to the system we will use the built in 'fs' library.
                    // In this example we will pass 3 parameters to the writeFile function
                                    // Parameter 1 :  output.json - this is what the created filename will be called
                    // Parameter 2 :  JSON.stringify(json, null, 4) - the data to write, here we do an extra step by calling JSON.stringify to make our JSON easier to read
                    // Parameter 3 :  callback function - a callback function to let us know the status of our function

                    fs.writeFile('outputSociete.json', JSON.stringify(json, null, 4), function(err){

                        console.log('File "outputSociete.json" successfully written! - Check your project directory for the file');

                    })
                      return callback(json);

                    })
  }
}
