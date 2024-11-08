const prisma = require("../config/prisma");

exports.changeOrderStatus = async (req, res) => {
  try {
    const { orderId, orderStatus } = req.body;

    const order = await prisma.order.findFirst({ where: { id: orderId } });

    if (!order) {
      return res.status(400).json({ status: false, message: "Don't have this order in DB" });
    }

    const orderUpdated = await prisma.order.update({
      where: { id: +orderId },
      data: {
        orderStatus: orderStatus,
      },
    });
    res.json(orderUpdated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getOrderAdmin = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        products: {
          include: {
            product: true,
          },
        },
        orderedBy: {
          select: {
            id: true,
            email: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};
