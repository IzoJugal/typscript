import { Request, Response } from "express";
import UserModel from "../models/User";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addUser = async (req: Request, res: Response) => {
  console.log("Received body:", req.body);

  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newUser = new UserModel({ name, email }); // ✅ use UserModel not User
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Server error" });
  }
};



export default { getUsers, addUser };