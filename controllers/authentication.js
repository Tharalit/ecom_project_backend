const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { is } = require("express/lib/request");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required !!!" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required !!!" });
    }

    const user = await prisma.user.findFirst({ where: { email: email } });
    if (user) {
      return res.status(400).json({ message: "Email already exist" });
    }
    // step 3 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //step4 Register
    await prisma.user.create({ data: { email: email, password: hashedPassword } });

    res.send("Register Success");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    //1 Check email

    const user = await prisma.user.findFirst({ where: { email: email } });
    if (!user || !user.enabled) {
      return res.status(400).json({ message: "User not found or not Enable." });
    }
    //2 Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password invalid" });
    }
    //3 Create payload
    const payload = { id: user.id, email: user.email, role: user.role };
    //4 Gen token
    jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1d" }, (error, token) => {
      if (error) {
        return res.status(500).json({ message: "Server error" });
      }
      res.json({ payload, token });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error." });
  }
};

exports.currentUser = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: req.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    res.json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};
