import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["pendente", "autorizado", "recusado"],
      default: "pendente",
    },
  },
  {
    timestamps: true,
  }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;