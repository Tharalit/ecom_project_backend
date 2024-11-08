const prisma = require("../config/prisma");
const stripe = require("stripe")(
  "sk_test_51QD4cRLJcTYHG30MbMOahepxIeb9gft1jFIdjDaMYrE5AoFIMbIC2Q43kGwx07G2hyuBHAhvSC1YHnOsEnCxTZcM00txKEgpVg"
);

exports.payment = async (req, res) => {
  try {
    console.log("user ID =========");
    console.log(req.user.id);
    const cart = await prisma.cart.findFirst({
      where: {
        orderedById: req.user.id,
      },
    });

    const amountTHB = cart.cartTotal * 100

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountTHB,
      currency: "thb",
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};