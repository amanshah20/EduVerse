const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Course = require('../models/Course');
const { Enrollment, Payment } = require('../models/index');
const { auth, authorize } = require('../middleware/auth');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order
router.post('/create-order', auth, authorize('student'), async (req, res) => {
  try {
    const { courseId, couponCode } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (existing) return res.status(400).json({ message: 'Already enrolled' });
    
    let amount = course.price;
    let couponUsed = null;
    
    if (couponCode) {
      const coupon = course.couponCodes.find(c => c.code === couponCode && c.isActive);
      if (coupon && (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)) {
        if (coupon.type === 'percent') amount = amount * (1 - coupon.discount / 100);
        else amount = Math.max(0, amount - coupon.discount);
        couponUsed = couponCode;
      }
    }
    
    amount = Math.round(amount);
    
    // Free course
    if (amount === 0) {
      const enrollment = new Enrollment({
        student: req.user._id,
        course: courseId,
        amountPaid: 0,
        couponUsed
      });
      await enrollment.save();
      
      if (couponUsed) {
        const coupon = course.couponCodes.find(c => c.code === couponUsed);
        if (coupon) { coupon.usedCount++; await course.save(); }
      }
      
      course.totalStudents++;
      await course.save();
      
      return res.json({ free: true, message: 'Enrolled successfully!' });
    }
    
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `order_${Date.now()}`
    });
    
    const payment = new Payment({
      student: req.user._id,
      course: courseId,
      amount,
      razorpayOrderId: order.id,
      coupon: couponUsed
    });
    await payment.save();
    
    res.json({ orderId: order.id, amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Verify payment
router.post('/verify', auth, authorize('student'), async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId, couponCode } = req.body;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    
    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }
    
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, status: 'success' },
      { new: true }
    );
    
    const course = await Course.findById(courseId);
    const enrollment = new Enrollment({
      student: req.user._id,
      course: courseId,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      amountPaid: payment.amount,
      couponUsed: couponCode
    });
    await enrollment.save();
    
    if (couponCode) {
      const coupon = course.couponCodes.find(c => c.code === couponCode);
      if (coupon) { coupon.usedCount++; }
    }
    course.totalStudents++;
    await course.save();
    
    res.json({ message: 'Payment successful! Enrolled in course.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id }).populate('course', 'title').sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
