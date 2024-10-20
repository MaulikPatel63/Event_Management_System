const Event = require("../models/Event.js");
const User = require("../models/User.js");

const eventAdd = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ message: "User Does not exists" });
    }

    const newEvent = new Event({
      ...req.body,
      creator: user._id,
    });
    await newEvent.save();

    return res
      .status(200)
      .json({ message: "Event Created Successfully!", data: newEvent });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Event controller error", err: error.message });
  }
};

const eventGet = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const events = await Event.find()
      .populate({
        path: "creator",
        select: "-password -createdAt -updatedAt -__v",
      })
      .lean(); // Use lean() to return plain JS objects

    // Calculate available capacity for each event
    const eventsWithAvailableCapacity = events.map((event) => {
      const availableCapacity = event.capacity - event.attendees.length;
      return { ...event, availableCapacity };
    });

    const totalEvents = await Event.countDocuments();

    return res.status(200).json({
      message: "The events were retrieved successfully!",
      pagination: {
        total: totalEvents,
        currentPage: pageNum,
        totalPages: Math.ceil(totalEvents / limitNum),
      },
      data: eventsWithAvailableCapacity.slice(
        (pageNum - 1) * limitNum,
        pageNum * limitNum
      ),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

const eventGetById = async (req, res) => {
  try {
    const { id } = req.params;

    const events = await Event.find({ _id: id });
    if (!events) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res.status(200).json({
      message: "The events was retrieved successfully!",
      data: events,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

const eventGetByTitle = async (req, res) => {
  try {
    const { title } = req.query;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 1;

    const events = await Event.find({
      title: { $regex: new RegExp(title, "i") },
    })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (!events) {
      return res.status(404).json({ message: "Event not found" });
    }
    const totalEvents = await Event.countDocuments({
      title: { $regex: new RegExp(title, "i") }, // Same regex for counting
    });

    return res.status(200).json({
      message: "The events was retrieved successfully!",
      pagination: {
        total: totalEvents,
        currentPage: pageNum,
        totalPages: Math.ceil(totalEvents / limitNum),
      },
      data: events,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

const eventUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { ...req.body },
      {
        new: true,
      }
    );
    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res
      .status(200)
      .json({ message: "Event Created Successfully!", data: updatedEvent });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

const eventDelete = async (req, res) => {
  try {
    const { id } = req.params;

    await Event.findByIdAndDelete(id);
    return res.status(200).json({ message: "Event Deleted Successfully!" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

const inviteAdd = async (req, res) => {
  try {
    const { eventId } = req.body;

    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ message: "User Does not exists" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.attendees.includes(user._id)) {
      return res
        .status(400)
        .json({ message: "You have already been invited to this event." });
    }
    event.attendees.push(user._id);

    await event.save();
    return res.status(200).json({ message: "Invite Created Successfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Add Invite controller error", err: error.message });
  }
};

const inviteGet = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const events = await Event.find(
      {
        $or: [{ attendees: req.user._id }],
      },
      "-attendees -createdAt -updatedAt"
    )
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (!events) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({
      message: "Invite events retrieved Successfully!",
      pagination: {
        total: events.length,
        currentPage: pageNum,
        totalPages: Math.ceil(events.length / limitNum),
      },
      data: events,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Invite retrieved controller error",
      err: error.message,
    });
  }
};

const inviteDelete = async (req, res) => {
  try {
    const { eventId } = req.params;

    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ message: "User Does not exists" });
    }

    const event = await Event.findById({ _id: eventId });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.attendees.includes(user._id)) {
      return res.status(400).json({ message: "User is not an attendee." });
    }

    event.attendees = event.attendees.filter(
      (attendee) => !attendee.equals(user._id)
    );

    // Save the updated event
    await event.save();
    return res.status(200).json({ message: "event Deleted Successfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "event Updated controller error", err: error.message });
  }
};

const eventImgUpload = async (req, res) => {
  try {
    const fullUrl =
      req.protocol + "://" + req.get("host") + "/uploads/" + req.file.filename;

    res.status(200).json({
      message: "Image uploaded successfully!",
      imageUrl: fullUrl,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error uploading image", error: error.message });
  }
};

module.exports = {
  eventAdd,
  eventGetById,
  eventGetByTitle,
  eventGet,
  eventUpdate,
  eventDelete,
  inviteAdd,
  inviteGet,
  inviteDelete,
  eventImgUpload,
};
