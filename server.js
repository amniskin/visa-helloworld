var port = 3006;
var app = require('express')();
var request = require("request");
var req = request.defaults();
var fs = require('fs');
var uid = fs.readFileSync(".uid");
var pw = fs.readFileSync(".pw");
var passphrase = fs.readFileSync(".passphrase", "utf8");  

var users = require("./includes/users.js");
var cardAcceptor = require("./includes/cardAcceptor.js");

app.use(function(req, res, next){
   res.header("Access-Control-Allow-Origin", "*");
   next();
});

//HELLO WORLD
app.get("/visahelloworld", function(req, res){
  var reqOpts = {
    uri: "https://sandbox.api.visa.com/vdp/helloworld",
    key: fs.readFileSync("./doubleSSL/WaaS/key_WaaS.pem","utf8"),
    cert: fs.readFileSync("./doubleSSL/WaaS/cert.pem", "utf8"),
    passphrase: passphrase,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": 'Basic ' + new Buffer(uid + ':' + pw).toString('base64'),
      //"Authorization": "Basic QjkyUzFSRU80SEZMWU40QjlHREIyMWdlSW9qcFdmenlUdEtaTEhJNGZIVFVkdkVmbzp1bDBHUkFmVHQ=",
      "Host": "sandbox.api.visa.com",
      "Connection": "Keep-Alive"

    }
  };
  //console.log("key: "+reqOpts.key);
  //console.log("cert: "+reqOpts.cert);
  //console.log(uid+":"+pw);
  
  request(reqOpts, function(error, response, body){
    if (error){
      console.log(error);
      res.end(error.toString());
      return;
    }
    console.log("Received response from Visa Server:");
    //console.log(response);
    console.log("body: "+body);
    res.end(JSON.stringify(body));
  });  
});

//*****************************PULL FUNDS******************************//
app.post("/pullmoney", function(req,res){
  var PAN = req.query.PAN;
  var expDate = req.query.expDate;
  var amount = req.query.amount;
  var auditNo = req.query.auditNo;
  var reqBody = {
    "acquirerCountryCode": "840",
    "acquiringBin": "408999",
    "amount": ""+amount,
    "businessApplicationId": "AA",
    "cardAcceptor": {
      "address": {
        "country": "USA",
        "state": "CA",
        "zipCode": "94404"
      },
      "idCode": "CA-IDCode-77765",
      "name": "Acceptor 1",
      "terminalId": "ABCD1234"
    },
    "localTransactionDateTime": "2016-04-16T18:32:19",
    "retrievalReferenceNumber": "330000550000",
    "senderCardExpiryDate": ""+expDate,
    "senderCurrencyCode": "USD",
    "senderPrimaryAccountNumber": ""+PAN,
    "systemsTraceAuditNumber": ""+auditNo
  };
  sendRequestToVisa("https://sandbox.api.visa.com/visadirect/fundstransfer/v1/pullfundstransactions",
                   reqBody, function(error, response, body){
    
    if (error){
      console.log(error.toString());
      res.end("ERROR PULLING! "+error.toString());
      return;
    }
    else{
      var bodyString = JSON.stringify(body);
      console.log(bodyString);
      res.end(bodyString);
    }
    
  });
});

//***********************PUSH MONEY*************************************
app.post("/pushmoney", function(req, res){
  var recipientName = req.query.recipientName;
  var senderPAN = req.query.senderPAN;
  var receiverPAN = req.query.receiverPAN;
  var expDate = req.query.expDate;
  var amount = req.query.amount;
  var auditNo = req.query.auditNo;
  var reqBody = {
    "acquirerCountryCode": "840",
    "acquiringBin": "408999",
    "amount": "124.05",
    "businessApplicationId": "AA",
    "cardAcceptor": {
      "address": {
        "country": "USA",
        "county": "San Mateo",
        "state": "CA",
        "zipCode": "94404"
      },
      "idCode": "CA-IDCode-77765",
      "name": "Visa Inc. USA-Foster City",
      "terminalId": "TID-9999"
    },
    "localTransactionDateTime": "2016-04-16T19:27:04",
    "merchantCategoryCode": "6012",
    "pointOfServiceData": {
      "motoECIIndicator": "0",
      "panEntryMode": "90",
      "posConditionCode": "00"
    },
    "recipientName": ""+recipientName,
    "recipientPrimaryAccountNumber": ""+receiverPAN,
    "retrievalReferenceNumber": "412770451018",
    "senderAccountNumber": ""+senderPAN,
    "senderAddress": "901 Metro Center Blvd",
    "senderCity": "Foster City",
    "senderCountryCode": "124",
    "senderName": "Mohammed Qasim",
    "senderReference": "",
    "senderStateCode": "CA",
    "sourceOfFundsCode": "05",
    "systemsTraceAuditNumber": "451018",
    "transactionCurrencyCode": "USD",
    "transactionIdentifier": "381228649430015"
  };
  sendRequestToVisa("https://sandbox.api.visa.com/visadirect/fundstransfer/v1/pushfundstransactions",
                   reqBody,function(error, response, body){
    if (error){
      console.log(error.toString());
      res.end("ERROR PUSHING! "+error.toString());
      return;
    }
    res.end(JSON.stringify(body));
  });
});


//***********************AUX FUNCTION TO SEND REQUEST***************************
function sendRequestToVisa(uri, body, callback){
  var reqOpts = {
    uri: uri,
    key: fs.readFileSync("./doubleSSL/WaaS/key_WaaS.pem","utf8"),
    cert: fs.readFileSync("./doubleSSL/WaaS/cert.pem", "utf8"),
    passphrase: passphrase,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": 'Basic ' + new Buffer(uid + ':' + pw).toString('base64'),
      //"Authorization": "Basic QjkyUzFSRU80SEZMWU40QjlHREIyMWdlSW9qcFdmenlUdEtaTEhJNGZIVFVkdkVmbzp1bDBHUkFmVHQ=",
      //"Host": "sandbox.api.visa.com",
      //"Connection": "Keep-Alive"

    },
    body: JSON.stringify(body).replace(/\\/g,"")
  };
  console.log("sending request to visa with body: "+reqOpts.body);
  console.log("");
  //console.log("sending request to uri: "+uri);
  request.post(reqOpts, callback);
}

app.listen(port);
console.log("App listening on port " + port);
