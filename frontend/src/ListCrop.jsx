import { useRef, useState } from "react";
import axios from "axios";

function ListCrop() {
  const [cropName, setCropName] = useState("");
  const [category, setCategory] = useState("Other");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [organic, setOrganic] = useState(false);

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  // ==========================================
  // ADD IMAGES
  // ==========================================

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    setError("");
    setMessage("");

    // Maximum 5 images
    const availableSlots = 5 - imageFiles.length;

    if (availableSlots <= 0) {
      setError("You can add maximum 5 photos");
      return;
    }

    const filesToAdd = selectedFiles.slice(0, availableSlots);

    if (selectedFiles.length > availableSlots) {
      setError(
        `You can add maximum 5 photos. Only ${availableSlots} photo(s) were added.`
      );
    }

    // Prevent duplicate files
    const newFiles = filesToAdd.filter((file) => {
      return !imageFiles.some(
        (existingFile) =>
          existingFile.name === file.name &&
          existingFile.size === file.size &&
          existingFile.lastModified === file.lastModified
      );
    });

    if (newFiles.length === 0) {
      setError("These photos are already selected");
      return;
    }

    // Add files
    setImageFiles((current) => [...current, ...newFiles]);

    // Create previews
    const newPreviews = newFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setImagePreviews((current) => [...current, ...newPreviews]);

    // Reset input so same file can be selected again later
    e.target.value = "";
  };

  // ==========================================
  // REMOVE IMAGE
  // ==========================================

  const handleRemoveImage = (index) => {
    setError("");
    setMessage("");

    // Revoke preview URL
    const previewToRemove = imagePreviews[index];

    if (previewToRemove?.url) {
      URL.revokeObjectURL(previewToRemove.url);
    }

    setImageFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index)
    );

    setImagePreviews((current) =>
      current.filter((_, previewIndex) => previewIndex !== index)
    );
  };

  // ==========================================
  // SUBMIT CROP
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // Basic validation
    if (!cropName.trim()) {
      setError("Please enter crop name");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (!price || Number(price) <= 0) {
      setError("Please enter a valid price");
      return;
    }

    if (imageFiles.length === 0) {
      setError("Please add at least one photo of your crop");
      return;
    }

    if (imageFiles.length > 5) {
      setError("You can upload maximum 5 photos");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login again");
      return;
    }

    try {
      setUploading(true);

      // ==========================================
      // STEP 1: UPLOAD IMAGES TO CLOUDINARY
      // ==========================================

      const formData = new FormData();

      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const uploadResponse = await axios.post(
        "http://localhost:5000/api/crops/upload-images",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const urls = uploadResponse.data.image_urls;

      if (!urls || urls.length === 0) {
        throw new Error("No image URLs received from server");
      }

      // ==========================================
      // STEP 2: CREATE CROP
      // ==========================================

      const response = await axios.post(
        "http://localhost:5000/api/crops",
        {
          crop_name: cropName.trim(),

          category,

          quantity: Number(quantity),

          price: Number(price),

          harvest_date: harvestDate || null,

          organic,

          // First image = main image
          image_url: urls[0],

          // All images
          image_urls: urls,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ==========================================
      // SUCCESS
      // ==========================================

      setMessage(
        `Crop listed successfully! ID: ${response.data.crop_id}`
      );

      // Reset form
      setCropName("");
      setCategory("Other");
      setQuantity("");
      setPrice("");
      setHarvestDate("");
      setOrganic(false);

      // Revoke all preview URLs
      imagePreviews.forEach((preview) => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });

      setImageFiles([]);
      setImagePreviews([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("List crop error:", err);

      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to list crop"
      );
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // STYLES
  // ==========================================

  const inputStyle = {
    background: "var(--soil)",
    border: "1px solid var(--line)",
    color: "var(--mist)",
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <p className="eyebrow mb-3">Farmer</p>

      <h2
        className="text-3xl mb-2"
        style={{ color: "var(--mist)" }}
      >
        List a Crop
      </h2>

      <p
        className="text-sm mb-6"
        style={{ color: "var(--mist-dim)" }}
      >
        Add crop details and up to 5 photos.
      </p>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-7"
        style={{
          background: "var(--soil-2)",
          border: "1px solid var(--line)",
        }}
      >
        {/* ==========================================
            CROP NAME
        ========================================== */}

        <label
          className="text-xs uppercase tracking-wide"
          style={{ color: "var(--mist-dim)" }}
        >
          Crop Name
        </label>

        <input
          type="text"
          value={cropName}
          onChange={(e) => setCropName(e.target.value)}
          placeholder="e.g. Wheat"
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
        />

        {/* ==========================================
            CATEGORY
        ========================================== */}

        <label
          className="text-xs uppercase tracking-wide"
          style={{ color: "var(--mist-dim)" }}
        >
          Category
        </label>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
        >
          <option value="Vegetables">Vegetables</option>
          <option value="Fruits">Fruits</option>
          <option value="Grains">Grains</option>
          <option value="Dairy">Dairy</option>
          <option value="Spices">Spices</option>
          <option value="Other">Other</option>
        </select>

        {/* ==========================================
            QUANTITY
        ========================================== */}

        <label
          className="text-xs uppercase tracking-wide"
          style={{ color: "var(--mist-dim)" }}
        >
          Quantity (kg)
        </label>

        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g. 100"
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
        />

        {/* ==========================================
            PRICE
        ========================================== */}

        <label
          className="text-xs uppercase tracking-wide"
          style={{ color: "var(--mist-dim)" }}
        >
          Price per kg
        </label>

        <input
          type="number"
          min="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 2500"
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
        />

        {/* ==========================================
            HARVEST DATE
        ========================================== */}

        <label
          className="text-xs uppercase tracking-wide"
          style={{ color: "var(--mist-dim)" }}
        >
          Harvest Date
        </label>

        <input
          type="date"
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
          className="w-full p-3 mt-1 mb-5 rounded-lg outline-none"
          style={inputStyle}
        />

        {/* ==========================================
            CROP PHOTOS
        ========================================== */}

        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <label
              className="text-xs uppercase tracking-wide"
              style={{ color: "var(--mist-dim)" }}
            >
              Crop Photos
            </label>

            <span
              className="text-xs"
              style={{ color: "var(--mist-dim)" }}
            >
              {imageFiles.length}/5
            </span>
          </div>

          {/* ==========================================
              IMAGE PREVIEWS
          ========================================== */}

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {imagePreviews.map((preview, index) => (
                <div
                  key={`${preview.file.name}-${index}`}
                  className="relative rounded-xl overflow-hidden"
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--soil)",
                  }}
                >
                  <img
                    src={preview.url}
                    alt={`Crop preview ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />

                  {/* MAIN PHOTO LABEL */}

                  {index === 0 && (
                    <div
                      className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-semibold"
                      style={{
                        background: "var(--gold)",
                        color: "var(--ink)",
                      }}
                    >
                      Main Photo
                    </div>
                  )}

                  {/* REMOVE BUTTON */}

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    disabled={uploading}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center font-bold disabled:opacity-50"
                    style={{
                      background: "rgba(0, 0, 0, 0.75)",
                      color: "white",
                    }}
                    title="Remove photo"
                  >
                    ×
                  </button>

                  {/* IMAGE NUMBER */}

                  <div
                    className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-[10px]"
                    style={{
                      background: "rgba(0, 0, 0, 0.7)",
                      color: "white",
                    }}
                  >
                    Photo {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ==========================================
              ADD PHOTOS BUTTON
          ========================================== */}

          {imageFiles.length < 5 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={uploading}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-4 rounded-xl flex flex-col items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{
                  border: "1px dashed var(--mist-dim)",
                  background: "var(--soil)",
                  color: "var(--mist)",
                }}
              >
                <span className="text-2xl mb-1">＋</span>

                <span className="text-sm font-semibold">
                  Add Photos
                </span>

                <span
                  className="text-xs mt-1"
                  style={{ color: "var(--mist-dim)" }}
                >
                  You can add up to {5 - imageFiles.length} more
                </span>
              </button>
            </>
          )}

          {imageFiles.length === 5 && (
            <p
              className="text-xs mt-2"
              style={{ color: "var(--mist-dim)" }}
            >
              Maximum 5 photos added.
            </p>
          )}

          <p
            className="text-xs mt-3"
            style={{ color: "var(--mist-dim)" }}
          >
            Add clear photos of your crop. The first photo will be used
            as the main photo.
          </p>
        </div>

        {/* ==========================================
            ORGANIC
        ========================================== */}

        <label
          className="flex items-center gap-2 mb-5 text-sm"
          style={{ color: "var(--mist)" }}
        >
          <input
            type="checkbox"
            checked={organic}
            onChange={(e) => setOrganic(e.target.checked)}
          />

          Organic
        </label>

        {/* ==========================================
            ERROR
        ========================================== */}

        {error && (
          <p
            className="text-sm mb-4"
            style={{ color: "var(--clay)" }}
          >
            {error}
          </p>
        )}

        {/* ==========================================
            SUCCESS
        ========================================== */}

        {message && (
          <p
            className="text-sm mb-4"
            style={{ color: "var(--crop-solid)" }}
          >
            {message}
          </p>
        )}

        {/* ==========================================
            SUBMIT
        ========================================== */}

        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3 rounded-full font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          style={{
            background: "var(--gold)",
            color: "var(--ink)",
          }}
        >
          {uploading ? "Uploading Photos..." : "List Crop"}
        </button>
      </form>
    </div>
  );
}

export default ListCrop;