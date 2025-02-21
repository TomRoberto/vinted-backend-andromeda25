const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/Offer");
const convertToBase64 = require("../utils/convertToBase64");
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // console.log(req.body);
      //   console.log(req.files.picture);

      // const obj = {
      //   a: 1,
      //   b: 2,
      //   c: 3,
      // };

      // const { a, b, c } = obj;

      // const title = req.body.title;
      // const description = req.body.description;
      // const price = req.body.price;

      // Destructuring d'objet
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      //   const cloudinaryResponse = await cloudinary.uploader.upload(
      //     convertToBase64(req.files.picture)
      //   );

      //   console.log(cloudinaryResponse);

      //   const user = await User.findOne({
      //     token: req.headers.authorization.replace("Bearer ", ""),
      //   });

      console.log(req.user);

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        // product_image: cloudinaryResponse,
        owner: req.user._id,
      });

      await newOffer.populate("owner", "account _id");
      await newOffer.save();

      res.status(201).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    // console.log(req.query);
    const { title, priceMin, priceMax, sort, page, limit } = req.query;

    // let sortFilter;
    // if (sort === "price-asc") {
    //   sortFilter = "ascending";
    // } else if (sort === "price-desc") {
    //   sortFilter = "descending";
    // }

    // console.log(title);
    // console.log("regexp", new RegExp(title, "i"));

    // console.log(priceMin);
    // console.log(priceMax);

    // Si rien

    // Si title

    // Si title et priceMin

    // Si title et priceMax

    // Si title & priceMin & priceMax

    // Si priceMin & priceMax

    const filters = {};

    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMin) {
      filters.product_price = { $gte: Number(priceMin) };
    }

    if (priceMax) {
      if (filters.product_price) {
        // Soit j'ai déjà ajouté la clef product_price à filters (je suis passé dans le if du priceMin) ===> je ne veux pas écraser la valeur de cette clef, je veux juste ajouter une clef $lte
        filters.product_price.$lte = Number(priceMax);
      } else {
        filters.product_price = { $lte: Number(priceMax) };
      }

      // console.log(filters);
    }

    const sortFilter = {};
    if (sort === "price-asc") {
      sortFilter.product_price = "ascending";
    } else if (sort === "price-desc") {
      sortFilter.product_price = "descending";
    }

    // console.log(sortFilter);

    let skip = 0;

    let limitFilter = 5;

    // 5 résultats par page : 1 skip=0, 2 skip=5, 3 skip=10, 4 skip=15
    // 3 résultats par page : 1 skip=0, 2 skip=3, 3 skip=6, 4 skip=9

    if (page) {
      skip = (Number(page) - 1) * limitFilter;
      console.log(Number("0xFF"));
    }

    if (limit) {
      limitFilter = Number(limit);
    }

    const offersLength = await Offer.countDocuments(filters);
    console.log(offersLength);

    const offers = await Offer.find(filters)
      .populate("owner", "account")
      .sort(sortFilter)
      .skip(skip)
      .limit(limitFilter);

    res.json({ count: offersLength, offers: offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    console.log(req.params);
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
