const express = require("express");
const router = express.Router();
const {
  create,
  list,
  remove,
  listBy,
  searchFilter,
  update,
  read,
  removeImage,
  createImage,
} = require("../controllers/product.js");
const { authCheck, adminCheck } = require("../middlewares/authCheck.js");

router.post("/product", create);
router.get("/products/:count", list);
router.get("/product/:id", read);
router.put("/product/:id", update);
router.delete("/product/:id", authCheck, adminCheck, remove);
router.post("/productby", listBy);
router.post("/search/filters", searchFilter);

router.post("/images", authCheck, adminCheck, createImage);
router.post("/removeImages", authCheck, adminCheck, removeImage);

module.exports = router;
