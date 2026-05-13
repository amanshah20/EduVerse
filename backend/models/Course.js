const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: String,
  type: { type: String, enum: ['pdf', 'doc', 'video', 'youtube', 'link'] },
  url: String,
  youtubeUrl: String,
  fileName: String,
  duration: String,
  order: Number
});

const chapterSchema = new mongoose.Schema({
  title: String,
  description: String,
  order: Number,
  materials: [materialSchema]
});

const moduleSchema = new mongoose.Schema({
  title: String,
  description: String,
  order: Number,
  chapters: [chapterSchema]
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  thumbnail: String,
  price: { type: Number, default: 0 },
  discountPrice: Number,
  category: String,
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  tags: [String],
  modules: [moduleSchema],
  instructor: String,
  duration: String,
  totalStudents: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  couponCodes: [{
    code: String,
    discount: Number,
    type: { type: String, enum: ['percent', 'flat'] },
    isActive: Boolean,
    usageLimit: Number,
    usedCount: { type: Number, default: 0 }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
