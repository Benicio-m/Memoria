import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";

import Teacher from "./models/Teacher.js";

await mongoose.connect(process.env.MONGODB_URI);

const emailc = "beniciomr36@gmail.com";
const senhac = "H1st0r1@";
const senhaHashc = await bcrypt.hash(senhac, 10);

const emailv = "teste2@email.com";
const senhav = "L1t3r@d4";
const senhaHashv = await bcrypt.hash(senhav, 10);

await Teacher.deleteOne({ email: emailc });
await Teacher.deleteOne({ email: emailv });

await Teacher.create({
  name: "Cláudio",
  email: emailc,
  password: senhaHashc,
  role: "professor",
  profilePhoto: "./public/Cláudio.png",
});
await Teacher.create({
  name: "Vânia",
  email: emailv,
  password: senhaHashv,
  role: "professor",
  profilePhoto: "./public/Vânia.png",
});

console.log("Professores criados com sucesso");

await mongoose.disconnect();