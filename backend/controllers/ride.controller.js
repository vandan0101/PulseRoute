const rideService = require("../services/ride.service");
const { validationResult } = require("express-validator");
const mapService = require("../services/maps.service");
const { sendMessageToSocketId } = require("../services/socket");
const rideModel = require("../models/ride.model");
const captainModel = require("../models/captain.model");

async function notifyCaptainsAboutRide(ride, pickup) {
  try {
    const pickupCoordinates = await mapService.getAddressCoordinate(pickup);

    const captainsInRadius = await mapService.getCaptainsInTheRadius(
      pickupCoordinates.ltd,
      pickupCoordinates.lng,
      2,
    );

    const rideWithUser = await rideModel
      .findOne({ _id: ride._id })
      .populate("user");

    if (captainsInRadius.length === 0) {
      console.log(
        'No captains available in the pickup radius, delivering ride notification to all connected captains.',
      );
      const allCaptains = await captainModel.find({
        socketId: { $exists: true, $ne: null },
      });

      allCaptains.forEach((captain) => {
        if (!captain.socketId) {
          return;
        }

        sendMessageToSocketId(captain.socketId, {
          event: "new-ride",
          data: rideWithUser,
        });
      });
      return;
    }

    captainsInRadius.forEach((captain) => {
      if (!captain.socketId) {
        return;
      }

      sendMessageToSocketId(captain.socketId, {
        event: "new-ride",
        data: rideWithUser,
      });
    });
  } catch (error) {
    console.error('Failed to notify captains about new ride:', error);
  }
}

module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, pickup, destination, vehicleType } = req.body;

  try {
    const ride = await rideService.createRide({
      user: req.user._id,
      pickup,
      destination,
      vehicleType,
    });
    res.status(201).json(ride);

    notifyCaptainsAboutRide(ride, pickup);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination } = req.query;

  try {
    const fare = await rideService.getFare(pickup, destination);
    return res.status(200).json(fare);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    console.log('confirmRide headers Authorization:', req.headers.authorization);
    console.log('confirmRide cookie token:', req.cookies && req.cookies.token);
    console.log('confirmRide req.captain:', !!req.captain, req.captain && req.captain._id);
    const ride = await rideService.confirmRide({
      rideId,
      captain: req.captain,
    });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-confirmed",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.query;

  try {
    const ride = await rideService.startRide({ rideId, captain: req.captain });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-started",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.body;

  try {
    const ride = await rideService.endRide({ rideId, captain: req.captain, otp });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-ended",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
