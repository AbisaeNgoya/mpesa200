



//initialilize our backend application

const express = require("express");

const app= express();
require("dotenv").config();
const cors = require("cors");

app.use(express.json());
const axios = require("axios");
const port = process.env.PORT;












//Deciding which port listens to our applications and should show on the browser
 app.listen (port, ()=> {
    console.log(`Server runs Nicely, Mr Abisae; app running at localhost:${port}` );
 });

 // creatingg a gate route to test if the application is really running
 app.get("/", (req, res)=>{
    res.send("Mpesa Programming, Stay put");
 });
 //middleware function to generate token
 //app.get("/token", (req, res) => {
  // generateToken();
  //})
 //});

 const generateToken = async (req, res, next) => {
   const secret = process.env.MPESA_CONSUMER_SECRET;
   const consumer = process.env.MPESA_CONSUMER_KEY;
   const auth = Buffer.from(`${consumer}:${secret}`).toString("base64");
 
   await axios
     .get(
       "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
       {
         headers: {
           authorization: `Basic ${auth}`,
         },
       }
     )
     .then((response) => {
       //console.log(response.data.access_token);
       // Assign the token to `req.token` for later use
       token = response.data.access_token;
       next();
     })
     .catch((err) => {
       console.log(err);
       //res.status(400).json(err.message);
     });
 };
 

 app.post("/stk", generateToken, async (req, res) => {
   const phone = req.body.phone.substring(1);
   const amount = req.body.amount; 

   const date = new Date();
   const timestamp = date.getFullYear() +
     ("0" + (date.getMonth() + 1)).slice(-2) +
     ("0" + date.getDate()).slice(-2) +
     ("0" + date.getHours()).slice(-2) +
     ("0" + date.getMinutes()).slice(-2) +
     ("0" + date.getSeconds()).slice(-2);

     const shortCode = process.env.MPESA_PAYBILL;
     const passkey = process.env.MPESA_PASSKEY;

     const password = new Buffer.from(shortCode + passkey + timestamp).toString("base64");




   
     await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortCode,
         Password: password,
         Timestamp: timestamp,
         TransactionType: "CustomerPayBillOnline",
         Amount: amount,
         PartyA: `254${phone}`,
         PartyB: shortCode,
         PhoneNumber: `254${phone}`,
         CallBackURL: "https://mydomain.com/path",
         AccountReference: `254${phone}`,
         TransactionDesc: "Test",

      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    .then((feed)=>{
      console.log(feed.data);
      res.status(200).json(feed.data);
    })
    .catch((err)=>{
      console.log(err.message)
      res.status(400).json(err.message)
    });

 });

// STK Query Route
 app.post("/stkquery", generateToken, async (req, res) => {
  const shortCode = process.env.MPESA_PAYBILL;
  const passkey = process.env.MPESA_PASSKEY;
  const { CheckoutRequestID } = req.body;

  const date = new Date();
  const timestamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  const password = Buffer.from(shortCode + passkey + timestamp).toString("base64");

  try {
    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(400).json({ error: "Failed to query STK Push status" });
  }
});
