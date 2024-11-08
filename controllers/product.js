const prisma = require("../config/prisma");
const cloudinary = require("cloudinary").v2;

//Config cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.create = async (req, res) => {
  try {
    // code
    const { title, description, price, quantity, categoryId, images } = req.body;
    // console.log(title, description, price, quantity, images)
    const product = await prisma.product.create({
      data: {
        title: title,
        description: description,
        price: +price,
        quantity: +quantity,
        categoryId: +categoryId,
        images: {
          create: images.map((item) => ({
            assetId: item.asset_id,
            publicId: item.public_id,
            url: item.url,
            secureUrl: item.secure_url,
          })),
        },
      },
    });
    res.send(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.list = async (req, res) => {
  try {
    const { count } = req.params;
    const products = await prisma.product.findMany({
      take: +count,
      orderBy: { createdAt: "desc" },
      include: { category: true, images: true },
    });

    res.send(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.read = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await prisma.product.findFirst({
      where: {
        id: +id,
      },
      include: {
        category: true,
        images: true,
      },
    });

    res.send(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, description, price, quantity, categoryId, images } = req.body;
    const { id } = req.params;
    await prisma.image.deleteMany({
      where: {
        productId: +id,
      },
    });

    const product = await prisma.product.update({
      where: { id: +id },
      data: {
        title: title,
        description: description,
        price: +price,
        quantity: +quantity,
        categoryId: +categoryId,
        images: {
          create: images.map((item) => ({
            assetId: item.asset_id,
            publicId: item.public_id,
            url: item.url,
            secureUrl: item.secure_url,
          })),
        },
      },
    });
    res.send(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // step 1 ค้นหาสินค้า inlude images
    const product = await prisma.product.findFirst({
      where: { id: +id },
      include: { images: true },
    });
    if (!product) {
      return res.status(400).json({ message: "This product doesn't exist." });
    }

    // step 2 Promise ลบภาพใน Cloudinary
    const deletedImage = product.images.map(
      (image) =>
        new Promise((resolve, reject) => {
          // ลบจาก Cloudinary
          cloudinary.uploader.destroy(image.publicId, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        })
    );
    await Promise.all(deletedImage);

    // ลบสินค้า
    await prisma.product.delete({
      where: {
        id: +id,
      },
    });
    res.send("Delete success");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listBy = async (req, res) => {
  try {
    const { sort, order, limit } = req.body;
    console.log(sort, order, limit);

    const products = await prisma.product.findMany({
      take: +limit,
      orderBy: { [sort]: order },
      include: { category: true, images: true },
    });

    res.send(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const hendleQuery = async (req, res, query) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        title: {
          contains: query,
        },
      },
      include: {
        category: true,
        images: true,
      },
    });
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Search Error" });
  }
};

const handlePrice = async (req, res, priceRange) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        price: {
          gte: priceRange[0],
          lte: priceRange[1],
        },
      },
      include: {
        category: true,
        images: true,
      },
    });
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Price Error" });
  }
};

const handleCategory = async (req, res, categoryId) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        categoryId: {
          in: categoryId.map((id) => +id),
        },
      },
      include: {
        category: true,
        images: true,
      },
    });
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Category Error" });
  }
};

exports.searchFilter = async (req, res) => {
  try {
    const { query, category, price } = req.body;
    if (query) {
      await hendleQuery(req, res, query);
    }
    if (category) {
      await handleCategory(req, res, category);
    }
    if (price) {
      await handlePrice(req, res, price);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createImage = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.body.image, {
      public_id: `Ecom-${Date.now()}`,
      resource_type: "auto",
      folder: "Ecom2024",
    });
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeImage = async (req, res) => {
  try {
    const { publicId } = req.body;
    cloudinary.uploader.destroy(publicId, (result) => {
      res.send("Remove image successful.", result);
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};
