const Listing = require("../models/listing");
const axios = require("axios");

module.exports.index = async (req, res) => {
  const { category, q } = req.query;
  let allListings;

  // If both q and category are provided
  if (q && category) {
    const regex = new RegExp(escapeRegex(q), "i");
    allListings = await Listing.find({
      title: regex,
      category,
    });
  }
  // If only q is provided
  else if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    allListings = await Listing.find({
      title: regex,
    });
  }
  // If only category is provided
  else if (category) {
    allListings = await Listing.find({
      category,
    });
  }
  // No filter
  else {
    allListings = await Listing.find({});
  }

  res.render("listings/index.ejs", { allListings });

  // Utility function to safely use regex
  function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you have requested does not exist!");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  try {
    const locationQuery = req.body.listing.location;
    const geoRes = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: locationQuery,
          format: "json",
          limit: 1,
        },
        headers: {
          "User-Agent": "Deepak/1.0 (deepakvaishnav3112@gmail.com)",
        },
      }
    );

    if (!geoRes.data || geoRes.data.length === 0) {
      req.flash("error", "Could not find the cooordinates for the location");
      return res.redirect("/listings/new");
    }

    const { lat, lon } = geoRes.data[0];

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    newListing.geometry = {
      type: "Point",
      coordinates: [lon, lat],
    };

    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success", "New listing created succesfully!");
    res.redirect("/listings");
  } catch (error) {
    console.log("Geocoding error: ", error);
    req.flash("error", "An error occured while geocoding the location!");
    res.redirect("/listings/new");
  }
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you are trying to edit does not exist!");
    res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

  const locationQuery = req.body.listing.location;

  try {
    const geoRes = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: locationQuery,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "Deepak/1.0 (deepakvaishnav3112@gmail.com)",
      },
    });

    if (!geoRes.data || geoRes.data.length === 0) {
      req.flash("error", "Could not find the coordinates for the location");
      return res.redirect("/listings/new");
    }

    const { lat, lon } = geoRes.data[0];

    // Update geometry
    listing.geometry = {
      type: "Point",
      coordinates: [lon, lat],
    };

    // If image is uploaded
    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await listing.save(); // <-- save after all updates (geometry + image if any)

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  } catch (error) {
    console.error("Geocoding error:", error);
    req.flash("error", "An error occurred while updating the location!");
    res.redirect(`/listings/${id}/edit`);
  }
};


module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted succesfully!");
  res.redirect("/listings");
};
