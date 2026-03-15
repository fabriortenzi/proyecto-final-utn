db = db.getSiblingDB("deliver_it");

db.getCollection("user-type").insertMany([
  {
    description: "client",
  },
  {
    description: "owner",
  },
  {
    description: "delivery",
  },
  {
    description: "admin",
  },
]);

db.getCollection("shop-type").insertMany([
  {
    description: "Hamburguesas",
    iconDescription: "lunch_dining",
  },
  {
    description: "Heladerías",
    iconDescription: "icecream",
  },
  {
    description: "Bebidas",
    iconDescription: "local_bar",
  },
  {
    description: "Restaurantes",
    iconDescription: "restaurant",
  },
  {
    description: "Verdulerías",
    iconDescription: "nutrition",
  },
  {
    description: "Farmacias",
    iconDescription: "pill",
  },
]);

db.getCollection("payment-type").insertMany([
  {
    description: "Efectivo",
  },
]);

db.getCollection("product-category").insertMany([
  {
    description: "Efectivo",
  },
]);
