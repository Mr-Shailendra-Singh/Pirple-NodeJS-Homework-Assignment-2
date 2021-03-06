/*
 * Helpers for various tasks
 *
 */

// Dependencies
var config = require("./config");
var crypto = require("crypto");
var https = require("https");
var querystring = require("querystring");

// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function(str) {
  if (typeof str == "string" && str.length > 0) {
    var hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength) {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all the possible characters that could go into a string
    var possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

    // Start the final string
    var str = "";
    for (i = 1; i <= strLength; i++) {
      // Get a random charactert from the possibleCharacters string
      var randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      // Append this character to the string
      str += randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

helpers.sendTwilioSms = function(phone, msg, callback) {
  // Validate parameters
  phone =
    typeof phone == "string" && phone.trim().length == 10
      ? phone.trim()
      : false;
  msg =
    typeof msg == "string" && msg.trim().length > 0 && msg.trim().length <= 1600
      ? msg.trim()
      : false;
  if (phone && msg) {
    // Configure the request payload
    var payload = {
      From: config.twilio.fromPhone,
      To: "+1" + phone,
      Body: msg
    };
    var stringPayload = querystring.stringify(payload);

    // Configure the request details
    var requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path:
        "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
      auth: config.twilio.accountSid + ":" + config.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    var req = https.request(requestDetails, function(res) {
      // Grab the status of the sent request
      var status = res.statusCode;
      // Callback successfully if the request went through
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback("Status code returned was " + status);
      }
    });

    // Bind to the error event so it doesn't get thrown
    req.on("error", function(e) {
      callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
  } else {
    callback("Given parameters were missing or invalid");
  }
};

helpers.validateEmail = email => {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

helpers.stripe = (amount, currency, description, source, callback) => {
  const payload = {
    amount,
    currency,
    description,
    source
  };
  const stringPayload = querystring.stringify(payload);

  const stripe = {
    protocol: "https:",
    hostname: "api.stripe.com",
    method: "POST",
    path: "/v1/charges",
    auth: config.stripeSecretKey,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringPayload)
    }
  };

  // Instantiate the request object
  let req = https.request(stripe, res => {
    // Grab the status of the sent request
    const status = res.statusCode;
    // Callback successfully if the request went through
    if (status == 200 || status == 201) {
      callback(true);
    } else {
      callback(status);
    }
  });

  // Bind to the error event so it doesn't get the thrown
  req.on("error", e => {
    callback("There Was An Error");
  });

  // Add the payload
  req.write(stringPayload);

  // End the request
  req.end();
};

helpers.mailgun = (subject, text, callback) => {
  const payload = {
    from: "nodejs@masterclass.assignment2.com",
    to: "syahrul@abcdead.com", // authorized domain
    subject,
    text
  };
  const stringPayload = querystring.stringify(payload);

  const requestDetails = {
    auth: "api:1efc409e57e9f2749fa7973288d94188-c8e745ec-3209c115",
    protocol: "https:",
    hostname: "api.mailgun.net",
    method: "POST",
    path: "/v3/sandbox0d30cbfce257493fbdd446bea3a7b2c3.mailgun.org/messages",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringPayload)
    }
  };

  // Instantiate the request object
  let req = https.request(requestDetails, res => {
    // Grab the status of the sent request
    let status = res.statusCode;

    if (status == 200 || status == 201) {
      callback(true);
    } else {
      callback(status);
    }
  });

  // Bind to the error event so it doesn't get thrown
  req.on("error", e => {
    callback(e);
  });

  // Add the payload
  req.write(stringPayload);

  // End the request
  req.end();
};

// Export the module
module.exports = helpers;
