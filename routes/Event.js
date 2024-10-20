const Joi = require("joi");
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const {
  eventAdd,
  eventGet,
  eventGetById,
  eventUpdate,
  eventDelete,
  inviteAdd,
  inviteUpdate,
  inviteGet,
  eventGetByTitle,
  inviteDelete,
  eventImgUpload,
} = require("../controllers/EventController.js");
const { validateRequest } = require("../middleware/validate-request.js");

const { authMiddleware } = require("../middleware/authMiddleware.js");

router.use(authMiddleware);

//? event router
router.post("/event-add", AddValidation, eventAdd);
router.get("/event-get", eventGet);
router.get("/event-get/:id", eventGetById);
router.get("/event-get-by-title", eventGetByTitle);
router.put("/event-update/:id", UpdateValidation, eventUpdate);
router.delete("/event-delete/:id", eventDelete);

//? invite router
router.post("/invite-add", InviteAddValidation, inviteAdd);
router.get("/invite-get", inviteGet);
router.delete("/invite-delete/:eventId", inviteDelete);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Directory to save uploaded images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Save with unique name
  },
});

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit: 5MB
  fileFilter: fileFilter,
});

// Route to upload event image
router.post("/event-upload", upload.single("image"), eventImgUpload);

function AddValidation(req, res, next) {
  const schema = Joi.object({
    title: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(5).max(100).required(),
    category: Joi.string()
      .valid("music", "movie", "navratri", "other")
      .required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref("startDate")).required(), // Ensure endDate is after startDate
    location: Joi.string().min(3).max(100).required(),
    capacity: Joi.number().integer().min(1).required(),
    image: Joi.string().required(),
  });
  validateRequest(req, res, next, schema);
}
function UpdateValidation(req, res, next) {
  const schema = Joi.object({
    title: Joi.string().min(3).max(50).optional(),
    description: Joi.string().min(5).max(100).optional(),
    category: Joi.string()
      .valid("music", "movie", "navratri", "other")
      .optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().greater(Joi.ref("startDate")).optional(), // Ensure endDate is after startDate
    location: Joi.string().min(3).max(100).optional(),
    capacity: Joi.number().integer().min(1).optional(),
    image: Joi.string().optional(),
  });
  validateRequest(req, res, next, schema);
}
function InviteAddValidation(req, res, next) {
  const schema = Joi.object({
    eventId: Joi.string()
      .pattern(/^[a-fA-F0-9]{24}$/)
      .required(),
  });
  validateRequest(req, res, next, schema);
}
module.exports = router;
