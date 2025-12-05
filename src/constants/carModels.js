// Hardcoded list of supported EVs
// efficiency: Wh/km (Watt-hours per km) - used for range calc
export const CAR_MODELS = [
  { 
    id: '1', 
    name: 'Tata Nexon EV Max', 
    range: 437, 
    efficiency: 130, 
    batteryCapacity: 40.5 // kWh
  },
  { 
    id: '2', 
    name: 'MG ZS EV', 
    range: 461, 
    efficiency: 140,
    batteryCapacity: 50.3
  },
  { 
    id: '3', 
    name: 'Hyundai Kona', 
    range: 452, 
    efficiency: 135,
    batteryCapacity: 39.2
  },
  { 
    id: '4', 
    name: 'Tata Tiago EV', 
    range: 315, 
    efficiency: 110,
    batteryCapacity: 24
  },
  { 
    id: '5', 
    name: 'Mahindra XUV400', 
    range: 456, 
    efficiency: 138,
    batteryCapacity: 39.4
  },
];