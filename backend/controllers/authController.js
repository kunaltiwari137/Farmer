// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");

// const User = require("../models/User");
// const Farmer = require("../models/Farmer");
// const Buyer = require("../models/Buyer");

// const { OAuth2Client } = require("google-auth-library");
// const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// const {
//   createNotification,
// } = require("./notificationController");

// const { sendOTPEmail } = require("../config/email");


// // ======================================================
// // CREATE PROFILE FOR ROLE
// // ======================================================

// const createProfileForRole = async (user) => {

//   if (user.role === "farmer") {

//     const existing = await Farmer.findOne({
//       user_id: user._id,
//     });

//     if (!existing) {

//       await Farmer.create({
//         user_id: user._id,
//         village: "",
//         district: "",
//         state: "",
//         verified: false,
//       });

//     }

//   }

//   else if (user.role === "buyer") {

//     const existing = await Buyer.findOne({
//       user_id: user._id,
//     });

//     if (!existing) {

//       await Buyer.create({
//         user_id: user._id,
//         company_name: "",
//         location: "",
//       });

//     }

//   }

// };


// // ======================================================
// // NOTIFY ALL ADMINS
// // ======================================================

// const notifyAdmins = async (
//   message,
//   relatedUserId = null
// ) => {

//   const admins = await User.find({
//     role: "admin",
//   });

//   for (const admin of admins) {

//     await createNotification(
//       admin._id,
//       message,
//       "signup",
//       relatedUserId
//     );

//   }

// };


// // ======================================================
// // SIGNUP
// // ======================================================

// exports.signup = async (req, res) => {

//   try {

//     const {
//       name,
//       email,
//       password,
//       phone,
//       role,
//     } = req.body;


//     if (
//       !name ||
//       !email ||
//       !password ||
//       !role
//     ) {

//       return res.status(400).json({
//         error: "Missing required fields",
//       });

//     }


//     if (
//       role !== "farmer" &&
//       role !== "buyer"
//     ) {

//       return res.status(400).json({
//         error: "Role must be 'farmer' or 'buyer'",
//       });

//     }


//     const existing = await User.findOne({
//       email,
//     });


//     if (existing) {

//       return res.status(409).json({
//         error: "Email already registered",
//       });

//     }


//     const password_hash =
//       await bcrypt.hash(password, 10);


//     const newUser =
//       await User.create({

//         name,
//         email,
//         password_hash,
//         phone: phone || undefined,
//         role,
//         status: "pending",

//       });


//     // Create farmer/buyer profile

//     await createProfileForRole(
//       newUser
//     );


//     // Notify admins

//     await notifyAdmins(
//       `New ${role} signup pending approval: ${name}`,
//       newUser._id
//     );


//     res.status(201).json({

//       message:
//         "Signup successful. Your account is pending admin approval.",

//       user_id: newUser._id,

//     });


//   }

//   catch (error) {

//     console.error(
//       "Signup error:",
//       error
//     );

//     res.status(500).json({
//       error: "Signup failed",
//     });

//   }

// };


// // ======================================================
// // LOGIN
// // ======================================================

// exports.login = async (req, res) => {

//   try {

//     const {
//       email,
//       password,
//     } = req.body;


//     if (!email || !password) {

//       return res.status(400).json({
//         error:
//           "Email and password are required",
//       });

//     }


//     const user =
//       await User.findOne({
//         email,
//       });


//     if (!user) {

//       return res.status(401).json({
//         error:
//           "Invalid email or password",
//       });

//     }


//     const isMatch =
//       await bcrypt.compare(
//         password,
//         user.password_hash
//       );


//     if (!isMatch) {

//       return res.status(401).json({
//         error:
//           "Invalid email or password",
//       });

//     }


//     // Admin doesn't require approval

//     if (user.role !== "admin") {

//       if (
//         user.status === "pending"
//       ) {

//         return res.status(403).json({
//           error:
//             "Your account is pending admin approval",
//         });

//       }


//       if (
//         user.status === "rejected"
//       ) {

//         return res.status(403).json({
//           error:
//             "Your account has been rejected by the admin",
//         });

//       }

//     }


//     await createProfileForRole(
//       user
//     );


//     // Generate OTP

//     const otp =
//       Math.floor(
//         100000 +
//         Math.random() * 900000
//       ).toString();


//     user.otp_code = otp;

//     user.otp_expiry =
//       new Date(
//         Date.now() +
//         5 * 60 * 1000
//       );


//     await user.save();


//     await sendOTPEmail(
//       user.email,
//       otp
//     );


//     res.json({

//       message:
//         "OTP sent to your email",

//       otp_required: true,

//       user_id: user._id,

//     });

//   }

//   catch (error) {

//     console.error(
//       "Login error:",
//       error
//     );

//     res.status(500).json({
//       error: "Login failed",
//     });

//   }

// };


// // ======================================================
// // VERIFY OTP
// // ======================================================

// exports.verifyOTP = async (
//   req,
//   res
// ) => {

//   try {

//     const {
//       user_id,
//       otp,
//     } = req.body;


//     if (!user_id || !otp) {

//       return res.status(400).json({
//         error:
//           "user_id and otp are required",
//       });

//     }


//     const user =
//       await User.findById(
//         user_id
//       );


//     if (!user) {

//       return res.status(404).json({
//         error:
//           "User not found",
//       });

//     }


//     if (
//       !user.otp_code ||
//       !user.otp_expiry
//     ) {

//       return res.status(400).json({
//         error:
//           "No OTP requested. Please login again.",
//       });

//     }


//     if (
//       new Date() >
//       user.otp_expiry
//     ) {

//       return res.status(400).json({
//         error:
//           "OTP expired. Please login again.",
//       });

//     }


//     if (
//       user.otp_code !== otp
//     ) {

//       return res.status(400).json({
//         error:
//           "Invalid OTP",
//       });

//     }


//     user.otp_code = undefined;
//     user.otp_expiry = undefined;

//     await user.save();


//     const token =
//       jwt.sign(

//         {
//           user_id:
//             user._id,

//           role:
//             user.role,
//         },

//         process.env.JWT_SECRET,

//         {
//           expiresIn: "7d",
//         }

//       );


//     res.json({

//       message:
//         "Login successful",

//       token,

//       user: {

//         user_id:
//           user._id,

//         name:
//           user.name,

//         email:
//           user.email,

//         role:
//           user.role,

//       },

//     });

//   }

//   catch (error) {

//     console.error(
//       "OTP verification error:",
//       error
//     );

//     res.status(500).json({
//       error:
//         "OTP verification failed",
//     });

//   }

// };


// // ======================================================
// // GOOGLE AUTH
// // ======================================================

// exports.googleAuth = async (
//   req,
//   res
// ) => {

//   try {

//     const {
//       credential,
//       role,
//     } = req.body;


//     if (
//       !credential ||
//       !role
//     ) {

//       return res.status(400).json({
//         error:
//           "Missing Google credential or role",
//       });

//     }


//     if (
//       role !== "farmer" &&
//       role !== "buyer"
//     ) {

//       return res.status(400).json({
//         error:
//           "Role must be 'farmer' or 'buyer'",
//       });

//     }


//     const ticket =
//       await googleClient.verifyIdToken({

//         idToken:
//           credential,

//         audience:
//           process.env.GOOGLE_CLIENT_ID,

//       });


//     const payload =
//       ticket.getPayload();


//     const {
//       email,
//       name,
//     } = payload;


//     let user =
//       await User.findOne({
//         email,
//       });


//     let isNewUser = false;


//     if (!user) {

//       const randomPassword =
//         await bcrypt.hash(
//           Date.now().toString() +
//           email,
//           10
//         );


//       user =
//         await User.create({

//           name,

//           email,

//           password_hash:
//             randomPassword,

//           role,

//           status:
//             "pending",

//         });


//       isNewUser = true;


//       await createProfileForRole(
//         user
//       );


//       await notifyAdmins(
//         `New ${role} signup pending approval: ${name}`,
//         user._id
//       );

//     }

//     else {

//       await createProfileForRole(
//         user
//       );

//     }


//     if (user.role !== "admin") {

//       if (
//         user.status === "pending"
//       ) {

//         return res.status(403).json({

//           error:
//             isNewUser
//               ? "Signup successful. Your account is pending admin approval."
//               : "Your account is pending admin approval",

//         });

//       }


//       if (
//         user.status === "rejected"
//       ) {

//         return res.status(403).json({

//           error:
//             "Your account has been rejected by the admin",

//         });

//       }

//     }


//     const token =
//       jwt.sign(

//         {
//           user_id:
//             user._id,

//           role:
//             user.role,
//         },

//         process.env.JWT_SECRET,

//         {
//           expiresIn:
//             "7d",
//         }

//       );


//     res.json({

//       message:
//         "Google sign-in successful",

//       token,

//       user: {

//         user_id:
//           user._id,

//         name:
//           user.name,

//         email:
//           user.email,

//         role:
//           user.role,

//       },

//     });

//   }

//   catch (error) {

//     console.error(
//       "Google authentication error:",
//       error
//     );

//     res.status(500).json({

//       error:
//         "Google authentication failed",

//     });

//   }

// };





// 2ndd version





const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Farmer = require("../models/Farmer");
const Buyer = require("../models/Buyer");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { createNotification } = require("./notificationController");
const { sendOTPEmail } = require("../config/email");

const createProfileForRole = async (user) => {
  if (user.role === "farmer") {
    const existing = await Farmer.findOne({ user_id: user._id });
    if (!existing) await Farmer.create({ user_id: user._id, village: "", district: "", state: "", verified: false });
  } else if (user.role === "buyer") {
    const existing = await Buyer.findOne({ user_id: user._id });
    if (!existing) await Buyer.create({ user_id: user._id, company_name: "", location: "" });
  }
};

const notifyAdmins = async (message) => {
  const admins = await User.find({ role: "admin" });
  for (const admin of admins) {
    await createNotification(admin._id, message, "admin");
  }
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: "Missing required fields" });
    if (role !== "farmer" && role !== "buyer") return res.status(400).json({ error: "Role must be 'farmer' or 'buyer'" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password_hash, phone: phone || undefined, role, status: "pending" });

    await createProfileForRole(newUser);
    await notifyAdmins(`New ${role} signup pending approval: ${name}`);

    res.status(201).json({ message: "Signup successful. Your account is pending admin approval.", user_id: newUser._id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Signup failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

    if (user.role !== "admin") {
      if (user.status === "pending") return res.status(403).json({ error: "Your account is pending admin approval" });
      if (user.status === "rejected") return res.status(403).json({ error: "Your account has been rejected by the admin" });
    }

    await createProfileForRole(user);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp_code = otp;
    user.otp_expiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendOTPEmail(user.email, otp);

    res.json({ message: "OTP sent to your email", otp_required: true, user_id: user._id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { user_id, otp } = req.body;
    if (!user_id || !otp) return res.status(400).json({ error: "user_id and otp are required" });

    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.otp_code || !user.otp_expiry) return res.status(400).json({ error: "No OTP requested. Please login again." });
    if (new Date() > user.otp_expiry) return res.status(400).json({ error: "OTP expired. Please login again." });
    if (user.otp_code !== otp) return res.status(400).json({ error: "Invalid OTP" });

    user.otp_code = undefined;
    user.otp_expiry = undefined;
    await user.save();

    const token = jwt.sign({ user_id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user: { user_id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "OTP verification failed" });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential, role } = req.body;
    if (!credential || !role) return res.status(400).json({ error: "Missing Google credential or role" });
    if (role !== "farmer" && role !== "buyer") return res.status(400).json({ error: "Role must be 'farmer' or 'buyer'" });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      const randomPassword = await bcrypt.hash(Date.now().toString() + email, 10);
      user = await User.create({ name, email, password_hash: randomPassword, role, status: "pending" });
      isNewUser = true;
      await createProfileForRole(user);
      await notifyAdmins(`New ${role} signup pending approval: ${name}`);
    } else {
      await createProfileForRole(user);
    }

    if (user.role !== "admin") {
      if (user.status === "pending") {
        return res.status(403).json({ error: isNewUser ? "Signup successful. Your account is pending admin approval." : "Your account is pending admin approval" });
      }
      if (user.status === "rejected") return res.status(403).json({ error: "Your account has been rejected by the admin" });
    }

    const token = jwt.sign({ user_id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Google sign-in successful", token, user: { user_id: user._id, name: user.name, email: user.email, role: user.role } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Google authentication failed" });
  }
};

// STEP 1: Naya function — logged-in user apna password badal sakta hai
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: "current_password and new_password are required" });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.user_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // STEP 2: Purana password sahi hai ya nahi, verify karo pehle
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // STEP 3: Naya password hash karke save karo
    user.password_hash = await bcrypt.hash(new_password, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update password" });
  }
};