const mongoose = require('mongoose');

const PassengerSchema = new mongoose.Schema({
  englishFirstName: {
    type: String,
    required: true
  },
  englishLastName: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['nationalId', 'passport'],
    required: true
  },
  documentNumber: {
    type: String,
    required: true
  },
  passportExpiry: {
    type: String
  },
  nationality: {
    type: String,
    default: 'Iranian'
  },
  birthDate: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  age: {
    type: String
  }
});

const FlightInfoSchema = new mongoose.Schema({
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String
  },
  flightNumber: {
    type: String
  },
  airline: {
    type: String
  },
  originCityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  },
  destinationCityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  },
  fromair: {
    type: String
  },
  toair: {
    type: String
  },
  fromAirportCode: {
    type: String
  },
  toAirportCode: {
    type: String
  },
  price: {
    type: String
  },
  tax: {
    type: String
  },
  total: {
    type: String
  },
  aircraft: {
    type: String
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  }
});

const AirlineSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Airline'
  },
  name: {
    type: String
  },
  englishName: {
    type: String
  },
  logo: {
    type: String
  },
  aircraftModel: {
    type: String
  }
});

const FloatingTicketSchema = new mongoose.Schema({
  passengers: [PassengerSchema],
  flightInfo: FlightInfoSchema,
  airline: AirlineSchema,
  sourceType: {
    type: String,
    enum: ['route', 'city'],
    default: 'route'
  },
  pdfPath: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

module.exports = mongoose.model('FloatingTicket', FloatingTicketSchema); 