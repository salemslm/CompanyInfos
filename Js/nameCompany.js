var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

function getNameCompany(url, callback){

  request(url, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);

      var companyName;

      $('#identite_deno').filter(function(){
        var data = $(this);
        companyName = data.text();
        console.log(companyName);

      })



    }

    return callback(companyName);
  })

}


module.exports.getNameCompany = getNameCompany;
