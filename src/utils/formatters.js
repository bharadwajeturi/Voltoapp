// Utils/formatters.js
// Data formatting and display utilities

export const formatDistance = (km) => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

export const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

export const formatBattery = (percentage) => {
  return `${Math.round(percentage)}%`;
};

export const formatAddress = (address) => {
  if (!address) return 'Unknown Location';
  if (typeof address === 'string') return address;
  
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipcode
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const formatStationName = (name) => {
  if (!name) return 'Charging Station';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatOperator = (operator) => {
  const mapping = {
    'tatanpower': 'Tata Power',
    'zeuscharging': 'Zeus Charging',
    'shellrecharge': 'Shell Recharge',
    'chargeplus': 'ChargePlus',
    'icharging': 'iCharging'
  };
  
  const key = operator?.toLowerCase().replace(/\s/g, '');
  return mapping[key] || operator || 'Unknown Operator';
};

export const formatCurrency = (amount) => {
  return `₹${amount.toFixed(2)}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime12Hour = (hours, minutes) => {
  const hour = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};
