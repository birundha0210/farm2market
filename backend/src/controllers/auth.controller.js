import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

import { prisma } from "../config/prisma.js";
import { emailLayout, sendEmail } from "../services/email.js";
import { publicUser } from "../utils/serializers.js";

const code = (role) =>
  `${role === "FARMER" ? "FM" : "BUY"}-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;

async function makeCode(role) {
  let value;

  do {
    value = code(role);
  } while (
    await prisma.user.findUnique({
      where: {
        loginCode: value,
      },
    })
  );

  return value;
}

export async function register(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Please correct the marked fields.",
      errors: errors.array(),
    });
  }

  const {
    name,
    email,
    username,
    password,
    dob,
    gender,
    landDetails,
    landAcres,
    shopNumber,
    businessType,
  } = req.body;

  /*
   * IMPORTANT FIX:
   *
   * Routes are:
   * /register/farmer
   * /register/buyer
   *
   * They don't contain :role.
   *
   * So req.params.role is undefined.
   *
   * We use req.body.role as fallback.
   */
  const requestedRole = req.params.role || req.body.role;

  const role = String(requestedRole || "").toUpperCase();

  if (!["FARMER", "BUYER"].includes(role)) {
    return res.status(400).json({
      message: "Invalid account role.",
    });
  }

  /*
   * Make sure the role selected in the form
   * matches the registration endpoint.
   */
  if (req.body.role && req.body.role !== role) {
    return res.status(400).json({
      message:
        "Role identification does not match this registration.",
    });
  }

  /*
   * Check duplicate email / username.
   */
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        {
          email: email.toLowerCase(),
        },
        {
          username,
        },
      ],
    },
  });

  if (existing) {
    return res.status(409).json({
      message:
        existing.email === email.toLowerCase()
          ? "This email is already registered."
          : "This username is already taken.",
    });
  }

  /*
   * Generate unique Farm2Market login code.
   *
   * Farmer:
   * FM-XXXXXXXXXX
   *
   * Buyer:
   * BUY-XXXXXXXXXX
   */
  const loginCode = await makeCode(role);

  /*
   * Create user and role-specific profile.
   */
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      username,

      passwordHash: await bcrypt.hash(
        password,
        12
      ),

      loginCode,

      dob: new Date(dob),

      gender,

      role,

      /*
       * Farmer profile
       */
      ...(role === "FARMER"
        ? {
            farmerProfile: {
              create: {
                landDetails,
                landAcres: Number(landAcres),
              },
            },
          }
        : {
            /*
             * Buyer profile
             */
            buyerProfile: {
              create: {
                shopNumber,
                businessType,
              },
            },
          }),
    },

    include: {
      farmerProfile: true,
      buyerProfile: true,
    },
  });

  /*
   * Send registration completed email.
   */
  sendEmail({
    to: user.email,

    subject:
      "Farm2Market Registration Completed",

    html: emailLayout(
      "Registration completed",

      `
        <p>Welcome, ${user.name}.</p>

        <p>
          Your ${role.toLowerCase()} account is ready.
          Your Farm2Market login code is:
        </p>

        <h2
          style="
            letter-spacing:2px;
            color:#166534;
          "
        >
          ${loginCode}
        </h2>

        <p>
          Use your registered email and this code
          to log in.
          Keep it safe; never share it.
        </p>
      `
    ),
  });

  /*
   * Send successful response to frontend.
   */
  return res.status(201).json({
    message: "Registration completed.",

    user: publicUser(user),
  });
}

export async function login(req, res) {
  const {
    email,
    loginCode,
  } = req.body;

  const user =
    await prisma.user.findUnique({
      where: {
        email: String(email || "").toLowerCase(),
      },

      include: {
        farmerProfile: true,
        buyerProfile: true,
      },
    });

  /*
   * Validate email + generated login code.
   */
  if (
    !user ||
    user.loginCode !==
      String(loginCode || "")
        .trim()
        .toUpperCase()
  ) {
    return res.status(401).json({
      message:
        "Email or Farm2Market code is incorrect.",
    });
  }

  /*
   * Create JWT.
   */
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: "8h",
    }
  );

  return res.json({
    token,
    user: publicUser(user),
  });
}

export async function me(req, res) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },

      include: {
        farmerProfile: true,

        buyerProfile: true,

        products: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

  return res.json({
    user: publicUser(user),
  });
}