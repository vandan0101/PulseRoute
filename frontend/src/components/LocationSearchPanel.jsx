import React from "react";

const LocationSearchPanel = ({
  suggestions = [],
  setPanelOpen,
  setPickup,
  setDestination,
  activeField,
}) => {
  const handleSuggestionSelect = (suggestion) => {
    if (activeField === "pickup") {
      setPickup(suggestion);
    } else if (activeField === "destination") {
      setDestination(suggestion);
    }

    setPanelOpen(false);
  };

  if (!suggestions.length) {
    return (
      <div className="px-2 py-4 text-sm text-gray-500">
        Search for a pickup or destination.
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1 py-3">
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          type="button"
          onClick={() => handleSuggestionSelect(suggestion)}
          className="flex w-full items-center gap-4 rounded-xl border border-gray-200 p-3 text-left active:border-black"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eee]">
            <i className="ri-map-pin-line text-lg"></i>
          </div>
          <span className="text-base font-medium text-gray-800">{suggestion}</span>
        </button>
      ))}
    </div>
  );
};

export default LocationSearchPanel;
