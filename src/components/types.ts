export interface MealOptions {
  sobhane: boolean;
  nahar: boolean;
  sham: boolean;
}

export interface HotelStay {
  hotel: string;
  stayDuration: number;
  firstMeal: MealOptions;
  lastMeal: MealOptions;
}

export interface RoomOption {
  price: number;
  forSale: boolean;
}

export interface Service {
  name: string;
  price: number;
  selectable?: boolean;
}

export interface Airline {
  _id: string;
  name: string;
  code: string;
  logo?: string;
}

export interface Aircraft {
  _id: string;
  model: string;
  manufacturer: string;
  image?: string;
  airline: string | Airline;
  capacity: {
    economy: number;
    business: number;
    firstClass: number;
  };
}

export interface Transportation {
  departure: 'zamini' | 'havaii';
  return: 'zamini' | 'havaii';
  departureAirline?: string;
  departureAircraft?: string;
  returnAirline?: string;
  returnAircraft?: string;
  departureFlightNumber?: string;
  returnFlightNumber?: string;
}

export interface Package {
  _id?: string;
  name: string;
  isPublic: boolean;
  allAccess: boolean;
  route: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  transportation: Transportation;
  basePrice: number;
  infantPrice: number;
  servicesFee: number;
  capacity: number;
  hotels: HotelStay[];
  services: Service[];
  rooms: {
    single: RoomOption;
    double: RoomOption;
    triple: RoomOption;
    quadruple: RoomOption;
    quintuple: RoomOption;
  };
  image?: string;
  isActive: boolean;
  createdBy?: {
    user: string;
    fullName: string;
  };
} 