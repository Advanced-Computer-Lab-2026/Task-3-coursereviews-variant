import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coursereviews';

async function seedDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    const db = mongoose.connection.db;

    // 1. FIX: Remove the unique index that causes the E11000 error
    // The problematic index is named 'courseCode_1_reviewedBy_1'
    try {
      await db.collection('reviews').dropIndex('courseCode_1_reviewedBy_1');
      console.log('Removed problematic unique index.');
    } catch (e) {
      console.log('Index not found or already removed, continuing...');
    }

    // 2. Define Schemas for seeding
    const CourseSchema = new mongoose.Schema({
      courseCode: { type: String, required: true, unique: true },
      title: String,
      instructor: String,
      category: String,
      description: String,
    });

    const ReviewSchema = new mongoose.Schema({
      courseCode: { type: String, required: true },
      studentName: String,
      rating: Number,
      comment: String,
      date: { type: Date, default: Date.now },
    });

    const Course = mongoose.model('Course', CourseSchema);
    const Review = mongoose.model('Review', ReviewSchema);

    // 3. Clear existing data
    await Course.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing data.');

    // 4. Seed Courses
    const courses = await Course.insertMany([
      {
        courseCode: 'CS101',
        title: 'Introduction to Web Development',
        instructor: 'Dr. Sarah Smith',
        category: 'Programming',
        description: 'Learn the basics of HTML, CSS, and JavaScript from scratch.',
      },
      {
        courseCode: 'CS202',
        title: 'Advanced React Patterns',
        instructor: 'John Doe',
        category: 'Programming',
        description: 'Master hooks, context, and performance optimization in React.',
      },
      {
        courseCode: 'MKT301',
        title: 'Digital Marketing 101',
        instructor: 'Emily Chen',
        category: 'Marketing',
        description: 'Everything you need to know about SEO, SEM, and Social Media.',
      },
    ]);
    console.log('Courses seeded.');

    // 5. Seed Reviews
    const reviews = [];
    courses.forEach((course, index) => {
      reviews.push({
        courseCode: course.courseCode,
        studentName: `Student ${index + 1}`,
        rating: 5,
        comment: 'Amazing course! Highly recommended.',
      });
      reviews.push({
        courseCode: course.courseCode,
        studentName: `Student ${index + 2}`,
        rating: 4,
        comment: 'Very informative, but some parts were a bit fast.',
      });
    });

    await Review.insertMany(reviews);
    console.log('Reviews seeded.');

    console.log('\nSUCCESS: Your local database is now ready with sample data!');
    console.log('You can now run your app and see the reviews.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seedDB();
