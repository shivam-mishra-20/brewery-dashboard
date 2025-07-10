import mongoose from 'mongoose';

// Define Reservation Schema
const ReservationSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: [true, 'Table ID is required'],
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required'],
  },
  customerEmail: {
    type: String,
    required: false,
  },
  partySize: {
    type: Number,
    required: [true, 'Party size is required'],
    min: [1, 'Party size must be at least 1'],
  },
  reservationDate: {
    type: Date,
    required: [true, 'Reservation date is required'],
  },
  duration: {
    type: Number,  // Duration in minutes
    default: 90,
    min: [30, 'Minimum duration is 30 minutes'],
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'completed'],
    default: 'confirmed',
  },
  specialRequests: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create an index for efficient lookups
ReservationSchema.index({ tableId: 1, reservationDate: 1 });

// Check if the model exists before creating it
export const Reservation = mongoose.models.Reservation || mongoose.model('Reservation', ReservationSchema);
