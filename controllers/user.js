const prisma = require("../config/prisma");

exports.listUsers = async (req, res) => {
  try {
    const user = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        enabled: true,
      },
    });
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const { id, enabled } = req.body;

    const user = await prisma.user.update({
      where: { id: +id },
      data: { enabled: enabled },
    });
    res.send("Update status success");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.changeRole = async (req, res) => {
  try {
    const { id, role } = req.body;
    console.log(id, role);
    const user = await prisma.user.update({
      where: { id: +id },
      data: { role: role },
    });
    res.send("Update role success");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.userCart = async (req, res) => {
  try {
    const { cart } = req.body;
    console.log(cart);
    console.log(req.user.id);

    const user = await prisma.user.findFirst({ where: { id: +req.user.id } });

    //Check quantity
    for (const item of cart) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { quantity: true, title: true, price: true },
      });
      if (!product || item.count > product.quantity) {
        return res
          .status(400)
          .json({ OK: false, message: `${product?.title || "This"} product is sold out` });
      }
    }

    //delete old cart item
    await prisma.productOnCart.deleteMany({
      where: {
        cart: { orderedById: +user.id },
      },
    });

    //delete old cart
    await prisma.cart.deleteMany({
      where: { orderedById: +user.id },
    });

    //เตรียมสินค้า
    let products = cart.map((item) => ({
      productId: item.id,
      count: item.count,
      price: item.price,
    }));
    //หาผลรวม
    let cartTotal = products.reduce((sum, item) => sum + item.price * item.count, 0);

    // New cart
    await prisma.cart.create({
      data: {
        products: {
          create: products,
        },
        cartTotal: cartTotal,
        orderedById: +user.id,
      },
    });

    res.send("Add Cart OK");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getUserCart = async (req, res) => {
  try {
    const cart = await prisma.cart.findFirst({
      where: {
        orderedById: +req.user.id,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      products: cart.products,
      cartTotal: cart.cartTotal,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.emptyCart = async (req, res) => {
  try {
    const cart = await prisma.cart.findFirst({
      where: {
        orderedById: +req.user.id,
      },
    });
    if (!cart) {
      return res.status(400).json({ message: "No cart" });
    }

    await prisma.productOnCart.deleteMany({
      where: { cartId: +cart.id },
    });

    const result = await prisma.cart.deleteMany({
      where: { orderedById: +req.user.id },
    });

    console.log(result);
    res.json({ message: "Cart Empty Success", deleteCount: result.count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.saveAddress = async (req, res) => {
  try {
    const { address } = req.body;
    console.log(address);
    const addressUser = await prisma.user.update({
      where: {
        id: +req.user.id,
      },
      data: {
        address: address,
      },
    });

    res.json({ ok: true, message: "Update successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.saveOrder = async (req, res) => {
  try {
    // step 0 Check stripe
    // console.log(req.body);
    // return res.send("Hello jukkru");

    const { id, amount, currency, status } = req.body.paymentIntent;

    //step 1 Get user Cart
    const userCart = await prisma.cart.findFirst({
      where: {
        orderedById: +req.user.id,
      },
      include: { products: true },
    });

    //Check empty
    if (!userCart || userCart.products.length === 0) {
      return res.status(400).json({ OK: false, message: "Cart is empty" });
    }

    const amountTHB = Number(amount) / 100;

    //Create a new Order
    const order = await prisma.order.create({
      data: {
        products: {
          create: userCart.products.map((item) => ({
            productId: item.productId,
            count: item.count,
            price: item.price,
          })),
        },
        orderedBy: {
          connect: { id: +req.user.id },
        },
        cartTotal: userCart.cartTotal,
        stripePaymentId: id,
        amount: amountTHB,
        status: status,
        curreny: currency,
      },
    });

    //Update Product
    const update = userCart.products.map((item) => ({
      where: { id: item.productId },
      data: {
        quantity: { decrement: item.count },
        sold: { increment: item.count },
      },
    }));

    await Promise.all(update.map((updated) => prisma.product.update(updated)));

    await prisma.cart.deleteMany({
      where: { orderedById: +req.user.id },
    });

    res.json({ OK: true, order });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { orderedById: Number(req.user.id) },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!orders || orders.length === 0) {
      return res.status(400).json({ OK: false, message: "No orders" });
    }

    res.json({ OK: true, orders });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};
