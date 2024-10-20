const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, required: true },
    capacity: { type: Number, required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: { type: String },
  },
  { timestamps: true }
);

// Export the model
const Event = mongoose.model("Event", EventSchema);

module.exports = Event;
