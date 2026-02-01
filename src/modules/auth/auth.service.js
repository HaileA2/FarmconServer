import User from "../../database/models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";

export const register = async ({ email, password }) => {
  const exists = await User.findOne({ email });
  if (exists) throw new Error("User already exists");
  

  const hash = await bcrypt.hash(password, 10);

  return User.create({ email, password: hash });
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user._id }, env.jwtSecret);

  return { token, user };
};
