db = db.getSiblingDB("deliver_it");

db.getCollection("user-type").insertMany([
  {
    _id: ObjectId("6a1cae2b965e866be59df8a3"),
    description: "client",
  },
  {
    _id: ObjectId("6a1cae2b965e866be59df8a4"),
    description: "owner",
  },
  {
    _id: ObjectId("6a1cae2b965e866be59df8a5"),
    description: "delivery",
  },
  {
    _id: ObjectId("6a1cae2b965e866be59df8a6"),
    description: "admin",
  },
]);

db.getCollection("shop-type").insertMany([
  {
    _id: ObjectId("6a1cae2b965e866be59df8a7"),
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
  {
    description: "Mercado Pago",
  },
]);

db.getCollection("product-category").insertMany([
  {
    _id: ObjectId("6a1e53090951213dad7f1e56"),
    description: "Hamburguesa",
  },
  {
    _id: ObjectId("6a1e53090951213dad7f1e57"),
    description: "Pizza",
  },
  {
    _id: ObjectId("6a1e53750951213dad7f1e58"),
    description: "Helado",
  },
  {
    _id: ObjectId("6a1e53850951213dad7f1e59"),
    description: "Comida general",
  },
]);

db.getCollection("user").insertMany([
  {
    _id: ObjectId("6a1cb189f4d3904def3f232c"),
    name: "fede",
    surname: "test4",
    phoneNumber: "333",
    email: "fede4@a.com",
    password: "$2a$10$3j.LSqzY82lyerics6Fq/ujjIl45iCHGmkkRgys2Ls48c1gawWc2K",
    creditBalance: 0,
    street: "Zeballos",
    streetNumber: "350",
    apartment: "2",
    additionalInfo: "",
    address: "Zeballos 350, S2000BPH Rosario, Santa Fe, Argentina",
    latitude: -32.9569222,
    longitude: -60.6298305,
    userType: ObjectId("6a1cae2b965e866be59df8a3"),
  },
  {
    _id: ObjectId("6a1caf0bf4d3904def3f2321"),
    name: "fede",
    surname: "test",
    phoneNumber: "3333",
    email: "fede@a.com",
    password: "$2a$10$Q6fLMwz2YYAtqSfeSHkHl.oCtq.XN3D0c17S9tc5jWWwoBXWn3nD6",
    creditBalance: 0,
    userType: ObjectId("6a1cae2b965e866be59df8a4"),
  },
]);

db.getCollection("shop").insertMany([
  {
    _id: ObjectId("6a1caf68f4d3904def3f2322"),
    name: "hamburgesas local",
    phoneNumber: "333",
    email: "fede@aa.com",
    logoPath:
      "https://res.cloudinary.com/duyb82bkr/image/upload/v1780264806/DeliverIt/shops/p2cgsej2s7udxkxwt0kh.jpg",
    logoId: "DeliverIt/shops/p2cgsej2s7udxkxwt0kh",
    openingTime: "05:59",
    closingTime: "00:59",
    shippingPrice: "2000",
    preparationTime: 7,
    totalReviews: 0,
    totalStars: 0,
    street: "Paraguay",
    streetNumber: "1850",
    address: "Paraguay 1850, S2000FZD Rosario, Santa Fe, Argentina",
    latitude: -32.958,
    longitude: -60.64706649999999,
    shopType: ObjectId("6a1cae2b965e866be59df8a7"),
    owner: ObjectId("6a1caf0bf4d3904def3f2321"),
  },
]);

db.getCollection("product").insertMany([
  {
    _id: ObjectId("6a1caf9df4d3904def3f2324"),
    name: "hamburguesa 1",
    description: "muy rica",
    photoPath:
      "https://res.cloudinary.com/duyb82bkr/image/upload/v1780264860/DeliverIt/products/d0vzj4hr7rzmcaf1pofm.jpg",
    photoId: "DeliverIt/products/d0vzj4hr7rzmcaf1pofm",
    allowsVariations: false,
    shop: ObjectId("6a1caf68f4d3904def3f2322"),
    productCategory: ObjectId("6a1e53090951213dad7f1e56"),
    prices: [
      {
        amount: 10500,
        validSince: "2026-05-31",
      },
    ],
  },
]);

db.getCollection("commission").insertMany([
  {
    validSince: "2024-02-25",
    percentage: 0.05,
  },
]);
