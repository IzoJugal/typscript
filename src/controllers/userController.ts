import { Request, Response } from "express";
import User from "../models/User"; 

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addUser = async (req: Request, res: Response) => {
  const { id, name, email } = req.body;

  if (!id || !name || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newUser = new User({ id, name, email });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default { getUsers, addUser };