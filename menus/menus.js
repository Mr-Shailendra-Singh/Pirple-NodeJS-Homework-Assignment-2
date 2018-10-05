const handlers = require("../lib/handlers");
const helpers = require("../lib/helpers");
var _data = require("../lib/data");

// Available menu
const listOfMenu = {
  1: {
    name: "Margherita",
    description: "Tomato sauce, mozzarella, and oregano"
  },
  2: {
    name: "Marinara.",
    description: "Tomato sauce, garlic and basil"
  },
  3: {
    name: "Quattro Stagioni.",
    description:
      "Tomato sauce, mozzarella, mushrooms, ham, artichokes, olives, and oregano"
  },
  4: {
    name: "Carbonara.",
    description: "Tomato sauce, mozzarella, parmesan, eggs, and bacon"
  },
  5: {
    name: "Frutti di Mare.",
    description: "Tomato sauce and seafood"
  },
  6: {
    name: "Quattro Formaggi.",
    description:
      "Tomato sauce, mozzarella, parmesan, gorgonzola cheese, artichokes, and oregano"
  },
  7: {
    name: "Crudo.",
    description: "Tomato sauce, mozzarella and Parma ham"
  },
  8: {
    name: "Napoletana or Napoli.",
    description: "Tomato sauce, mozzarella, oregano, anchovies"
  },
  9: {
    name: "Pugliese.",
    description: "Tomato sauce, mozzarella, oregano, and onions"
  },
  10: {
    name: "Montanara.",
    description:
      "Tomato sauce, mozzarella, mushrooms, pepperoni, and Stracchino (soft cheese)"
  }
};

// Users
let menus = {};

// List all available menus, only to logged in user
// Required data: email
// Optional data: none
menus.viewMenu = (data, callback) => {
  if (data.method === "get") {
    // Check that email number is valid
    var email =
      typeof data.queryStringObject.email == "string"
        ? data.queryStringObject.email.trim()
        : false;
    if (helpers.validateEmail(email)) {
      // Get token from headers
      var token =
        typeof data.headers.token == "string" ? data.headers.token : false;
      // Verify that the given token is valid for the email
      handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
        if (tokenIsValid) {
          callback(200, listOfMenu);
        } else {
          callback(403, {
            Error: "Missing required token in header, or token is invalid."
          });
        }
      });
    } else {
      callback(400, { Error: "Missing email" });
    }
  } else {
    callback(405);
  }
};

// Menus - post (add to cart)
// Required data: menu, quantity, email
// Optional data: none
menus.addMenu = (data, callback) => {
  if (data.method === "post") {
    var menuId =
      typeof data.payload.menuId == "number" ? data.payload.menuId : false;
    var quantity =
      typeof data.payload.quantity == "number" ? data.payload.quantity : false;
    var email =
      typeof data.payload.email == "string" &&
      data.payload.email.trim().length > 0
        ? data.payload.email.trim()
        : false;

    if (menuId > 10 || menuId <= 0) {
      callback(403, {
        Error: "Invalid menu id"
      });
    } else if (quantity <= 0) {
      callback(403, {
        Error: "Invalid quantity"
      });
    } else if (menuId && quantity && email) {
      // Make sure email format is correct
      if (helpers.validateEmail(email)) {
        // Get token from headers
        var token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
          if (tokenIsValid) {
            let userData = {
              email,
              cart: [
                {
                  menuId,
                  quantity
                }
              ]
            };
            _data.read("cart", email, function(err, data) {
              // if cart exist
              if (!err && data) {
                data.cart.push({ menuId, quantity });
                const output = data.cart.reduce(
                  (acc, c) => Object.assign(acc, { [c.menuId]: c.quantity }),
                  {}
                );
                const updateData = Object.keys(output)
                  .map(s => ({ menuId: Number(s), quantity: output[s] }))
                  .sort((a, b) => b.menuId - a.menuId);

                userData = {
                  email,
                  cart: updateData
                };

                // Store the new updates
                _data.update("cart", email, userData, function(err) {
                  if (!err) {
                    callback(200);
                  } else {
                    callback(500, { Error: "Could not update the cart." });
                  }
                });
              }
              // if cart doesn't exist
              else {
                _data.create("cart", email, userData, function(err) {
                  if (!err) {
                    callback(200);
                  } else {
                    callback(500, { Error: "Could not create the cart." });
                  }
                });
              }
            });
          } else {
            callback(403, {
              Error: "Missing required token in header, or token is invalid."
            });
          }
        });
      } else {
        callback(400, { Error: "Incorrect email format" });
      }
    } else {
      callback(400, { Error: "Missing required fields" });
    }
  } else {
    callback(405);
  }
};

// Menus - post (delete menu from cart)
// Required data: menu, email
// Optional data: none
menus.deleteMenu = (data, callback) => {
  if (data.method === "post") {
    var menuId =
      typeof data.payload.menuId == "number" ? data.payload.menuId : false;
    var email =
      typeof data.payload.email == "string" &&
      data.payload.email.trim().length > 0
        ? data.payload.email.trim()
        : false;

    if (menuId > 10 || menuId <= 0) {
      callback(403, {
        Error: "Invalid menu id"
      });
    } else if (menuId && email) {
      // Make sure email format is correct
      if (helpers.validateEmail(email)) {
        // Get token from headers
        var token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
          if (tokenIsValid) {
            _data.read("cart", email, function(err, data) {
              // if cart exist
              if (!err && data) {
                let newData = data.cart.filter(d => d.menuId != menuId);
                let updateData = {
                  email,
                  cart: newData
                };

                // Store the new updates
                _data.update("cart", email, updateData, function(err) {
                  if (!err) {
                    callback(200);
                  } else {
                    callback(500, { Error: "Could not update the cart." });
                  }
                });
              }
              // if cart doesn't exist
              else {
                callback(500, {
                  Error: "Could not delete the menu id, it may not existed."
                });
              }
            });
          } else {
            callback(403, {
              Error: "Missing required token in header, or token is invalid."
            });
          }
        });
      } else {
        callback(400, { Error: "Incorrect email format" });
      }
    } else {
      callback(400, { Error: "Missing required fields" });
    }
  } else {
    callback(405);
  }
};

// List added menus / Cart itme
// Required data: email
// Optional data: none
menus.cart = (data, callback) => {
  if (data.method === "get") {
    // Check that email number is valid
    var email =
      typeof data.queryStringObject.email == "string"
        ? data.queryStringObject.email.trim()
        : false;
    if (helpers.validateEmail(email)) {
      // Get token from headers
      var token =
        typeof data.headers.token == "string" ? data.headers.token : false;
      // Verify that the given token is valid for the email
      handlers._tokens.verifyToken(token, email, function(tokenIsValid) {
        if (tokenIsValid) {
          _data.read("cart", email, function(err, data) {
            if (!err && data) {
              callback(200, data.cart);
            } else {
              callback(500, {
                Error: "Could not list the cart"
              });
            }
          });
        } else {
          callback(403, {
            Error: "Missing required token in header, or token is invalid."
          });
        }
      });
    } else {
      callback(400, { Error: "Missing email" });
    }
  } else {
    callback(405);
  }
};

module.exports = menus;
