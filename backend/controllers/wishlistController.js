const Wishlist = require("../models/Wishlist");

exports.toggleWishlist = async (req, res) => {
  try {
    const { crop_id } = req.body;
    if (!crop_id) return res.status(400).json({ error: "crop_id is required" });

    const existing = await Wishlist.findOne({ user_id: req.user.user_id, crop_id });

    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      return res.json({ message: "Removed from wishlist", wishlisted: false });
    }

    await Wishlist.create({ user_id: req.user.user_id, crop_id });
    res.json({ message: "Added to wishlist", wishlisted: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update wishlist" });
  }
};

exports.getMyWishlist = async (req, res) => {
  try {
    const items = await Wishlist.find({ user_id: req.user.user_id }).populate("crop_id");
    res.json(items.map((i) => i.crop_id).filter(Boolean));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
};

exports.checkWishlist = async (req, res) => {
  try {
    const { crop_id } = req.params;

    const existing = await Wishlist.findOne({
      user_id: req.user.user_id,
      crop_id,
    });

    res.json({
      wishlisted: !!existing,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to check wishlist",
    });
  }
};