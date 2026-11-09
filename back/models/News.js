import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const newsSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    authorRole: {
      type: String,
      required: true,
      enum: ["aluno", "professor"],
    },

    authors: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    iconImage: { type: String, default: "" },
    content: { type: String, required: true },
    comments: [commentSchema],
  },
  { timestamps: true }
);

const News = mongoose.model("News", newsSchema);

export default News;