const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    roles: {
      type: [String],
      enum: ["user", "volunteer", "admin", "dealer","recycler"],
      default: ["user"],
      validate: {
        validator: function (roles) {
          if (
            (roles.includes("admin") || roles.includes("dealer")) &&
            roles.length > 1
          ) {
            return false;
          }
          return true;
        },
        message: "Admin or Dealer role must not be combined with other roles",
      },
    },
    profileImage: { type: String, default: "" },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Genrate Token
userSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      roles: this.roles,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

module.exports = mongoose.model("User", userSchema);
