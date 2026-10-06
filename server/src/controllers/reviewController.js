import Joi from 'joi';
import { Review } from '../models/Review.js';

const reviewSchema = Joi.object({
  courseCode: Joi.string().min(2).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow(''),
  // the reviewer is always the logged-in user, never taken from the body
  reviewedBy: Joi.forbidden()
});

export async function getAllReviews(req, res, next) {
  try {
    const reviews = await Review.find()
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reviews });
  } catch (err) { next(err); }
}

export async function getReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id).populate('reviewedBy', 'name email');
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ review });
  } catch (err) { next(err); }
}

// GET /api/reviews/summary?courseCode=CS101
export async function getCourseSummary(req, res, next) {
  try {
    const { courseCode } = req.query;
    if (!courseCode) return res.status(400).json({ message: 'courseCode query parameter is required' });

    const [summary] = await Review.aggregate([
      { $match: { courseCode: courseCode.toUpperCase() } },
      {
        $group: {
          _id: '$courseCode',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    if (!summary) {
      return res.json({ courseCode: courseCode.toUpperCase(), averageRating: null, reviewCount: 0 });
    }
    res.json({ courseCode: summary._id, averageRating: summary.averageRating, reviewCount: summary.reviewCount });
  } catch (err) { next(err); }
}

export async function createReview(req, res, next) {
  try {
    const { value, error } = reviewSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const courseCode = value.courseCode.trim().toUpperCase();
    const duplicate = await Review.exists({ courseCode, reviewedBy: req.user.id });
    if (duplicate) return res.status(409).json({ message: 'You already reviewed this course' });

    const doc = await Review.create({ ...value, reviewedBy: req.user.id });
    res.status(201).json({ review: doc });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already reviewed this course' });
    next(err);
  }
}

export async function updateReview(req, res, next) {
  try {
    const existing = await Review.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Review not found' });
    if (existing.reviewedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    // drop reviewedBy from the merge so the owner can't be reassigned
    const { reviewedBy, ...current } = existing.toObject();
    const merged = { ...current, ...req.body };
    const { value, error } = reviewSchema.validate(merged, { abortEarly: false, stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ message: error.message });

    const courseCode = value.courseCode.trim().toUpperCase();
    const duplicate = await Review.exists({
      courseCode,
      reviewedBy: req.user.id,
      _id: { $ne: existing._id }
    });
    if (duplicate) return res.status(409).json({ message: 'You already reviewed this course' });

    const doc = await Review.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    res.json({ review: doc });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already reviewed this course' });
    next(err);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const existing = await Review.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Review not found' });
    if (existing.reviewedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await existing.deleteOne();
    res.json({ ok: true });
  } catch (err) { next(err); }
}
