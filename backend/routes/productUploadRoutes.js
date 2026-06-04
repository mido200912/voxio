import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import supabase from "../config/supabase.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files (jpg, png, webp, gif) are allowed"));
  },
});

// @route   POST /api/products/upload-image
router.post("/upload-image", requireAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    const ext = req.file.mimetype.split("/")[1] || "jpg";
    const fileName = `products/${req.user._id}_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("voxio-uploads")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("[Product Upload] Supabase error:", error.message);
      return res.status(500).json({ error: "Failed to upload image" });
    }

    const { data: urlData } = supabase.storage
      .from("voxio-uploads")
      .getPublicUrl(fileName);

    res.json({ imageUrl: urlData.publicUrl });
  } catch (err) {
    console.error("[Product Upload] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/products/upload-images (multiple, max 5)
router.post("/upload-images", requireAuth, upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ error: "No images uploaded" });
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    const urls = [];
    for (const file of req.files) {
      const ext = file.mimetype.split("/")[1] || "jpg";
      const fileName = `products/${req.user._id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("voxio-uploads")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from("voxio-uploads")
          .getPublicUrl(fileName);
        urls.push(urlData.publicUrl);
      }
    }

    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
