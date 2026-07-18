const axios = require("axios");
const captainModel = require("../models/captain.model");

const MIN_SEARCH_LENGTH = 3;
const KNOWN_LOCATION_ALIASES = [
  {
    terms: [
      "iit jodhpur",
      "indian institute of technology jodhpur",
      "institute of technology jodhpur",
    ],
    label:
      "Indian Institute of Technology Jodhpur, NH 62, Karwar, Jodhpur, Rajasthan 342030, India",
    coordinates: {
      ltd: 26.4716,
      lng: 73.1136,
    },
  },
  {
    terms: [ "jodhpur" ],
    label: "Jodhpur, Rajasthan, India",
    coordinates: {
      ltd: 26.2389,
      lng: 73.0243,
    },
  },
  {
    terms: [ "surat" ],
    label: "Surat, Gujarat, India",
    coordinates: {
      ltd: 21.1702,
      lng: 72.8311,
    },
  },
];

function hasGoogleApiKey() {
  return Boolean(process.env.GOOGLE_MAPS_API);
}

function normalizeInput(value) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function findMatchingAliases(input) {
  const normalizedInput = normalizeInput(input);

  return KNOWN_LOCATION_ALIASES.filter((alias) =>
    [ ...alias.terms, alias.label ].some((term) => {
      const normalizedTerm = normalizeInput(term);
      return (
        normalizedTerm.includes(normalizedInput) ||
        normalizedInput.includes(normalizedTerm)
      );
    }),
  );
}

function findExactAlias(input) {
  const normalizedInput = normalizeInput(input);

  return KNOWN_LOCATION_ALIASES.find((alias) =>
    [ ...alias.terms, alias.label ].some(
      (term) => normalizeInput(term) === normalizedInput,
    ),
  );
}

async function geocodeWithNominatim(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`;
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "PulseRoute/1.0",
      "Accept-Language": "en",
    },
  });

  const place = response.data?.[0];
  if (!place) {
    throw new Error("Unable to fetch coordinates");
  }

  return {
    ltd: Number(place.lat),
    lng: Number(place.lon),
  };
}

async function suggestionsWithNominatim(input) {
  const aliasMatches = findMatchingAliases(input);
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(input)}`;
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "PulseRoute/1.0",
      "Accept-Language": "en",
    },
  });

  const apiSuggestions = response.data
    .map((place) => place.display_name)
    .filter(Boolean);

  const combinedSuggestions = [
    ...aliasMatches.map((alias) => alias.label),
    ...apiSuggestions,
  ];

  return [ ...new Set(combinedSuggestions) ].slice(0, 5);
}

async function distanceTimeWithOsrm(origin, destination) {
  const originCoordinates = await module.exports.getAddressCoordinate(origin);
  const destinationCoordinates = await module.exports.getAddressCoordinate(destination);

  const url = `https://router.project-osrm.org/route/v1/driving/${originCoordinates.lng},${originCoordinates.ltd};${destinationCoordinates.lng},${destinationCoordinates.ltd}?overview=false`;
  const response = await axios.get(url);

  const route = response.data?.routes?.[0];
  if (!route) {
    throw new Error("Unable to fetch distance and time");
  }

  return {
    distance: {
      text: `${(route.distance / 1000).toFixed(1)} km`,
      value: route.distance,
    },
    duration: {
      text: `${Math.round(route.duration / 60)} mins`,
      value: route.duration,
    },
  };
}

module.exports.getAddressCoordinate = async (address) => {
  if (!address || typeof address !== "string" || address.trim().length < MIN_SEARCH_LENGTH) {
    throw new Error("Address is required");
  }

  const exactAlias = findExactAlias(address);
  if (exactAlias) {
    return exactAlias.coordinates;
  }

  const matchingAlias = findMatchingAliases(address)[0];
  if (matchingAlias) {
    return matchingAlias.coordinates;
  }

  const apiKey = process.env.GOOGLE_MAPS_API;
  if (!hasGoogleApiKey()) {
    return geocodeWithNominatim(address);
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      const location = response.data.results[0].geometry.location;
      return {
        ltd: location.lat,
        lng: location.lng,
      };
    } else {
      return geocodeWithNominatim(address);
    }
  } catch (error) {
    console.error(error);
    if (hasGoogleApiKey()) {
      return geocodeWithNominatim(address);
    }
    throw error;
  }
};

module.exports.getDistanceTime = async (origin, destination) => {
  if (!origin || !destination) {
    throw new Error("Origin and destination are required");
  }

  if (!hasGoogleApiKey()) {
    return distanceTimeWithOsrm(origin, destination);
  }

  const apiKey = process.env.GOOGLE_MAPS_API;

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      if (response.data.rows[0].elements[0].status === "ZERO_RESULTS") {
        throw new Error("No routes found");
      }

      return response.data.rows[0].elements[0];
    } else {
      return distanceTimeWithOsrm(origin, destination);
    }
  } catch (err) {
    console.error(err);
    if (hasGoogleApiKey()) {
      return distanceTimeWithOsrm(origin, destination);
    }
    throw err;
  }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
  if (!input || typeof input !== "string" || input.trim().length < MIN_SEARCH_LENGTH) {
    return [];
  }

  const aliasMatches = findMatchingAliases(input);
  const apiKey = process.env.GOOGLE_MAPS_API;
  if (!hasGoogleApiKey()) {
    return suggestionsWithNominatim(input);
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === "OK") {
      const googleSuggestions = response.data.predictions
        .map((prediction) => prediction.description)
        .filter((value) => value);

      return [
        ...new Set([
          ...aliasMatches.map((alias) => alias.label),
          ...googleSuggestions,
        ]),
      ].slice(0, 5);
    } else {
      return suggestionsWithNominatim(input);
    }
  } catch (err) {
    console.error(err);
    if (hasGoogleApiKey()) {
      return suggestionsWithNominatim(input);
    }
    throw err;
  }
};

function getDistanceInKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
  if (typeof ltd !== 'number' || typeof lng !== 'number') {
    throw new Error('Latitude and longitude must be numbers');
  }

  const captains = await captainModel.find({
    'location.ltd': { $exists: true },
    'location.lng': { $exists: true },
  });

  return captains.filter((captain) => {
    const captainLocation = captain.location;
    if (
      !captainLocation ||
      typeof captainLocation.ltd !== 'number' ||
      typeof captainLocation.lng !== 'number'
    ) {
      return false;
    }

    const distance = getDistanceInKm(
      ltd,
      lng,
      captainLocation.ltd,
      captainLocation.lng,
    );

    return distance <= radius;
  });
};
