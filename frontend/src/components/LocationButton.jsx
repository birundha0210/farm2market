import React from "react";

const locationErrorMessage = (error) => {
  switch (error?.code) {
    case 1:
      return "Location permission was denied. Enable it in your browser and try again.";
    case 2:
      return "Your location is currently unavailable. Please try again.";
    case 3:
      return "Location request timed out. Please try again.";
    default:
      return "Could not get your current location.";
  }
};

export default function LocationButton({ onLocation, onError, label = "Share current location" }) {
  const reportError = (message) => {
    if (onError) onError(message);
    else alert(message);
  };

  const locate = () => {
    if (!navigator.geolocation) return reportError("Geolocation is not available in this browser.");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        Promise.resolve()
          .then(() => onLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }))
          .catch((error) => reportError(error.response?.data?.message || "Could not share your location."));
      },
      (error) => reportError(locationErrorMessage(error)),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return <button type="button" className="location-button" onClick={locate}>📍 {label}</button>;
}
