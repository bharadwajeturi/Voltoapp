// Utils/validators.js
// Input validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[^\d]/g, ''));
};

export const validateLocation = (latitude, longitude) => {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

export const validateBatteryPercentage = (percentage) => {
  return typeof percentage === 'number' && percentage >= 0 && percentage <= 100;
};

export const validateCarModel = (model) => {
  const validModels = [
    'Tata Nexon',
    'MG ZS EV',
    'Hyundai Kona',
    'Mahindra XUV400',
    'BYD Yuan Plus',
    'Volkswagen ID.4',
    'Tesla Model 3'
  ];
  return validModels.includes(model);
};

export const validateTrip = (trip) => {
  return (
    trip.currentLocation &&
    validateLocation(trip.currentLocation.latitude, trip.currentLocation.longitude) &&
    trip.destination &&
    validateLocation(trip.destination.latitude, trip.destination.longitude) &&
    validateBatteryPercentage(trip.currentBattery) &&
    trip.carModel &&
    validateCarModel(trip.carModel)
  );
};
